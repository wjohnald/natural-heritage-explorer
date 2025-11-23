import { NextResponse } from 'next/server';
import { ParcelScorer } from '@/services/scoring/parcel-scorer';
import { getParcelGeometry } from '@/services/parcel-geometry';

/**
 * Parcel Scoring API
 * 
 * This API scores parcels using the Marbletown CPP composite scoring methodology.
 * Scores are calculated by aggregating raw scores by category, mapping to priority
 * levels (High/Medium/Low), and summing priority values into a composite score.
 */

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');
        const latParam = searchParams.get('lat');
        const lonParam = searchParams.get('lon');

        const lat = latParam ? parseFloat(latParam) : undefined;
        const lon = lonParam ? parseFloat(lonParam) : undefined;

        if (!address && (!lat || !lon)) {
            return NextResponse.json(
                { error: 'Either address or lat/lon coordinates are required' },
                { status: 400 }
            );
        }

        // Get parcel geometry
        const parcel = await getParcelGeometry(address || undefined, lat, lon);

        if (!parcel || !parcel.geometry) {
            return NextResponse.json(
                { error: 'Could not find parcel geometry' },
                { status: 404 }
            );
        }

        // Calculate Scores using ParcelScorer service
        console.log('Starting composite parcel scoring...');
        const scorer = new ParcelScorer();

        // Extract Parcel ID (PRINT_KEY)
        const parcelId = parcel.attributes?.PRINT_KEY;

        if (!parcelId) {
            console.warn('No Parcel ID found for address');
        }

        const scoreResult = await scorer.scoreParcel(parcelId || '');

        // Build response with composite scoring data
        return NextResponse.json({
            parcelInfo: {
                address: parcel.attributes?.PARCEL_ADDR,
                county: parcel.attributes?.COUNTY_NAME,
                municipality: parcel.attributes?.MUNI_NAME,
                acres: parcel.attributes?.ACRES,
                printKey: parcel.attributes?.PRINT_KEY,
                owner: parcel.attributes?.PRIMARY_OWNER,
            },
            parcelGeometry: parcel.geometry,
            compositeScore: scoreResult.compositeScore,
            categories: scoreResult.categories,
            breakdown: scoreResult.breakdown,
        });

    } catch (error) {
        console.error('Error scoring parcel:', error);
        return NextResponse.json(
            { error: 'Failed to score parcel', details: (error as Error).message },
            { status: 500 }
        );
    }
}
