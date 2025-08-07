# Sheenweb2

Ein modernes React-Projekt mit Next.js, TypeScript, Tailwind CSS, ESLint und Prettier.

## Funktionen

- **Next.js** für serverseitiges Rendering und Routing
- **TypeScript** für statische Typisierung
- **Tailwind CSS** für schnelles und responsives Design
- **ESLint** für Code-Qualitätsprüfung
- **Prettier** für konsistente Code-Formatierung

## Erste Schritte

### Voraussetzungen

- Node.js 16.8 oder höher

### Installation

1. Klone das Repository oder entpacke die Projektdateien
2. Installiere die Abhängigkeiten:

```bash
npm install
# oder
yarn install
# oder
pnpm install
```

### Entwicklungsserver starten

```bash
npm run dev
# oder
yarn dev
# oder
pnpm dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser, um das Ergebnis zu sehen.

## Projektstruktur

```
sheenweb2/
├── src/
│   ├── app/            # App Router Komponenten
│   │   ├── layout.tsx  # Root Layout
│   │   ├── page.tsx    # Homepage
│   │   └── globals.css # Globale Styles mit Tailwind
│   ├── components/     # Wiederverwendbare Komponenten
│   └── styles/         # Zusätzliche Styles
├── public/             # Statische Assets
└── ...                 # Konfigurationsdateien
```

## Skripte

- `npm run dev` - Startet den Entwicklungsserver
- `npm run build` - Erstellt eine optimierte Produktionsversion
- `npm start` - Startet den Produktionsserver
- `npm run lint` - Führt ESLint für Codequalitätsprüfung aus
- `npm run format` - Formatiert den Code mit Prettier

## Social Login Einrichtung

Die Anwendung unterstützt die Anmeldung mit Google- und Apple-Konten. Wenn bei der Anmeldung der Fehler `auth/operation-not-allowed` auftritt, müssen Sie die Authentifizierungsanbieter in der Firebase-Console aktivieren.

**Detaillierte Anweisungen finden Sie in der [Social Login-Einrichtungsanleitung](./docs/SOCIAL_LOGIN_SETUP.md)**.

Kurzanleitung:

1. Öffnen Sie die [Firebase Console](https://console.firebase.google.com/) und navigieren Sie zu Ihrem Projekt
2. Gehen Sie zu **Authentication** > **Sign-in method**
3. Aktivieren Sie die Anbieter "Google" und/oder "Apple"
4. Fügen Sie Ihre Domains zu den autorisierten Domains hinzu (unter **Authentication** > **Settings**)

Bei weiteren Problemen oder für detaillierte Anweisungen zur Apple-Anmeldeeinrichtung sehen Sie bitte die ausführliche Anleitung.
