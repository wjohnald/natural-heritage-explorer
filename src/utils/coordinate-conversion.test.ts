import { describe, it, expect } from 'vitest';
import { webMercatorToLatLon, convertArcGISRingsToLatLon } from './coordinate-conversion';

describe('coordinate-conversion', () => {
    describe('webMercatorToLatLon', () => {
        it('should convert (0, 0) correctly', () => {
            const [lat, lon] = webMercatorToLatLon(0, 0);
            expect(lat).toBeCloseTo(0);
            expect(lon).toBeCloseTo(0);
        });

        it('should convert New York City coordinates correctly', () => {
            // NYC Web Mercator: ~ -8238310.24, 4970071.58
            // NYC Lat/Lon: ~ 40.7128, -74.0060
            const x = -8238310.24;
            const y = 4970071.58;
            const [lat, lon] = webMercatorToLatLon(x, y);

            expect(lat).toBeCloseTo(40.7128, 3);
            expect(lon).toBeCloseTo(-74.0060, 3);
        });

        it('should handle boundaries', () => {
            // Max extent
            const max = 20037508.34;
            const [lat, lon] = webMercatorToLatLon(max, max);

            expect(lon).toBeCloseTo(180, 1);
            expect(lat).toBeCloseTo(85.051129, 1);
        });
    });

    describe('convertArcGISRingsToLatLon', () => {
        it('should convert an array of rings correctly', () => {
            const rings = [
                [
                    [0, 0],
                    [-8238310.24, 4970071.58]
                ]
            ];

            const result = convertArcGISRingsToLatLon(rings);

            expect(result).toHaveLength(1);
            expect(result[0]).toHaveLength(2);

            // Check first point (0,0)
            expect(result[0][0][0]).toBeCloseTo(0);
            expect(result[0][0][1]).toBeCloseTo(0);

            // Check second point (NYC)
            expect(result[0][1][0]).toBeCloseTo(40.7128, 3);
            expect(result[0][1][1]).toBeCloseTo(-74.0060, 3);
        });

        it('should handle empty rings', () => {
            const result = convertArcGISRingsToLatLon([]);
            expect(result).toEqual([]);
        });
    });
});
