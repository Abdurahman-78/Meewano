import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  propertyTitle?: string
  isEdits?: boolean
  propertyId?: string
  siteUrl?: string
}

const SITE_URL = 'https://meewano.com'
const BRAND = '#FF5780'
const BRAND_LIGHT = '#FFF0F3'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const PropertyApprovedEmail = ({ firstName, propertyTitle, isEdits, propertyId, siteUrl }: Props) => {
  const name = firstName || 'there'
  const url = siteUrl || SITE_URL
  const title = propertyTitle || 'your listing'
  const viewLink = propertyId ? `${url}/property/${propertyId}` : `${url}/host/dashboard`
  return (
    <Html lang="en">
      <Head />
      <Preview>{isEdits ? 'Your listing edits are live' : 'Your listing is approved and live'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={hero}>
            <Text style={check}>✓</Text>
            <Heading style={h1}>
              {isEdits ? 'Your edits are live!' : 'Your listing is live!'}
            </Heading>
          </Section>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Great news — <strong>"{title}"</strong> has been approved on <strong>Meewano</strong> and
            {isEdits ? ' your latest edits are now visible to guests.' : ' is now visible to guests across Kurdistan.'}
          </Text>

          <Section style={nextStepsBox}>
            <Text style={nextStepsHeading}>NEXT STEPS — WHAT TO DO</Text>
            <Text style={nextStepItem}>1. Review your live listing to make sure everything looks perfect.</Text>
            <Text style={nextStepItem}>2. Set your availability calendar so guests know when they can book.</Text>
            <Text style={nextStepItem}>3. Respond to booking requests quickly — fast responses improve your ranking.</Text>
            <Text style={nextStepItem}>4. Keep your listing updated with fresh photos and accurate pricing.</Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={viewLink} style={button}>
              View your listing
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Questions? Just reply to this email and our team will help you out.</Text>
          <Text style={footer}>— The Meewano team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PropertyApprovedEmail,
  subject: 'Your Meewano listing is approved 🎉',
  displayName: 'Property listing approved',
  previewData: { firstName: 'Karwan', propertyTitle: 'Cozy Erbil apartment' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const hero = { backgroundColor: BRAND_LIGHT, borderRadius: '12px', padding: '28px 24px', textAlign: 'center' as const, marginBottom: '20px' }
const check = { color: BRAND, fontSize: '40px', fontWeight: 700, lineHeight: '1', margin: '0 0 8px 0' }
const h1 = { color: INK, fontSize: '22px', fontWeight: 700, margin: 0 }
const text = { color: INK, fontSize: '15px', lineHeight: '24px' }
const button = {
  backgroundColor: BRAND, color: '#ffffff', borderRadius: '10px',
  padding: '12px 24px', fontWeight: 600, textDecoration: 'none', fontSize: '15px',
}
const nextStepsBox = { backgroundColor: BRAND_LIGHT, borderRadius: '10px', padding: '16px 18px', margin: '16px 0' }
const nextStepsHeading = { color: BRAND, fontSize: '12px', fontWeight: 700, letterSpacing: '0.4px', margin: '0 0 8px 0' }
const nextStepItem = { color: INK, fontSize: '14px', lineHeight: '22px', margin: '0 0 4px 0' }
const hr = { borderColor: '#eaeaea', margin: '32px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '4px 0' }
