import { NextResponse } from 'next/server';
import { ParcelScorer } from '@/services/scoring/parcel-scorer';

export async function GET() {
    try {
        // 1. Define the geometry for 789 Lapla Road (from previous debug)
        const geometry = {
            "rings": [
                [
                    [-8251392.4278, 5139556.8398],
                    [-8251230.1234, 5139556.8398],
                    [-8251230.1234, 5139400.1234],
                    [-8251392.4278, 5139400.1234],
                    [-8251392.4278, 5139556.8398]
                ]
            ],
            "spatialReference": {
                "wkid": 3857
            }
        };

        console.log('Testing ParcelScorer with 789 Lapla Road geometry (Web Mercator)...');

        const scorer = new ParcelScorer();
        const scoreResult = await scorer.scoreParcel(geometry);

        return NextResponse.json({
            message: 'ParcelScorer Test',
            geometry,
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
