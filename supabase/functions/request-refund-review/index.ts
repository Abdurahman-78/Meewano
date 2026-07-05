// Guest requests a refund review under exceptional circumstances.
// - Verifies caller is the booking's guest
// - Creates a refund_requests row (pending_host)
// - Cancels the booking so calendar dates reopen
// - Emails guest + host, plus in-app host notification

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function shortId(id: string) { return id.slice(0, 8).toUpperCase() }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const bookingId: string = body?.bookingId
    const reason: string = (body?.reason || '').toString().slice(0, 300)
    const details: string = (body?.details || '').toString().slice(0, 4000)
    const evidenceUrls: string[] = Array.isArray(body?.evidenceUrls) ? body.evidenceUrls.slice(0, 20) : []

    if (!bookingId || !reason || details.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'bookingId, reason and details (min 20 chars) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const { data: booking, error: bErr } = await admin
      .from('bookings')
      .select('id, guest_id, host_id, property_id, check_in, check_out, total_price, status')
      .eq('id', bookingId).maybeSingle()
    if (bErr || !booking) return new Response(JSON.stringify({ error: 'Booking not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (booking.guest_id !== userId) return new Response(JSON.stringify({ error: 'Not allowed' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (booking.status === 'cancelled') return new Response(JSON.stringify({ error: 'Booking already cancelled' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: property } = await admin.from('properties').select('id, title').eq('id', booking.property_id).maybeSingle()

    const { data: reqRow, error: rErr } = await admin.from('refund_requests').insert({
      booking_id: booking.id,
      guest_id: booking.guest_id,
      host_id: booking.host_id,
      property_id: booking.property_id,
      reason,
      details,
      evidence_urls: evidenceUrls,
      total_price: Number(booking.total_price) || 0,
      status: 'pending_host',
    }).select('id').single()
    if (rErr) throw rErr

    await admin.from('bookings').update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancellation_category: 'exceptional',
      cancelled_at: new Date().toISOString(),
    }).eq('id', bookingId)

    await admin.from('notifications').insert({
      user_id: booking.host_id,
      title: 'Refund request needs review',
      message: `Guest has requested a refund for booking #${shortId(bookingId)} under exceptional circumstances. Please review within 24 hours.`,
      type: 'booking',
      link: '/host/refund-requests',
    }).catch(() => {})

    const { data: guestProfile } = await admin.from('profiles').select('email, full_name').eq('id', booking.guest_id).maybeSingle()
    const { data: hostProfile } = await admin.from('profiles').select('email, full_name').eq('id', booking.host_id).maybeSingle()

    const invoke = (payload: Record<string, unknown>) =>
      admin.functions.invoke('send-transactional-email', { body: payload }).catch((e) => console.warn('email failed', e))

    if (guestProfile?.email) {
      invoke({
        templateName: 'refund-request-submitted-guest',
        recipientEmail: guestProfile.email,
        idempotencyKey: `refund-req-guest-${reqRow.id}`,
        templateData: {
          firstName: (guestProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(bookingId),
          propertyTitle: property?.title ?? '',
        },
      })
    }
    if (hostProfile?.email) {
      invoke({
        templateName: 'refund-request-submitted-host',
        recipientEmail: hostProfile.email,
        idempotencyKey: `refund-req-host-${reqRow.id}`,
        templateData: {
          hostFirstName: (hostProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(bookingId),
          reviewUrl: `${new URL(req.url).origin.replace(/\/functions\/.*/, '')}/host/refund-requests`,
        },
      })
    }

    return new Response(JSON.stringify({ ok: true, refundRequestId: reqRow.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('request-refund-review error', e)
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
