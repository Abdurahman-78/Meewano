// Sends "Your booking request was declined" email to the guest.
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Row, Column, Section, Text,
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
const INK = '#1a1a1a'
const MUTED = '#6b7280'
const BORDER = '#F0F0F0'
const WARN_SOFT = '#FFF4E5'
const WARN = '#B45309'

interface Booking {
  guestName: string
  hostName: string
  confirmationNumber: string
  propertyName: string
  propertyLocation: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  reason?: string
}

function row(label: string, value: string) {
  return React.createElement(Row, { style: { marginBottom: 6 } },
    React.createElement(Column, null,
      React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: 0 } }, label)),
    React.createElement(Column, { align: 'right' },
      React.createElement(Text, { style: { color: INK, fontSize: 14, fontWeight: 500, margin: 0 } }, value)),
  )
}

function RejectedEmail(b: Booking) {
  const name = b.guestName || 'there'
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Your ${SITE_NAME} booking request was declined`),
    React.createElement(Body, {
      style: { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '32px 0' }
    },
      React.createElement(Container, {
        style: { backgroundColor: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 16, maxWidth: 600, margin: '0 auto', padding: '36px 32px' }
      },
        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 16 } },
          React.createElement(Img, { src: LOGO_URL, alt: SITE_NAME, width: 56, height: 56, style: { borderRadius: 12 } }),
        ),
        React.createElement(Heading, { style: { color: INK, fontSize: 24, fontWeight: 700, textAlign: 'center', margin: '8px 0 6px' } },
          `Hi ${name}, your booking request was declined`),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 24px' } },
          `Unfortunately your host wasn't able to accept this request. You haven't been charged.`),

        b.reason && React.createElement(Section, {
          style: { backgroundColor: WARN_SOFT, borderRadius: 12, padding: '16px 20px', marginBottom: 20, borderLeft: `4px solid ${WARN}` }
        },
          React.createElement(Text, { style: { color: WARN, fontWeight: 700, fontSize: 13, margin: '0 0 6px', letterSpacing: '0.4px' } }, 'MESSAGE FROM HOST'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' } }, b.reason),
        ),

        React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Request detail'),
        React.createElement(Section, { style: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: '18px 20px', marginBottom: 24 } },
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 2px' } }, b.propertyName),
          React.createElement(Text, { style: { color: MUTED, fontSize: 13, margin: '0 0 12px' } }, b.propertyLocation),
          row('Confirmation #', b.confirmationNumber),
          row('Host', b.hostName || '—'),
          row('Check-in', b.checkIn),
          row('Check-out', b.checkOut),
          row('Guests', String(b.guests)),
          row('Nights', String(b.nights)),
        ),

        React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: '0 0 20px', textAlign: 'center' } },
          `Plenty of other places in Kurdistan are ready to host you — keep exploring on ${SITE_NAME}.`),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/search`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'Find another stay')),

        React.createElement(Hr, { style: { borderColor: BORDER, margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `${SITE_NAME} · Erbil · Sulaymaniyah · Duhok`),
      ),
    ),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { email, booking } = await req.json() as { email: string; booking: Booking }
    if (!email || !booking) {
      return new Response(JSON.stringify({ error: 'email and booking required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const html = await renderAsync(React.createElement(RejectedEmail, booking) as any)
    const text = await renderAsync(React.createElement(RejectedEmail, booking) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'booking_rejected', recipient_email: email, status: 'pending',
    })

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      await supabase.from('email_send_log').insert({
        message_id: messageId, template_name: 'booking_rejected', recipient_email: email, status: 'failed',
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
        'Idempotency-Key': `booking-rejected-${booking.confirmationNumber}`,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [email],
        subject: `Your ${SITE_NAME} booking request was declined`,
        html, text,
        tags: [{ name: 'template', value: 'booking_rejected' }],
      }),
    })
    const resendBody = await resendResponse.json().catch(() => ({}))
    if (!resendResponse.ok) {
      await supabase.from('email_send_log').insert({
        message_id: messageId, template_name: 'booking_rejected', recipient_email: email, status: 'failed',
        error_message: `Resend ${resendResponse.status}: ${JSON.stringify(resendBody)}`.slice(0, 500),
      })
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'booking_rejected', recipient_email: email, status: 'sent',
    })

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-booking-rejected error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
