/**
 * Feature Flag management system
 * Controls gradual rollout of new features
 */

/**
 * Feature flags configuration
 */
export const featureFlags = {
  /**
   * Use new report generation system (v2)
   * - Inngest for background tasks
   * - Type-safe persistence
   * - Better monitoring
   */
  useNewReportSystem: () => {
    return process.env.NEXT_PUBLIC_USE_NEW_REPORT_SYSTEM === 'true';
  },

  /**
   * Use new credit system (future)
   */
  useNewCreditSystem: () => {
    return process.env.NEXT_PUBLIC_USE_NEW_CREDIT_SYSTEM === 'true';
  },

  /**
   * Enable advanced monitoring (future)
   */
  useAdvancedMonitoring: () => {
    return process.env.NEXT_PUBLIC_USE_ADVANCED_MONITORING === 'true';
  },
} as const;

/**
 * Get all feature flag states (for debugging)
 */
export function getFeatureFlagStates() {
  return {
    newReportSystem: featureFlags.useNewReportSystem(),
    newCreditSystem: featureFlags.useNewCreditSystem(),
    advancedMonitoring: featureFlags.useAdvancedMonitoring(),
  };
}
