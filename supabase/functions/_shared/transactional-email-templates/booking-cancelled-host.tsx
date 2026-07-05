import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  hostFirstName?: string
  bookingShortId?: string
  propertyTitle?: string
  checkIn?: string
  checkOut?: string
  daysUntilCheckIn?: number
  policyLabel?: string
  hostPayout?: string
  guestRefund?: string
}

const BRAND = '#FF5780'
const BRAND_LIGHT = '#FFF0F3'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const BookingCancelledHostEmail = ({
  hostFirstName, bookingShortId, propertyTitle, checkIn, checkOut,
  daysUntilCheckIn, policyLabel, hostPayout, guestRefund,
}: Props) => {
  const name = hostFirstName || 'there'
  return (
    <Html lang="en">
      <Head />
      <Preview>Guest cancelled a reservation — dates are open again</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}><Text style={brand}>Meewano</Text></Section>
          <Section style={card}>
            <Heading style={h1}>A guest cancelled</Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              A guest has cancelled reservation <strong>#{bookingShortId}</strong> for <strong>{propertyTitle}</strong>.
              The dates ({checkIn} → {checkOut}) are now available for new bookings.
            </Text>
            <Section style={box}>
              <Text style={boxLabel}>PAYOUT SPLIT</Text>
              <Text style={boxRow}>
                Because the cancellation is within {daysUntilCheckIn} days of check-in,
                according to the <strong>{policyLabel}</strong> cancellation policy:
              </Text>
              <Text style={boxRow}>Paid to your account: <strong>{hostPayout}</strong></Text>
              <Text style={boxRow}>Refunded to the guest: <strong>{guestRefund}</strong></Text>
            </Section>
            <Text style={text}>
              No action needed on your side — your calendar has been reopened automatically.
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Questions? Just reply to this email.</Text>
          <Text style={footer}>— The Meewano team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BookingCancelledHostEmail,
  subject: (d: any) => `Guest cancelled reservation #${d?.bookingShortId ?? ''}`.trim(),
  displayName: 'Booking cancelled — host',
  previewData: {
    hostFirstName: 'Aram', bookingShortId: 'A1B2C3', propertyTitle: 'Cozy apartment in Erbil',
    checkIn: '2026-08-01', checkOut: '2026-08-05', daysUntilCheckIn: 20,
    policyLabel: 'Standard', hostPayout: '0 IQD', guestRefund: '240,000 IQD',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', margin: '0', padding: '0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }
const header = { backgroundColor: BRAND, borderRadius: '12px 12px 0 0', padding: '16px 24px', textAlign: 'center' as const }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0' }
const card = { backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '24px' }
const h1 = { color: INK, fontSize: '22px', fontWeight: 700, margin: '0 0 16px 0' }
const text = { color: INK, fontSize: '15px', lineHeight: '24px', margin: '0 0 12px 0' }
const box = { backgroundColor: BRAND_LIGHT, borderRadius: '10px', padding: '16px 18px', margin: '16px 0' }
const boxLabel = { color: BRAND, fontSize: '12px', fontWeight: 700, letterSpacing: '0.4px', margin: '0 0 8px 0' }
const boxRow = { color: INK, fontSize: '14px', lineHeight: '22px', margin: '0 0 4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '4px 0' }
