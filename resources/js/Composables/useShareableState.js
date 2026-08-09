import { onMounted, ref, watch } from 'vue';
import LZString from 'lz-string';
import { sanitizeFundingList } from './renovationFunding.ts';

const PREFIX = '#z=';
const POSITIONAL_PREFIX = '#p=';
const LEGACY_PREFIX = '#profile=';

// Never reorder this schema: its indexes are part of the public share-link format.
export const SHARE_SCHEMA = Object.freeze([
  'purchasePrice', 'transferTaxPercent', 'notaryPercent', 'brokerPercent', 'equity',
  'renovationEnabled', 'renovationBudget', 'grossArea', 'utilityArea', 'buyers', 'children',
  'rentalIncome', 'rentalIncomeHaircutPercent', 'householdNetIncome', 'otherMonthlyIncome',
  'livingCosts', 'otherCommitments', 'monthlySafetyBuffer', 'monthlyHousingUtilities',
  'monthlyMaintenanceReserve', 'wiBankEnabled', 'wiBankOverride', 'wiBankAmount',
  'wiBankInterest', 'wiBankTerm', 'kfwEnabled', 'kfwAmount', 'kfwInterest', 'kfwTerm',
  'kfwInterestOnlyYears', 'employerEnabled', 'employerAmount', 'employerInterest',
  'employerPayment', 'employerTerm', 'employerBalloon', 'mainBankInterest', 'mainBankTerm',
  'targetMonthlyRate', 'useTargetRate', 'chartYears', 'currentAge',
  'renovationFunding',
  'retirementAge', 'etfMonthlyBudget', 'etfExistingCapital', 'etfExpectedReturn', 'etfAnnualCosts',
  'etfTaxRate', 'etfRiskDiscount', 'etfInflation', 'etfWithdrawalRate',
  'monthlyEnergySavings', 'renovationValueAddingShare', 'propertyAppreciation', 'energyReinvestmentShare',
]);

const toBase64Url = bytes => btoa(String.fromCharCode(...bytes))
  .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
const fromBase64Url = value => {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
};

export const encodeSharePayload = payload => toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
export const decodeSharePayload = value => JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
export const compressSharePayload = payload => LZString.compressToEncodedURIComponent(JSON.stringify(payload));
export const decompressSharePayload = value => JSON.parse(LZString.decompressFromEncodedURIComponent(value));

// Version 2 is a sparse positional array: [version, fieldIndex, value, fieldIndex, value, ...].
export const buildSharePayload = (inputs, defaults) => SHARE_SCHEMA.reduce((payload, key, index) => {
  const equal = Array.isArray(inputs[key]) ? JSON.stringify(inputs[key]) === JSON.stringify(defaults[key]) : inputs[key] === defaults[key];
  if (!equal) payload.push(index, inputs[key]);
  return payload;
}, [2]);

export const expandSharePayload = payload => {
  if (!Array.isArray(payload) || payload[0] !== 2) return payload?.values || payload;
  const values = {};
  for (let offset = 1; offset + 1 < payload.length; offset += 2) {
    const key = SHARE_SCHEMA[payload[offset]];
    if (key) values[key] = payload[offset + 1];
  }
  return values;
};

export function useShareableState(inputs, defaults, language = { value: 'de' }) {
  const shareMessage = ref('');
  const allowed = new Set(Object.keys(inputs));
  let ready = false;
  const clean = data => Object.fromEntries(Object.entries(data || {}).flatMap(([key, value]) => {
    if (!allowed.has(key)) return [];
    if (key === 'renovationFunding') return [[key, sanitizeFundingList(value)]];
    return ['number', 'boolean', 'string'].includes(typeof value) ? [[key, value]] : [];
  }));
  const text = (de, en) => language.value === 'en' ? en : de;
  const syncUrl = () => history.replaceState(null, '', `${location.pathname}${location.search}${PREFIX}${compressSharePayload(buildSharePayload(clean({ ...inputs }), defaults))}`);

  onMounted(() => {
    const prefix = [PREFIX, POSITIONAL_PREFIX, LEGACY_PREFIX].find(candidate => location.hash.startsWith(candidate));
    if (prefix) {
      try {
        const encoded = location.hash.slice(prefix.length);
        const payload = prefix === PREFIX ? decompressSharePayload(encoded) : decodeSharePayload(encoded);
        Object.assign(inputs, clean(expandSharePayload(payload)));
        shareMessage.value = text('Geteilte Berechnung wurde geladen.', 'Shared calculation loaded.');
      } catch {
        shareMessage.value = text('Der geteilte Link ist ungültig.', 'The shared link is invalid.');
      }
    }
    ready = true;
    syncUrl();
  });
  watch(inputs, () => { if (ready) syncUrl(); }, { deep: true, flush: 'post' });
  const copyShareLink = async () => {
    syncUrl();
    try {
      await navigator.clipboard.writeText(location.href);
      shareMessage.value = text('Link wurde kopiert.', 'Link copied.');
    } catch {
      window.prompt('Link kopieren:', location.href);
      shareMessage.value = text('Link ist bereit zum Kopieren.', 'The link is ready to copy.');
    }
    window.setTimeout(() => { shareMessage.value = ''; }, 2500);
  };
  return { shareMessage, copyShareLink };
}
