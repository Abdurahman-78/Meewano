// Sends an email to the host when a guest makes a new booking request.
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
const SENDER_DOMAIN = 'notify.mail.meewano.com'
const FROM_DOMAIN = 'notify.mail.meewano.com'
const SITE_URL = 'https://meewano.com'
const LOGO_URL =
  `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-assets/meewano-logo.png`

const BRAND = '#FF5780'
const BRAND_SOFT = '#FFE8EE'
const INK = '#1a1a1a'
const MUTED = '#6b7280'
const BORDER = '#F0F0F0'

interface Props {
  hostName: string
  guestName: string
  propertyName: string
  propertyLocation: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  totalPrice: number
  currency: string
  guestMessage?: string
  confirmationNumber: string
}

const money = (n: number, c: string) => `${c} ${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`

function HostBookingNotificationEmail(p: Props) {
  const name = p.hostName || 'there'
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, `New booking request for ${p.propertyName} from ${p.guestName}`),
    React.createElement(Body, {
      style: { backgroundColor: '#FAFAFA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', margin: 0, padding: '32px 0' }
    },
      React.createElement(Container, {
        style: { backgroundColor: '#ffffff', border: `1px solid ${BORDER}`, borderRadius: 16, maxWidth: 600, margin: '0 auto', padding: '36px 32px' }
      },
        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 16 } },
          React.createElement(Img, { src: LOGO_URL, alt: SITE_NAME, width: 56, height: 56, style: { borderRadius: 12 } }),
        ),

        React.createElement(Section, {
          style: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: '16px 18px', marginBottom: 20, textAlign: 'center' }
        },
          React.createElement(Text, { style: { fontSize: 28, margin: '0 0 4px' } }, '🔔'),
          React.createElement(Heading, { style: { color: INK, fontSize: 22, fontWeight: 700, margin: '0 0 4px' } },
            'New Booking Request'),
          React.createElement(Text, { style: { color: MUTED, fontSize: 14, margin: 0 } },
            `Confirmation # ${p.confirmationNumber}`),
        ),

        React.createElement(Section, { style: { marginBottom: 20 } },
          React.createElement(Text, { style: { color: INK, fontSize: 15, lineHeight: '24px', margin: '0 0 16px' } },
            `Hi ${name}, you have a new booking request for your property. Please review and respond.`),
        ),

        React.createElement(Heading, { as: 'h2', style: { color: INK, fontSize: 18, fontWeight: 700, margin: '0 0 12px' } }, 'Booking Details'),
        React.createElement(Section, { style: { backgroundColor: '#F7F7F7', borderRadius: 12, padding: '18px 20px', marginBottom: 20 } },
          React.createElement(Text, { style: { color: INK, fontWeight: 600, fontSize: 16, margin: '0 0 2px' } }, p.propertyName),
          React.createElement(Text, { style: { color: MUTED, fontSize: 13, margin: '0 0 12px' } }, p.propertyLocation),
          row('Guest', p.guestName),
          row('Check-in', p.checkIn),
          row('Check-out', p.checkOut),
          row('Guests', String(p.guests)),
          row('Nights', String(p.nights)),
          React.createElement(Hr, { style: { borderColor: BORDER, margin: '12px 0' } }),
          row('Total', money(p.totalPrice, p.currency), true),
        ),

        p.guestMessage && React.createElement(Section, {
          style: { backgroundColor: BRAND_SOFT, borderLeft: `4px solid ${BRAND}`, borderRadius: 8, padding: '14px 18px', marginBottom: 20 }
        },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 12, margin: '0 0 6px', letterSpacing: '0.4px' } }, 'MESSAGE FROM GUEST'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' } }, p.guestMessage),
        ),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: `${SITE_URL}/host/bookings`,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, 'Review & Respond'),
        ),

        React.createElement(Section, {
          style: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: '14px 18px', marginTop: 20, marginBottom: 8 }
        },
          React.createElement(Text, { style: { color: '#92400E', fontSize: 13, margin: 0 } },
            '⏰ Please respond to this booking request as soon as possible. Guests appreciate quick responses!'),
        ),

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
    let { email, host_id, booking } = body as { email: string | null; host_id?: string; booking: Props }
    if (!booking) {
      return new Response(JSON.stringify({ error: 'booking required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // If email wasn't provided, try to resolve it from the host's profile or auth.users
    if (!email && host_id) {
      // Try profiles first
      const { data: prof } = await supabase.from('profiles').select('email').eq('id', host_id).maybeSingle()
      email = prof?.email || null

      // Fall back to auth.users (requires service role)
      if (!email) {
        const { data: authUser } = await supabase.auth.admin.getUserById(host_id)
        email = authUser?.user?.email || null
      }
    }

    if (!email) {
      console.error('send-host-booking-notification: no email found for host', host_id)
      return new Response(JSON.stringify({ error: 'no host email found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const props: Props = { ...booking }
    const html = await renderAsync(React.createElement(HostBookingNotificationEmail, props) as any)
    const text = await renderAsync(React.createElement(HostBookingNotificationEmail, props) as any, { plainText: true })

    const messageId = crypto.randomUUID()
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: 'host_booking_notification', recipient_email: email, status: 'pending',
    })

    const { error } = await supabase.rpc('enqueue_email', {
      queue_name: 'auth_emails',
      payload: {
        run_id: messageId,
        message_id: messageId,
        to: email,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: `🔔 New booking request for ${booking.propertyName}`,
        html, text,
        purpose: 'transactional',
        label: 'host_booking_notification',
        queued_at: new Date().toISOString(),
      },
    })
    if (error) throw error

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-host-booking-notification error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
