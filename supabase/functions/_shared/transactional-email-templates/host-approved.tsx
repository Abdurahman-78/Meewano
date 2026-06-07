import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Img, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  siteUrl?: string
}

const SITE_URL = 'https://meewano.com'
const BRAND = '#FF5780'
const BRAND_LIGHT = '#FFF0F3'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const HostApprovedEmail = ({ firstName, siteUrl }: Props) => {
  const name = firstName || 'there'
  const url = siteUrl || SITE_URL
  return (
    <Html lang="en">
      <Head />
      <Preview>Your host account is approved — start listing on Meewano</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header bar */}
          <Section style={headerBar}>
            <Text style={brandText}>Meewano</Text>
          </Section>

          {/* Hero / Approval badge */}
          <Section style={heroSection}>
            <Text style={checkmark}>✓</Text>
            <Heading style={h1}>You're approved!</Heading>
            <Text style={subhead}>Your host account is live</Text>
          </Section>

          <Section style={card}>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Great news — your host account on <strong style={brandStrong}>Meewano</strong> has been approved by our team.
              You can now publish your property listings and start welcoming guests across Kurdistan.
            </Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button href={`${url}/host/add-listing`} style={button}>
                List your first property
              </Button>
            </Section>

            <Section style={nextStepsBox}>
              <Text style={nextStepsHeading}>NEXT STEPS — WHAT TO DO</Text>
              <Text style={nextStepItem}>1. Click "List your first property" above to get started.</Text>
              <Text style={nextStepItem}>2. Upload clear, high-quality photos of your property.</Text>
              <Text style={nextStepItem}>3. Write an honest, detailed description and set your nightly rate.</Text>
              <Text style={nextStepItem}>4. Submit for review — our team will verify your listing within 24 hours.</Text>
              <Text style={nextStepItem}>5. Once approved, guests can find and book your property.</Text>
            </Section>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Questions? Just reply to this email and our team will help you out.
          </Text>
          <Text style={footer}>— The Meewano team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: HostApprovedEmail,
  subject: 'Your Meewano host account is approved 🎉',
  displayName: 'Host account approved',
  previewData: { firstName: 'Karwan' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif', margin: '0', padding: '0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }
const headerBar = {
  backgroundColor: BRAND,
  borderRadius: '12px 12px 0 0',
  padding: '16px 24px',
  textAlign: 'center' as const,
}
const brandText = { color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0' }
const heroSection = {
  backgroundColor: BRAND_LIGHT,
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderRadius: '0 0 12px 12px',
  marginBottom: '24px',
}
const checkmark = {
  color: BRAND,
  fontSize: '40px',
  fontWeight: 700,
  lineHeight: '1',
  margin: '0 0 12px 0',
}
const h1 = { color: INK, fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }
const subhead = { color: MUTED, fontSize: '15px', margin: '0' }
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
}
const text = { color: INK, fontSize: '15px', lineHeight: '24px', margin: '0 0 16px 0' }
const brandStrong = { color: BRAND }
const button = {
  backgroundColor: BRAND,
  color: '#ffffff',
  borderRadius: '10px',
  padding: '12px 28px',
  fontWeight: 600,
  textDecoration: 'none',
  fontSize: '15px',
}
const nextStepsBox = { backgroundColor: BRAND_LIGHT, borderRadius: '10px', padding: '16px 18px', margin: '16px 0' }
const nextStepsHeading = { color: BRAND, fontSize: '12px', fontWeight: 700, letterSpacing: '0.4px', margin: '0 0 8px 0' }
const nextStepItem = { color: INK, fontSize: '14px', lineHeight: '22px', margin: '0 0 4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '4px 0' }
