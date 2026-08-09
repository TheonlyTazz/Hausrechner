import { describe, expect, it } from 'vitest';
import {
  calculateBafaGrant,
  calculateKfw358Maximum,
  createFunding,
  resolveFundingAmounts,
} from '../resources/js/Composables/renovationFunding.ts';

describe('automatic BAFA and KfW 358/359 funding', () => {
  it('calculates the current BAFA base grant without iSFP', () => {
    expect(calculateBafaGrant(52_500, false)).toBe(4_500);
    expect(calculateBafaGrant(10_000, false)).toBe(1_500);
  });

  it('applies the current iSFP bonus only above 30,000 euros', () => {
    expect(calculateBafaGrant(52_500, true, 'current-2026')).toBe(9_000);
    expect(calculateBafaGrant(60_000, true, 'current-2026')).toBe(10_500);
  });

  it('keeps the legacy iSFP rule available for earlier approvals', () => {
    expect(calculateBafaGrant(52_500, true, 'legacy-before-2026-07-21')).toBe(10_500);
  });

  it('caps KfW 358/359 at remaining eligible costs and 120,000 euros', () => {
    expect(calculateKfw358Maximum(52_500, 9_000)).toBe(43_500);
    expect(calculateKfw358Maximum(200_000, 10_500)).toBe(120_000);
  });

  it('resolves BAFA first and then derives the KfW maximum', () => {
    const bafa = { ...createFunding('bafa'), isfp: true };
    const kfw = createFunding('kfw358');
    const result = resolveFundingAmounts([bafa, kfw], 52_500);
    expect(result.find(item => item.preset === 'bafa')?.amount).toBe(9_000);
    expect(result.find(item => item.preset === 'kfw358')?.amount).toBe(43_500);
  });
});
