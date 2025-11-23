import { NextResponse } from 'next/server';
import { ParcelScorer } from '@/services/scoring/parcel-scorer';

export async function GET() {
    try {
        // 1. Define a known Parcel ID (from CSV)
        const parcelId = '78.1-1-22.111'; // 1000 Mohonk - Mtn Rest Rd

        console.log(`Testing ParcelScorer with Parcel ID: ${parcelId}...`);

        const scorer = new ParcelScorer();
        const scoreResult = await scorer.scoreParcel(parcelId);

        return NextResponse.json({
            message: 'ParcelScorer Test',
            parcelId,
            scoreResult
        });

    } catch (error) {
        console.error('Debug service error:', error);
        return NextResponse.json(
            { error: 'Debug service failed', details: (error as Error).message },
            { status: 500 }
        );
    }
}
