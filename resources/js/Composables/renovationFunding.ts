export type FundingKind = 'credit' | 'grant';

export interface RenovationFunding {
  id: string;
  preset: string;
  name: string;
  kind: FundingKind;
  amount: number;
  interestRate: number;
  interestOnlyYears: number;
  termYears: number;
}

export type FundingPreset = Omit<RenovationFunding, 'id' | 'preset' | 'amount'> & { key: string };

export const FUNDING_PRESETS: ReadonlyArray<FundingPreset> = Object.freeze([
  { key: 'kfw270', name: 'KfW 270 (PV-Anlage)', kind: 'credit', interestRate: 0, interestOnlyYears: 1, termYears: 20 },
  { key: 'kfw261', name: 'KfW 261 (Effizienzhaus)', kind: 'credit', interestRate: 0, interestOnlyYears: 1, termYears: 30 },
  { key: 'bafa', name: 'BAFA Einzelmaßnahmen', kind: 'grant', interestRate: 0, interestOnlyYears: 0, termYears: 0 },
]);

const numberInRange = (value: unknown, min: number, max: number): number => Math.min(max, Math.max(min, Number(value) || 0));
const makeId = (): string => globalThis.crypto?.randomUUID?.() || `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function createFunding(presetKey = ''): RenovationFunding {
  const preset = FUNDING_PRESETS.find(item => item.key === presetKey);
  return { id: makeId(), preset: preset?.key || 'custom', name: preset?.name || 'Eigene Förderung', kind: preset?.kind || 'credit', amount: 0, interestRate: preset?.interestRate || 0, interestOnlyYears: preset?.interestOnlyYears || 0, termYears: preset?.termYears || 20 };
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
    };
  });
}
