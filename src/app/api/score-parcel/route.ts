import { NextResponse } from 'next/server';

// Scoring criteria with service URLs
const SCORING_CRITERIA = [
    {
        category: 'Drinking Water',
        name: 'EPA Principal Aquifers',
        score: 1,
        serviceUrl: 'https://geopub.epa.gov/arcgis/rest/services/NEPAssist/Water/MapServer/6',
    },
    {
        category: 'Wildlife Habitat',
        name: 'DEC SBAs',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer/8',
    },
    {
        category: 'Wildlife Habitat',
        name: 'NYNHP Important Areas for Rare Animals',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer',
        layers: [0, 1, 2, 3], // Multiple animal-related layers
    },
    {
        category: 'Wildlife Habitat',
        name: 'Audubon IBAs',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer/9',
    },
    {
        category: 'Wildlife Habitat',
        name: 'NYNHP Significant Communities',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer/7',
    },
    {
        category: 'Wildlife Habitat',
        name: 'Wetland with 300\' buffer',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer/0',
        buffer: 300, // feet
    },
    {
        category: 'Forests and Woodlands',
        name: 'NYNHP Important Areas for Rare Plants',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer/1',
    },
    {
        category: 'Streams and Wetlands',
        name: 'Wetland with 100\' buffer',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer/0',
        buffer: 100, // feet
    },
    {
        category: 'Streams and Wetlands',
        name: 'NYNHP Important Areas for Fish',
        score: 1,
        serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer',
        layers: [5, 6], // Fish and coldwater stream layers
    },
];

// Helper to query ArcGIS feature service
// Helper to query ArcGIS feature service
async function queryFeatureService(
    serviceUrl: string,
    geometry: any,
    layerId?: number
): Promise<boolean> {
    try {
        const url = layerId !== undefined
            ? `${serviceUrl}/${layerId}/query`
            : `${serviceUrl}/query`;

        // Extract geometry and spatial reference from parcel feature
        const geom = geometry;
        const sr = geometry.spatialReference || { wkid: 3857 };

        const params = new URLSearchParams({
            f: 'json',
            geometry: JSON.stringify(geom),
            geometryType: 'esriGeometryPolygon',
            inSR: sr.wkid?.toString() || '3857',
            spatialRel: 'esriSpatialRelIntersects',
            returnGeometry: 'false',
            returnCountOnly: 'true',
        });

        // Use POST to handle large geometries
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            console.error(`HTTP error querying ${serviceUrl}: ${response.status} ${response.statusText}`);
            return false;
        }

        const text = await response.text();
        try {
            const data = JSON.parse(text);

            if (data.error) {
                console.error(`Query error for ${serviceUrl}:`, data.error);
                return false;
            }

            return data.count > 0;
        } catch (e) {
            console.error(`Invalid JSON from ${serviceUrl}:`, text.substring(0, 100));
            return false;
        }
    } catch (error) {
        console.error(`Error querying ${serviceUrl}:`, error);
        return false;
    }
}

// Get parcel geometry from NYS Tax Parcels service
async function getParcelGeometry(address: string): Promise<any> {
    try {
        // First geocode the address to get coordinates
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const geocodeResponse = await fetch(
            `${baseUrl}/api/geocode?address=${encodeURIComponent(address)}`
        );
        const geocodeData = await geocodeResponse.json();

        if (!geocodeData.coordinates || !geocodeData.coordinates.lat || !geocodeData.coordinates.lon) {
            throw new Error('Failed to geocode address');
        }

        const { lat, lon } = geocodeData.coordinates;

        // Query NYS Tax Parcels to find parcel containing this point
        // Using ShareGIS NYS Tax Parcels Public service (correct URL)
        // Layer 1 = detailed parcels with attributes
        const parcelServiceUrl = 'https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcels_Public/MapServer/1/query';

        const params = new URLSearchParams({
            f: 'json',
            geometry: JSON.stringify({
                x: lon,
                y: lat,
                spatialReference: { wkid: 4326 }
            }),
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelWithin',
            returnGeometry: 'true',
            outFields: 'PRINT_KEY,COUNTY_NAME,MUNI_NAME,PARCEL_ADDR,ACRES',
        });

        const response = await fetch(`${parcelServiceUrl}?${params}`);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            return data.features[0];
        }

        throw new Error('No parcel found at this address');
    } catch (error) {
        console.error('Error getting parcel geometry:', error);
        throw error;
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address parameter is required' },
                { status: 400 }
            );
        }

        // Get parcel geometry
        const parcel = await getParcelGeometry(address);

        if (!parcel || !parcel.geometry) {
            return NextResponse.json(
                { error: 'Could not find parcel geometry' },
                { status: 404 }
            );
        }

        // Score breakdown by category
        const breakdown: Record<string, { score: number; criteria: string[] }> = {};
        let totalScore = 0;
        const detailsMatched: string[] = [];
        const criteriaSummary: Array<{
            name: string;
            category: string;
            maxScore: number;
            earnedScore: number;
            matched: boolean;
            implemented: boolean;
        }> = [];

        // Query each criterion
        for (const criterion of SCORING_CRITERIA) {
            let met = false;

            if (criterion.layers) {
                // Query multiple layers
                for (const layerId of criterion.layers) {
                    const baseUrl = criterion.serviceUrl.split('/MapServer')[0] + '/MapServer';
                    if (await queryFeatureService(baseUrl, parcel.geometry, layerId)) {
                        met = true;
                        break;
                    }
                }
            } else {
                // Single layer query
                met = await queryFeatureService(criterion.serviceUrl, parcel.geometry);
            }

            if (met) {
                totalScore += criterion.score;
                detailsMatched.push(criterion.name);

                if (!breakdown[criterion.category]) {
                    breakdown[criterion.category] = { score: 0, criteria: [] };
                }
                breakdown[criterion.category].score += criterion.score;
                breakdown[criterion.category].criteria.push(criterion.name);
            }

            // Add to summary
            criteriaSummary.push({
                name: criterion.name,
                category: criterion.category,
                maxScore: criterion.score,
                earnedScore: met ? criterion.score : 0,
                matched: met,
                implemented: true,
            });
        }

        // Add unimplemented criteria (stubbed)
        const unimplementedCriteria = [
            { category: 'Drinking Water', name: 'Bedrock Aquifers (Vly School Rondout)', score: 1 },
            { category: 'Drinking Water', name: 'Ashokan Watershed', score: 1 },
            { category: 'Drinking Water', name: 'DEC Class A Streams outside of Ashokan Watershed', score: 1 },
            { category: 'Wildlife Habitat', name: 'TNC Resilient Sites', score: 1 },
            { category: 'Wildlife Habitat', name: 'NYNHP Modeled Rare Species', score: 1.5 },
            { category: 'Wildlife Habitat', name: 'Ulster County Habitat Cores', score: 1 },
            { category: 'Wildlife Habitat', name: 'Vernal Pool with 750\' buffer', score: 1 },
            { category: 'Wildlife Habitat', name: 'Hudsonia Mapped Crest/ledge/talus w/600\' buffer', score: 1 },
            { category: 'Forests and Woodlands', name: 'TNC Matrix Forest Blocks or Linkage Zones', score: 1 },
            { category: 'Forests and Woodlands', name: 'NYNHP Core Forests', score: 1 },
            { category: 'Forests and Woodlands', name: 'NYNHP High Ranking Forests (60+ percentile)', score: 1 },
            { category: 'Forests and Woodlands', name: 'NYNHP Roadless Blocks (100+ acres)', score: 1 },
            { category: 'Forests and Woodlands', name: 'Adjacent to protected land', score: 1 },
            { category: 'Streams and Wetlands', name: 'FEMA Flood Hazard Areas', score: 1 },
            { category: 'Streams and Wetlands', name: 'NYNHP Riparian Buffers or w/in 100\' of stream or 650\' of Rondout Creek and tribs', score: 1 },
            { category: 'Streams and Wetlands', name: 'NRCS Hydric Soils', score: 1 },
            { category: 'Recreation and Trails', name: 'Adjacent to protected lands', score: 1.5 },
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
            { category: 'Agricultural', name: 'Prime or Statewide Important Farmland Soils', score: 2 },
            { category: 'Agricultural', name: 'Prime Soils if Drained', score: 1 },
            { category: 'Agricultural', name: 'Agricultural District', score: 1 },
            { category: 'Agricultural', name: 'Coded as an Active farm and/or Receiving an Ag Tax exemption', score: 1 },
            { category: 'Agricultural', name: 'Adjacent to protected land', score: 1 },
            { category: 'Agricultural', name: 'Century Farms', score: 1 },
        ];

        for (const criterion of unimplementedCriteria) {
            criteriaSummary.push({
                name: criterion.name,
                category: criterion.category,
                maxScore: criterion.score,
                earnedScore: 0,
                matched: false,
                implemented: false,
            });
        }

        return NextResponse.json({
            parcelInfo: {
                address: parcel.attributes?.PARCEL_ADDR,
                county: parcel.attributes?.COUNTY_NAME,
                municipality: parcel.attributes?.MUNI_NAME,
                acres: parcel.attributes?.ACRES,
                printKey: parcel.attributes?.PRINT_KEY,
            },
            totalScore,
            maxPossibleScore: criteriaSummary.reduce((sum, c) => sum + c.maxScore, 0),
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
