// Sends "Your host account has been approved" email after admin verifies a host.
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
const FROM_DOMAIN = 'meewano.com'
const SITE_URL = 'https://meewano.com'
const LOGO_URL =
  `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/meewano-logo.png`

const BRAND = '#FF5780'
const BRAND_SOFT = '#FFE8EE'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

function ApprovedEmail({ firstName }: { firstName: string }) {
  const name = firstName || 'there'
  return React.createElement(
    Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Your ${SITE_NAME} host account has been approved`),
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
          `You're approved, ${name}! 🎉`),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 24px' } },
          `Our team has reviewed your documents and your ${SITE_NAME} host account is now verified.`),

        React.createElement(Section, { style: { backgroundColor: BRAND_SOFT, borderRadius: 12, padding: '20px 22px', marginBottom: 18 } },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 13, margin: '0 0 4px', letterSpacing: '0.4px' } }, 'YOU CAN NOW'),
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 4px' } }, 'List your properties'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: 0 } },
            'Add photos, set your nightly rate and availability, and publish your listing to start receiving bookings.')),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/host/add-listing`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'Add your first property')),

        React.createElement(Hr, { style: { borderColor: '#F0F0F0', margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `Welcome to the ${SITE_NAME} host community.`),
      ),
    ),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { email, firstName, userId } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let toEmail = email
    let name = firstName
    if (!toEmail && userId) {
      const { data: prof } = await supabase
        .from('profiles').select('email, full_name').eq('id', userId).maybeSingle()
      toEmail = prof?.email
      name = name || (prof?.full_name?.split(' ')[0] ?? '')
    }
    if (!toEmail) {
      return new Response(JSON.stringify({ error: 'email or userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const html = await renderAsync(React.createElement(ApprovedEmail, { firstName: name || '' }) as any)
    const text = await renderAsync(React.createElement(ApprovedEmail, { firstName: name || '' }) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'host_approved', recipient_email: toEmail, status: 'pending',
    })

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      await supabase.from('email_send_log').insert({
        message_id: messageId, template_name: 'host_approved', recipient_email: toEmail, status: 'failed',
        error_message: 'RESEND_API_KEY not configured',
      })
      return new Response(JSON.stringify({ error: 'Email provider not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
        'Idempotency-Key': `host-approved-${userId || toEmail}`,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [toEmail],
        subject: `Your ${SITE_NAME} host account has been approved`,
        html, text,
        tags: [{ name: 'template', value: 'host_approved' }],
      }),
    })
    const resendBody = await resendResponse.json().catch(() => ({}))
    if (!resendResponse.ok) {
      await supabase.from('email_send_log').insert({
        message_id: messageId, template_name: 'host_approved', recipient_email: toEmail, status: 'failed',
        error_message: `Resend ${resendResponse.status}: ${JSON.stringify(resendBody)}`.slice(0, 500),
      })
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'host_approved', recipient_email: toEmail, status: 'sent',
    })

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-host-approved error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
