import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../../app/api/score-parcel/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/services/server-geocoding', () => ({
    geocodeAddress: vi.fn().mockResolvedValue({
        coordinates: { lat: 41.854, lon: -74.123 },
        displayName: '789 Lapla Rd, Accord, NY 12404'
    })
}));

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe('Score Parcel API Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return 400 if address is missing', async () => {
        const req = new NextRequest('http://localhost:3000/api/score-parcel');
        const res = await GET(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Address parameter is required');
    });

    it('should score a parcel correctly', async () => {
        // Mock Parcel Service response
        globalFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                features: [{
                    attributes: {
                        PARCEL_ADDR: '789 Lapla Rd',
                        COUNTY_NAME: 'Ulster',
                        MUNI_NAME: 'Rochester',
                        ACRES: 10.5,
                        PRINT_KEY: '123.45-1-1'
                    },
                    geometry: {
                        x: -74.123,
                        y: 41.854,
                        spatialReference: { wkid: 4326 }
                    }
                }]
            })
        });

        // Mock Criterion Service responses (simplified for all criteria)
        // We need to mock enough responses for all criteria in ParcelScorer
        // Since we can't easily predict the order, we'll just mock them all to return count: 0 (no match)
        // or specific ones to match.
        globalFetch.mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ count: 0 }),
            json: async () => ({ count: 0 })
        });

        const req = new NextRequest('http://localhost:3000/api/score-parcel?address=789 Lapla Rd');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data.parcelInfo.address).toBe('789 Lapla Rd');
        expect(data.totalScore).toBeDefined();
        expect(data.breakdown).toBeDefined();
        expect(data.criteriaSummary).toBeDefined();
        expect(data.criteriaSummary.length).toBeGreaterThan(10); // Should have both implemented and unimplemented
    });
});
