import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  bookingShortId?: string
  refundAmount?: string
  propertyTitle?: string
}

const BRAND = '#FF5780'
const BRAND_LIGHT = '#FFF0F3'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const BookingCancelledGuestEmail = ({
  firstName, bookingShortId, refundAmount, propertyTitle,
}: Props) => {
  const name = firstName || 'there'
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Meewano cancellation is confirmed — refund is being processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}><Text style={brand}>Meewano</Text></Section>
          <Section style={card}>
            <Heading style={h1}>Cancellation confirmed</Heading>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Your booking for <strong>{propertyTitle || 'your reservation'}</strong> has been cancelled.
            </Text>
            <Section style={box}>
              <Text style={boxLabel}>REFUND SUMMARY</Text>
              <Text style={boxRow}>Booking reference: <strong>#{bookingShortId}</strong></Text>
              <Text style={boxRow}>Refund amount: <strong>{refundAmount}</strong></Text>
            </Section>
            <Text style={text}>
              Your refund of <strong>{refundAmount}</strong> for booking <strong>#{bookingShortId}</strong> is being processed.
              Please allow up to 14 days to receive your refund before contacting our team.
            </Text>
            <Text style={text}>The refund will go back to the payment method you used to book.</Text>
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
  component: BookingCancelledGuestEmail,
  subject: (d: any) => `Your Meewano cancellation is confirmed — refund is being processed`,
  displayName: 'Booking cancelled — guest',
  previewData: { firstName: 'Karwan', bookingShortId: 'A1B2C3', refundAmount: '240,000 IQD', propertyTitle: 'Cozy apartment in Erbil' },
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
