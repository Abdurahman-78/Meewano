// Sends "Your host verification was rejected" email after admin rejects.
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
const SENDER_DOMAIN = 'home.meewano.com'
const FROM_DOMAIN = 'meewano.com'
const SITE_URL = 'https://meewano.com'
const LOGO_URL =
  `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/meewano-logo.png`

const BRAND = '#FF5780'
const INK = '#1a1a1a'
const MUTED = '#6b7280'
const WARN_SOFT = '#FFF4E5'
const WARN = '#B45309'

function RejectedEmail({ firstName, reason }: { firstName: string; reason: string }) {
  const name = firstName || 'there'
  const why = reason?.trim() || 'Please review your documents and submit clearer, valid files.'
  return React.createElement(
    Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Your ${SITE_NAME} host verification needs attention`),
    React.createElement(
      Body,
      { style: { backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '32px 0' } },
      React.createElement(
        Container,
        { style: { backgroundColor: '#ffffff', border: '1px solid #F0F0F0', borderRadius: 16, maxWidth: 560, margin: '0 auto', padding: '36px 32px' } },
        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 24 } },
          React.createElement(Img, { src: LOGO_URL, alt: SITE_NAME, width: 56, height: 56, style: { borderRadius: 12 } }),
        ),
        React.createElement(Heading, { style: { color: INK, fontSize: 24, fontWeight: 700, textAlign: 'center', margin: '8px 0 6px' } },
          `Hi ${name}, your verification needs attention`),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 24px' } },
          `Our team reviewed your host verification on ${SITE_NAME} and we weren't able to approve it yet.`),

        React.createElement(Section, { style: { backgroundColor: WARN_SOFT, borderRadius: 12, padding: '20px 22px', marginBottom: 18, borderLeft: `4px solid ${WARN}` } },
          React.createElement(Text, { style: { color: WARN, fontWeight: 700, fontSize: 13, margin: '0 0 6px', letterSpacing: '0.4px' } }, 'REASON FOR REJECTION'),
          React.createElement(Text, { style: { color: INK, fontSize: 15, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' } }, why),
        ),

        React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: '0 0 24px' } },
          'You can update your documents and resubmit anytime — most resubmissions are reviewed within 24 hours.'),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/host/verification`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'Resubmit verification')),

        React.createElement(Hr, { style: { borderColor: '#F0F0F0', margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `Need help? Reply to this email and the ${SITE_NAME} team will assist you.`),
      ),
    ),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { email, firstName, userId, reason } = await req.json()
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

    const html = await renderAsync(React.createElement(RejectedEmail, { firstName: name || '', reason: reason || '' }) as any)
    const text = await renderAsync(React.createElement(RejectedEmail, { firstName: name || '', reason: reason || '' }) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'host_rejected', recipient_email: toEmail, status: 'pending',
    })

    const { error } = await supabase.rpc('enqueue_email', {
      queue_name: 'auth_emails',
      payload: {
        run_id: messageId,
        message_id: messageId,
        to: toEmail,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Your ${SITE_NAME} host verification needs attention`,
        html, text,
        purpose: 'transactional',
        label: 'host_rejected',
        queued_at: new Date().toISOString(),
      },
    })
    if (error) throw error

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-host-rejected error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
