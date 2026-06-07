import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  propertyTitle?: string
  reason?: string
  isEdits?: boolean
  propertyId?: string
  siteUrl?: string
}

const SITE_URL = 'https://meewano.com'
const BRAND = '#FF5780'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const PropertyRejectedEmail = ({ firstName, propertyTitle, reason, isEdits, propertyId, siteUrl }: Props) => {
  const name = firstName || 'there'
  const url = siteUrl || SITE_URL
  const title = propertyTitle || 'your listing'
  const editLink = propertyId ? `${url}/host/edit-listing/${propertyId}` : `${url}/host/dashboard`
  return (
    <Html lang="en">
      <Head />
      <Preview>{isEdits ? 'Your listing edits need attention' : 'Your Meewano listing needs attention'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isEdits ? 'Your listing edits were not approved' : 'Your listing was not approved'}
          </Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We reviewed <strong>"{title}"</strong> on <strong>Meewano</strong> and
            {isEdits ? ' weren\'t able to approve the latest edits.' : ' weren\'t able to publish it yet.'}
          </Text>
          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonLabel}>Reason from our team:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}

          <Section style={nextStepsBox}>
            <Text style={nextStepsHeading}>NEXT STEPS — WHAT TO DO</Text>
            <Text style={nextStepItem}>1. Read the reason for rejection carefully above.</Text>
            <Text style={nextStepItem}>2. Update your photos, description, or pricing based on the feedback.</Text>
            <Text style={nextStepItem}>3. Click "Edit & resubmit" — our team will review again within 24 hours.</Text>
            <Text style={nextStepItem}>4. Need help? Reply to this email and we'll guide you.</Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={editLink} style={button}>
              Edit & resubmit
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
  component: PropertyRejectedEmail,
  subject: 'Your Meewano listing needs attention',
  displayName: 'Property listing rejected',
  previewData: { firstName: 'Karwan', propertyTitle: 'Cozy Erbil apartment', reason: 'Photos appear to be stock images.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { color: INK, fontSize: '22px', fontWeight: 700, marginBottom: '16px' }
const text = { color: INK, fontSize: '15px', lineHeight: '24px' }
const reasonBox = { backgroundColor: '#fff5f7', border: `1px solid ${BRAND}33`, borderRadius: '10px', padding: '14px 16px', margin: '16px 0' }
const reasonLabel = { color: MUTED, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' as const, margin: 0 }
const reasonText = { color: INK, fontSize: '15px', lineHeight: '22px', margin: '4px 0 0' }
const button = {
  backgroundColor: BRAND, color: '#ffffff', borderRadius: '10px',
  padding: '12px 24px', fontWeight: 600, textDecoration: 'none', fontSize: '15px',
}
const nextStepsBox = { backgroundColor: '#fff5f7', border: `1px solid ${BRAND}33`, borderRadius: '10px', padding: '16px 18px', margin: '16px 0' }
const nextStepsHeading = { color: BRAND, fontSize: '12px', fontWeight: 700, letterSpacing: '0.4px', margin: '0 0 8px 0' }
const nextStepItem = { color: INK, fontSize: '14px', lineHeight: '22px', margin: '0 0 4px 0' }
const hr = { borderColor: '#eaeaea', margin: '32px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '4px 0' }
