import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/services/server-geocoding';

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
        const result = await geocodeAddress(address);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Geocoding error:', error);

        // Check if it's a "not found" error
        if (error instanceof Error && error.message === 'Address not found') {
            return NextResponse.json(
                {
                    error: 'Address not found. Try:\n• Adding city, state (e.g., "123 Main St, Albany, NY")\n• Using coordinates (e.g., "44.2176, -73.4301")\n• Using a nearby town or landmark',
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to geocode address. Please try again.' },
            { status: 500 }
        );
    }
}
