import { describe, it, expect, beforeAll } from 'vitest';
import { geocodeAddress } from './server-geocoding';

/**
 * Integration tests for server-geocoding.ts
 * These tests make real API calls and should be run sparingly
 * Skip these tests in CI/CD by using: npm test -- --exclude integration
 */
describe('server-geocoding - Integration Tests', () => {
    // Skip if no API key is configured
    const hasGoogleApiKey = !!process.env.GOOGLE_MAPS_API_KEY;

    describe('Real Geocoding Tests', () => {
        it('should geocode a well-known address', async () => {
            const result = await geocodeAddress('1600 Pennsylvania Avenue NW, Washington, DC');

            expect(result.coordinates.lat).toBeCloseTo(38.8977, 2);
            expect(result.coordinates.lon).toBeCloseTo(-77.0365, 2);
            expect(result.displayName).toBeTruthy();
            expect(['google', 'openstreetmap']).toContain(result.provider);
        }, 30000); // 30 second timeout for API calls

        it('should geocode a New York address', async () => {
            const result = await geocodeAddress('Times Square, New York, NY');

            expect(result.coordinates.lat).toBeCloseTo(40.758, 1);
            expect(result.coordinates.lon).toBeCloseTo(-73.985, 1);
            expect(result.displayName).toBeTruthy();
        }, 30000);

        it('should handle coordinate input', async () => {
            const result = await geocodeAddress('42.6526, -73.7562'); // Albany, NY

            expect(result.coordinates.lat).toBe(42.6526);
            expect(result.coordinates.lon).toBe(-73.7562);
            expect(result.provider).toBe('coordinates');
            expect(result.displayName).toContain('42.652600');
        });

        it('should throw error for completely invalid address', async () => {
            await expect(
                geocodeAddress('XYZABC123NOTAREALADDRESS456')
            ).rejects.toThrow('Address not found');
        }, 30000);
    });

    describe('Provider Selection', () => {
        it.skipIf(!hasGoogleApiKey)('should use Google Maps when API key is available', async () => {
            const result = await geocodeAddress('Central Park, New York, NY');

            if (hasGoogleApiKey) {
                expect(result.provider).toBe('google');
            }
            expect(result.coordinates.lat).toBeCloseTo(40.785, 1);
            expect(result.coordinates.lon).toBeCloseTo(-73.968, 1);
        }, 30000);

        it('should fall back to OpenStreetMap when Google is not available', async () => {
            // Temporarily remove API key
            const originalKey = process.env.GOOGLE_MAPS_API_KEY;
            delete process.env.GOOGLE_MAPS_API_KEY;

            const result = await geocodeAddress('Boston, MA');

            expect(result.provider).toBe('openstreetmap');
            expect(result.coordinates.lat).toBeCloseTo(42.36, 1);
            expect(result.coordinates.lon).toBeCloseTo(-71.06, 1);

            // Restore API key
            if (originalKey) {
                process.env.GOOGLE_MAPS_API_KEY = originalKey;
            }
        }, 30000);
    });

    describe('Edge Cases', () => {
        it('should handle addresses with special characters', async () => {
            const result = await geocodeAddress('O\'Hare International Airport, Chicago, IL');

            expect(result.coordinates.lat).toBeCloseTo(41.98, 1);
            expect(result.coordinates.lon).toBeCloseTo(-87.90, 1);
        }, 30000);

        it('should handle partial addresses', async () => {
            const result = await geocodeAddress('Albany, NY');

            expect(result.coordinates.lat).toBeCloseTo(42.65, 1);
            expect(result.coordinates.lon).toBeCloseTo(-73.75, 1);
        }, 30000);
    });
});
