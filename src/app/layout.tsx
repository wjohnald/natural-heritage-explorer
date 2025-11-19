import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'iNaturalist Explorer - Discover Biodiversity Near You',
  description: 'Search for iNaturalist observations near any address. Explore biodiversity and wildlife sightings in your area.',
  keywords: ['iNaturalist', 'biodiversity', 'wildlife', 'nature', 'observations', 'species'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
