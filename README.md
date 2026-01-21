This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Foursquare API (optional but recommended for place search)
# Option 1: Places API v3 (Service API Key - may not work)
FOURSQUARE_API_KEY=your_foursquare_api_key_here

# Option 2: Legacy API v2 (Client ID + Secret - recommended)
FOURSQUARE_CLIENT_ID=your_client_id_here
FOURSQUARE_SECRET=your_client_secret_here
```

To get Foursquare API credentials:
1. Go to [Foursquare Developer Portal](https://developer.foursquare.com/)
2. Sign up or log in
3. Create a new app
4. Copy your credentials:
   - For Legacy API v2 (recommended): Copy `Client ID` and `Client Secret`
   - For Places API v3: Copy `Service API Key` (may require OAuth token instead)
5. Add them to `.env`

**Note:** The app will automatically use Legacy API v2 if available, as it's more reliable than Places API v3 with Service API Key.

The Foursquare integration enables:
- **Place search**: Users can search for places by name when creating a new spot
- **Auto-fill**: Automatically fills in place details (name, address, city, country, etc.) when coordinates are entered

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
