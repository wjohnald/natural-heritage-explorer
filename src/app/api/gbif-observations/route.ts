import { NextRequest, NextResponse } from 'next/server';
import { getConservationStatus } from '../../../lib/conservationStatus';
import { GBIFObservation, GBIFResponse } from '../../../types';

const GBIF_API_BASE = 'https://api.gbif.org/v1';
const MILES_TO_KM = 1.60934;
const KM_TO_DEGREES = 0.009; // Approximate conversion for latitude
const PER_PAGE = 200;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radiusMiles = searchParams.get('radius');
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam) : 1;

    if (!lat || !lon) {
        return NextResponse.json(
            { error: 'Latitude and longitude parameters are required' },
            { status: 400 }
        );
    }

    // Use provided radius or default to 3 miles
    const radius = radiusMiles ? parseFloat(radiusMiles) : 3;
    const radiusKm = radius * MILES_TO_KM;
    const radiusDegrees = radiusKm * KM_TO_DEGREES;

    // Calculate offset for GBIF pagination (0-indexed)
    const offset = (page - 1) * PER_PAGE;

    try {
        // Fetch from GBIF
        const gbifData = await fetchGBIFPage(
            parseFloat(lat),
            parseFloat(lon),
            radiusDegrees,
            offset
        );

        const observations: GBIFObservation[] = gbifData.results;
        const totalResults = gbifData.count;

        // Enrich observations with conservation data
        for (const obs of observations) {
            if (obs.scientificName) {
                // Try exact match first
                let conservationData = await getConservationStatus(obs.scientificName);
                
                // If no match, try without author names (everything before first comma or parenthesis)
                if (!conservationData) {
                    const nameWithoutAuthor = obs.scientificName
                        .split(/[,(]/)[0]  // Split on comma or opening parenthesis
                        .trim();
                    conservationData = await getConservationStatus(nameWithoutAuthor);
                }
                
                if (conservationData) {
                    obs.stateProtection = conservationData.stateProtection;
                    obs.conservationNeed = conservationData.conservationNeed;
                }
            }

            // Add geojson for compatibility with existing map code
            if (obs.decimalLatitude && obs.decimalLongitude) {
                obs.geojson = {
                    coordinates: [obs.decimalLongitude, obs.decimalLatitude],
                    type: 'Point'
                };
            }
        }

        return NextResponse.json({
            total_results: totalResults,
            observations: observations,
            page: page,
            per_page: PER_PAGE
        });
    } catch (error) {
        console.error('GBIF API error:', error);
        return NextResponse.json(
            { error: `Failed to fetch observations: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

async function fetchGBIFPage(
    lat: number,
    lon: number,
    radiusDegrees: number,
    offset: number,
    retryCount = 0
): Promise<GBIFResponse> {
    // Calculate bounding box
    const minLat = lat - radiusDegrees;
    const maxLat = lat + radiusDegrees;
    const minLon = lon - radiusDegrees;
    const maxLon = lon + radiusDegrees;

    // Create WKT polygon for the bounding box
    const geometry = `POLYGON((${minLon} ${minLat},${maxLon} ${minLat},${maxLon} ${maxLat},${minLon} ${maxLat},${minLon} ${minLat}))`;

    const params = new URLSearchParams({
        geometry: geometry,
        limit: PER_PAGE.toString(),
        offset: offset.toString(),
        hasCoordinate: 'true',
        hasGeospatialIssue: 'false',
    });

    const url = `${GBIF_API_BASE}/occurrence/search?${params.toString()}`;
    const MAX_RETRIES = 5;
    const FETCH_TIMEOUT = 30000; // 30 second timeout

    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Try to parse error response body
            let errorData: { error?: string } | null = null;
            try {
                errorData = await response.json();
            } catch {
                // If JSON parsing fails, fall back to status text
            }

            // Check for throttling
            const isThrottled =
                response.status === 429 ||
                response.statusText.includes('throttl') ||
                (errorData && typeof errorData.error === 'string' && errorData.error.includes('throttl'));

            if (isThrottled && retryCount < MAX_RETRIES) {
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s + random jitter
                const baseDelay = Math.pow(2, retryCount) * 1000;
                const jitter = Math.random() * 500;
                const delay = baseDelay + jitter;

                console.log(`[GBIF] Rate limited (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchGBIFPage(lat, lon, radiusDegrees, offset, retryCount + 1);
            }

            // If not throttling or max retries reached
            const errorMessage = errorData?.error || response.statusText;
            throw new Error(`GBIF API error: ${errorMessage}`);
        }

        return await response.json();
    } catch (error: unknown) {
        // Handle network-level failures (fetch failed, timeout, DNS issues, etc.)
        const err = error as Error & { cause?: { code?: string } };
        const isNetworkError = 
            err.name === 'AbortError' ||
            err.message?.includes('fetch failed') ||
            err.message?.includes('Backend fetch failed') ||
            err.message?.includes('network') ||
            err.cause?.code === 'ECONNREFUSED' ||
            err.cause?.code === 'ENOTFOUND' ||
            err.cause?.code === 'ETIMEDOUT';

        // Check if error message contains throttling information
        const isThrottlingError = err.message && err.message.includes('throttl');

        if ((isNetworkError || isThrottlingError) && retryCount < MAX_RETRIES) {
            const baseDelay = Math.pow(2, retryCount) * 1000;
            const jitter = Math.random() * 500;
            const delay = baseDelay + jitter;

            const errorType = err.name === 'AbortError' ? 'Timeout' : isThrottlingError ? 'Rate limited' : 'Network error';
            console.log(`[GBIF] ${errorType} (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${Math.round(delay)}ms...`);
            console.log(`[GBIF] Error details:`, err.message);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchGBIFPage(lat, lon, radiusDegrees, offset, retryCount + 1);
        }

        // If max retries reached, provide a helpful error message
        if (retryCount >= MAX_RETRIES) {
            throw new Error(`GBIF API failed after ${MAX_RETRIES} retries. Last error: ${err.message}`);
        }

        throw error;
    }
}

