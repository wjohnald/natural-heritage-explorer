import { NextRequest, NextResponse } from 'next/server';
import { getConservationStatus } from '../../../lib/conservationStatus';

const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';
const MILES_TO_KM = 1.60934;
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

    try {
        // Fetch specific page
        const pageData = await fetchPage(parseFloat(lat), parseFloat(lon), radiusKm, page);
        const observations: any[] = pageData.results;
        const totalResults = pageData.total_results;

        // Enrich observations with State Protection status
        for (const obs of observations) {
            if (obs.taxon && obs.taxon.name) {
                const stateProtection = await getConservationStatus(obs.taxon.name);
                if (stateProtection) {
                    obs.stateProtection = stateProtection;
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

async function fetchPage(lat: number, lon: number, radiusKm: number, page: number): Promise<any> {
    const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lon.toString(),
        radius: radiusKm.toString(),
        per_page: PER_PAGE.toString(),
        page: page.toString(),
        order: 'desc',
        order_by: 'observed_on',
    });

    const url = `${INATURALIST_API_BASE}/observations?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`iNaturalist API error: ${response.statusText}`);
    }

    return await response.json();
}
