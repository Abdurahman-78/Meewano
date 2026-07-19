// Sends property approval / rejection email to the host.
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
const WARN_SOFT = '#FFF4E5'
const WARN = '#B45309'

type Variant = 'approved' | 'rejected' | 'changes_approved' | 'changes_rejected'

function PropertyEmail({
  firstName, propertyTitle, propertyId, variant, reason,
}: {
  firstName: string; propertyTitle: string; propertyId: string; variant: Variant; reason?: string;
}) {
  const name = firstName || 'there'
  const isApprove = variant === 'approved' || variant === 'changes_approved'
  const isEdits = variant === 'changes_approved' || variant === 'changes_rejected'

  const heading = isApprove
    ? (isEdits ? `Your edits to "${propertyTitle}" are live` : `"${propertyTitle}" is live! 🎉`)
    : (isEdits ? `Your edits to "${propertyTitle}" were rejected` : `"${propertyTitle}" was not approved`)

  const intro = isApprove
    ? (isEdits
        ? `Our team reviewed your updates and your listing is now showing the latest version on ${SITE_NAME}.`
        : `Our team has reviewed your listing and it's now visible to guests on ${SITE_NAME}.`)
    : (isEdits
        ? `Our team reviewed your edits and we weren't able to publish them as submitted.`
        : `Our team has reviewed your listing and we weren't able to approve it as submitted.`)

  const cta = isApprove ? 'View your listing' : 'Update and resubmit'
  const ctaHref = isApprove ? `${SITE_URL}/property/${propertyId}` : `${SITE_URL}/host/edit-listing/${propertyId}`

  return React.createElement(
    Html, null,
    React.createElement(Head, null),
    React.createElement(Preview, null, heading),
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
          `Hi ${name},`),
        React.createElement(Text, { style: { color: INK, fontSize: 17, fontWeight: 600, textAlign: 'center', margin: '0 0 10px' } },
          heading),
        React.createElement(Text, { style: { color: MUTED, fontSize: 15, textAlign: 'center', margin: '0 0 24px' } },
          intro),

        !isApprove && React.createElement(Section, {
          style: { backgroundColor: WARN_SOFT, borderRadius: 12, padding: '20px 22px', marginBottom: 18, borderLeft: `4px solid ${WARN}` },
        },
          React.createElement(Text, { style: { color: WARN, fontWeight: 700, fontSize: 13, margin: '0 0 6px', letterSpacing: '0.4px' } }, 'REASON FOR REJECTION'),
          React.createElement(Text, { style: { color: INK, fontSize: 15, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' } },
            (reason || '').trim() || 'Please review your listing details, photos, and pricing, then resubmit.'),
        ),

        !isApprove && React.createElement(Section, { style: { backgroundColor: '#ffffff', border: '1px solid #F0F0F0', borderRadius: 12, padding: '20px 22px', marginBottom: 18 } },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 13, margin: '0 0 8px', letterSpacing: '0.4px' } }, 'NEXT STEPS — WHAT TO DO'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 } }, '1. Read the reason for rejection carefully above.'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 } }, '2. Update your photos, description, or pricing based on the feedback.'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 } }, '3. Click "Update and resubmit" — our team will review again within 24 hours.'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: 0, lineHeight: 1.5 } }, '4. Need help? Reply to this email and we\'ll guide you.')),

        isApprove && React.createElement(Section, { style: { backgroundColor: BRAND_SOFT, borderRadius: 12, padding: '20px 22px', marginBottom: 18 } },
          React.createElement(Text, { style: { color: BRAND, fontWeight: 700, fontSize: 13, margin: '0 0 8px', letterSpacing: '0.4px' } }, 'NEXT STEPS — WHAT TO DO'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 } }, '1. Review your live listing to make sure everything looks perfect.'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 } }, '2. Set your availability calendar so guests know when they can book.'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: '0 0 4px', lineHeight: 1.5 } }, '3. Respond to booking requests quickly — fast responses improve your ranking.'),
          React.createElement(Text, { style: { color: INK, fontSize: 14, margin: 0, lineHeight: 1.5 } }, '4. Keep your listing updated with fresh photos and accurate pricing.')),

        React.createElement(Section, { style: { textAlign: 'center', marginBottom: 8 } },
          React.createElement(Button, {
            href: ctaHref,
            style: { backgroundColor: BRAND, color: '#ffffff', borderRadius: 10, padding: '13px 28px', fontWeight: 600, fontSize: 15, textDecoration: 'none' },
          }, cta)),

        React.createElement(Hr, { style: { borderColor: '#F0F0F0', margin: '28px 0 16px' } }),
        React.createElement(Text, { style: { color: MUTED, fontSize: 12, textAlign: 'center', margin: 0 } },
          `${SITE_NAME} · Erbil · Sulaymaniyah · Duhok`),
      ),
    ),
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  try {
    const { propertyId, variant, reason } = await req.json() as {
      propertyId: string; variant: Variant; reason?: string;
    }
    if (!propertyId || !variant) {
      return new Response(JSON.stringify({ error: 'propertyId and variant required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: prop } = await supabase
      .from('properties').select('id, title, host_id').eq('id', propertyId).maybeSingle()
    if (!prop) {
      return new Response(JSON.stringify({ error: 'property not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: host } = await supabase
      .from('profiles').select('email, full_name').eq('id', prop.host_id).maybeSingle()
    if (!host?.email) {
      return new Response(JSON.stringify({ skipped: 'no host email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const firstName = host.full_name?.split(' ')[0] ?? ''
    const element = React.createElement(PropertyEmail, {
      firstName, propertyTitle: prop.title, propertyId: prop.id, variant, reason,
    })
    const html = await renderAsync(element as any)
    const text = await renderAsync(element as any, { plainText: true })

    const messageId = crypto.randomUUID()
    const label = `property_${variant}`
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: label, recipient_email: host.email, status: 'pending',
    })

    const isApprove = variant === 'approved' || variant === 'changes_approved'
    const subject = isApprove
      ? `Your ${SITE_NAME} listing "${prop.title}" is live`
      : `Action needed on your ${SITE_NAME} listing "${prop.title}"`

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      await supabase.from('email_send_log').insert({
        message_id: messageId, template_name: label, recipient_email: host.email, status: 'failed',
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
        'Idempotency-Key': `property-review-${propertyId}-${variant}`,
      },
      body: JSON.stringify({
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        to: [host.email],
        subject,
        html, text,
        tags: [{ name: 'template', value: label }],
      }),
    })
    const resendBody = await resendResponse.json().catch(() => ({}))
    if (!resendResponse.ok) {
      await supabase.from('email_send_log').insert({
        message_id: messageId, template_name: label, recipient_email: host.email, status: 'failed',
        error_message: `Resend ${resendResponse.status}: ${JSON.stringify(resendBody)}`.slice(0, 500),
      })
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    await supabase.from('email_send_log').insert({
      message_id: messageId, template_name: label, recipient_email: host.email, status: 'sent',
    })

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('send-property-review error', e)
    return new Response(JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
