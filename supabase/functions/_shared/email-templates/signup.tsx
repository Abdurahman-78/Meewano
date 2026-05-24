/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

const LOGO_URL =
  'https://oyqaztlebhbgvkglfmbe.supabase.co/storage/v1/object/public/email-assets/meewano-logo.png'

export const SignupEmail = ({ recipient, token }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Meewano verification code: {token || '------'}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={logoWrap}>
          <Img src={LOGO_URL} alt="Meewano" width="140" style={logo} />
        </Section>

        <Container style={card}>
          <Heading style={h1}>Verify your email</Heading>
          <Text style={lead}>
            Thank you for signing up for <strong style={brand}>Meewano Travel Website</strong>.
            Use the code below to confirm your email address.
          </Text>

          <Section style={codeBox}>
            <Text style={codeLabel}>Your verification code</Text>
            <Text style={codeText}>{token || '------'}</Text>
            <Text style={codeHint}>Expires in 60 minutes</Text>
          </Section>

          <Text style={recipientText}>
            Sent to <strong>{recipient}</strong>
          </Text>

          <Hr style={hr} />

          <Text style={small}>
            If you didn't create a Meewano account, you can safely ignore this email — no account
            will be created.
          </Text>
        </Container>

        <Text style={footer}>
          Discover Kurdistan with Meewano · Erbil · Sulaymaniyah · Duhok
        </Text>
        <Text style={footerTiny}>
          © {new Date().getFullYear()} Meewano. All rights reserved.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

// Brand: Meewano coral/pink ~ hsl(345 100% 67%) → #FF5780
const BRAND = '#FF5780'
const BRAND_SOFT = '#FFE8EE'
const INK = '#1a1a1a'
const MUTED = '#6b7280'

const main = {
  backgroundColor: '#FAFAFA',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: '32px 16px',
}
const outer = { maxWidth: '520px', margin: '0 auto', padding: '0' }
const logoWrap = { textAlign: 'center' as const, padding: '8px 0 20px' }
const logo = { display: 'inline-block' as const, height: 'auto' }
const card = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '36px 32px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #F0F0F0',
}
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  color: INK,
  margin: '0 0 14px',
  letterSpacing: '-0.02em',
}
const brand = { color: BRAND }
const lead = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const codeBox = {
  backgroundColor: BRAND_SOFT,
  borderRadius: '16px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '8px 0 24px',
}
const codeLabel = {
  fontSize: '11px',
  fontWeight: 600 as const,
  color: BRAND,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 10px',
}
const codeText = {
  fontSize: '38px',
  fontWeight: 700 as const,
  letterSpacing: '12px',
  color: BRAND,
  margin: '0 0 8px',
  fontFamily: '"SF Mono", Menlo, Consolas, monospace',
  lineHeight: '1.1',
}
const codeHint = {
  fontSize: '12px',
  color: MUTED,
  margin: 0,
}
const recipientText = {
  fontSize: '13px',
  color: MUTED,
  textAlign: 'center' as const,
  margin: '0 0 8px',
}
const hr = { borderColor: '#F0F0F0', margin: '24px 0 16px' }
const small = {
  fontSize: '12px',
  color: MUTED,
  lineHeight: '1.6',
  margin: 0,
}
const footer = {
  fontSize: '12px',
  color: MUTED,
  textAlign: 'center' as const,
  margin: '24px 0 4px',
}
const footerTiny = {
  fontSize: '11px',
  color: '#9CA3AF',
  textAlign: 'center' as const,
  margin: 0,
}
