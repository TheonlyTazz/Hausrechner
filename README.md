# Hauskaufrechner Hessen

Local-first Finanzierungsrechner für Immobilienkäufe in Hessen. Die Anwendung kombiniert klassische Bankdarlehen mit Hessengeld, WI Bank Hessen, KfW 124 und Arbeitgeberdarlehen. Alle Eingaben und Berechnungen bleiben im Browser.

## Live-Version

[Hauskaufrechner auf GitHub Pages öffnen](https://theonlytazz.github.io/Hausrechner/)

## Funktionen

- Reaktive Haushalts- und Finanzierungsrechnung
- Hessengeld als jährliche Sondertilgung zum jeweils teuersten Darlehen
- WI-Bank-Prüfung anhand der modellierten WoFlV-Fläche
- Einstellbarer bankseitiger Risikoabschlag auf Mieteinnahmen
- Vergleich mehrerer Finanzierungsszenarien
- Zins-, Tilgungs- und Restschuldverlauf
- Druck- und PDF-Ansicht

## Lokale Entwicklung

Voraussetzungen: PHP, Composer und Node.js.

```bash
composer install
npm ci
composer run dev
```

Laravel läuft anschließend unter `http://127.0.0.1:8123`.

## Statischen Pages-Build erzeugen

```bash
npm ci
npm run build:pages
```

Die statischen Dateien werden in `dist/` erzeugt. Ein Push auf `main` veröffentlicht diesen Build automatisch über GitHub Actions.

## Hinweis

Die Ergebnisse sind unverbindliche Modellrechnungen und keine Finanzierungsberatung oder Förderzusage. Konditionen, Förderfähigkeit, Sondertilgungsrechte und die Wohnflächenberechnung müssen mit den jeweiligen Kreditinstituten geprüft werden.
