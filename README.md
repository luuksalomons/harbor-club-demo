# Royal Mission Portal

Interne webomgeving voor studenten en docenten van de Royal Mission School.
Eén centrale plek voor nieuws, rooster, onderling contact en zorgaanvragen.

## Functies (v1)

- **Nieuws** — docenten/admin plaatsen interne mededelingen, iedereen leest ze.
- **Rooster** — per schooljaar; docenten/admin beheren items, studenten zien
  het rooster van het schooljaar waar ze aan gekoppeld zijn.
- **Berichten** — intern berichtensysteem (geen live chat) tussen alle
  gebruikers. Ontvangt een docent een bericht, dan krijgt die een e-mailmelding.
- **Zorggesprek aanvragen** — één knop, optionele toelichting. Alle gebruikers
  met de "zorgcoach"-vlag krijgen direct een e-mailmelding.
- **Schooljaren** — studenten worden door de admin aan een schooljaar gekoppeld;
  elk schooljaar heeft zijn eigen rooster.
- **Admin** — gebruikers uitnodigen (met rol student/docent/admin), rollen
  wijzigen, zorgcoach-vlag zetten, schooljaren aanmaken/activeren, studenten
  in-/uitschrijven, en het wachtwoord van een gebruiker resetten.
- **Mijn profiel** — elke gebruiker past zelf zijn naam, leeftijd, geslacht
  en wachtwoord aan (`/profiel`, link bij de rol-badge rechtsboven).

## Techstack

- **Next.js 16** (App Router, Turbopack, TypeScript, Tailwind CSS v4)
- **Supabase** — Postgres database, authenticatie en Row Level Security
- **Resend** — transactionele e-mail (berichtmelding, zorggesprek-melding)

> Let op: dit project draait op Next.js 16, dat recent verschenen is en op
> een aantal punten breekt met eerdere versies (async `params`/`cookies`,
> `middleware.ts` heet nu `proxy.ts`, etc). Zie
> `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` voor
> de volledige lijst voordat je hier grote wijzigingen in aanbrengt.

## Setup

### 1. Supabase-project aanmaken

1. Maak een gratis project aan op [supabase.com](https://supabase.com).
2. Ga naar **SQL Editor** en plak de inhoud van
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Run het.
   Dit zet alle tabellen, rollen-logica en Row Level Security policies neer.
   Draai daarna ook
   [`supabase/migrations/0002_profile_self_service.sql`](supabase/migrations/0002_profile_self_service.sql)
   (leeftijd/geslacht-velden + bescherming tegen zelf-promotie naar admin)
   en
   [`supabase/migrations/0003_email_sync.sql`](supabase/migrations/0003_email_sync.sql)
   (houdt `profiles.email` altijd gelijk aan het echte inlogadres in
   `auth.users` — bewerk e-mailadressen dus nooit rechtstreeks in de Table
   Editor, dat verandert alleen het weergaveveld, niet het inlogadres).
3. Ga naar **Project Settings → API** en kopieer de `Project URL`, de
   `anon public` key en de `service_role` key (geheim!).
4. Ga naar **Authentication → Email templates** en pas eventueel de
   "Invite user"-mail aan met het logo/de kleuren uit de huisstijl.

### 2. Resend (e-mail)

1. Maak een account op [resend.com](https://resend.com).
2. Voeg een (sub)domein toe en verifieer de DNS-records.
3. Maak een API key aan.

### 3. Environment variables

Kopieer `.env.example` naar `.env.local` en vul in:

```bash
cp .env.example .env.local
```

| Variabele | Waar te vinden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (geheim, nooit committen) |
| `RESEND_API_KEY` | Resend → API Keys |
| `EMAIL_FROM` | Een adres op je geverifieerde Resend-domein |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` lokaal, live-URL in productie |

### 4. Lokaal draaien

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Je wordt naar `/login`
gestuurd — er is nog geen gebruiker, zie hieronder.

### 5. Eerste admin-account aanmaken

De app heeft geen open registratie: alleen een admin kan gebruikers
uitnodigen, en de eerste admin moet dus rechtstreeks in Supabase aangemaakt worden.

1. Supabase-dashboard → **Authentication → Users → Add user** (of "Invite").
   Vul je eigen e-mailadres in.
2. Ga naar **Table Editor → profiles**, zoek de nieuw aangemaakte rij op jouw
   `id`, en zet `role` op `admin`.
3. Stel via de invite-mail (of **Authentication → Users → ⋮ → Send password
   recovery**) een wachtwoord in en log in op `/login`.

Vanaf hier kun je via **Admin** in de app zelf nieuwe gebruikers uitnodigen.

## Huisstijl

De UI is gebouwd met [Untitled UI React](https://www.untitledui.com/react)
(open source, MIT): Tailwind v4 + React Aria. Volgens de Untitled UI-aanpak
staan de componenten als broncode in de repo, niet als npm-pakket:

- Thema/design tokens: [`src/styles/theme.css`](src/styles/theme.css)
  (kleuren, schaduwen, typografie) — dark mode volgt de OS-instelling.
- Basiscomponenten: `src/components/base/` (Button, Input, TextArea,
  NativeSelect, Badge, Avatar, Tooltip), `src/components/foundations/`
  (FeaturedIcon) en `src/components/application/` (sidebar-navigatie-item).
- App-specifieke bouwstenen: `card.tsx`, `page-header.tsx`, `empty-state.tsx`,
  `logo.tsx`, `auth-layout.tsx` in `src/components/`.
- Iconen: [`@untitledui/icons`](https://www.npmjs.com/package/@untitledui/icons).

Harbor Club-kleuren:

- Merkkleur (navy, `#1b4965` = `brand-600`): de `--color-brand-*`-schaal in
  `src/styles/theme.css` — pas die schaal aan om de hele app te herkleuren.
- Accent (amber `#f0a202`): `--color-accent` in
  [`src/app/globals.css`](src/app/globals.css), gebruikt voor de demo-banner
  en het logo.
- Lettertype: **Inter** (via `next/font/google`, zie
  [`src/app/layout.tsx`](src/app/layout.tsx)).

Let op: in Untitled UI zijn `bg-primary`, `text-primary` enz. *semantische*
tokens (wit vlak, donkerste tekst), niet de merkkleur. Gebruik voor de
merkkleur `bg-brand-solid`, `text-brand-secondary`, `ring-brand`, etc.

## Deployen

Het makkelijkst via [Vercel](https://vercel.com): koppel deze map als project,
zet dezelfde environment variables in de Vercel-projectinstellingen, en deploy.

## Herbruikbaarheid

Dit project is ook een sjabloon: zie
[`INSTALLATIE.md`](INSTALLATIE.md) voor de prompts en aanpak om eenzelfde
soort systeem voor een ander bedrijf of andere school te bouwen.
