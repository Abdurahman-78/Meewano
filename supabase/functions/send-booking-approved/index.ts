// Sends "Your booking was approved" email to the guest after the host approves.
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
const SENDER_DOMAIN = 'home.meewano.com'
const FROM_DOMAIN = 'meewano.com'
const SITE_URL = 'https://meewano.com'
const LOGO_URL =
  `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/meewano-logo.png`

const BRAND = '#FF5780'
const BRAND_SOFT = '#FFE8EE'
const INK = '#1a1a1a'
const MUTED = '#6b7280'
const BORDER = '#F0F0F0'
const GREEN_SOFT = '#E7F8EF'
const GREEN = '#0F8C50'

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
  pricePerNight: number
  subtotal: number
  cleaningFee: number
  tax: number
  total: number
  currency: string
  paymentMethod?: string
  welcomeMessage?: string
  cleaningPolicy?: string
}

const money = (n: number, c: string) =>
  `${c} ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

function row(label: string, value: string, bold = false) {
  return React.createElement(Row, { style: { marginBottom: 6 } },
    React.createElement(Column, null,
      React.createElement(Text, { style: { color: bold ? INK : MUTED, fontSize: bold ? 15 : 14, fontWeight: bold ? 700 : 400, margin: 0 } }, label)),
    React.createElement(Column, { align: 'right' },
      React.createElement(Text, { style: { color: INK, fontSize: bold ? 16 : 14, fontWeight: bold ? 700 : 500, margin: 0 } }, value)),
  )
}

function ApprovedEmail(b: Booking) {
  const name = b.guestName || 'there'
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Your ${SITE_NAME} booking ${b.confirmationNumber} was approved`),
    React.createElement(Body, {
      style: { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '32px 0' }
    },
      React.createElement(Container, {
        style: { backgroundColor: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 16, maxWidth: 600, margin: '0 auto', padding: '36px 32px' }
      },
        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 16 } },
          React.createElement(Img, { src: LOGO_URL, alt: SITE_NAME, width: 140, height: 40, style: { display: 'inline-block', objectFit: 'contain' } }),
        ),
        React.createElement(Heading, { style: { color: INK, fontSize: 26, fontWeight: 700, textAlign: 'center', margin: '8px 0 6px' } },
          `Great news, ${name} — your booking is approved!`),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 8px' } },
          `Confirmation # ${b.confirmationNumber}`),

        React.createElement(Section, {
          style: { backgroundColor: GREEN_SOFT, borderRadius: 12, padding: '16px 18px', margin: '16px 0 8px', borderLeft: `4px solid ${GREEN}` }
        },
          React.createElement(Text, { style: { color: GREEN, fontWeight: 700, fontSize: 13, margin: '0 0 4px', letterSpacing: '0.4px' } }, 'NEXT STEP — COMPLETE PAYMENT'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: 0 } },
            `Your host accepted your request. Please complete payment to fully confirm your stay.`)),

        React.createElement(Hr, { style: { borderColor: BORDER, margin: '24px 0 20px' } }),

        React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Booking detail'),
        React.createElement(Section, { style: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: '18px 20px', marginBottom: 20 } },
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 2px' } }, b.propertyName),
          React.createElement(Text, { style: { color: MUTED, fontSize: 13, margin: '0 0 12px' } }, b.propertyLocation),
          row('Host', b.hostName || '—'),
          row('Check-in', b.checkIn),
          row('Check-out', b.checkOut),
          row('Guests', String(b.guests)),
          row('Nights', String(b.nights)),
        ),

        b.welcomeMessage && React.createElement(Section, {
          style: { backgroundColor: BRAND_SOFT, borderLeft: `4px solid ${BRAND}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }
        },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 12, margin: '0 0 6px', letterSpacing: '0.4px' } }, 'A MESSAGE FROM YOUR HOST'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' } }, b.welcomeMessage),
        ),

        React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Invoice preview'),
        React.createElement(Section, { style: { border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', marginBottom: 24 } },
          row(`${money(b.pricePerNight, b.currency)} × ${b.nights} nights`, money(b.subtotal, b.currency)),
          React.createElement(Hr, { style: { borderColor: BORDER, margin: '12px 0' } }),
          row('Total due', money(b.total, b.currency), true),
        ),

        b.cleaningPolicy && React.createElement(React.Fragment, null,
          React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Cleaning policy'),
          React.createElement(Section, { style: { border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24 } },
            React.createElement(Text, { style: { color: INK, fontSize: 14, lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' } }, b.cleaningPolicy),
          ),
        ),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/guest/bookings`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'Complete payment')),

        React.createElement(Hr, { style: { borderColor: BORDER, margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `Discover Kurdistan with ${SITE_NAME} · Erbil · Sulaymaniyah · Duhok`),
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

    const html = await renderAsync(React.createElement(ApprovedEmail, booking) as any)
    const text = await renderAsync(React.createElement(ApprovedEmail, booking) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'booking_approved', recipient_email: email, status: 'pending',
    })

    const { error } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Your ${SITE_NAME} booking was approved — ${booking.confirmationNumber}`,
        html, text,
        purpose: 'transactional',
        label: 'booking_approved',
        idempotency_key: `booking-approved-${booking.confirmationNumber}`,
        queued_at: new Date().toISOString(),
      },
    })
    if (error) throw error

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-booking-approved error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
