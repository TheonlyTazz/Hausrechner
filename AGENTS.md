# AGENTS.md — Technical Guidelines & Architecture Rules

## System Overview
You are building a specialized, local-first web application: a **German Real Estate & Subsidy Financing Calculator** ("Hauskaufrechner").
The application models complex financing structures, combining bank loans, local state subsidies (Hessengeld, WIBank Hessen-Darlehen), federal subsidies (KfW 124, 308, 261, 358), private loans, and rental income.

---

## Tech Stack Guidelines

### Stack
- **Backend:** PHP 8.3 / Laravel 11
- **Frontend:** Vue 3 (Composition API, `<script setup>`), Inertia.js
- **Styling:** Tailwind CSS (clean, responsive, data-dense dashboard layout)
- **Charts:** Chart.js / Vue-ChartJS
- **Formatting:** Standardized Currency (`EUR`) & Percentage formatters (`de-DE`)

---

## Core Financial Engine & Mathematical Rules

### 1. Calculation Pipeline
All calculations must be fully reactive. Updating any input must immediately recalculate:
1. Total Acquisition Costs (Kaufpreis + Nebenkosten).
2. Subsidy Eligibility Thresholds (e.g., WoFlV < 200m² check).
3. Capital Gap (Remaining Bank Financing Required).
4. Monthly Debt Service (Brutto & Netto after rental income).
5. 10-Year Amortization Schedule & Total Interest Paid.

### 2. Specific Subsidy Rules to Implement

#### A. Hessengeld (State Subsidy)
- **Eligibility:** Primary self-occupied home in Hessen.
- **Grant Calculation:** `10.000 €` per buyer + `5.000 €` per eligible child.
- **Cap Rule:** Capped strictly at the paid **Grunderwerbsteuer** (6% of purchase price in Hessen).
- **Payout Structure:** Paid annually in equal installments over 10 years (used as dedicated annual principal reduction / Sondertilgung).

#### B. WIBank Hessen-Darlehen (State Loan)
- **Target Interest Rate:** ~1.0% - 1.6%.
- **Max Sum:** Up to `140.000 €`.
- **Wohnflächengrenze Rule:** If living area according to WoFlV exceeds `200.0 m²`, trigger a UI warning flag ("Gefahr des Förderausschlusses") and allow toggling an "Einzelfallprüfung / Dispenzantrag" override.

#### C. KfW Programs
- **KfW 124 (Wohneigentumsprogramm):** Up to `100.000 €`, standard market-aligned rates, optional 1–3 interest-only years (tilgungsfreie Anlaufjahre).
- **KfW 308 ("Jung kauft Alt"):** Best-rate family subsidy for older homes, tied to strict energy renovation duties (requires 65% EE & envelope insulation).
- **KfW 358 (Ergänzungskredit):** Low-interest top-up credit for energy-efficiency measures.

#### D. Private / Employer Loan (Arbeitgeberdarlehen)
- Custom amount input (e.g., `50.000 €`), custom interest rate (e.g., `1.5%`), fixed monthly rate or end-of-term repayment option.

---

## Code Quality & Architecture Directives

1. **Precision:** All financial formulas must avoid floating-point inaccuracies. Perform calculations using exact integer cents or strictly formatted precision floats.
2. **Modularity:** Separate financial calculation logic into dedicated Vue Composables (`useFinancingCalculator.ts`) or Laravel Action Classes.
3. **No Fluff UI:** Prioritize data density, crisp tables, clear metric cards, toggles for "Sanierung / Null-Sanierung", and comparative side-by-side scenario cards.