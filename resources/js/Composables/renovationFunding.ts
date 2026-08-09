export type FundingKind = 'credit' | 'grant';
export type BafaRuleSet = 'current-2026' | 'legacy-before-2026-07-21';

export interface RenovationFunding {
  id: string;
  preset: string;
  name: string;
  kind: FundingKind;
  amount: number;
  interestRate: number;
  interestOnlyYears: number;
  termYears: number;
  autoCalculate: boolean;
  isfp: boolean;
  bafaRuleSet: BafaRuleSet;
}

export type FundingPreset = Omit<RenovationFunding, 'id' | 'preset' | 'amount'> & { key: string };

export const FUNDING_PRESETS: ReadonlyArray<FundingPreset> = Object.freeze([
  { key: 'kfw270', name: 'KfW 270 (PV-Anlage)', kind: 'credit', interestRate: 0, interestOnlyYears: 1, termYears: 20, autoCalculate: false, isfp: false, bafaRuleSet: 'current-2026' },
  { key: 'kfw261', name: 'KfW 261 (Effizienzhaus)', kind: 'credit', interestRate: 0, interestOnlyYears: 1, termYears: 30, autoCalculate: false, isfp: false, bafaRuleSet: 'current-2026' },
  { key: 'kfw358', name: 'KfW 358/359 (Ergänzungskredit)', kind: 'credit', interestRate: 0, interestOnlyYears: 1, termYears: 30, autoCalculate: true, isfp: false, bafaRuleSet: 'current-2026' },
  { key: 'bafa', name: 'BAFA Einzelmaßnahmen', kind: 'grant', interestRate: 0, interestOnlyYears: 0, termYears: 0, autoCalculate: true, isfp: false, bafaRuleSet: 'current-2026' },
]);

const numberInRange = (value: unknown, min: number, max: number): number => Math.min(max, Math.max(min, Number(value) || 0));
const makeId = (): string => globalThis.crypto?.randomUUID?.() || `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function createFunding(presetKey = ''): RenovationFunding {
  const preset = FUNDING_PRESETS.find(item => item.key === presetKey);
  return { id: makeId(), preset: preset?.key || 'custom', name: preset?.name || 'Eigene Förderung', kind: preset?.kind || 'credit', amount: 0, interestRate: preset?.interestRate || 0, interestOnlyYears: preset?.interestOnlyYears || 0, termYears: preset?.termYears || 20, autoCalculate: preset?.autoCalculate || false, isfp: preset?.isfp || false, bafaRuleSet: preset?.bafaRuleSet || 'current-2026' };
}

export function calculateBafaGrant(costs: number, isfp: boolean, ruleSet: BafaRuleSet = 'current-2026'): number {
  const eligible = Math.min(Math.max(0, Number(costs) || 0), isfp ? 60_000 : 30_000);
  if (!isfp) return Math.round(eligible * 0.15 * 100) / 100;
  if (ruleSet === 'legacy-before-2026-07-21') return Math.round(eligible * 0.20 * 100) / 100;
  const bonusBasis = Math.max(0, eligible - 30_000);
  return Math.round((eligible * 0.15 + bonusBasis * 0.05) * 100) / 100;
}

export function calculateKfw358Maximum(costs: number, grants: number): number {
  return Math.round(Math.min(120_000, Math.max(0, (Number(costs) || 0) - (Number(grants) || 0))) * 100) / 100;
}

export function resolveFundingAmounts(value: unknown, renovationCosts: number): RenovationFunding[] {
  const items = sanitizeFundingList(value);
  const resolved = items.map(item => item.preset === 'bafa' && item.kind === 'grant' && item.autoCalculate
    ? { ...item, amount: calculateBafaGrant(renovationCosts, item.isfp, item.bafaRuleSet) }
    : { ...item });
  const grants = resolved.filter(item => item.kind === 'grant').reduce((sum, item) => sum + item.amount, 0);
  return resolved.map(item => item.preset === 'kfw358' && item.kind === 'credit' && item.autoCalculate
    ? { ...item, amount: calculateKfw358Maximum(renovationCosts, grants) }
    : item);
}

export function sanitizeFundingList(value: unknown): RenovationFunding[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((raw, index) => {
    const item = record(raw);
    const kind: FundingKind = item.kind === 'grant' ? 'grant' : 'credit';
    return {
      id: String(item.id || `import-${index}`).slice(0, 80), preset: String(item.preset || 'custom').slice(0, 20),
      name: String(item.name || 'Eigene Förderung').trim().slice(0, 80) || 'Eigene Förderung', kind,
      amount: numberInRange(item.amount, 0, 10_000_000), interestRate: kind === 'credit' ? numberInRange(item.interestRate, 0, 30) : 0,
      interestOnlyYears: kind === 'credit' ? numberInRange(item.interestOnlyYears, 0, 10) : 0,
      termYears: kind === 'credit' ? numberInRange(item.termYears, 1, 50) : 0,
      autoCalculate: Boolean(item.autoCalculate), isfp: Boolean(item.isfp),
      bafaRuleSet: item.bafaRuleSet === 'legacy-before-2026-07-21' ? 'legacy-before-2026-07-21' : 'current-2026',
    };
  });
}
