import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  firstName?: string
  siteUrl?: string
}

const SITE_URL = 'https://meewano.com'
const BRAND = '#FF5780'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const CustomerWelcomeEmail = ({ firstName, siteUrl }: Props) => {
  const name = firstName || 'there'
  const url = siteUrl || SITE_URL
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Meewano — your stay in Kurdistan starts here</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Meewano 👋</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            Thanks for joining <strong>Meewano</strong> — your home for finding amazing stays
            across Kurdistan, from mountain cabins in Haji Omran to cozy apartments in Erbil and Ranya.
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={`${url}/search`} style={button}>
              Start exploring properties
            </Button>
          </Section>
          <Text style={text}>
            Here's what you can do next:
          </Text>
          <Text style={bullet}>• Browse properties by city or map</Text>
          <Text style={bullet}>• Save your favorite stays with one tap</Text>
          <Text style={bullet}>• Book directly and message the host</Text>
          <Hr style={hr} />
          <Text style={footer}>
            Need help? Just reply to this email and our team will be happy to assist.
          </Text>
          <Text style={footer}>— The Meewano team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CustomerWelcomeEmail,
  subject: 'Welcome to Meewano 👋',
  displayName: 'Customer welcome',
  previewData: { firstName: 'Sara' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { color: INK, fontSize: '24px', fontWeight: 700, marginBottom: '16px' }
const text = { color: INK, fontSize: '15px', lineHeight: '24px' }
const bullet = { color: INK, fontSize: '15px', lineHeight: '22px', margin: '4px 0' }
const button = {
  backgroundColor: BRAND, color: '#ffffff', borderRadius: '10px',
  padding: '12px 24px', fontWeight: 600, textDecoration: 'none', fontSize: '15px',
}
const hr = { borderColor: '#eaeaea', margin: '32px 0 16px' }
const footer = { color: MUTED, fontSize: '13px', lineHeight: '20px', margin: '4px 0' }
