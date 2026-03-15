# 🗺️ Exploree

**Objevuj a sdílej úžasná místa s komunitou.**

Exploree je moderní webová aplikace pro vytváření, sdílení a objevování zajímavých míst po celém světě. Ať už jsi cestovatel, fotograf, nebo jen hledáš inspiraci pro další výlet – Exploree ti pomůže najít skryté skvosty a podělit se o své oblíbené lokace.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

---

## ✨ Hlavní funkce

### 🌍 Interaktivní mapa

- Vybírej místa na plně interaktivní mapě pomocí Mapbox/MapLibre
- Zobrazuj místa v okolí nebo na celém světě
- Plynulé animace a gesta pro intuitivní navigaci

### 📍 Sdílení míst (Spots)

- Přidávej vlastní místa s fotkami, popisem a lokací
- Automatické doplnění údajů díky Foursquare API
- Tagování a kategorizace míst

### 👥 Sociální funkce

- Sleduj ostatní uživatele a objevuj jejich oblíbená místa
- Lajkuj a ukládej místa do sbírek
- Zaznamenávej své návštěvy s poznámkami

### 📚 Kolekce

- Vytvárej tematické sbírky míst (např. "Nejlepší kavárny v Praze")
- Veřejné i soukromé kolekce
- Sdílení kolekcí s přáteli

### 🔐 Bezpečná autentizace

- Přihlášení přes Google účet (NextAuth)
- Onboarding proces pro nové uživatele
- Ochrana stránek pomocí middleware

---

## 🚀 Instalace a spuštění

### Předpoklady

- Node.js 18+
- npm / yarn / pnpm / bun
- MySQL databáze

### 1. Klonování repozitáře

```bash
git clone https://github.com/Dejnyyy/rocnikovka-exploree.git
cd rocnikovka-exploree
```

### 2. Instalace závislostí

```bash
npm install
```

### 3. Nastavení prostředí

Vytvoř soubor `.env` v kořenovém adresáři a vyplň následující proměnné:

```env
# Databáze (MySQL)
DATABASE_URL="mysql://user:password@localhost:3306/exploree"

# NextAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000

# Foursquare API (pro vyhledávání míst)
FOURSQUARE_CLIENT_ID=your_foursquare_client_id
FOURSQUARE_SECRET=your_foursquare_secret

# Cloudinary (pro nahrávání obrázků)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. Inicializace databáze

```bash
npx prisma db push
npx prisma generate
```

### 5. Spuštění vývojového serveru

```bash
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000) v prohlížeči.

---

## 🔧 Nastavení externích služeb

### Google OAuth

1. Přejdi na [Google Cloud Console](https://console.cloud.google.com/)
2. Vytvoř nový projekt nebo vyber existující
3. V sekci "APIs & Services" → "Credentials" vytvoř OAuth 2.0 Client ID
4. Nastav Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Zkopíruj Client ID a Client Secret do `.env`

### Foursquare API

1. Zaregistruj se na [Foursquare Developer Portal](https://developer.foursquare.com/)
2. Vytvoř novou aplikaci
3. Zkopíruj Client ID a Client Secret (Legacy API v2)
4. Toto API umožňuje automatické vyhledávání a doplňování údajů o místech

### Cloudinary

1. Vytvoř účet na [Cloudinary](https://cloudinary.com/)
2. V Dashboard najdeš Cloud Name, API Key a API Secret
3. Vytvoř Upload Preset pro unsigned uploady

---

## 🛠️ Technologický stack

| Kategorie       | Technologie                           |
| --------------- | ------------------------------------- |
| **Framework**   | Next.js 15 (Pages Router, Turbopack)  |
| **Frontend**    | React 19, TypeScript                  |
| **Styling**     | Tailwind CSS 4                        |
| **Animace**     | Framer Motion, GSAP                   |
| **Mapy**        | Mapbox GL / MapLibre GL, React Map GL |
| **Databáze**    | MySQL + Prisma ORM                    |
| **Autentizace** | NextAuth.js (Google OAuth)            |
| **Obrázky**     | Cloudinary                            |
| **Stav**        | React Query (TanStack Query)          |
| **Validace**    | Zod                                   |
| **Ikony**       | Lucide React                          |

---

## 📁 Struktura projektu

```
src/
├── components/     # Znovupoužitelné UI komponenty
├── context/        # React Context providers
├── generated/      # Vygenerované soubory
├── hooks/          # Custom React hooks
├── lib/            # Utility funkce a konfigurace
├── middleware.ts   # Ochrana obsahu a přesměrování
├── pages/          # Next.js stránky a API routes
├── styles/         # Globální CSS styly
└── types/          # TypeScript definice
```

---

## 📜 Skripty

| Příkaz          | Popis                              |
| --------------- | ---------------------------------- |
| `npm run dev`   | Spustí vývojový server s Turbopack |
| `npm run build` | Vytvoří produkční build            |
| `npm run start` | Spustí produkční server            |
| `npm run lint`  | Zkontroluje kód pomocí ESLint      |

---

## 📝 Licence

Tento projekt je součástí mojí maturitní práce.

---

<p align="center">
  Vytvořeno s ❤️ Dejnyho
</p>
