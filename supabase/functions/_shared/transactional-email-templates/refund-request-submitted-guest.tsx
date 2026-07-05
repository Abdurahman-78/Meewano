import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { firstName?: string; bookingShortId?: string; propertyTitle?: string }

const BRAND = '#FF5780'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const Email = ({ firstName, bookingShortId, propertyTitle }: Props) => (
  <Html lang="en"><Head />
    <Preview>Your refund request has been submitted</Preview>
    <Body style={main}><Container style={container}>
      <Section style={header}><Text style={brand}>Meewano</Text></Section>
      <Section style={card}>
        <Heading style={h1}>Refund request received</Heading>
        <Text style={text}>Hi {firstName || 'there'},</Text>
        <Text style={text}>
          Your refund request for booking <strong>#{bookingShortId}</strong>
          {propertyTitle ? <> at <strong>{propertyTitle}</strong></> : null} has been submitted.
        </Text>
        <Text style={text}>
          We aim to provide a response as soon as possible, but please allow up to 5 days before contacting our team.
        </Text>
        <Text style={text}>You are cancelling due to exceptional circumstances — the host will review your request to decide if you are eligible for a full or partial refund.</Text>
      </Section>
      <Hr style={hr} /><Text style={footer}>— The Meewano team</Text>
    </Container></Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your refund request has been submitted',
  displayName: 'Refund request submitted — guest',
  previewData: { firstName: 'Karwan', bookingShortId: 'A1B2C3', propertyTitle: 'Cozy apartment in Erbil' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }
const header = { backgroundColor: BRAND, borderRadius: '12px 12px 0 0', padding: '16px 24px', textAlign: 'center' as const }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0' }
const card = { backgroundColor: '#ffffff', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '24px' }
const h1 = { color: INK, fontSize: '22px', fontWeight: 700, margin: '0 0 16px 0' }
const text = { color: INK, fontSize: '15px', lineHeight: '24px', margin: '0 0 12px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', margin: '4px 0' }
