import { describe, it, expect } from 'vitest';
import { webMercatorToLatLon, convertArcGISRingsToLatLon } from '../coordinate-conversion';

describe('webMercatorToLatLon', () => {
    it('converts Web Mercator coordinates to WGS84 lat/lon', () => {
        // Test with coordinates near Accord, NY (from actual API response)
        const [lat, lon] = webMercatorToLatLon(-8257320.2435, 5149103.476999998);

        expect(lat).toBeCloseTo(41.925, 3); // Within 0.001 degrees (~100m)
        expect(lon).toBeCloseTo(-74.152, 3);
    });

    it('converts origin point correctly', () => {
        const [lat, lon] = webMercatorToLatLon(0, 0);

        expect(lat).toBeCloseTo(0, 10);
        expect(lon).toBeCloseTo(0, 10);
    });

    it('converts positive coordinates correctly', () => {
        // Test with coordinates in eastern hemisphere, northern latitude
        const [lat, lon] = webMercatorToLatLon(1000000, 5000000);

        expect(lat).toBeGreaterThan(0);
        expect(lon).toBeGreaterThan(0);
        expect(lat).toBeLessThan(90);
        expect(lon).toBeLessThan(180);
    });

    it('converts negative longitude correctly', () => {
        // Test with western hemisphere coordinates
        const [lat, lon] = webMercatorToLatLon(-8000000, 5000000);

        expect(lon).toBeLessThan(0);
        expect(lon).toBeGreaterThan(-180);
    });

    it('handles maximum valid Web Mercator extents', () => {
        // Web Mercator max extent is approximately ±20037508
        const [lat1, lon1] = webMercatorToLatLon(20037508, 20037508);
        const [lat2, lon2] = webMercatorToLatLon(-20037508, -20037508);

        // Latitude should be within valid range (-90 to 90)
        expect(lat1).toBeGreaterThan(-90);
        expect(lat1).toBeLessThan(90);
        expect(lat2).toBeGreaterThan(-90);
        expect(lat2).toBeLessThan(90);

        // Longitude should be within valid range (-180 to 180)
        expect(lon1).toBeCloseTo(180, 1);
        expect(lon2).toBeCloseTo(-180, 1);
    });
});

describe('convertArcGISRingsToLatLon', () => {
    it('converts a single ring polygon', () => {
        const rings = [
            [
                [-8257320.2435, 5149103.476999998],
                [-8257324.6881, 5149106.718599997],
                [-8257320.2435, 5149103.476999998] // Closing point
            ]
        ];

        const converted = convertArcGISRingsToLatLon(rings);

        expect(converted).toHaveLength(1);
        expect(converted[0]).toHaveLength(3);

        // All points should have valid lat/lon
        converted[0].forEach(([lat, lon]) => {
            expect(lat).toBeGreaterThan(-90);
            expect(lat).toBeLessThan(90);
            expect(lon).toBeGreaterThan(-180);
            expect(lon).toBeLessThan(180);
        });

        // First and last points should be the same (closed ring)
        expect(converted[0][0][0]).toBeCloseTo(converted[0][2][0], 10);
        expect(converted[0][0][1]).toBeCloseTo(converted[0][2][1], 10);
    });

    it('converts multiple ring polygons (with holes)', () => {
        const rings = [
            // Outer ring
            [
                [-8257320, 5149103],
                [-8257324, 5149106],
                [-8257328, 5149103],
                [-8257320, 5149103]
            ],
            // Inner ring (hole)
            [
                [-8257322, 5149104],
                [-8257326, 5149104],
                [-8257324, 5149105],
                [-8257322, 5149104]
            ]
        ];

        const converted = convertArcGISRingsToLatLon(rings);

        expect(converted).toHaveLength(2);
        expect(converted[0]).toHaveLength(4);
        expect(converted[1]).toHaveLength(4);

        // Both rings should have valid coordinates
        converted.forEach(ring => {
            ring.forEach(([lat, lon]) => {
                expect(lat).toBeGreaterThan(-90);
                expect(lat).toBeLessThan(90);
                expect(lon).toBeGreaterThan(-180);
                expect(lon).toBeLessThan(180);
            });
        });
    });

    it('handles empty rings array', () => {
        const converted = convertArcGISRingsToLatLon([]);
        expect(converted).toEqual([]);
    });

    it('preserves ring structure', () => {
        const rings = [
            [[0, 0], [1000000, 1000000], [2000000, 0], [0, 0]]
        ];

        const converted = convertArcGISRingsToLatLon(rings);

        expect(converted).toHaveLength(1);
        expect(converted[0]).toHaveLength(4);

        // Structure should be preserved: array of arrays of [lat, lon] tuples
        expect(Array.isArray(converted[0][0])).toBe(true);
        expect(converted[0][0]).toHaveLength(2);
    });
});
