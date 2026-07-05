// Admin decides on a host's refund rejection.
//  - approve_rejection: guest gets "declined by host" email
//  - decline_rejection: admin overrides with refundPct (100/75/50/25); host + guest emailed
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

    const admin = createClient(supabaseUrl, serviceKey)
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' })
    const { data: isMod } = await admin.rpc('has_role', { _user_id: userId, _role: 'moderator' })
    if (!isAdmin && !isMod) return new Response(JSON.stringify({ error: 'Not allowed' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const body = await req.json().catch(() => ({}))
    const refundRequestId: string = body?.refundRequestId
    const decision: string = body?.decision
    const refundPct: number = Number(body?.refundPct)
    if (!refundRequestId || !['approve_rejection', 'decline_rejection'].includes(decision)) {
      return new Response(JSON.stringify({ error: 'refundRequestId and valid decision required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (decision === 'decline_rejection' && ![100, 75, 50, 25].includes(refundPct)) {
      return new Response(JSON.stringify({ error: 'refundPct must be 100, 75, 50 or 25' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: rr, error: rErr } = await admin.from('refund_requests').select('*').eq('id', refundRequestId).maybeSingle()
    if (rErr || !rr) return new Response(JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (rr.status !== 'host_rejected') return new Response(JSON.stringify({ error: 'Not in host_rejected state' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: guestProfile } = await admin.from('profiles').select('email, full_name').eq('id', rr.guest_id).maybeSingle()
    const { data: hostProfile } = await admin.from('profiles').select('email, full_name').eq('id', rr.host_id).maybeSingle()

    const invoke = (payload: Record<string, unknown>) =>
      admin.functions.invoke('send-transactional-email', { body: payload }).catch((e) => console.warn('email failed', e))

    if (decision === 'approve_rejection') {
      await admin.from('refund_requests').update({
        status: 'admin_approved_rejection',
        admin_decision: 'approve_rejection',
        refund_amount: 0,
      }).eq('id', refundRequestId)

      if (guestProfile?.email) invoke({
        templateName: 'refund-rejected-guest', recipientEmail: guestProfile.email,
        idempotencyKey: `refund-rej-guest-${refundRequestId}`,
        templateData: { firstName: (guestProfile.full_name || '').split(' ')[0] || '', bookingShortId: shortId(rr.booking_id) },
      })
    } else {
      const total = Number(rr.total_price) || 0
      const refundAmount = Math.round(total * (refundPct / 100))
      await admin.from('refund_requests').update({
        status: 'admin_declined_rejection',
        admin_decision: 'decline_rejection',
        admin_refund_pct: refundPct,
        refund_amount: refundAmount,
      }).eq('id', refundRequestId)
      await admin.from('bookings').update({ refund_amount: refundAmount }).eq('id', rr.booking_id)

      if (guestProfile?.email) invoke({
        templateName: 'refund-admin-override-guest', recipientEmail: guestProfile.email,
        idempotencyKey: `refund-adm-guest-${refundRequestId}`,
        templateData: {
          firstName: (guestProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(rr.booking_id), refundPct, refundAmount: fmtIQD(refundAmount),
        },
      })
      if (hostProfile?.email) invoke({
        templateName: 'refund-admin-override-host', recipientEmail: hostProfile.email,
        idempotencyKey: `refund-adm-host-${refundRequestId}`,
        templateData: {
          hostFirstName: (hostProfile.full_name || '').split(' ')[0] || '',
          bookingShortId: shortId(rr.booking_id), refundPct, refundAmount: fmtIQD(refundAmount),
        },
      })
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('admin-decide-refund-rejection error', e)
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
