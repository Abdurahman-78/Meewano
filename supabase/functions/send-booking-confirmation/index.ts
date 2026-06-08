// Sends booking confirmation + invoice email to the guest after a successful booking.
// Also includes a "Welcome to Meewano" intro for first-time guests.
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

interface Props {
  firstName: string
  isFirstBooking: boolean
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
  paymentMethod: string
  welcomeMessage?: string
  cleaningPolicy?: string
}

const money = (n: number, c: string) => `${c} ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

function BookingEmail(p: Props) {
  const name = p.firstName || 'there'
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `Your ${SITE_NAME} booking ${p.confirmationNumber} is confirmed`),
    React.createElement(Body, {
      style: { backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '32px 0' }
    },
      React.createElement(Container, {
        style: { backgroundColor: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 16, maxWidth: 600, margin: '0 auto', padding: '36px 32px' }
      },
        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 16 } },
          React.createElement(Img, { src: LOGO_URL, alt: SITE_NAME, width: 56, height: 56, style: { borderRadius: 12 } }),
        ),
        React.createElement(Heading, { style: { color: INK, fontSize: 26, fontWeight: 700, textAlign: 'center', margin: '8px 0 6px' } },
          `Booking confirmed, ${name}!`),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 8px' } },
          `Confirmation # ${p.confirmationNumber}`),

        p.isFirstBooking && React.createElement(Section, {
          style: { backgroundColor: BRAND_SOFT, borderRadius: 12, padding: '16px 18px', margin: '16px 0 8px' }
        },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 13, margin: '0 0 4px', letterSpacing: '0.4px' } }, `WELCOME TO ${SITE_NAME.toUpperCase()}`),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: 0 } },
            `Thank you for choosing ${SITE_NAME} for your stay in Kurdistan. We're thrilled to host you.`)),

        React.createElement(Hr, { style: { borderColor: BORDER, margin: '24px 0 20px' } }),

        React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Booking detail'),
        React.createElement(Section, { style: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: '18px 20px', marginBottom: 20 } },
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 2px' } }, p.propertyName),
          React.createElement(Text, { style: { color: MUTED, fontSize: 13, margin: '0 0 12px' } }, p.propertyLocation),
          row('Check-in', p.checkIn),
          row('Check-out', p.checkOut),
          row('Guests', String(p.guests)),
          row('Nights', String(p.nights)),
        ),

        p.welcomeMessage && React.createElement(Section, {
          style: { backgroundColor: BRAND_SOFT, borderLeft: `4px solid ${BRAND}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }
        },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 12, margin: '0 0 6px', letterSpacing: '0.4px' } }, 'A MESSAGE FROM YOUR HOST'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' } }, p.welcomeMessage),
        ),

        React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Invoice'),
        React.createElement(Section, { style: { border: `1px solid ${BORDER}`, borderRadius: 12, padding: '18px 20px', marginBottom: 24 } },
          row(`${money(p.pricePerNight, p.currency)} × ${p.nights} nights`, money(p.subtotal, p.currency)),
          row('Cleaning fee', money(p.cleaningFee, p.currency)),
          row('Taxes & fees', money(p.tax, p.currency)),
          React.createElement(Hr, { style: { borderColor: BORDER, margin: '12px 0' } }),
          row('Total paid', money(p.total, p.currency), true),
          React.createElement(Text, { style: { color: MUTED, fontSize: 12, margin: '10px 0 0' } }, `Payment method: ${p.paymentMethod}`),
        ),

        p.cleaningPolicy && React.createElement(React.Fragment, null,
          React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Cleaning policy'),
          React.createElement(Section, { style: { border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24 } },
            React.createElement(Text, { style: { color: INK, fontSize: 14, lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' } }, p.cleaningPolicy),
          ),
        ),


        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/guest/bookings`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'View my bookings')),

        React.createElement(Hr, { style: { borderColor: BORDER, margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `Discover Kurdistan with ${SITE_NAME} · Erbil · Sulaymaniyah · Duhok`),
      ),
    ),
  )
}

function row(label: string, value: string, bold = false) {
  return React.createElement(Row, { style: { marginBottom: 6 } },
    React.createElement(Column, null,
      React.createElement(Text, { style: { color: bold ? INK : MUTED, fontSize: bold ? 15 : 14, fontWeight: bold ? 700 : 400, margin: 0 } }, label)),
    React.createElement(Column, { align: 'right' },
      React.createElement(Text, { style: { color: INK, fontSize: bold ? 16 : 14, fontWeight: bold ? 700 : 500, margin: 0 } }, value)),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const body = await req.json()
    const { email, firstName, booking } = body as { email: string; firstName?: string; booking: Omit<Props, 'firstName' | 'isFirstBooking'> }
    if (!email || !booking) {
      return new Response(JSON.stringify({ error: 'email and booking required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // First-booking detection: count prior bookings for this guest by email
    const { data: prof } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle()
    let isFirstBooking = true
    if (prof?.id) {
      const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('guest_id', prof.id)
      isFirstBooking = (count ?? 0) <= 1
    }

    const props: Props = { ...booking, firstName: firstName || '', isFirstBooking }
    const html = await renderAsync(React.createElement(BookingEmail, props) as any)
    const text = await renderAsync(React.createElement(BookingEmail, props) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'booking_confirmation', recipient_email: email, status: 'pending',
    })

    const { error } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `Your ${SITE_NAME} booking is confirmed — ${booking.confirmationNumber}`,
        html, text,
        purpose: 'transactional',
        label: 'booking_confirmation',
        idempotency_key: `booking-confirmation-${booking.confirmationNumber}`,
        queued_at: new Date().toISOString(),
      },
    })
    if (error) throw error

    return new Response(JSON.stringify({ ok: true, isFirstBooking }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-booking-confirmation error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
