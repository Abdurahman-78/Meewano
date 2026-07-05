// Host decides on a refund request:
//  - approve_refund: full refund, notify guest + host
//  - approve_rebook: proposes new dates, notifies guest (message + email)
//  - reject: notifies admin for review
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function shortId(id: string) { return id.slice(0, 8).toUpperCase() }
function fmtIQD(n: number) { return `${Math.round(n).toLocaleString('en-US')} IQD` }

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
    const { data: userData, error: uErr } = await userClient.auth.getUser()
    if (uErr || !userData?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const refundRequestId: string = body?.refundRequestId
    const decision: string = body?.decision
    const hostNote: string = (body?.hostNote || '').toString().slice(0, 2000)
    if (!refundRequestId || !['approve_refund', 'approve_rebook', 'reject'].includes(decision)) {
      return new Response(JSON.stringify({ error: 'refundRequestId and valid decision required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (decision === 'reject' && hostNote.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Rejection reason required (min 10 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: rr, error: rErr } = await admin.from('refund_requests').select('*').eq('id', refundRequestId).maybeSingle()
    if (rErr || !rr) return new Response(JSON.stringify({ error: 'Refund request not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (rr.host_id !== userId) return new Response(JSON.stringify({ error: 'Not allowed' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (rr.status !== 'pending_host') return new Response(JSON.stringify({ error: 'Already decided' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: guestProfile } = await admin.from('profiles').select('email, full_name').eq('id', rr.guest_id).maybeSingle()
    const { data: hostProfile } = await admin.from('profiles').select('email, full_name').eq('id', rr.host_id).maybeSingle()
    const { data: property } = await admin.from('properties').select('title').eq('id', rr.property_id).maybeSingle()

    const invoke = (payload: Record<string, unknown>) =>
      admin.functions.invoke('send-transactional-email', { body: payload }).catch((e) => console.warn('email failed', e))

    if (decision === 'approve_refund') {
      const refundAmount = Number(rr.total_price) || 0
      await admin.from('refund_requests').update({
        status: 'host_approved_refund',
        refund_amount: refundAmount,
        host_decision_reason: hostNote || null,
      }).eq('id', refundRequestId)
      await admin.from('bookings').update({ refund_amount: refundAmount }).eq('id', rr.booking_id)

      if (guestProfile?.email) invoke({
        templateName: 'refund-approved-guest', recipientEmail: guestProfile.email,
        idempotencyKey: `refund-approved-guest-${refundRequestId}`,
        templateData: {
          firstName: (guestProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(rr.booking_id),
          refundAmount: fmtIQD(refundAmount),
        },
      })
      if (hostProfile?.email) invoke({
        templateName: 'refund-approved-host', recipientEmail: hostProfile.email,
        idempotencyKey: `refund-approved-host-${refundRequestId}`,
        templateData: {
          hostFirstName: (hostProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(rr.booking_id),
        },
      })
      await admin.from('notifications').insert({
        user_id: rr.guest_id, title: 'Refund approved',
        message: `Your refund of ${fmtIQD(refundAmount)} for booking #${shortId(rr.booking_id)} has been approved.`,
        type: 'booking', link: '/guest',
      }).catch(() => {})
    } else if (decision === 'approve_rebook') {
      await admin.from('refund_requests').update({
        status: 'host_approved_rebook',
        host_decision_reason: hostNote || null,
      }).eq('id', refundRequestId)

      // Send a message to the guest with the reschedule offer
      await admin.from('messages').insert({
        sender_id: rr.host_id,
        receiver_id: rr.guest_id,
        content: `Hi — regarding your refund request for booking #${shortId(rr.booking_id)}, I'd like to offer to reschedule instead of a refund.\n\n${hostNote || 'Please suggest dates that work for you.'}`,
      }).catch(() => {})

      if (guestProfile?.email) invoke({
        templateName: 'rebook-offered-guest', recipientEmail: guestProfile.email,
        idempotencyKey: `rebook-guest-${refundRequestId}`,
        templateData: {
          firstName: (guestProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(rr.booking_id),
          propertyTitle: property?.title ?? '',
          hostNote,
        },
      })
      await admin.from('notifications').insert({
        user_id: rr.guest_id, title: 'Reschedule offered',
        message: `Your host offered to reschedule booking #${shortId(rr.booking_id)}.`,
        type: 'booking', link: '/messages',
      }).catch(() => {})
    } else {
      // reject → admin queue
      await admin.from('refund_requests').update({
        status: 'host_rejected',
        host_decision_reason: hostNote,
      }).eq('id', refundRequestId)

      // Notify admins
      const { data: adminUsers } = await admin.from('user_roles').select('user_id').in('role', ['admin', 'moderator'])
      if (adminUsers && adminUsers.length > 0) {
        const rows = adminUsers.map((u: any) => ({
          user_id: u.user_id,
          title: 'Refund rejection needs review',
          message: `Host rejected refund for booking #${shortId(rr.booking_id)}. Please review.`,
          type: 'booking',
          link: '/admin/refund-requests',
        }))
        await admin.from('notifications').insert(rows).catch(() => {})
      }
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('decide-refund-request error', e)
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
