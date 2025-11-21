/**
 * Converts Web Mercator (EPSG:3857) coordinates to WGS84 lat/lon (EPSG:4326)
 * 
 * @param x - Web Mercator X coordinate (easting)
 * @param y - Web Mercator Y coordinate (northing)
 * @returns [latitude, longitude] in WGS84
 */
export function webMercatorToLatLon(x: number, y: number): [number, number] {
    const lon = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lat, lon];
}

/**
 * Converts ArcGIS polygon rings from Web Mercator to WGS84 coordinates
 * 
 * @param rings - Array of rings, where each ring is an array of [x, y] Web Mercator coordinates
 * @returns Array of rings with [lat, lon] WGS84 coordinates
 */
export function convertArcGISRingsToLatLon(rings: number[][][]): [number, number][][] {
    return rings.map(ring =>
        ring.map(([x, y]) => webMercatorToLatLon(x, y))
    );
}
