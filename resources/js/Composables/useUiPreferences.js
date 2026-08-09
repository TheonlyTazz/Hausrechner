import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const english = {
  'Finanzierungsplanung · lokal': 'Financing plan · local',
  'Hauskaufrechner Hessen': 'Home Financing Calculator Hesse',
  'Planungs-Wizard': 'Planning wizard',
  'PDF / Druckansicht': 'PDF / Print view',
  'Kapitalbedarf': 'Capital required', 'Kauf inkl. Kosten & Sanierung': 'Purchase incl. costs & renovation',
  'Rate brutto': 'Gross payment', 'Zielrate inkl. Miete': 'Target payment incl. rent', 'vertragliche Raten': 'Contractual payments',
  'Rate netto': 'Net payment', 'Zinsvorteil WI Bank': 'WI Bank interest benefit', 'Modellrechnung bis Ablösung': 'Model estimate until repayment',
  'Voraussichtlich schuldenfrei': 'Estimated debt-free date', 'Rate prüfen': 'Check payment',
  'Objekt': 'Property', 'Einkommen': 'Income', 'Haushalt': 'Household', 'Darlehen': 'Loans',
  'Objekt & Kaufnebenkosten': 'Property & purchase costs', 'Kaufpreis (€)': 'Purchase price (€)', 'GrESt %': 'Transfer tax %', 'Notar %': 'Notary %', 'Makler %': 'Broker %', 'Nebenkosten': 'Ancillary costs',
  'Mit Sanierung': 'With renovation', 'Null-Sanierung': 'No renovation', 'Sanierungsbudget (€)': 'Renovation budget (€)',
  'Einkommen & Haushaltsbudget': 'Income & household budget', 'Ermittelt die monatlich tragbare eigene Rate vor Mieteinnahmen.': 'Calculates the affordable monthly personal payment before rental income.',
  'Haushaltsnetto (€)': 'Net household income (€)', 'Sonstige Einnahmen (€)': 'Other income (€)', 'Lebenshaltung (€)': 'Living expenses (€)', 'Andere Verpflichtungen (€)': 'Other commitments (€)', 'Sicherheitspuffer (€)': 'Safety buffer (€)',
  'Einnahmen inkl. Kaltmiete': 'Income incl. rent', 'Tragbare eigene Rate': 'Affordable personal payment', 'Aktuell geplante Nettorate': 'Current planned net payment', 'Bank-Sicht nach Mietabschlag': 'Bank view after rent haircut', 'Rate / Nettoeinkommen': 'Payment / net income', 'Monatliche Unterdeckung': 'Monthly shortfall', 'Verbleibender Puffer': 'Remaining buffer', 'Als Zielrate übernehmen': 'Use as target payment',
  'Haushalt & Wohnfläche': 'Household & living area', 'Bruttofläche m²': 'Gross area m²', 'Keller/Nutzfläche m²': 'Basement/utility area m²', 'Käufer': 'Buyers', 'Kinder': 'Children', 'WoFlV-Fläche': 'WoFlV area',
  'Gefahr des Förderausschlusses: über 200 m².': 'Risk of subsidy exclusion: above 200 m².', 'Einzelfallprüfung / Dispenzantrag annehmen': 'Assume individual review / exemption',
  'Eigenkapital (€)': 'Equity (€)', 'Kaltmiete/Monat (€)': 'Monthly cold rent (€)', 'Mietabschlag Bank (%)': 'Bank rent haircut (%)', 'Modellannahme, bankabhängig': 'Model assumption, varies by bank', 'Aktuelles Alter': 'Current age', 'Diagramm (Jahre)': 'Chart period (years)',
  'Darlehen & Zielrate': 'Loans & target payment', 'Hauptbank': 'Main bank', 'Zins %': 'Interest %', 'Laufzeit (J.)': 'Term (years)', 'WI Bank Hessen': 'WI Bank Hesse', 'Betrag €': 'Amount €', 'Laufzeit J.': 'Term years', 'KfW 124': 'KfW 124', 'Tilgungsfrei J.': 'Interest-only years', 'Arbeitgeberdarlehen': 'Employer loan', 'Monatsrate €': 'Monthly payment €', 'Endfällige Tilgung': 'Balloon repayment',
  'Zielrate zur schnelleren Tilgung verwenden': 'Use target payment for faster repayment', 'Eigene Rate netto/Monat (€)': 'Personal net payment/month (€)', 'Gesamtzahlung inkl. Miete:': 'Total payment incl. rent:', 'Rate deckt die Zinsen nicht': 'Payment does not cover interest',
  'Förderhinweis:': 'Subsidy notice:', 'Die errechnete WoFlV-Fläche überschreitet 200 m². Das WI-Bank-Darlehen wird deaktiviert, solange keine Einzelfallprüfung angenommen wird.': 'The calculated WoFlV area exceeds 200 m². The WI Bank loan is disabled unless an individual review is assumed.',
  'Aktive Finanzierung': 'Active financing', 'Darlehensaufteilung': 'Loan allocation', 'Sondertilgung zuerst:': 'Special repayment first:', '(höchster aktiver Zins)': '(highest active interest)', 'Baustein': 'Component', 'Betrag': 'Amount', 'Zins': 'Interest', 'Mindestrate': 'Minimum payment', 'Fremdkapital gesamt': 'Total borrowed capital', 'Geplante Gesamtzahlung inkl. Miete': 'Planned total payment incl. rent',
  'Finanzierungsverlauf': 'Financing timeline', 'Alle Diagramme reagieren direkt auf deine Eingaben.': 'All charts update immediately when inputs change.', 'Zins & Tilgung': 'Interest & principal', 'Restschuld': 'Remaining debt', 'Zins- und Tilgungsverlauf': 'Interest and principal timeline', 'Restschuldverlauf': 'Remaining debt timeline',
  'A · Mit WI Bank': 'A · With WI Bank', 'B · Ohne WI Bank': 'B · Without WI Bank', 'C · Null-Sanierung': 'C · No renovation', 'C · Mit Sanierung': 'C · With renovation', 'netto/Monat': 'net/month', 'Zinsen gesamt': 'Total interest', 'Laufzeit': 'Term', 'Bei Zielrate': 'At target payment',
  'Finanzierung einrichten': 'Set up financing', 'Objekt und Kaufkosten': 'Property and purchase costs', 'Kaufpreis, Nebenkosten und geplante Sanierung.': 'Purchase price, ancillary costs and planned renovation.', 'Grunderwerbsteuer (%)': 'Transfer tax (%)', 'Notar (%)': 'Notary (%)', 'Makler (%)': 'Broker (%)', 'Sanierung einplanen': 'Include renovation',
  'Einkommen und Ausgaben': 'Income and expenses', 'Aus diesen Angaben wird die tragbare eigene Rate berechnet.': 'These inputs determine the affordable personal payment.', 'Kaltmiete (€)': 'Cold rent (€)',
  'Haushalt und Wohnfläche': 'Household and living area', 'Relevant für Hessengeld und die modellierte WI-Bank-Prüfung.': 'Relevant for Hessengeld and the modeled WI Bank check.', 'Bruttofläche (m²)': 'Gross area (m²)', 'Keller/Nutzfläche (m²)': 'Basement/utility area (m²)',
  'Darlehen und Zielrate': 'Loans and target payment', 'Die Details können anschließend im Darlehen-Tab weiter verfeinert werden.': 'Details can be refined later in the Loans tab.', 'Hauptbank-Zins (%)': 'Main bank interest (%)', 'Hauptbank-Laufzeit (Jahre)': 'Main bank term (years)', 'WI Bank Hessen verwenden': 'Use WI Bank Hesse', 'KfW 124 verwenden': 'Use KfW 124', 'Arbeitgeberdarlehen verwenden': 'Use employer loan', 'Eigene Zielrate netto (€)': 'Personal target payment net (€)',
  'Zurück': 'Back', 'Weiter': 'Next', 'Rate übernehmen & fertig': 'Apply payment & finish',
  'Jahr': 'Year', 'Restschuld in Euro': 'Remaining debt in euros', 'Zahlung pro Jahr': 'Payment per year', 'Zinsen': 'Interest', 'Tilgung inkl. Hessengeld': 'Principal incl. Hessengeld',
};

export function useUiPreferences(root) {
  const language = ref(localStorage.getItem('hausrechner-language') || 'de');
  const theme = ref(localStorage.getItem('hausrechner-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  let observer;
  let translating = false;

  const translateTree = () => {
    if (!root.value || translating) return;
    translating = true;
    observer?.disconnect();
    try {
      const reverse = Object.fromEntries(Object.entries(english).map(([de, en]) => [en, de]));
      const walker = document.createTreeWalker(root.value, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const raw = node.nodeValue;
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const translated = language.value === 'en' ? english[trimmed] : reverse[trimmed];
        if (translated && translated !== trimmed) node.nodeValue = raw.replace(trimmed, translated);
      }
      document.documentElement.lang = language.value;
    } finally {
      translating = false;
      observer?.observe(root.value, { childList: true, subtree: true });
    }
  };
  const applyTheme = () => {
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
    localStorage.setItem('hausrechner-theme', theme.value);
  };
  const toggleTheme = () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; };
  const toggleLanguage = () => { language.value = language.value === 'de' ? 'en' : 'de'; };

  watch(language, async value => { localStorage.setItem('hausrechner-language', value); await nextTick(); translateTree(); });
  watch(theme, applyTheme);
  onMounted(() => {
    applyTheme(); translateTree();
    observer = new MutationObserver(() => queueMicrotask(translateTree));
    observer.observe(root.value, { childList: true, subtree: true });
  });
  onBeforeUnmount(() => observer?.disconnect());
  return { language, theme, toggleLanguage, toggleTheme };
}
