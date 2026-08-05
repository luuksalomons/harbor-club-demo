# Installatiegids: dit systeem opnieuw bouwen voor een ander bedrijf/school

Dit document is geen gebruikershandleiding (zie daarvoor `README.md`), maar
een **draaiboek**: de prompts en beslissingen die tot dit project hebben
geleid, zodat jij — of iemand anders, in een andere Claude-omgeving — met
dezelfde aanpak een vergelijkbare interne webomgeving kan bouwen voor een
willekeurig ander bedrijf of school.

## Waarom een `.md`-bestand en geen skill?

Voor dit soort projecten is een leesbaar bestand naast de code bewust
gekozen boven een Claude Skill:
- Het werkt in **elke** omgeving (andere machine, ander Claude-account, geen
  Claude Code nodig) — je kunt het gewoon kopiëren/plakken of aan iemand
  anders doorsturen.
- Een nieuw project heeft toch bijna altijd andere features nodig; een skill
  suggereert herbruikbare automatisering, terwijl dit vooral herbruikbare
  **denkstappen en architectuurkeuzes** zijn.
- Zodra dit patroon een paar keer is toegepast en de stappen echt identiek
  blijken, is het alsnog te verpakken als skill — begin met dit bestand.

## Stap 1 — De openingsprompt

Dit project begon met een prompt in deze vorm (Nederlands, aan Claude Code,
met een lege/nieuwe projectmap):

> "We gaan een online omgeving maken voor de studenten en docenten van
> [ORGANISATIE]. Bouw dit in een nieuwe projectmap, zet er een README.md in
> met wat we gaan doen, en houd onderweg een INSTALLATIE.md bij met de
> prompts, zodat dit systeem ook voor een ander bedrijf/school na te bouwen
> is.
>
> Functies die de app moet hebben:
> - [feature 1]
> - [feature 2]
> - ...
>
> Stel mij vragen ter verduidelijking. Vraag ook waar de huisstijl
> (kleuren/lettertype/logo's) te vinden is."

De laatste twee zinnen zijn het belangrijkste onderdeel van deze prompt:
ze zetten de agent in "vragen stellen"-modus in plaats van meteen te bouwen.
**Voor Luuk zelf geldt dat niet meer onverkort** — zie Stap 2: de
techniek-keuzes hieronder liggen inmiddels vast en hoeven niet elke keer
opnieuw uitgevraagd te worden. Vraag alleen nog door op de dingen die per
organisatie echt verschillen.

## Stap 2 — Vaste keuzes (niet opnieuw vragen) vs. wat per organisatie verschilt

De eerste keer dat dit project gebouwd werd, zijn onderstaande punten via
verduidelijkingsvragen uitgezocht. Nu die keuzes gemaakt zijn, past Luuk ze
**standaard opnieuw toe** bij een vergelijkbaar project — vraag dit dus niet
opnieuw, ga er gewoon van uit, tenzij Luuk zelf expliciet iets anders zegt:

- **Techstack & hosting: Next.js + Supabase.** Vaste keuze (gratis tier,
  geen eigen server/database-beheer, goed gedocumenteerd). Niet opnieuw ter
  discussie stellen.
- **E-mail: Resend.** Start altijd met het ingebouwde testadres
  (`onboarding@resend.dev`) om de hele flow werkend te krijgen zonder
  DNS-gedoe — bevestigd werkend. Beperking: dat adres kan vermoedelijk
  alleen mailen naar het adres waarmee bij Resend is ingelogd, dus niet
  geschikt voor échte eindgebruikers. Pas daarna een apart (sub)domein
  verifiëren (nooit het hoofddomein van een bestaande mailomgeving, om
  SPF-conflicten te vermijden).
- **Herbruikbaarheid: een `.md`-bestand, geen skill** (zie boven) —
  standaardkeuze, niet opnieuw afwegen.
- **Design tokens vanaf dag 1**, ongeacht of de huisstijl al klaar is (zie
  `src/app/globals.css` voor het patroon) — altijd meteen zo bouwen, geen
  losse afweging nodig.
- **Node.js/tooling**: als het er nog niet staat, gewoon installeren (bv.
  via Homebrew) — dit is inmiddels een bekende, geaccepteerde stap, geen
  aparte toestemmingsvraag meer nodig tenzij de omgeving dat vereist.

Dit blijft **wél** per project/organisatie anders, en verdient dus nog
steeds een vraag vooraf:

- **Welke features de app nodig heeft** — dat is per organisatie het hele
  punt van het gesprek.
- **Of een "live" functie (chat, notificaties) écht realtime moet zijn**,
  of bij nader inzien ook async kan (zoals hier: "chat" bleek een async
  berichtensysteem te mogen zijn, geen live chat — scheelt een hele laag
  complexiteit). Dit hangt af van wat de organisatie zelf bedoelt met het
  gevraagde feature, dus wel navragen.
- **Van welk adres/domein productiemail moet komen** — dat verschilt per
  organisatie (en of er al een bestaande mailomgeving is die (nog) niet
  toegankelijk is, bv. een tenant die beheerdersgoedkeuring vereist).
- **Waar de huisstijl (kleuren/lettertype/logo's) te vinden is** — puur
  organisatie-specifiek, altijd vragen.
- **Hoe de rollen heten.** Dit project gebruikt `student`/`docent`/`admin`
  omdat het een schoolomgeving is — logisch in die context, maar een ander
  soort bedrijf werkt eerder met bv. `medewerker`/`manager`/`admin` of
  `lid`/`beheerder`. De rolnamen zelf zijn dus organisatie-specifiek en
  horen bij de vragen over "welke features/rollen nodig zijn", ook al is
  het onderliggende drie-rollen-RLS-patroon (zie Stap 3) wél een vaste
  keuze.

## Stap 3 — Architectuurkeuzes die generiek herbruikbaar zijn

Deze keuzes zijn losgekoppeld van "Royal Mission" en gelden voor vrijwel elk
vergelijkbaar intern-portal-project:

- **Rollen + Row Level Security in de database, niet (alleen) in de
  applicatielaag.** Eén `profiles`-tabel met een `role`-kolom
  (`student`/`docent`/`admin` → generiek: `gebruiker`/`beheerder`/eventueel
  een derde rol specifiek voor de organisatie). Alle rechten worden
  afgedwongen via Postgres RLS-policies, met een `security definer`
  helper-functie (`my_role()`) om recursieve policy-checks te vermijden. Dit
  betekent: zelfs als er een bug in de UI zit, kan een student nooit bij
  admin-data — de database zelf weigert het.
- **Admin nodigt uit, geen open registratie.** Nieuwe gebruikers ontstaan
  altijd via een uitnodiging door de admin (Supabase
  `auth.admin.inviteUserByEmail`, met rol/naam als user-metadata), gevolgd
  door een database-trigger (`handle_new_user`) die automatisch een
  `profiles`-rij aanmaakt. Zo hoeft de eerste admin maar één keer handmatig
  in het Supabase-dashboard aangemaakt te worden; alle volgende gebruikers
  lopen via de app zelf.
- **E-mail is een melding, geen kritiek pad.** Wrap elke e-mailverzending in
  een try/catch die alleen logt bij falen (zie `src/lib/email.ts`) — een
  Resend-storing mag nooit een bericht versturen of een aanvraag aanmaken
  blokkeren.
- **Design tokens vanaf dag 1** (zie Stap 2).
- **Eén Supabase-migratiebestand als brondocument** van het hele datamodel
  (`supabase/migrations/0001_init.sql`) — leesbaar, in git, en de admin kan
  het 1-op-1 in de Supabase SQL-editor plakken zonder CLI/tooling.

## Stap 4 — Wat per organisatie verandert

Bij het hergebruiken van dit project voor een andere klant, pas je aan:

| Onderdeel | Royal Mission (dit project) | Generiek |
|---|---|---|
| Rollen | student, docent, admin | pas namen aan op de organisatie |
| "Schooljaar"-concept | `school_years` + `enrollments` | vervang door een generiek groeperingsconcept als dat past (afdeling, cohort, vestiging) — of laat helemaal weg als niet relevant |
| "Zorggesprek" | `care_requests` + zorgcoach-vlag | vervang door welke 1-knops-escalatie de organisatie nodig heeft (bv. "meld een incident", "vraag IT-hulp") |
| Nieuws | `news_posts` | vaak 1-op-1 herbruikbaar |
| Berichten | `messages`, alleen docenten krijgen mail | pas de regel "wie krijgt een mailmelding" aan per organisatie |
| Huisstijl | `royal mission/huisstijl/` | organisatie-specifiek, altijd vragen waar dit staat (zie Stap 2) |

## Stap 5 — Volgorde van bouwen (wat werkte goed)

1. Scaffold het framework (`create-next-app` met expliciete flags, geen
   interactieve prompts) en installeer de kern-dependencies
   (`@supabase/supabase-js`, `@supabase/ssr`, `resend`).
2. **Lees eerst de meegeleverde framework-docs** als het een net
   uitgebrachte major-versie betreft
   (`node_modules/next/dist/docs/.../upgrading/version-X.md`) — voorkomt dat
   je met verouderde patronen (uit trainingsdata) code schrijft die niet
   compileert.
3. Schrijf het volledige datamodel + RLS in één keer (het is de basis
   waarop alles verder steunt).
4. Bouw auth (login, invite-flow, sessie-refresh via `proxy.ts`) voordat je
   featurepagina's bouwt — elke pagina leunt hierop.
5. Bouw feature voor feature, elke keer: server actions (mutaties) eerst,
   dan de pagina (weergave) die ze aanroept.
6. Na elke fase: `npx tsc --noEmit`, `npx eslint .`, en een `next build` met
   placeholder env-variabelen. Dat vangt het merendeel van de fouten zonder
   dat er al een echt Supabase-project nodig is.
7. Pas als de basis werkt: README + dit bestand afronden.

## Stap 6 — Openstaande punten om nooit te vergeten

- Voeg de eerste admin **handmatig** toe via het Supabase-dashboard (zie
  README, stap 5) — dat kan niet via de app zelf, want de app vereist al een
  admin om uit te nodigen.
- `SUPABASE_SERVICE_ROLE_KEY` mag nooit naar de client — alleen gebruikt in
  `src/lib/supabase/admin.ts`, dat uitsluitend server-side geïmporteerd wordt.
- Test de RLS-policies niet alleen via de UI maar ook door in te loggen als
  een lagere rol en te proberen bij verboden data te komen (bv. via de
  Supabase Table Editor met "Run as" een andere rol simuleren, of gewoon een
  tweede test-account per rol aanmaken).
- **Zet publieke zelfregistratie uit — dit staat standaard AAN.** Het hele
  "admin nodigt uit, geen open registratie"-model (Stap 3) is een dode
  letter zolang Supabase's eigen publieke signup-endpoint
  (`/auth/v1/signup`) nog open staat: dan kan **iedereen** met een geldig
  e-mailadres zelf een account aanmaken (en na het klikken op de eigen
  bevestigingsmail meteen inloggen als laagste rol), volledig buiten de
  admin om. In dit project bij een pentest ontdekt en bevestigd
  exploiteerbaar. Zet dit direct na het aanmaken van het Supabase-project
  uit: **Authentication → Providers/Sign In → Email → "Allow new users to
  sign up" uit.** Check na afloop met
  `curl <project-url>/auth/v1/settings` dat `disable_signup: true` staat,
  en dat een testpoging tot `/auth/v1/signup` een `signup_disabled`-fout
  geeft. De admin-uitnodigingsflow (`inviteUserByEmail`/de Admin API)
  blijft hierna gewoon werken — dat is een apart mechanisme.
- Overweeg ook of elke kolom die "iedereen ingelogd mag alles lezen"-achtige
  policies blootleggen (zoals `profiles_select_all`) echt voor **alle**
  rollen zichtbaar moet zijn. In dit project kan elke ingelogde gebruiker
  (dus met open registratie: potentieel iedereen) de leeftijd/geslacht van
  alle andere gebruikers zien — voor Royal Mission geen probleem bevonden,
  maar vraag dit na bij een andere organisatie, vooral bij gevoeligere
  velden dan naam/rol.

## Stap 7 — Concrete bugs die dit project al heeft gehad (voorkom ze meteen)

Dit zijn geen hypothetische aandachtspunten maar bugs die na de eerste
oplevering echt zijn opgetreden tijdens gebruik. Bouw ze meteen goed in
plaats van ze opnieuw te laten ontstaan:

- **`proxy.ts` (de auth-middleware) moet statische bestanden uitsluiten.**
  De `matcher` bepaalt welke requests door de sessie/auth-check gaan. Sluit
  je alleen `_next/static`/`_next/image`/`favicon.ico` uit (het
  create-next-app-default), dan wordt bv. `/brand/logo.svg` of een
  `app/icon.svg`-favicon voor uitgelogde bezoekers doorgestuurd naar
  `/login` — het logo op de eigen loginpagina laadt dan niet. Sluit bestanden
  met een extensie sowieso uit:
  ```
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
  ```
  Dezelfde valkuil geldt voor `manifest.webmanifest` en `sw.js` zodra je PWA-
  support toevoegt (zie Stap 13): die hebben geen bestandsextensie die de
  regex al opvangt, dus expliciet uitsluiten of de installatie-prompt/
  service worker krijgt voor uitgelogde bezoekers ook een redirect naar
  `/login` in plaats van de echte inhoud.
- **Nooit `date.toISOString().slice(0, 10)` voor een datum-only URL-param.**
  Als de `Date` lokaal is opgebouwd (`setDate`/`setHours` zonder tijdzone),
  converteert `toISOString()` naar UTC — op een server met een tijdzone vóór
  op UTC (bv. Europe/Amsterdam) schuift de datum daardoor een dag terug. Dit
  brak de "volgende week"-navigatie in het rooster. Format een datum-only
  string altijd met lokale getters:
  ```ts
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  `${y}-${m}-${d}`
  ```
  (zie `src/lib/dates.ts`). Zodra je zo'n datum-only string weer terugleest
  voor weergave (bv. dagnaam bepalen), gebruik dan bewust de UTC-varianten
  (`getUTCDay()`, `toLocaleDateString(..., { timeZone: "UTC" })`) — anders
  ontstaat hetzelfde soort verschuiving in de omgekeerde richting.
- **Kloktijden (uren:minuten, niet alleen datums) verschuiven tussen lokaal
  en Vercel als je nergens expliciet een tijdzone noemt.** `new
  Date("2026-09-07T09:00")` (uit een `datetime-local`-inputveld) en
  `date.toLocaleTimeString(...)` zonder `timeZone`-optie gebruiken allebei
  stilzwijgend de tijdzone van de server die de code uitvoert. Op een
  ontwikkelaars-Mac in Nederland is dat toevallig al Europe/Amsterdam, dus
  lijkt alles te kloppen — maar Vercel's servers draaien standaard op UTC,
  wat een verschuiving van 1-2 uur geeft (zomer-/wintertijd) tussen
  lokaal en live. Dit raakt zowel **weergave** (bestaande tijden tonen
  fout) als **opslag** (nieuwe tijden die via de live site worden
  ingevoerd, worden ook echt fout opgeslagen — geen displaybug maar
  databeschadiging). Reproduceer dit soort bug altijd eerst met een klein
  Node-scriptje dat `process.env.TZ` verandert vóór je een fix
  aanneemt/verwerpt.

  **Fix die écht werkt: converteer expliciet, vertrouw nergens op de
  ambient servertijdzone** — ook niet via `process.env.TZ` mutatie of
  een `TZ`-omgevingsvariabele. Twee eerdere pogingen faalden hier allebei
  op een manier die pas bij een echte Vercel-deploy zichtbaar werd:
  1. Een `TZ`-omgevingsvariabele instellen (lokaal + Vercel) — Vercel
     weigert `TZ` als naam ("reserved"), dus dit lukt niet eens.
  2. `process.env.TZ = "Europe/Amsterdam"` zetten in `instrumentation.ts`
     (Next.js' `register()`-hook, draait één keer bij serverstart) — dit
     compileerde en leek lokaal te werken, maar bleek op Vercel's
     runtime niet betrouwbaar: het wijzigen van `process.env.TZ`
     ***tijdens*** het draaien van het proces wordt niet overal
     gegarandeerd opgepikt door de Date/Intl-interne cache. De
     verificatie die dit leek te bevestigen testte per ongeluk het
     verkeerde ding (`TZ` als shell-variabele *vóór* het opstarten van
     het proces, wat wél werkt — niet hetzelfde mechanisme als
     `instrumentation.ts` gebruikt).

  Schrijf in plaats daarvan een kleine, omgeving-onafhankelijke
  conversiefunctie (in `lib/dates.ts`) die `Intl.DateTimeFormat` gebruikt
  om een lokale kloktijd-string (bv. uit een `datetime-local`-inputveld)
  om te zetten naar de juiste UTC-ISO-string, ongeacht de tijdzone van de
  machine die het uitvoert:
  ```ts
  export function localDateTimeToUtcIso(local: string): string {
    const [datePart, timePart] = local.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
    const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    }).formatToParts(guess);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asAmsterdam = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
    return new Date(guess.getTime() - (asAmsterdam - guess.getTime())).toISOString();
  }
  ```
  Gebruik deze functie op de **opslag**-kant (i.p.v. `new
  Date(inputString).toISOString()`), en geef expliciet `timeZone:
  "Europe/Amsterdam"` mee aan **elke** `toLocaleTimeString`/
  `toLocaleDateString`-aanroep die kloktijden toont — die laatste stap
  had ook zonder de conversiefunctie al gewerkt, maar de opslag-kant kan
  alleen zo goed gezet worden. **Verifieer altijd met een echte
  production build waarbij de shell-`TZ` geforceerd op een ándere
  tijdzone dan Amsterdam staat** (`TZ=UTC npm run start`) — test zowel
  het **tonen** van bestaande data als het **aanmaken** van een nieuw
  item, en herhaal dat voor zowel een zomer- als een winterdatum (de
  UTC-offset verschilt door zomer-/wintertijd). Vertrouw pas op "het
  werkt" na een test op de **echte** hostingomgeving zelf, niet alleen
  een lokale simulatie — dat is precies waar de instrumentation.ts-poging
  hierboven misging.
- **Zodra dezelfde logica in twee pagina's opduikt, trek 'm meteen naar
  `lib/`.** In dit project stond de datum-arithmetiek en de
  schooljaar-selectielogica eerst alleen in de roosterpagina; toen de
  homepage dezelfde logica nodig had, is het naar `lib/dates.ts` en
  `lib/school-years.ts` verplaatst. Doe dat bij de tweede gebruiker van een
  stuk logica, niet pas bij de derde of vierde.
- **Een "toon het actieve item"-selectie heeft altijd een fallback nodig
  voor "er is niks actiefs, maar wel iets."** De admin-functie om studenten
  aan een schooljaar te koppelen koos het schooljaar via `jaar-param ??
  actief-gemarkeerd-jaar`, zonder verdere fallback. Zodra er precies één
  schooljaar bestond dat niet als "actief" was gemarkeerd, viel de hele
  sectie terug op "maak eerst een schooljaar aan" — terwijl er al een jaar
  was. De functie leek daardoor te ontbreken, terwijl hij prima werkte.
  Voeg altijd een derde fallback toe (het eerste item uit de lijst) voor
  elk zo'n "kies het relevante item"-patroon:
  `jaar ?? actief ?? lijst[0]`.

## Stap 8 — Bestaande data van de klant importeren

Veel organisaties hebben al operationele data die in het nieuwe systeem
moet (een rooster, een ledenlijst, een planning) — vaak in Word/Excel, niet
in een makkelijk te parsen formaat. Aanpak die hier werkte (rooster van 389
items uit 5 Word-documenten):

1. Converteer naar **HTML**, niet platte tekst: `textutil -convert html
   -output out.html "bestand.docx"` (macOS, ingebouwd). HTML bewaart de
   tabelstructuur (rijen/kolommen), platte tekst niet — een Word-tabel wordt
   in platte tekst een onbetrouwbare, moeilijk terug te herleiden lijst.
2. Parse de HTML met een script (Python + BeautifulSoup, of vergelijkbaar)
   in plaats van blind regex op de platte tekst los te laten.
3. **Toon een preview en vraag bevestiging** voordat je in bulk naar de
   echte database schrijft, zeker bij aannames die niet in de brondocumenten
   staan (hier: de tijd van avondprogramma-onderdelen was niet
   gedocumenteerd). Dit is échte operationele data van de klant — een
   foutieve aanname raakt in bulk honderden rijen tegelijk.
4. Schrijf de importscripts weg in de projectrepo (bv.
   `scripts/<naam>-import/`) met een korte `README.md` over de aanpak, in
   plaats van ze alleen in een tijdelijke scratchpad te laten — de klant
   wil dit soort imports later mogelijk opnieuw of voor een volgend jaar
   draaien.
5. Voor de bulk-insert zelf: de Supabase REST API rechtstreeks aanroepen
   met de service-role key (in batches, bv. 100 rijen per request) is
   sneller dan honderden keren door de app-UI klikken, en hoeft niet door
   de RLS-policies heen (service-role bypasst RLS by design).

## Stap 9 — Wat een goede standaard-homepage doet

Een dashboard met alleen navigatiekaarten ("Nieuws", "Rooster", ...) is een
zwakke standaard: de gebruiker moet zelf op zoek naar wat relevant is. Beter:
laat de homepage meteen **tijdsgebonden inhoud** tonen — in dit project de
eerstvolgende (echte) lesdag en de laatste nieuwsberichten. Zodra de
menubalk alle pagina's al ontsluit, zijn aparte navigatiekaarten op de
homepage overbodig geworden en kunnen ze weg — die combinatie (menubalk
+ kaarten) is dubbelop. Vraag bij een ander soort organisatie: wat zou
iemand die inlogt als eerste willen weten? (bv. bij een bedrijf:
eerstvolgende teammeeting + laatste aankondiging.)

## Stap 10 — Mobielvriendelijk vanaf het begin, niet achteraf

Test responsief gedrag met een **echte browser-engine en echte metingen**,
niet alleen door een screenshot te bekijken. De `chrome --headless
--screenshot --window-size=W,H`-combinatie op de command line bleek in dit
project onbetrouwbaar (rapporteerde een niet-bestaande overflow-bug); een
Playwright-scriptje met `page.viewport`, `boundingBox()` en
`element.evaluate("el => el.scrollWidth")` gaf het echte, betrouwbare beeld.

**Let bij het testen zelf op met Playwright**: een generieke tekst-selector
als `page.click('text=Toevoegen')` of `'text=Opslaan'` matcht de **eerste**
knop met die tekst op de pagina. Een admin-scherm heeft al snel meerdere
formulieren met eenzelfde knoplabel (bv. "Schooljaar toevoegen" én "Student
toevoegen aan schooljaar") — de test klikt dan stilzwijgend de verkeerde
knop aan, en de conclusie "de functie werkt niet" is dan een fout in de
test, niet in de app. Scope de klik altijd tot het specifieke formulier:
`page.locator('form:has(select[name="student_id"]) button[type="submit"]').click()`.
Bevestig een negatieve testuitslag daarom ook altijd met een tweede,
onafhankelijke check (bv. rechtstreeks via de REST API) voordat je een
"bug" rapporteert of gaat fixen.

Concrete patronen die hier nodig waren:

- **Master-detail-schermen** (zoals een berichten-inbox met contactenlijst
  + gesprek naast elkaar) worden op mobiel al snel twee dingen half over
  elkaar in plaats van één ding goed. Toon op smalle schermen bewust maar
  één kant tegelijk (lijst, of het geselecteerde item + een "terug"-link),
  niet allebei gestapeld.
- **Navigatiebalk**: los een volledige linkenlijst niet op met alleen
  `overflow-x-auto` — links die niet voor iedereen gelden of pas later zijn
  toegevoegd (hier eerst "Admin", later ook "Info") kunnen dan net buiten
  het scherm vallen, zonder enige visuele aanwijzing dat er meer te
  scrollen valt. De eerste fix (zo'n link naar de altijd-zichtbare rij
  naast de rol-badge/uitloggen verplaatsen) loste het incident op, maar
  bleek geen structurele oplossing: zodra er een tweede link bijkwam, trad
  precies hetzelfde probleem weer op. **Structurele fix zodra er meer dan
  ~4 navigatie-items zijn**: een hamburgermenu op mobiel (client component
  met open/dicht-state, alle items — inclusief rolgebonden links en
  uitloggen — in één uitklappaneel), desktop houdt gewoon de horizontale
  rij. Dit voorkomt de hele bugcategorie in plaats van 'm per link opnieuw
  te repareren.
- **Content-labels inkorten op smalle schermen** (bv. een datumrange met
  volledige maandnamen) i.p.v. een layout geforceerd op één regel proberen
  te houden — twee tekstvarianten renderen en met `hidden`/`sm:hidden` CSS
  wisselen, geen JS nodig.
- Rijen die tekst + een losstaand mini-formulier combineren (statusupdate,
  verwijderknop) krijgen `flex-wrap` op de rij en `min-w-0 flex-1` op de
  tekstkant / `shrink-0` op de formulierkant, anders duwt lange tekst de
  knoppen van het scherm af.

## Stap 11 — Zelf-service profielen: wachtwoord-reset en de privilege-escalatie-valkuil

Zodra gebruikers hun eigen profiel mogen bewerken (naam, leeftijd, wat dan
ook) én een admin diezelfde tabel ook mag beheren (rol, rechten), ontstaat
een klassieke valkuil: **Row Level Security werkt per rij, niet per
kolom.** Een policy als "een gebruiker mag zijn eigen rij updaten" staat
—zonder verdere maatregelen— ook toe dat diezelfde gebruiker via een
directe API-call (buiten de app-UI om) zijn eigen `role` of andere
rechten-kolom wijzigt. Dit is geen theoretisch risico: in dit project met
opzet getest door een tijdelijk test-account zichzelf via een rechtstreekse
PATCH-call naar `admin` te laten promoveren — dat lukte, tot een fix.

**Oplossing:** een `before update`-trigger op de tabel die rechten-kolommen
(`role`, `is_zorgcoach`, etc.) terugzet naar hun oude waarde tenzij de actor
zelf admin is (via dezelfde `my_role()`-helperfunctie als de RLS-policies).
RLS bepaalt wie de rij mag aanraken; de trigger bepaalt welke kolommen
daadwerkelijk mogen veranderen. Bouw dit **voordat** je zelf-service
profielbewerking oplevert, niet erna.

**Verwante valkuil: gespiegelde velden raken los van de bron.** Dit
project spiegelt `auth.users.email` naar `profiles.email` (voor makkelijk
querien/tonen in de UI). Iemand paste dat e-mailadres per ongeluk
rechtstreeks aan in de Supabase **Table Editor** — dat verandert alleen het
spiegel-veld, niet het echte inlogadres, met als gevolg dat een
wachtwoord-reset leek te mislukken (het nieuwe wachtwoord hoorde bij een
ander adres dan getoond). Los dit structureel op zodra je zo'n gespiegeld
veld hebt:
1. Vergrendel het gespiegelde veld tegen directe writes (reset naar de
   oude waarde in dezelfde trigger als hierboven).
2. Zet een `after update of <kolom> on auth.users`-trigger die het
   spiegel-veld automatisch bijwerkt zodra het echte veld wijzigt.
3. **Let op de volgorde-valkuil**: als dezelfde tabel al een
   vergrendelings-trigger heeft (stap 1), blokkeert die óók de sync uit
   stap 2 — de vergrendeling kan het verschil niet zien tussen een
   ongeoorloofde directe edit en de eigen legitieme sync-update. Los dit op
   met een transactie-lokale vlag: de sync-trigger zet
   `set_config('jouw_prefix.syncing_x', 'true', true)` (derde argument
   `true` = alleen geldig binnen de huidige transactie) vlak voor de
   update, en de vergrendelingstrigger laat de write door als die vlag
   staat. Test na het bouwen altijd **beide** paden met een wegwerp-
   testaccount: (a) een directe edit moet genegeerd worden, (b) een echte
   wijziging aan de bron moet wél doorkomen — anders ontdek je dit pas als
   een gebruiker klaagt dat iets "niet werkt" terwijl de onderliggende
   functie eigenlijk prima werkt (zoals hier: wachtwoord-reset zelf deed
   het goed, het echte probleem zat in verweesde data).

## Stap 12 — Live zetten: GitHub → Vercel → eigen domein

Dit hoeft niet meteen bij oplevering — hier is het pas gedaan nadat de app
al een tijd lokaal goed werkte. Volgorde die hier werkte:

1. **GitHub-repo aanmaken.** Nieuwe **private** repository op github.com,
   niets aanvinken bij "Initialize" (geen README/gitignore/license) — er is
   al een lokale repo met geschiedenis die je ongewijzigd wilt pushen.
2. **Authenticatie bij het pushen.** Als het GitHub-account via Google/SSO
   is aangemaakt, is er geen GitHub-wachtwoord — git heeft sowieso geen
   wachtwoord nodig maar een **Personal Access Token**
   (github.com/settings/tokens → Generate new token (classic) → scope
   `repo`). Gebruik die token **niet** door 'm permanent in de remote-URL
   te zetten (dan staat 'ie leesbaar in `.git/config`); zet 'm alleen
   tijdelijk in de URL voor de eerste push/fetch, en reset de remote-URL
   daarna terug naar de schone vorm zonder token:
   ```bash
   git remote set-url origin "https://<token>@github.com/<user>/<repo>.git"
   git push -u origin main
   git fetch origin && git branch --set-upstream-to=origin/main main
   git remote set-url origin "https://github.com/<user>/<repo>.git"
   ```
   Check achteraf met `grep -i "ghp_" .git/config` dat er niets is
   blijven hangen.
3. **Vercel-account**: inloggen via "Continue with GitHub" (geen apart
   wachtwoord nodig). Project importeren vanuit de zojuist aangemaakte
   repo.
4. **Environment variables invullen**: Vercel's invoerveld herkent vaak een
   heel geplakt `.env`-blok automatisch (plak het hele blok in het eerste
   "Key"-veld) en splitst het zelf in losse rijen — sneller dan één voor
   één overtypen. Voor `NEXT_PUBLIC_APP_URL`: gok op
   `https://<projectnaam>.vercel.app` (Vercel's standaardpatroon) en
   corrigeer na de eerste deploy als het net anders blijkt.
5. **Na de deploy verifiëren** (niet alleen "ziet er goed uit"): check met
   curl dat de inlogpagina 200 geeft, een statisch asset (logo/favicon)
   ook 200 geeft, en dat een beveiligde pagina zonder sessie nog steeds
   naar `/login` redirect (`proxy.ts` moet in productie hetzelfde gedrag
   vertonen als lokaal).
6. **Eigen (sub)domein koppelen**: Vercel-project → Settings → Domains →
   domein toevoegen. Vercel toont een CNAME-record (naam = het
   subdomein-gedeelte, waarde = iets als `xxxxx.vercel-dns...`) — dat
   record toevoegen bij de DNS-provider van dat domein (bij Strato:
   Domeinbeheer → domein → DNS → "TXT- en CNAME-records" → configuratie,
   zelfde scherm als voor een Resend-domein, zie Stap 2). Kan weer een
   tijdje duren voor het doorkomt.
7. **Resend-domein verifiëren (het eigen e-maildomein, niet het sandbox-
   testadres) — bij Strato is het custom MX-record de valkuil.** Het
   generieke DNS-formulier bij Strato (waar de DKIM/SPF TXT-records wel
   gewoon lukken) toont alleen TXT/CNAME als recordtype, geen MX. Een
   custom MX-record voor een subdomein (bv. `send.rms`, zoals Resend
   vraagt) moet via een **apart subdomein-object**: eerst dat subdomein
   zelf aanmaken bij Strato, dan naar de instellingen van dát subdomein →
   tabblad DNS → MX-record → "beheren" → "eigen mailserver" kiezen, de
   waarde van Resend invullen, prioriteit op "Laag". **Bekende valkuil in
   dat formulier:** Strato toont twee Hostnaam/Prioriteit-velden voor de
   eigen mailserver; het tweede veld kan per ongeluk gevuld staan met de
   subdomeinnaam zelf (in plaats van leeg te blijven), wat een tweede,
   ongeldig MX-record oplevert dat de Resend-verificatie blokkeert.
   Controleer na het opslaan altijd met `dig MX <subdomein>` dat er maar
   **één** MX-record staat. Zodra de DNS klopt, checkt Resend niet
   automatisch opnieuw — je moet zelf op **"restart verification"**
   klikken op resend.com/domains. Test daarna met een losse curl-aanroep
   naar de Resend API (`from` op het nieuwe domein) én met een echte
   end-to-end-actie in de app zelf (bv. tijdelijk een zorgcoach-vlag op
   een test-/eigen account zetten, een testaanvraag indienen, en daarna
   weer opruimen) voordat je concludeert dat het werkt.
8. **Demo-/test-accounts voor een presentatie aan collega's/stakeholders**:
   gebruik de Admin API's `createUser` (niet `inviteUserByEmail`) met
   `email_confirm: true` én een vast wachtwoord in dezelfde aanroep — dan
   is er geen echte e-mail nodig om het account te activeren, ideaal met
   nep-adressen (`naam.demo@example.com`). Waarschuw wel dat berichten/
   mailmeldingen vanuit zulke accounts nergens echt aankomen.
9. **Merk-gestylede PDF-hand-out voor gebruikers** (bv. "zo werkt de app +
   inloggegevens"): schrijf een HTML-bestand met de huisstijl-tokens en het
   logo (inline SVG) erin, en zet het om naar PDF met headless Chrome:
   `chrome --headless=new --disable-gpu --print-to-pdf=out.pdf
   --no-pdf-header-footer file://pad/naar/bestand.html`. Geen extra
   library nodig, en je kunt 'm meteen zelf visueel controleren door het
   PDF-bestand terug in te lezen.

## Stap 13 — Installeerbaar maken als PWA (iPhone + Android, zonder App Store)

Voordat je overweegt een echte native iOS/Android-app te bouwen (Capacitor-
wrapper of volledige React Native/Flutter-herbouw): een **PWA** kost een
fractie van het werk, hergebruikt de bestaande Next.js-codebase 100%, en is
voor een intern portal meestal voldoende. Aanpak die hier werkte:

1. **Iconen genereren uit de bestaande merk-SVG**, geen losse ontwerpstap
   nodig als er al een `public/brand/*.svg`-icoonmerk bestaat:
   - `sips -s format png -z <size> <size> logo.svg --out out.png` (macOS,
     ingebouwd) rasterizet een SVG direct naar PNG op de gewenste resolutie.
   - Voor het **apple-touch-icon** heeft iOS een ondoorzichtige achtergrond
     nodig (transparantie wordt anders lelijk zwart ingevuld) — comprimeer
     het icoon daarom met wat marge op een witte (of merk-)achtergrond via
     Python/Pillow (`Image.alpha_composite`) in plaats van de rauwe
     transparante rasterization te gebruiken.
   - Zet de 192×192/512×512 manifest-iconen in `public/` (bereikbaar via een
     kale URL); zet `apple-icon.png` in `src/app/` — dat is een Next.js
     file-conventie die automatisch de juiste `<link rel="apple-touch-icon">`
     genereert, geen handmatige meta-tag nodig.
2. **`src/app/manifest.ts`** (Next.js file-conventie, genereert automatisch
   `/manifest.webmanifest` + de `<link rel="manifest">`): `name`,
   `short_name`, `start_url: "/"`, `display: "standalone"`,
   `background_color`/`theme_color` uit dezelfde design-tokens als
   `globals.css` (zie Stap 2/3) — niet los verzinnen.
3. **`viewport`-export in `layout.tsx`** (apart van `metadata` sinds
   Next 14, zie framework-docs) met `themeColor` als light/dark-paar dat
   matcht met de `prefers-color-scheme`-tokens in `globals.css`, plus
   `appleWebApp: { capable: true, title, statusBarStyle: "default" }` in
   `metadata` voor het app-scherm op iOS.
4. **Service worker (`public/sw.js`) scopen tot alleen statische, versie-
   gebonden assets** (`_next/static/`, de iconen) met een stale-while-
   revalidate-strategie — laat pagina's, `/api` en auth-routes altijd
   rechtstreeks over het netwerk gaan. Een Supabase-app met sessies/RLS mag
   nooit een ingelogde-status of database-respons uit de cache serveren;
   dat risico is het (kleine) offline-voordeel niet waard. Registreer 'm via
   een client component (`useEffect` → `navigator.serviceWorker.register`)
   die je in `layout.tsx` rendert.
5. **Vergeet de `proxy.ts`-matcher niet** — zie de bug hierboven in Stap 7:
   zonder expliciete uitsluiting van `manifest.webmanifest` en `sw.js`
   redirect de auth-check ze naar `/login` en is de app niet installeerbaar
   voor uitgelogde bezoekers (bv. de inlogpagina zelf).
6. **Verifiëren doe je met een production build**, niet de dev-server (de
   dev-server cachet/serveert anders): `npm run build && npm run start --
   -p <poort>`, dan met `curl -i` checken dat `/manifest.webmanifest` en
   `/sw.js` een 200 met de juiste content-type geven (niet een 307 naar
   `/login`), en dat een beveiligde pagina zonder sessie nog steeds wél
   redirect. Test daarna ook echt "Zet op beginscherm" (iOS Safari) /
   "App installeren" (Android Chrome) op een fysiek toestel — de
   PWA-installatiecriteria van browsers zijn strenger dan alleen "de bestanden
   bestaan".

## Stap 14 — Rolgebonden instructie-PDF's met echte screenshots

Zodra de app meerdere rollen heeft (Stap 4) én installeerbaar is als PWA
(Stap 13), verdient elke rol zijn **eigen** PDF in plaats van één
generieke handleiding: een student heeft niets aan uitleg over
rooster-bewerken, en "hoe zet ik 'm op mijn telefoon" hoort er sowieso
altijd bij. Aanpak die hier werkte:

1. **Screenshots automatisch maken met Playwright, niet met de hand.**
   Log met een script in op elk demo-/testaccount (zie Stap 5), zet de
   `viewport` op een echt telefoonformaat (bv. 390×844,
   `deviceScaleFactor: 2`, `isMobile: true`, een iPhone-`userAgent`) en
   loop de kernpagina's per rol af. Zo krijg je in één run een complete,
   actuele set screenshots i.p.v. handmatig telefoonfoto's maken.
2. **Voordat je screenshot: check of de demo-/testdata er ook echt netjes
   uitziet.** Testaccounts verzamelen op den duur rommelige invoer van
   eerder testen/pentesten (hier bv. onzin-teksten in zorgaanvragen). Dat
   hoort niet in een document dat je aan echte gebruikers laat zien —
   ruim het op (of vervang door één realistisch voorbeeld) via de
   REST API vóórdat je screenshots maakt, niet erna.
3. **Maak alle screenshots in het document echt exact even groot — zelfde
   breedte én zelfde hoogte, geen uitzonderingen.** Individuele
   pagina's verschillen van nature in inhoudslengte (een leeg formulier
   vs. een volle roosterweek), dus zonder ingrijpen krijg je een rommelige
   mix van kleine en (uitgerekt) grote afbeeldingen — en een schermafbeelding
   die toevallig hoger is dan één afdrukpagina breekt bovendien af
   halverwege. Normaliseer daarom **elke** screenshot (ook de inhoudelijk
   lange, zoals een volledig rooster) naar dezelfde vaste pixel-afmeting
   vóór je ze in de PDF zet:
   - Kort een schermafbeelding in tot die vaste hoogte (bovenkant behouden,
     of een bewust gekozen uitsnede die het relevante deel toont — zie
     volgende punt) als hij langer is;
   - vul 'm aan met de eigen achtergrondkleur (uitlezen via de pixel
     rechtsonder) tot die vaste hoogte als hij korter is.
   Laat ze daarna allemaal in dezelfde rij-layout meelopen (bv. 3 per rij)
   zonder een aparte "volledige pagina"-behandeling voor de langere
   screenshots — dat oogt inconsistent naast de rest, ook al lost het op
   zichzelf het afbreek-probleem op.
4. **Een vaste kop-uitsnede (altijd vanaf bovenkant croppen) werkt niet
   voor elke pagina.** Een pagina met veel eigen inhoud onderaan (hier: het
   beheeroverzicht van alle aanvragen, zichtbaar ver onder de vouw) verloor
   bij een simpele boven-crop precies het onderdeel dat de screenshot moest
   laten zien. Neem in zo'n geval een schermafbeelding van de **volle
   pagina** (Playwright `fullPage: true` of scrollen vóór het maken van de
   screenshot) en snijd bewust het venster uit dat het relevante onderdeel
   toont, in plaats van altijd blind vanaf y=0 te croppen.
5. **Installatie-instructies (Stap 13) horen in elke rol-PDF terug te
   komen**, niet alleen in één centraal document — elke gebruiker leest
   waarschijnlijk maar één van de PDF's.
6. **Genereer de HTML's met een script (Python/Node), niet drie keer met
   de hand geschreven HTML.** Eén gedeelde CSS/lay-out-sjabloon met per rol
   een andere featurelijst + screenshot-selectie voorkomt dat de drie
   documenten qua opmaak uit elkaar gaan lopen. Zet de PDF-conversie
   (headless Chrome, zie Stap 7) in dezelfde build-stap.
7. **Controleer het eindresultaat altijd door de PDF terug te renderen naar
   afbeeldingen** (`pdftoppm -png -r 100 bestand.pdf out`) en die visueel te
   bekijken — niet alleen de HTML-bron beoordelen. Paginaverdeling
   (afbrekingen, witruimte, uitgerekte afbeeldingen) is in de HTML-preview
   totaal niet zichtbaar en pas in de daadwerkelijke PDF-uitvoer een
   probleem.

## Stap 15 — Van "werkt" naar "voelt echt op-merk": grafische huisstijl-elementen + laadstatus

Na oplevering kwam hier feedback op terug die niet over features ging,
maar over hoe de app *aanvoelde*: te generiek/"AI-gemaakt", en de
gebruiker zag niet wanneer de app iets aan het verwerken was. Beide
zijn met een vaste aanpak op te lossen, en horen standaard bij een
oplevering, niet pas als reactie op klachten:

1. **Design tokens (kleuren/lettertype, zie Stap 2) zijn niet genoeg voor
   "voelt echt op-merk".** Een correcte kleur + font op generieke
   `rounded-lg border`-kaartjes blijft ondanks correcte kleuren aanvoelen
   als een standaard Tailwind/shadcn-template. Zoek in de aangeleverde
   huisstijlmap altijd naar **grafische merkelementen** naast de
   kleur/font-tokens — vaak zit er een logo-map met varianten
   (wit-op-kleur, icoon-only), een getextureerde achtergrond per
   kleur/submerk, en/of een vormelement (hier: een "Royal Arch"-golf) dat
   het merk buiten reclame-uitingen ook op straat/print herkenbaar maakt.
   Gebruik die vorm als terugkerend visueel anker (hero-banner op de
   auth-schermen, overgang onder de vaste in-app header) in plaats van
   'm links te laten liggen omdat de kleurtokens al "goed genoeg" leken.
2. **PNG-vormelementen met transparantie: composite ze eerst over een
   contrastkleur voordat je aanneemt wat erin zit.** Zo'n PNG rendert in elke
   viewer die transparantie niet laat zien als leeg wit — en de vulkleur zelf
   bleek hier zelf ook wit te zijn (bedoeld om over een gekleurde
   achtergrond/foto heen te liggen), niet de merkkleur zelf. Check dit met
   een klein Python/PIL-scriptje
   (`Image.open(pad).convert('RGBA')` + `alpha_composite` op een fel gekleurde
   achtergrond, dan opslaan en bekijken) vóórdat je aannames doet over hoe
   en waar zo'n asset gebruikt moet worden.
3. **Een golf/boog-vormasset schaal je met een vaste hoogte + `object-fit:
   fill`, niet op native aspect ratio.** Zulke assets zijn vaak breed en
   ondiep bedoeld (bv. 1920×888px) puur om over een volle breedte te passen
   op willekeurige schermbreedtes; meeschalen op aspect ratio maakt 'm op
   brede schermen absurd hoog. Render als plain `<img>` (geen `next/image`,
   die dwingt anders een aspect ratio af) met een vaste `h-*`-klasse en
   `style={{ objectFit: "fill" }}`.
4. **Laadstatus hoort bij élke knop die een server action aanroept, niet
   losstaand per pagina uitgevonden.** Bouw één keer een generieke
   `SubmitButton`-component (`"use client"`, `useFormStatus()` uit
   `react-dom`, spinner + `disabled` zolang `pending`) en vervang daarmee
   stelselmatig **alle** losse `<button type="submit">` in de app — dat is
   grep-baar (`grep -rn 'type="submit"' src`) en moet na afloop leeg zijn op
   de knoppen die al een eigen `useActionState`-pending hebben (login,
   wachtwoord-vergeten-achtige schermen). Voor die laatste categorie: geen
   aparte component nodig, gewoon dezelfde `Spinner` hergebruiken naast de
   bestaande "Bezig..."-tekst.
5. **Navigatie tussen pagina's (niet alleen knop-submits) voelt ook
   "hangend" aan zonder feedback**, zeker bij Server Components die per
   pagina data ophalen. Los dit in App Router op met één `loading.tsx` in
   de layout-groep met de meeste pagina's (hier: `(app)/loading.tsx`) — dat
   wrapt automatisch elke onderliggende `page.tsx` in een Suspense-fallback
   bij navigatie, zonder dat je per route iets hoeft te doen.
6. **Verifiëren van een puur visuele wijziging kán niet met alleen
   `tsc`/`lint`/`build`** — dat bewijst alleen dat het compileert, niet dat
   het er goed uitziet. Als de betrokken pagina achter login zit
   (`proxy.ts` redirect uitgelogde bezoekers), en er is geen testaccount
   voorhanden: zet tijdelijk een weggooi-route neer buiten de normale
   route-groep (let op: een mapnaam die met `_` begint is in Next.js App
   Router een *private folder* en krijgt nooit een eigen pagina — gebruik
   een neutrale naam), voeg 'm heel even toe aan `PUBLIC_PATHS` in
   `proxy.ts`, render de component met nepdata, screenshot 'm met Playwright
   (venv onder `venv/bin/playwright`, of `chromium-cli` als die beschikbaar
   is), en verwijder daarna zowel de route als de `PUBLIC_PATHS`-toevoeging
   weer volledig.
7. **Een golf/boog-vormasset moet écht groot genoeg zijn om als curve te
   lezen, niet als kleurtoken-detail.** Eerste poging gebruikte een 12-16px
   hoge rand — dat oogde als een rafelig/kapot randje, niet als een
   golf, simpelweg omdat een zachte curve op die schaal niet meer als
   curve herkenbaar is (te weinig pixels). Vuistregel die hier werkte: laat
   'm zo'n 20px overlappen in het gekleurde vlak erboven én 40px doorlopen
   in het lichte vlak eronder (dus ~60px totale hoogte), ongeacht de
   breedte van de container — `object-fit: fill` maakt hoogte en breedte
   onafhankelijk schaalbaar, dus dit werkt op elke breedte. Test dit ook
   echt geïsoleerd (los HTML-testbestandje, één plaatje, een paar
   px-varianten) vóórdat je 'm in de app zet — dat is sneller dan blind in
   de context van de hele pagina itereren.
8. **Let op CSS-specificiteit als je een asset opnieuw stijlt in een
   test-/vergelijkingspagina.** Een generieke regel als `.opt-b .b-header
   img { height: 15px }` (bedoeld voor het logo) won stilzwijgend van de
   eigenlijk bedoelde `.opt-b .b-wave { height: 60px }`, puur omdat
   `header img` (twee klassen + één element) een hogere specificiteit heeft
   dan `.b-wave` (twee klassen). Zoiets valt niet op in de browser-preview
   zonder het na te meten (`getComputedStyle` + `matches()` op alle
   stylesheet-regels) — bij een onverwacht kleine/groot element is dit een
   van de eerste dingen om te checken, naast de voor de hand liggende
   Tailwind-arbitrary-value-typo's.
9. **Een wit vormelement (bedoeld om te verdwijnen tegen een lichte
   pagina-ondergrond) breekt in donkere modus.** Dit project ondersteunt al
   langer `prefers-color-scheme: dark` (ziet de pagina-achtergrond bijna
   zwart), maar de golf-asset zelf is en blijft wit — het resultaat is een
   hard wit balkje boven een donkere leegte, wat oogt als een bug (en door
   Luuk terecht "donkerrood/kapot" genoemd werd, ook al zat de fout niet in
   de kleurtokens zelf). Test een nieuw grafisch merkelement daarom altijd
   ook met `color_scheme='dark'` (Playwright: `browser.new_page(color_scheme=
   'dark')`) vóórdat je 'm oplevert, niet alleen in licht. Structurele fix
   hier: een `.brand-wave`-klasse die via `@media (prefers-color-scheme:
   dark) { .brand-wave { display: none } }` verdwijnt, met een dunne
   `border-bottom` als vervanging zodat de gekleurde balk niet zomaar
   overloopt in de donkere ondergrond. Niet elk licht-modus-vormelement
   heeft dus automatisch een donkere-modus-equivalent in de aangeleverde
   huisstijl-assets — reken daar niet op, ontwerp een expliciete fallback.
