import { NextResponse } from 'next/server';
import { ParcelScorer } from '@/services/scoring/parcel-scorer';
import { getParcelGeometry } from '@/services/parcel-geometry';

/**
 * Parcel Scoring API
 * 
 * This API scores parcels based on conservation value using multiple criteria categories.
 * It uses the ParcelScorer service for implemented criteria and appends unimplemented criteria
 * for frontend display.
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
        console.log('Starting modular parcel scoring...');
        const scorer = new ParcelScorer();
        const scoreResult = await scorer.scoreParcel(parcel.geometry);

        // Add unimplemented criteria (require static data files not available via public REST API)
        // See parcel_scoring_methodology.csv for data source details
        const unimplementedCriteria = [
            { category: 'Drinking Water', name: 'Bedrock Aquifers (Vly School Rondout)', score: 1, dataSource: 'NYS GIS Clearinghouse' },
            { category: 'Drinking Water', name: 'Ashokan Watershed', score: 1, dataSource: 'NYS Open Data Portal' },
            { category: 'Drinking Water', name: 'DEC Class A Streams outside of Ashokan Watershed', score: 1, dataSource: 'DEC Streams Layer' },
            { category: 'Wildlife Habitat', name: 'TNC Resilient Sites', score: 1, dataSource: 'TNC Data Basin (tnc_resilient_sites.shp)', notes: 'Only linkages present in town' },
            { category: 'Wildlife Habitat', name: 'NYNHP Modeled Rare Species', score: 1.5, dataSource: 'Contact NYNHP (nynhp_modeled_rare_species.shp)', notes: '1-2 species: 1pt, 3+ species: 2pts' },
            { category: 'Wildlife Habitat', name: 'Ulster County Habitat Cores', score: 1, dataSource: 'Ulster County Planning (ulster_habitat_cores.shp)' },
            { category: 'Wildlife Habitat', name: 'Vernal Pool with 750\' buffer', score: 1, dataSource: 'Hudsonia or local inventories (vernal_pools_buffered.shp)', notes: 'Includes Intermittent Woodland Pools with 750\' buffer per Hudsonia Report' },
            { category: 'Wildlife Habitat', name: 'Hudsonia Mapped Crest/ledge/talus w/600\' buffer', score: 1, dataSource: 'Contact Hudsonia (hudsonia_crest_ledge_talus.shp)', notes: '600\' buffer based on Hudsonia report' },
            { category: 'Forests and Woodlands', name: 'TNC Matrix Forest Blocks or Linkage Zones', score: 1 },
            { category: 'Forests and Woodlands', name: 'NYNHP Core Forests', score: 1, dataSource: 'NYS GIS Clearinghouse' },
            { category: 'Forests and Woodlands', name: 'NYNHP High Ranking Forests (60+ percentile)', score: 1, dataSource: 'NYS GIS Clearinghouse' },
            { category: 'Forests and Woodlands', name: 'NYNHP Roadless Blocks (100+ acres)', score: 1, dataSource: 'NYS GIS Clearinghouse' },
            { category: 'Streams and Wetlands', name: 'NYNHP Riparian Buffers or w/in 100\' of stream or 650\' of Rondout Creek and tribs', score: 1, dataSource: 'Calculate from DEC streams layer' },
            { category: 'Recreation and Trails', name: 'Adjacent to Existing Trails', score: 1 },
            { category: 'Recreation and Trails', name: 'Adjacent to Mohonk Preserve', score: 1 },
            { category: 'Recreation and Trails', name: 'Within potential trail connection area', score: 1 },
            { category: 'Recreation and Trails', name: 'Within 1 mile of hamlet centers', score: 1 },
            { category: 'Scenic Areas', name: 'Adjacent to SMSB', score: 1 },
            { category: 'Scenic Areas', name: 'Adjacent to local scenic roads', score: 1 },
            { category: 'Scenic Areas', name: 'Areas visible from SMSB and local scenic roads', score: 1 },
            { category: 'Scenic Areas', name: 'Areas visible from-to Sky Top', score: 1 },
            { category: 'Scenic Areas', name: 'Gateway areas', score: 1 },
            { category: 'Historic and Cultural', name: 'Designated Historic Sites and Districts OR Houses built prior to 1900', score: 1 },
            { category: 'Historic and Cultural', name: 'Historic Marker sites', score: 1 },
            { category: 'Historic and Cultural', name: 'Adjacent to D&H Canal', score: 1 },
            { category: 'Historic and Cultural', name: 'Adjacent to Special Properties', score: 1 },
            { category: 'Historic and Cultural', name: 'Cemeteries', score: 1 },
            { category: 'Agricultural', name: 'Prime Soils if Drained', score: 1, dataSource: 'SSURGO via Web Soil Survey' },
            { category: 'Agricultural', name: 'Coded as an Active farm and/or Receiving an Ag Tax exemption', score: 1, dataSource: 'County tax assessor data' },
            { category: 'Agricultural', name: 'Century Farms', score: 1, dataSource: 'NYS Ag & Markets' },
        ];

        const criteriaSummary = [...scoreResult.breakdown];

        for (const criterion of unimplementedCriteria) {
            criteriaSummary.push({
                name: criterion.name,
                category: criterion.category,
                maxScore: criterion.score,
                earnedScore: 0,
                matched: false,
                implemented: false,
                dataSource: (criterion as any).dataSource,
                notes: (criterion as any).notes,
            });
        }

        // Reconstruct breakdown object for compatibility
        const breakdown: Record<string, { score: number; criteria: string[] }> = {};
        const detailsMatched: string[] = [];

        for (const item of scoreResult.breakdown) {
            if (item.matched) {
                if (!breakdown[item.category]) {
                    breakdown[item.category] = { score: 0, criteria: [] };
                }
                breakdown[item.category].score += item.earnedScore;
                breakdown[item.category].criteria.push(item.name);
                detailsMatched.push(item.name);
            }
        }

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
            totalScore: scoreResult.totalScore,
            maxPossibleScore: criteriaSummary.reduce((sum, c) => sum + (c.maxScore || c.score || 0), 0),
            breakdown,
            criteriaMatched: detailsMatched,
            criteriaSummary,
        });

    } catch (error) {
        console.error('Error scoring parcel:', error);
        return NextResponse.json(
            { error: 'Failed to score parcel', details: (error as Error).message },
            { status: 500 }
        );
    }
}
