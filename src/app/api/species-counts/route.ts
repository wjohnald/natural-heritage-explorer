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
        const params = new URLSearchParams({
            lat: lat,
            lng: lon,
            radius: radiusKm.toString(),
            per_page: '500', // Get a good number of species
        });

        const url = `${INATURALIST_API_BASE}/observations/species_counts?${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `iNaturalist API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Enrich results with conservation and vernal pool data
        for (const item of data.results) {
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

        return NextResponse.json(data);
    } catch (error) {
        console.error('iNaturalist species counts API error:', error);
        return NextResponse.json(
            { error: `Failed to fetch species counts: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
