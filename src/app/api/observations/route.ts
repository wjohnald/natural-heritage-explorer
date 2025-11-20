import { NextRequest, NextResponse } from 'next/server';
import { getConservationStatus } from '../../../lib/conservationStatus';
import { getVernalPoolStatus } from '../../../lib/vernalPoolStatus';

const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';
const MILES_TO_KM = 1.60934;
const PER_PAGE = 200;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radiusMiles = searchParams.get('radius');
    const pageParam = searchParams.get('page');
    const taxonIdParam = searchParams.get('taxonId');
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
    const taxonId = taxonIdParam ? parseInt(taxonIdParam) : undefined;

    try {
        // Fetch specific page
        const pageData = await fetchPage(parseFloat(lat), parseFloat(lon), radiusKm, page, taxonId);
        const observations: any[] = pageData.results;
        const totalResults = pageData.total_results;

        // Enrich observations with conservation and vernal pool data
        for (const obs of observations) {
            if (obs.taxon && obs.taxon.name) {
                // Get conservation status
                const conservationData = await getConservationStatus(obs.taxon.name);
                if (conservationData) {
                    obs.stateProtection = conservationData.stateProtection;
                    obs.conservationNeed = conservationData.conservationNeed;
                }
                
                // Get vernal pool status
                const vernalPoolData = await getVernalPoolStatus(obs.taxon.name);
                if (vernalPoolData) {
                    obs.vernalPoolStatus = vernalPoolData.vernalPoolStatus;
                }
            }
        }

        return NextResponse.json({
            total_results: totalResults,
            observations: observations,
            page: page,
            per_page: PER_PAGE
        });
    } catch (error) {
        console.error('iNaturalist API error:', error);
        return NextResponse.json(
            { error: `Failed to fetch observations: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}

async function fetchPage(lat: number, lon: number, radiusKm: number, page: number, taxonId?: number, retryCount = 0): Promise<any> {
    const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lon.toString(),
        radius: radiusKm.toString(),
        per_page: PER_PAGE.toString(),
        page: page.toString(),
        order: 'desc',
        order_by: 'observed_on',
        mappable: 'true', // Only return observations with coordinates
    });

    // Add taxon filter if provided
    if (taxonId) {
        params.append('taxon_id', taxonId.toString());
    }

    const url = `${INATURALIST_API_BASE}/observations?${params.toString()}`;
    const MAX_RETRIES = 5;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // Try to parse error response body
            let errorData: any = null;
            try {
                errorData = await response.json();
            } catch {
                // If JSON parsing fails, fall back to status text
            }

            // Check for throttling in multiple places
            const isThrottled = 
                response.status === 429 ||
                response.statusText.includes('normal_throttling') ||
                (errorData && errorData.error === 'normal_throttling') ||
                (errorData && typeof errorData.error === 'string' && errorData.error.includes('normal_throttling'));

            if (isThrottled && retryCount < MAX_RETRIES) {
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s + random jitter
                const baseDelay = Math.pow(2, retryCount) * 1000;
                const jitter = Math.random() * 500;
                const delay = baseDelay + jitter;
                
                console.log(`[iNaturalist] Rate limited (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchPage(lat, lon, radiusKm, page, retryCount + 1);
            }

            // If not throttling or max retries reached
            const errorMessage = errorData?.error || response.statusText;
            throw new Error(`iNaturalist API error: ${errorMessage}`);
        }

        return await response.json();
    } catch (error: any) {
        // Check if error message contains throttling information
        if (error.message && error.message.includes('normal_throttling') && retryCount < MAX_RETRIES) {
            const baseDelay = Math.pow(2, retryCount) * 1000;
            const jitter = Math.random() * 500;
            const delay = baseDelay + jitter;
            
            console.log(`[iNaturalist] Rate limited in catch (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchPage(lat, lon, radiusKm, page, retryCount + 1);
        }
        throw error;
    }
}
