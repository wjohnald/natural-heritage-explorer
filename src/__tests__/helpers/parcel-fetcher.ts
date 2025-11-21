import { ParcelGeometry } from '@/services/scoring/types';
import { geocodeAddress } from '@/services/server-geocoding';

/**
 * Fetches real parcel geometry from NYS Tax Parcels service for a given address
 * This mirrors the logic in the score-parcel API route
 */
export async function fetchParcelGeometry(address: string): Promise<ParcelGeometry> {
    // Geocode the address
    const geocodeResult = await geocodeAddress(address);
    
    if (!geocodeResult.coordinates || !geocodeResult.coordinates.lat || !geocodeResult.coordinates.lon) {
        throw new Error(`Failed to geocode address: ${address}`);
    }
    
    const { lat, lon } = geocodeResult.coordinates;
    
    // Query NYS Tax Parcels to find parcel containing this point
    const parcelServiceUrl = 'https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcels_Public/MapServer/1/query';
    
    const params = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify({
            x: lon,
            y: lat,
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
        return data.features[0].geometry;
    }
    
    // Fallback: Try buffering the point by 100 meters if no exact match
    const bufferParams = new URLSearchParams({
        f: 'json',
        geometry: JSON.stringify({
            x: lon,
            y: lat,
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
        return bufferData.features[0].geometry;
    }
    
    throw new Error(`No parcel found at address: ${address}`);
}

