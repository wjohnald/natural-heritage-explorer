import { geocodeAddress } from './server-geocoding';
import { ParcelGeometry } from './scoring/types';

/**
 * Fetches parcel geometry from NYS Tax Parcels service
 * This is the single source of truth for parcel geometry fetching used by both:
 * - The score-parcel API route
 * - Integration tests
 * 
 * @param address - Street address to geocode and lookup
 * @param lat - Optional latitude (if coordinates provided directly)
 * @param lon - Optional longitude (if coordinates provided directly)
 * @returns Parcel feature with geometry and attributes
 */
export async function getParcelGeometry(address?: string, lat?: number, lon?: number): Promise<any> {
    try {
        let finalLat: number;
        let finalLon: number;

        // If coordinates provided directly, use them (for map clicks)
        if (lat !== undefined && lon !== undefined) {
            finalLat = lat;
            finalLon = lon;
        }
        // Otherwise geocode the address
        else if (address) {
            const geocodeResult = await geocodeAddress(address);

            if (!geocodeResult.coordinates || !geocodeResult.coordinates.lat || !geocodeResult.coordinates.lon) {
                throw new Error('Failed to geocode address');
            }

            finalLat = geocodeResult.coordinates.lat;
            finalLon = geocodeResult.coordinates.lon;
        }
        else {
            throw new Error('Either address or coordinates must be provided');
        }

        // Query NYS Tax Parcels to find parcel containing this point
        // Using ShareGIS NYS Tax Parcels Public service (correct URL)
        // Layer 1 = detailed parcels with attributes
        const parcelServiceUrl = 'https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcels_Public/MapServer/1/query';

        const params = new URLSearchParams({
            f: 'json',
            geometry: JSON.stringify({
                x: finalLon,
                y: finalLat,
                spatialReference: { wkid: 4326 }
            }),
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelWithin',
            returnGeometry: 'true',
            outFields: 'PRINT_KEY,COUNTY_NAME,MUNI_NAME,PARCEL_ADDR,ACRES,PRIMARY_OWNER',
        });

        const response = await fetch(`${parcelServiceUrl}?${params}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch parcel data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0];
        }

        // Fallback: Try buffering the point by 100 meters
        // This helps when the geocoded point is on a road centerline
        console.log('No exact match, trying buffer search...');
        const bufferParams = new URLSearchParams({
            f: 'json',
            geometry: JSON.stringify({
                x: finalLon,
                y: finalLat,
                spatialReference: { wkid: 4326 }
            }),
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            distance: '100',
            units: 'esriSRUnit_Meter',
            returnGeometry: 'true',
            outFields: 'PRINT_KEY,COUNTY_NAME,MUNI_NAME,PARCEL_ADDR,ACRES,PRIMARY_OWNER',
        });

        const bufferResponse = await fetch(`${parcelServiceUrl}?${bufferParams}`);

        if (!bufferResponse.ok) {
            throw new Error(`Failed to fetch parcel data (buffer): ${bufferResponse.status} ${bufferResponse.statusText}`);
        }

        const bufferData = await bufferResponse.json();

        if (bufferData.features && bufferData.features.length > 0) {
            console.log(`Found ${bufferData.features.length} parcels in buffer, using first one`);
            return bufferData.features[0];
        }

        throw new Error('No parcel found at this address (even with buffer)');
    } catch (error) {
        console.error('Error getting parcel geometry:', error);
        throw error;
    }
}
