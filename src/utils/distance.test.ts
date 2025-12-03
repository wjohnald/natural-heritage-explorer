import { describe, it, expect } from 'vitest';
import { calculateDistance } from './distance';

describe('calculateDistance', () => {
    it('should return 0 for the same coordinates', () => {
        const lat = 40.7128;
        const lon = -74.0060;
        expect(calculateDistance(lat, lon, lat, lon)).toBe(0);
    });

    it('should calculate distance between two known points correctly', () => {
        // New York City (40.7128, -74.0060) to Los Angeles (34.0522, -118.2437)
        // Approximate distance is ~2445 miles
        const nyc = { lat: 40.7128, lon: -74.0060 };
        const la = { lat: 34.0522, lon: -118.2437 };

        const distance = calculateDistance(nyc.lat, nyc.lon, la.lat, la.lon);

        // Allow for some margin of error due to float precision and earth radius constant variations
        expect(distance).toBeCloseTo(2445.5, 0);
    });

    it('should handle small distances correctly', () => {
        // Two points very close to each other
        // 40.7128, -74.0060
        // 40.7138, -74.0060 (~0.069 miles north)
        const lat1 = 40.7128;
        const lon1 = -74.0060;
        const lat2 = 40.7138;
        const lon2 = -74.0060;

        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeLessThan(1);
    });

    it('should round to 1 decimal place', () => {
        // We can check if the result stringified has at most 1 decimal place
        // or check specific values.
        const lat1 = 40.0;
        const lon1 = -74.0;
        const lat2 = 41.0;
        const lon2 = -75.0;

        const distance = calculateDistance(lat1, lon1, lat2, lon2);
        const decimalPart = distance.toString().split('.')[1];
        if (decimalPart) {
            expect(decimalPart.length).toBeLessThanOrEqual(1);
        }
    });

    it('should handle negative coordinates correctly', () => {
        // Sydney (-33.8688, 151.2093) to Melbourne (-37.8136, 144.9631)
        const sydney = { lat: -33.8688, lon: 151.2093 };
        const melbourne = { lat: -37.8136, lon: 144.9631 };

        const distance = calculateDistance(sydney.lat, sydney.lon, melbourne.lat, melbourne.lon);
        expect(distance).toBeGreaterThan(0);
        // Approx 443 miles
        expect(distance).toBeCloseTo(443, -1); // Check within 10 miles
    });
});
