This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Biodiversity Explorer

A web application for discovering biodiversity near any location using iNaturalist and GBIF data.

## Setup

### Environment Variables (Optional)

For the best geocoding experience, configure a Google Maps API key:

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)
2. Enable the **Geocoding API** for your project
3. Create a `.env.local` file in the root directory:

```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note:** The app will work without a Google Maps API key by falling back to OpenStreetMap geocoding, but some addresses may not be found. If you don't have an API key, you can also enter coordinates directly (e.g., `44.2176, -73.4301`).

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
