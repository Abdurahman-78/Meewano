import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  reason?: string
  siteUrl?: string
}

const SITE_URL = 'https://meewano.com'
const BRAND = '#FF5780'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const HostRejectedEmail = ({ firstName, reason, siteUrl }: Props) => {
  const name = firstName || 'there'
  const url = siteUrl || SITE_URL
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Meewano host verification needs attention</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your host verification needs attention</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thanks for applying to host on <strong>Meewano</strong>. After reviewing your submission,
            we weren't able to approve your host account yet.
          </Text>
          {reason && (
            <Section style={reasonBox}>
              <Text style={reasonLabel}>Reason from our team:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}
          <Text style={text}>
            You can update your details and resubmit — we'll review again as soon as possible.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={`${url}/host/verification`} style={button}>
              Update & resubmit
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
  component: HostRejectedEmail,
  subject: 'Your Meewano host verification needs attention',
  displayName: 'Host account rejected',
  previewData: { firstName: 'Karwan', reason: 'The selfie photo was blurry — please re-upload a clear photo.' },
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
const hr = { borderColor: '#eaeaea', margin: '32px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '4px 0' }
