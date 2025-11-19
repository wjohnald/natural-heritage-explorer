import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json(
            { error: 'Address parameter is required' },
            { status: 400 }
        );
    }

    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'iNaturalist Address Search App',
            },
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'Address not found. Please try a different address or be more specific.' },
                { status: 404 }
            );
        }

        const result = data[0];

        return NextResponse.json({
            coordinates: {
                lat: parseFloat(result.lat),
                lon: parseFloat(result.lon),
            },
            displayName: result.display_name,
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json(
            { error: 'Failed to geocode address. Please try again.' },
            { status: 500 }
        );
    }
}
