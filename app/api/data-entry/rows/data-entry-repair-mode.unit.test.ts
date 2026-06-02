import { describe, expect, it } from 'vitest';

import { requiresRepairModeForTable } from './route';

describe('data-entry repair mode', () => {
  it('requires repair mode for operational repair tables', () => {
    expect(requiresRepairModeForTable('AppRole')).toBe(true);
    expect(requiresRepairModeForTable('SecurityAuditLog')).toBe(true);
    expect(requiresRepairModeForTable('SecurityRateLimitCounter')).toBe(true);
  });

  it('keeps normal data-studio rows outside repair mode', () => {
    expect(requiresRepairModeForTable('User')).toBe(false);
    expect(requiresRepairModeForTable('Profile')).toBe(false);
  });
});
