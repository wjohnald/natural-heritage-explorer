import { NextRequest, NextResponse } from 'next/server';
import { getConservationStatus } from '../../../lib/conservationStatus';
import { getVernalPoolStatus } from '../../../lib/vernalPoolStatus';

const GBIF_API_BASE = 'https://api.gbif.org/v1';
const MILES_TO_KM = 1.60934;
const KM_TO_DEGREES = 0.009; // Approximate conversion for latitude

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
    const radiusDegrees = radiusKm * KM_TO_DEGREES;

    // Calculate bounding box
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const minLat = latNum - radiusDegrees;
    const maxLat = latNum + radiusDegrees;
    const minLon = lonNum - radiusDegrees;
    const maxLon = lonNum + radiusDegrees;

    // Create WKT polygon for the bounding box
    const geometry = `POLYGON((${minLon} ${minLat},${maxLon} ${minLat},${maxLon} ${maxLat},${minLon} ${maxLat},${minLon} ${minLat}))`;

    try {
        const params = new URLSearchParams({
            geometry: geometry,
            limit: '0', // We only want facets
            facet: 'speciesKey',
            facetLimit: '1000', // Request up to 1000 species (default is only 10)
            hasCoordinate: 'true',
            hasGeospatialIssue: 'false',
        });

        const url = `${GBIF_API_BASE}/occurrence/search?${params.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `GBIF API error: ${response.statusText}`);
        }

        const data = await response.json();
        const speciesFacets = data.facets?.find((f: any) => f.field === 'SPECIES_KEY')?.counts || [];

        // Resolve species names and enrich with conservation status
        // Process all species (no limit)
        const topSpecies = speciesFacets;

        const results = await Promise.all(topSpecies.map(async (item: any) => {
            const speciesKey = item.name;
            const count = item.count;

            try {
                // Fetch species details
                const speciesResponse = await fetch(`${GBIF_API_BASE}/species/${speciesKey}`);
                if (!speciesResponse.ok) return null;
                const speciesData = await speciesResponse.json();

                const scientificName = speciesData.scientificName;

                // Fetch vernacular names (common names) from dedicated endpoint
                let vernacularName = speciesData.canonicalName || scientificName;
                try {
                    const vernacularResponse = await fetch(`${GBIF_API_BASE}/species/${speciesKey}/vernacularNames`);
                    if (vernacularResponse.ok) {
                        const vernacularData = await vernacularResponse.json();

                        // Filter for English names and prefer "preferred" names
                        const englishNames = vernacularData.results?.filter(
                            (v: any) => v.language === 'en' || v.language === 'eng'
                        ) || [];

                        if (englishNames.length > 0) {
                            // Look for preferred name first
                            const preferredName = englishNames.find((v: any) => v.isPreferred);
                            if (preferredName) {
                                vernacularName = preferredName.vernacularName;
                            } else {
                                // Otherwise use the first English name
                                vernacularName = englishNames[0].vernacularName;
                            }
                        }
                    }
                } catch (vernacularErr) {
                    console.log(`Could not fetch vernacular names for ${speciesKey}, using canonical name`);
                }

                // Clean scientific name (remove author names)
                const cleanName = scientificName.split(/[,(]/)[0].trim();

                // Enrich with conservation status
                let stateProtection, conservationNeed, vernalPoolStatus;

                // Try exact match first for conservation data
                let conservationData = await getConservationStatus(scientificName);

                // If no match, try without author names
                if (!conservationData) {
                    conservationData = await getConservationStatus(cleanName);
                }

                if (conservationData) {
                    stateProtection = conservationData.stateProtection;
                    conservationNeed = conservationData.conservationNeed;
                }

                // Get vernal pool status (use clean name)
                const vernalPoolData = await getVernalPoolStatus(cleanName);
                if (vernalPoolData) {
                    vernalPoolStatus = vernalPoolData.vernalPoolStatus;
                }

                return {
                    count,
                    taxon: {
                        name: scientificName,
                        preferred_common_name: vernacularName,
                        // GBIF doesn't provide a simple default photo URL in the species API, 
                        // would need another call or use a placeholder. For now, we'll skip the photo.
                    },
                    stateProtection,
                    conservationNeed,
                    vernalPoolStatus
                };
            } catch (err) {
                console.error(`Failed to fetch details for species ${speciesKey}:`, err);
                return null;
            }
        }));

        // Filter out failed requests
        const validResults = results.filter((r: any) => r !== null);

        return NextResponse.json({ results: validResults });
    } catch (error) {
        console.error('GBIF species counts API error:', error);
        return NextResponse.json(
            { error: `Failed to fetch species counts: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}
