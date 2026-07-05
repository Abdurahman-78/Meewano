// Cancels a booking on behalf of the guest.
// - Verifies the caller is the booking's guest via JWT
// - Recomputes the refund server-side against the property's cancellation policy
// - Updates the booking (status, refund_amount, reason, cancelled_at)
// - Sends "refund processing" email to the guest and "reservation freed" email to the host

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Refund policy (server-side truth) ---------------------------------

const MEEWANO_SERVICE_FEE_PCT = 0.04

type PolicyKey = 'extra_flexible' | 'flexible' | 'standard' | 'strict'

const POLICY_LABELS: Record<PolicyKey, string> = {
  extra_flexible: 'Extra Flexible',
  flexible: 'Flexible',
  standard: 'Standard',
  strict: 'Strict',
}

const POLICY_TIERS: Record<PolicyKey, { full: number; half: number }> = {
  extra_flexible: { full: 3, half: 0.5 },
  flexible: { full: 7, half: 1 },
  standard: { full: 30, half: 7 },
  strict: { full: 60, half: 30 },
}

function detectPolicy(text: string | null | undefined): PolicyKey {
  if (!text) return 'standard'
  const lower = text.toLowerCase()
  if (lower.includes('extra flexible')) return 'extra_flexible'
  if (lower.includes('flexible')) return 'flexible'
  if (lower.includes('strict')) return 'strict'
  return 'standard'
}

function computeRefund(policyText: string | null, checkIn: string, totalPrice: number) {
  const policyKey = detectPolicy(policyText)
  const tier = POLICY_TIERS[policyKey]
  const now = new Date()
  const ci = new Date(checkIn)
  const days = (ci.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  const daysUntilCheckIn = Math.max(0, Math.floor(days))

  let refundPct = 0
  if (days >= tier.full) refundPct = 1
  else if (days >= tier.half) refundPct = 0.5

  const total = Math.max(0, Number(totalPrice) || 0)
  const serviceFee = Math.round(total * MEEWANO_SERVICE_FEE_PCT)
  const accommodationBase = total - serviceFee
  const accommodationRefund = Math.round(accommodationBase * refundPct)
  const serviceFeeRefund = refundPct === 1 ? serviceFee : 0
  const totalRefund = accommodationRefund + serviceFeeRefund
  const hostPayout = total - totalRefund

  return {
    policyKey, policyLabel: POLICY_LABELS[policyKey],
    daysUntilCheckIn, refundPct,
    totalRefund, hostPayout,
  }
}

function fmtIQD(n: number): string {
  return `${Math.round(n).toLocaleString('en-US')} IQD`
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

// -----------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = userData.user.id

    // Parse body
    const body = await req.json().catch(() => ({}))
    const bookingId: string = body?.bookingId
    const category: string = body?.category || ''
    const reason: string = (body?.reason || '').toString().slice(0, 1000)
    if (!bookingId || !category || !reason) {
      return new Response(JSON.stringify({ error: 'bookingId, category and reason are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!['general', 'exceptional'].includes(category)) {
      return new Response(JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    // Load booking + property + guest email + host email
    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('id, guest_id, host_id, property_id, check_in, check_out, total_price, status, created_at')
      .eq('id', bookingId)
      .maybeSingle()
    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (booking.guest_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (booking.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'Booking already cancelled' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: property } = await admin
      .from('properties')
      .select('id, title, cancellation_policy')
      .eq('id', booking.property_id)
      .maybeSingle()

    const refund = computeRefund(
      property?.cancellation_policy ?? null,
      booking.check_in as unknown as string,
      Number(booking.total_price),
    )

    // Update booking
    const { error: uErr } = await admin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancellation_category: category,
        refund_amount: refund.totalRefund,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
    if (uErr) throw uErr

    // Notifications (in-app)
    await admin.from('notifications').insert([
      {
        user_id: booking.host_id,
        title: 'Booking cancelled',
        message: `Guest cancelled reservation #${shortId(bookingId)}. Dates are open again.`,
        type: 'booking',
        link: '/host/bookings',
      },
    ]).catch(() => {})

    // Fetch email addresses
    const { data: guestProfile } = await admin
      .from('profiles').select('email, full_name').eq('id', booking.guest_id).maybeSingle()
    const { data: hostProfile } = await admin
      .from('profiles').select('email, full_name').eq('id', booking.host_id).maybeSingle()

    // Fire-and-forget emails
    const invoke = (payload: Record<string, unknown>) =>
      admin.functions.invoke('send-transactional-email', { body: payload }).catch((e) => {
        console.warn('email invoke failed', e)
      })

    if (guestProfile?.email) {
      invoke({
        templateName: 'booking-cancelled-guest',
        recipientEmail: guestProfile.email,
        idempotencyKey: `cancel-guest-${bookingId}`,
        templateData: {
          firstName: (guestProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(bookingId),
          refundAmount: fmtIQD(refund.totalRefund),
          propertyTitle: property?.title ?? '',
        },
      })
    }
    if (hostProfile?.email) {
      invoke({
        templateName: 'booking-cancelled-host',
        recipientEmail: hostProfile.email,
        idempotencyKey: `cancel-host-${bookingId}`,
        templateData: {
          hostFirstName: (hostProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(bookingId),
          propertyTitle: property?.title ?? '',
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          daysUntilCheckIn: refund.daysUntilCheckIn,
          policyLabel: refund.policyLabel,
          hostPayout: fmtIQD(refund.hostPayout),
          guestRefund: fmtIQD(refund.totalRefund),
        },
      })
    }

    return new Response(
      JSON.stringify({
        ok: true,
        refund_amount: refund.totalRefund,
        host_payout: refund.hostPayout,
        policy: refund.policyLabel,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    console.error('cancel-booking error', e)
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
