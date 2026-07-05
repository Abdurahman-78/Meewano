// Registry of all transactional email templates.
// Each entry maps a kebab-case template name to a component + subject.
import type { ComponentType } from 'npm:react@18.3.1'
import { template as hostApproved } from './host-approved.tsx'
import { template as hostRejected } from './host-rejected.tsx'
import { template as customerWelcome } from './customer-welcome.tsx'
import { template as propertyRejected } from './property-rejected.tsx'
import { template as propertyApproved } from './property-approved.tsx'
import { template as bookingCancelledGuest } from './booking-cancelled-guest.tsx'
import { template as bookingCancelledHost } from './booking-cancelled-host.tsx'
import { template as refundRequestSubmittedGuest } from './refund-request-submitted-guest.tsx'
import { template as refundRequestSubmittedHost } from './refund-request-submitted-host.tsx'
import { template as refundApprovedGuest } from './refund-approved-guest.tsx'
import { template as refundApprovedHost } from './refund-approved-host.tsx'
import { template as rebookOfferedGuest } from './rebook-offered-guest.tsx'
import { template as refundRejectedGuest } from './refund-rejected-guest.tsx'
import { template as refundAdminOverrideGuest } from './refund-admin-override-guest.tsx'
import { template as refundAdminOverrideHost } from './refund-admin-override-host.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string | ((data: any) => string)
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'host-approved': hostApproved,
  'host-rejected': hostRejected,
  'customer-welcome': customerWelcome,
  'property-rejected': propertyRejected,
  'property-approved': propertyApproved,
  'booking-cancelled-guest': bookingCancelledGuest,
  'booking-cancelled-host': bookingCancelledHost,
  'refund-request-submitted-guest': refundRequestSubmittedGuest,
  'refund-request-submitted-host': refundRequestSubmittedHost,
  'refund-approved-guest': refundApprovedGuest,
  'refund-approved-host': refundApprovedHost,
  'rebook-offered-guest': rebookOfferedGuest,
  'refund-rejected-guest': refundRejectedGuest,
  'refund-admin-override-guest': refundAdminOverrideGuest,
  'refund-admin-override-host': refundAdminOverrideHost,
}
