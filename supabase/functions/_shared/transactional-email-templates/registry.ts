// Registry of all transactional email templates.
// Each entry maps a kebab-case template name to a component + subject.
import type { ComponentType } from 'npm:react@18.3.1'
import { template as hostApproved } from './host-approved.tsx'
import { template as hostRejected } from './host-rejected.tsx'
import { template as customerWelcome } from './customer-welcome.tsx'
import { template as propertyRejected } from './property-rejected.tsx'
import { template as propertyApproved } from './property-approved.tsx'

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
}
