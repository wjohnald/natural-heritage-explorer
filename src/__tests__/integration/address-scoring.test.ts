/**
 * Integration tests for address-based parcel scoring
 * 
 * Philosophy: We don't run a GIS system - we use data from public APIs.
 * These tests verify the complete pipeline:
 * Street Address → Geocoding → Parcel Fetch → Scoring
 * 
 * No mocked geometry - tests use real addresses and real API calls.
 */

import { describe, it, expect } from 'vitest';
import { geocodeAddress } from '@/services/server-geocoding';
import { ParcelScorer } from '@/services/scoring/parcel-scorer';
import { ADDRESS_789_LAPLA_ROAD, ADDRESS_281_DEWITT_ROAD, ADDRESS_15_RONSEN_ROAD } from '../services/scoring/test-fixtures';

async function getParcelGeometry(address: string) {
    const geocodeResult = await geocodeAddress(address);
    
    if (!geocodeResult.coordinates) {
        throw new Error(`Failed to geocode address: ${address}`);
    }

    const { lat, lon } = geocodeResult.coordinates;
    
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
        outFields: 'PRINT_KEY,COUNTY_NAME,MUNI_NAME',
    });

    const response = await fetch(`${parcelServiceUrl}?${params}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch parcel: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
        throw new Error(`No parcel found for address: ${address}`);
    }

    return data.features[0].geometry;
}

describe('Address-Based Parcel Scoring Integration', () => {
    it('should score 789 Lapla Road - FEMA should be FALSE (Zone X)', async () => {
        console.log(`\nTesting: ${ADDRESS_789_LAPLA_ROAD}`);
        
        const geometry = await getParcelGeometry(ADDRESS_789_LAPLA_ROAD);
        const scorer = new ParcelScorer();
        const result = await scorer.scoreParcel(geometry);
        
        // Find FEMA criterion in breakdown
        const femaCriterion = result.breakdown.find((c: any) => 
            c.name === 'FEMA Flood Hazard Areas'
        );
        
        expect(femaCriterion).toBeDefined();
        expect(femaCriterion.matched).toBe(false); // Zone X, not SFHA
        expect(femaCriterion.earnedScore).toBe(0);
    }, 60000); // 60 second timeout for full integration

    it('should score 281 DeWitt Road - FEMA should be TRUE (in SFHA)', async () => {
        console.log(`\nTesting: ${ADDRESS_281_DEWITT_ROAD}`);
        
        const geometry = await getParcelGeometry(ADDRESS_281_DEWITT_ROAD);
        const scorer = new ParcelScorer();
        const result = await scorer.scoreParcel(geometry);
        
        // Find FEMA criterion in breakdown
        const femaCriterion = result.breakdown.find((c: any) => 
            c.name === 'FEMA Flood Hazard Areas'
        );
        
        expect(femaCriterion).toBeDefined();
        expect(femaCriterion.matched).toBe(true); // In SFHA
        expect(femaCriterion.earnedScore).toBe(1);
    }, 60000);

    it('should score 789 Lapla Road - Class A Streams should be FALSE (has Class C)', async () => {
        console.log(`\nTesting: ${ADDRESS_789_LAPLA_ROAD}`);
        
        const geometry = await getParcelGeometry(ADDRESS_789_LAPLA_ROAD);
        const scorer = new ParcelScorer();
        const result = await scorer.scoreParcel(geometry);
        
        // Find DEC Class A Streams criterion in breakdown
        const streamsCriterion = result.breakdown.find((c: any) => 
            c.name === 'DEC Class A Streams'
        );
        
        expect(streamsCriterion).toBeDefined();
        expect(streamsCriterion.matched).toBe(false); // Has Class C, not Class A
        expect(streamsCriterion.earnedScore).toBe(0);
    }, 60000);

    it('should score 15 Ronsen Road - Class A Streams should be TRUE', async () => {
        console.log(`\nTesting: ${ADDRESS_15_RONSEN_ROAD}`);
        
        const geometry = await getParcelGeometry(ADDRESS_15_RONSEN_ROAD);
        const scorer = new ParcelScorer();
        const result = await scorer.scoreParcel(geometry);
        
        // Find DEC Class A Streams criterion in breakdown
        const streamsCriterion = result.breakdown.find((c: any) => 
            c.name === 'DEC Class A Streams'
        );
        
        expect(streamsCriterion).toBeDefined();
        expect(streamsCriterion.matched).toBe(true); // Has Class A stream within 500ft
        expect(streamsCriterion.earnedScore).toBe(1);
    }, 60000);

    it('should return a complete scoring breakdown for 789 Lapla Road', async () => {
        console.log(`\nTesting: ${ADDRESS_789_LAPLA_ROAD}`);
        
        const geometry = await getParcelGeometry(ADDRESS_789_LAPLA_ROAD);
        const scorer = new ParcelScorer();
        const result = await scorer.scoreParcel(geometry);
        
        // Verify structure
        expect(result).toHaveProperty('totalScore');
        expect(result).toHaveProperty('breakdown');
        expect(Array.isArray(result.breakdown)).toBe(true);
        expect(result.breakdown.length).toBeGreaterThan(0);
        
        // Verify each criterion has required fields
        result.breakdown.forEach((criterion: any) => {
            expect(criterion).toHaveProperty('category');
            expect(criterion).toHaveProperty('name');
            expect(criterion).toHaveProperty('maxScore');
            expect(criterion).toHaveProperty('earnedScore');
            expect(criterion).toHaveProperty('matched');
            expect(criterion).toHaveProperty('implemented');
        });
        
        console.log(`Total Score: ${result.totalScore}`);
        console.log(`Criteria Count: ${result.breakdown.length}`);
    }, 60000);
});

