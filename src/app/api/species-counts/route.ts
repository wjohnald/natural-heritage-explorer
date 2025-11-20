import { NextRequest, NextResponse } from 'next/server';
import { getConservationStatus } from '../../../lib/conservationStatus';
import { getVernalPoolStatus } from '../../../lib/vernalPoolStatus';

const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';
const MILES_TO_KM = 1.60934;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const radiusMiles = searchParams.get('radius');

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
        // Pagination loop to get all species
        let allResults: any[] = [];
        let page = 1;
        let hasMore = true;
        const perPage = 500;

        while (hasMore) {
            const params = new URLSearchParams({
                lat: lat,
                lng: lon,
                radius: radiusKm.toString(),
                per_page: perPage.toString(),
                page: page.toString(),
            });

            const url = `${INATURALIST_API_BASE}/observations/species_counts?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `iNaturalist API error: ${response.statusText}`);
            }

            const data = await response.json();

            // Add results from this page
            allResults = [...allResults, ...data.results];

            // Check if there are more pages
            const totalResults = data.total_results || 0;
            if (allResults.length >= totalResults || data.results.length === 0) {
                hasMore = false;
            } else {
                page++;
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Enrich all results with conservation and vernal pool data
        for (const item of allResults) {
            if (item.taxon && item.taxon.name) {
                // Get conservation status
                const conservationData = await getConservationStatus(item.taxon.name);
                if (conservationData) {
                    item.stateProtection = conservationData.stateProtection;
                    item.conservationNeed = conservationData.conservationNeed;
                }

                // Get vernal pool status
                const vernalPoolData = await getVernalPoolStatus(item.taxon.name);
                if (vernalPoolData) {
                    item.vernalPoolStatus = vernalPoolData.vernalPoolStatus;
                }
            }
        }

        return NextResponse.json({
            results: allResults,
            total_results: allResults.length
        });
    } catch (error) {
        console.error('iNaturalist species counts API error:', error);
        return NextResponse.json(
            { error: `Failed to fetch species counts: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
