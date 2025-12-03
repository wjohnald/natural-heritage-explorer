import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodeAddress, GeocodeResult } from './server-geocoding';

// Mock the global fetch function
global.fetch = vi.fn();

// Mock process.env
const mockEnv = vi.hoisted(() => ({
    GOOGLE_MAPS_API_KEY: undefined as string | undefined,
}));

vi.stubEnv('GOOGLE_MAPS_API_KEY', mockEnv.GOOGLE_MAPS_API_KEY);

describe('server-geocoding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockEnv.GOOGLE_MAPS_API_KEY = undefined;
    });

    describe('geocodeAddress - Coordinate Input', () => {
        it('should parse and return valid coordinates', async () => {
            const result = await geocodeAddress('40.7128, -74.0060');

            expect(result.coordinates.lat).toBe(40.7128);
            expect(result.coordinates.lon).toBe(-74.0060);
            expect(result.provider).toBe('coordinates');
            expect(result.displayName).toContain('40.712800');
            expect(result.displayName).toContain('-74.006000');
        });

        it('should handle coordinates without spaces', async () => {
            const result = await geocodeAddress('42.5,-73.5');

            expect(result.coordinates.lat).toBe(42.5);
            expect(result.coordinates.lon).toBe(-73.5);
            expect(result.provider).toBe('coordinates');
        });

        it('should fall back to geocoding for invalid latitude', async () => {
            // Latitude out of range should fall through to geocoding
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ([{
                    lat: '40.0',
                    lon: '-74.0',
                    display_name: 'Test Location'
                }])
            } as Response);

            const result = await geocodeAddress('91.0, -74.0');
            expect(result.provider).toBe('openstreetmap');
            expect(result.coordinates.lat).toBe(40.0);
        });

        it('should fall back to geocoding for invalid longitude', async () => {
            vi.mocked(fetch).mockResolvedValue({
                ok: true,
                json: async () => ([{
                    lat: '40.0',
                    lon: '-74.0',
                    display_name: 'Test Location'
                }])
            } as Response);

            const result = await geocodeAddress('40.0, 181.0');
            expect(result.provider).toBe('openstreetmap');
            expect(result.coordinates.lon).toBe(-74.0);
        });
    });

    describe('geocodeAddress - Google Maps', () => {
        it('should successfully geocode with Google Maps', async () => {
            // Set API key before the test
            process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';

            const mockGoogleResponse = {
                status: 'OK',
                results: [{
                    formatted_address: '123 Main St, New York, NY 10001, USA',
                    geometry: {
                        location: {
                            lat: 40.7128,
                            lng: -74.0060
                        }
                    }
                }]
            };

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockGoogleResponse
            } as Response);

            const result = await geocodeAddress('123 Main St, New York, NY');

            expect(result.coordinates.lat).toBe(40.7128);
            expect(result.coordinates.lon).toBe(-74.0060);
            expect(result.displayName).toBe('123 Main St, New York, NY 10001, USA');
            expect(result.provider).toBe('google');

            // Clean up
            delete process.env.GOOGLE_MAPS_API_KEY;
        });

        it('should handle Google Maps ZERO_RESULTS and fall back to Nominatim', async () => {
            process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';

            // Mock console.error to suppress expected error logs
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const mockGoogleResponse = {
                status: 'ZERO_RESULTS',
                results: []
            };

            const mockNominatimResponse = [{
                lat: '40.7128',
                lon: '-74.0060',
                display_name: '123 Main St, New York, NY, USA'
            }];

            vi.mocked(fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockGoogleResponse
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockNominatimResponse
                } as Response);

            const result = await geocodeAddress('123 Main St, New York, NY');

            expect(result.provider).toBe('openstreetmap');
            expect(result.coordinates.lat).toBe(40.7128);

            consoleErrorSpy.mockRestore();
            delete process.env.GOOGLE_MAPS_API_KEY;
        });

        it('should handle Google Maps API errors and fall back to Nominatim', async () => {
            process.env.GOOGLE_MAPS_API_KEY = 'test-api-key';

            // Mock console.error to suppress expected error logs
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            vi.mocked(fetch)
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Internal Server Error'
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([{
                        lat: '40.7128',
                        lon: '-74.0060',
                        display_name: 'Test Location'
                    }])
                } as Response);

            const result = await geocodeAddress('123 Main St');
            expect(result.provider).toBe('openstreetmap');

            consoleErrorSpy.mockRestore();
            delete process.env.GOOGLE_MAPS_API_KEY;
        });
    });

    describe('geocodeAddress - OpenStreetMap/Nominatim', () => {
        it('should successfully geocode with Nominatim', async () => {
            const mockNominatimResponse = [{
                lat: '40.7128',
                lon: '-74.0060',
                display_name: '123 Main Street, New York, NY, USA',
                address: {
                    road: '123 Main Street',
                    city: 'New York',
                    state: 'New York'
                }
            }];

            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => mockNominatimResponse
            } as Response);

            const result = await geocodeAddress('123 Main St, New York, NY');

            expect(result.coordinates.lat).toBe(40.7128);
            expect(result.coordinates.lon).toBe(-74.0060);
            expect(result.displayName).toBe('123 Main Street, New York, NY, USA');
            expect(result.provider).toBe('openstreetmap');
        });

        it('should throw error when address not found', async () => {
            vi.mocked(fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                } as Response);

            await expect(geocodeAddress('Invalid Address XYZ123')).rejects.toThrow('Address not found');
        });

        it('should handle network errors', async () => {
            // Mock console.error to suppress expected error logs
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

            await expect(geocodeAddress('123 Main St')).rejects.toThrow('Address not found');

            // Verify errors were logged
            expect(consoleErrorSpy).toHaveBeenCalled();

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });
    });

    describe('geocodeAddress - Multiple Strategies', () => {
        it('should try multiple Nominatim strategies', async () => {
            // First strategy fails (structured search)
            vi.mocked(fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => []
                } as Response)
                // Second strategy succeeds (standard search with US focus)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ([{
                        lat: '40.7128',
                        lon: '-74.0060',
                        display_name: 'New York, NY, USA'
                    }])
                } as Response);

            const result = await geocodeAddress('123 Main St, New York, NY');

            expect(result.provider).toBe('openstreetmap');
            expect(result.coordinates.lat).toBe(40.7128);
        });
    });
});
