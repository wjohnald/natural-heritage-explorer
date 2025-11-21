import { ParcelGeometry } from './types';

/**
 * Buffers a geometry using the ArcGIS Geometry Service
 */
export async function bufferGeometry(
    geometry: ParcelGeometry,
    bufferDistanceFeet: number
): Promise<ParcelGeometry | null> {
    try {
        console.log(`Buffering geometry by ${bufferDistanceFeet} feet using ArcGIS Geometry Service`);

        const geomServiceUrl = 'https://utility.arcgisonline.com/arcgis/rest/services/Geometry/GeometryServer/buffer';

        // Convert buffer from feet to meters (1 foot = 0.3048 meters)
        const bufferInMeters = bufferDistanceFeet * 0.3048;

        // Ensure we have a spatial reference
        const sr = geometry.spatialReference || { wkid: 3857 };

        const bufferParams = new URLSearchParams({
            f: 'json',
            geometries: JSON.stringify({
                geometryType: 'esriGeometryPolygon',
                geometries: [geometry]
            }),
            inSR: sr.wkid.toString(),
            outSR: sr.wkid.toString(),
            bufferSR: '102100', // Web Mercator for accurate buffering
            distances: bufferInMeters.toString(),
            unit: '9001', // meters
            unionResults: 'false',
        });

        const bufferResponse = await fetch(geomServiceUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bufferParams.toString(),
        });

        if (!bufferResponse.ok) {
            console.error(`HTTP error buffering geometry: ${bufferResponse.status} ${bufferResponse.statusText}`);
            return null;
        }

        const bufferData = await bufferResponse.json();

        if (bufferData.geometries && bufferData.geometries.length > 0) {
            console.log(`Successfully buffered geometry`);
            return bufferData.geometries[0];
        } else {
            console.error(`Failed to buffer geometry:`, bufferData);
            return null;
        }
    } catch (error: any) {
        console.error(`Error buffering geometry:`, error.message);
        return null;
    }
}

/**
 * Queries an ArcGIS Feature Service or Map Service
 */
export async function queryFeatureService(
    serviceUrl: string,
    geometry: ParcelGeometry,
    options: {
        layerId?: number;
        whereClause?: string;
        buffer?: number;
    } = {}
): Promise<boolean> {
    try {
        const { layerId, whereClause, buffer } = options;

        // Construct query URL - if serviceUrl already ends with a layer number, just append /query
        // Otherwise, use layerId if provided
        let url: string;
        if (serviceUrl.match(/\/\d+$/)) {
            // URL already ends with layer number (e.g., /FeatureServer/0 or /MapServer/0)
            url = `${serviceUrl}/query`;
        } else if (layerId !== undefined) {
            // layerId provided separately
            url = `${serviceUrl}/${layerId}/query`;
        } else {
            // No layer number in URL or as parameter
            url = `${serviceUrl}/query`;
        }

        // Extract geometry and spatial reference from parcel feature
        const sr = geometry.spatialReference || { wkid: 3857 };

        console.log(`Querying: ${url}`);

        // If buffer is specified, use ArcGIS Geometry Service to buffer the geometry first
        let queryGeometry = geometry;
        if (buffer !== undefined && buffer > 0) {
            const bufferedGeom = await bufferGeometry(geometry, buffer);
            if (bufferedGeom) {
                queryGeometry = bufferedGeom;
            } else {
                // Fallback to original geometry if buffering fails, but log it
                console.warn('Buffering failed, using original geometry');
            }
        }

        const params = new URLSearchParams({
            f: 'json',
            geometry: JSON.stringify(queryGeometry),
            geometryType: 'esriGeometryPolygon',
            inSR: sr.wkid?.toString() || '3857',
            spatialRel: 'esriSpatialRelIntersects',
            returnGeometry: 'false',
            returnCountOnly: 'true',
        });

        // Add optional where clause
        if (whereClause) {
            params.append('where', whereClause);
        }

        // Debug logging for FEMA specifically
        if (url.includes('fema.gov')) {
            console.log('[FEMA QUERY DEBUG] URL:', url);
            console.log('[FEMA QUERY DEBUG] Spatial Reference:', sr.wkid);
            console.log('[FEMA QUERY DEBUG] Geometry rings count:', queryGeometry.rings?.length);
            console.log('[FEMA QUERY DEBUG] First ring points:', queryGeometry.rings?.[0]?.length);
        }

        // Use POST to handle large geometries
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            console.error(`HTTP error querying ${serviceUrl}: ${response.status} ${response.statusText}`);
            return false;
        }

        const text = await response.text();
        try {
            const data = JSON.parse(text);

            if (data.error) {
                console.error(`Query error for ${serviceUrl}:`, data.error);
                return false;
            }

            // Debug logging for FEMA specifically
            if (url.includes('fema.gov')) {
                console.log('[FEMA QUERY DEBUG] Response count:', data.count);
                if (data.count === 0) {
                    console.log('[FEMA QUERY DEBUG] No features found - property may not be in flood zone');
                }
            }

            if (buffer !== undefined) {
                console.log(`Buffered query result for ${serviceUrl}: count=${data.count}`);
            }

            return data.count > 0;
        } catch (e) {
            console.error(`Invalid JSON from ${serviceUrl}:`, text.substring(0, 100));
            return false;
        }
    } catch (error) {
        console.error(`Error querying feature service ${serviceUrl}:`, error);
        return false;
    }
}
