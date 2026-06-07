import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

    // Validate user from bearer token
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

    // Best-effort cleanup of related rows (cascade should also handle most)
    await admin.from('properties').delete().eq('host_id', user.id)
    await admin.from('bookings').delete().eq('guest_id', user.id)
    await admin.from('bookings').delete().eq('host_id', user.id)
    await admin.from('favorites').delete().eq('user_id', user.id)
    await admin.from('reviews').delete().eq('guest_id', user.id)
    await admin.from('property_reviews').delete().eq('reviewer_id', user.id)
    await admin.from('messages').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    await admin.from('notifications').delete().eq('user_id', user.id)
    await admin.from('host_verifications').delete().eq('user_id', user.id)
    await admin.from('user_roles').delete().eq('user_id', user.id)
    await admin.from('profiles').delete().eq('id', user.id)

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
