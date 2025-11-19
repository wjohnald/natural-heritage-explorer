import { NextRequest, NextResponse } from 'next/server';

const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';
const MILES_TO_KM = 1.60934;
const PER_PAGE = 200;

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
        const allObservations: any[] = [];
        let page = 1;
        let totalResults = 0;

        // Fetch first page to get total count
        const firstPageData = await fetchPage(parseFloat(lat), parseFloat(lon), radiusKm, page);
        totalResults = firstPageData.total_results;
        allObservations.push(...firstPageData.results);

        // Calculate total pages needed
        const totalPages = Math.ceil(totalResults / PER_PAGE);

        // Fetch remaining pages in parallel
        if (totalPages > 1) {
            const pagePromises: Promise<any>[] = [];
            for (let p = 2; p <= Math.min(totalPages, 10); p++) { // Limit to 10 pages max for performance
                pagePromises.push(fetchPage(parseFloat(lat), parseFloat(lon), radiusKm, p));
            }

            const remainingPages = await Promise.all(pagePromises);
            for (const pageData of remainingPages) {
                allObservations.push(...pageData.results);
            }
        }

        return NextResponse.json({
            total_results: totalResults,
            observations: allObservations,
        });
    } catch (error) {
        console.error('iNaturalist API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch observations. Please try again.' },
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
