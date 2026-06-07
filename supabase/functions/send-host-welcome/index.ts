// Sends the "Welcome to Meewano + next steps" email to a brand-new host
// right after their email OTP has been verified.
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_NAME = 'Meewano'
const SENDER_DOMAIN = 'notify.mail.meewano.com'
const FROM_DOMAIN = 'notify.mail.meewano.com'
const SITE_URL = 'https://meewano.com'
const LOGO_URL =
  `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/meewano-logo.png`

const BRAND = '#FF5780'
const BRAND_SOFT = '#FFE8EE'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

function WelcomeEmail({ firstName }: { firstName: string }) {
  const name = firstName || 'there'
  return React.createElement(
    Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Welcome to ${SITE_NAME} — here's how to get your property live`),
    React.createElement(
      Body,
      { style: { backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '32px 0' } },
      React.createElement(
        Container,
        { style: { backgroundColor: '#ffffff', border: '1px solid #F0F0F0', borderRadius: 16, maxWidth: 560, margin: '0 auto', padding: '36px 32px' } },
        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 24 } },
          React.createElement(Img, { src: LOGO_URL, alt: SITE_NAME, width: 56, height: 56, style: { borderRadius: 12 } }),
        ),
        React.createElement(Heading, { style: { color: INK, fontSize: 26, fontWeight: 700, textAlign: 'center', margin: '8px 0 6px' } },
          `Welcome to ${SITE_NAME}, ${name}!`),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 24px' } },
          'Your host account is ready. Here are your next steps:'),

        React.createElement(Section, { style: { backgroundColor: BRAND_SOFT, borderRadius: 12, padding: '20px 22px', marginBottom: 18 } },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 13, margin: '0 0 4px', letterSpacing: '0.4px' } }, 'STEP 1'),
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 4px' } }, 'Verify your identity'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: 0 } },
            'Upload your ID, a selfie, and proof of property ownership. Admin review usually takes under 24 hours.')),

        React.createElement(Section, { style: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: '20px 22px', marginBottom: 18 } },
          React.createElement(Text, { style: { color: INK, fontWeight: 700, fontSize: 13, margin: '0 0 4px', letterSpacing: '0.4px' } }, 'STEP 2'),
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 4px' } }, 'List your first property'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: 0 } },
            'Add photos, set your price and availability, write a welcome message — then submit for review.')),

        React.createElement(Section, { style: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: '20px 22px', marginBottom: 28 } },
          React.createElement(Text, { style: { color: INK, fontWeight: 700, fontSize: 13, margin: '0 0 4px', letterSpacing: '0.4px' } }, 'STEP 3'),
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 4px' } }, 'Start earning'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: 0 } },
            'Once approved, guests can book instantly and you get paid after each stay.')),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/host/verification`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'Start verification')),

        React.createElement(Hr, { style: { borderColor: '#F0F0F0', margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `Discover Kurdistan with ${SITE_NAME} · Erbil · Sulaymaniyah · Duhok`),
      ),
    ),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { email, firstName } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Skip if already sent (idempotent per profile)
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, welcome_email_sent_at')
      .eq('email', email)
      .maybeSingle()
    if (prof?.welcome_email_sent_at) {
      return new Response(JSON.stringify({ skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const html = await renderAsync(React.createElement(WelcomeEmail, { firstName }) as any)
    const text = await renderAsync(React.createElement(WelcomeEmail, { firstName }) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'host_welcome', recipient_email: email, status: 'pending',
    })

    const { error } = await supabase.rpc('enqueue_email', {
      queue_name: 'auth_emails',
      payload: {
        run_id: messageId,
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Welcome to ${SITE_NAME} — your next steps`,
        html, text,
        purpose: 'transactional',
        label: 'host_welcome',
        queued_at: new Date().toISOString(),
      },
    })
    if (error) throw error

    if (prof?.id) {
      await supabase.from('profiles').update({ welcome_email_sent_at: new Date().toISOString() }).eq('id', prof.id)
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-host-welcome error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
