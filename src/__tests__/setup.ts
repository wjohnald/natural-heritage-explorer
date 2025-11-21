import '@testing-library/jest-dom';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local and .env
// Vitest doesn't automatically load these like Next.js does
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Log if Google Maps API key is available (for debugging)
if (process.env.GOOGLE_MAPS_API_KEY) {
    console.log('✓ Google Maps API key loaded for tests');
} else {
    console.log('⚠ Google Maps API key not found - will use OpenStreetMap fallback');
}
