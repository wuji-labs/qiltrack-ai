/**
 * Brand configuration - centralized brand settings
 * All brand-related values should be read from here
 */

export const brand = {
  /** Full brand name, e.g., "Qiltrack AI" */
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Qiltrack AI',

  /** Short brand name, e.g., "Qiltrack" */
  short: process.env.NEXT_PUBLIC_BRAND_SHORT || 'Qiltrack',

  /** Domain name, e.g., "qiltrack.com" */
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'qiltrack.com',

  /** Admin email domain for permission checks */
  adminEmailDomain: process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || 'qiltrack.com',

  /** Site URL */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  /** Contact email for legal pages */
  get contactEmail() {
    return `legal@${this.domain}`
  },

  /** No-reply email for system emails */
  get noReplyEmail() {
    return `no-reply@${this.domain}`
  },

  /** Check if an email belongs to admin domain */
  isAdminEmail(email: string): boolean {
    return email.endsWith(`@${this.adminEmailDomain}`)
  },
}

export default brand
