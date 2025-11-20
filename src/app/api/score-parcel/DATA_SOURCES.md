# Data Sources for Parcel Scoring Criteria

This document provides detailed information on how to obtain and integrate the remaining data sources needed for complete parcel scoring functionality.

## Overview

The parcel scoring system has two tiers of implementation:

**Tier 1 (Active)**: Criteria using public REST APIs that are queried in real-time
**Tier 2 (Ready but requires data)**: Criteria that need static data files (shapefiles) to be obtained, hosted, and converted to queryable services

## Wildlife Habitat Criteria (Awaiting Data)

### 1. TNC Resilient Sites
- **Score**: 1 point
- **Data File**: `tnc_resilient_sites.shp`
- **Source**: The Nature Conservancy Data Basin or direct contact with TNC
- **Notes**: Only linkages present in town
- **How to Obtain**:
  1. Visit [TNC Data Basin](https://databasin.org/) or contact TNC directly
  2. Search for "Resilient and Connected Landscapes" or "Resilient Sites" for New York
  3. Download the dataset for your area of interest
- **Integration Steps**:
  1. Upload shapefile to ArcGIS Online or PostGIS database
  2. Create a feature service with public access
  3. Update `SCORING_CRITERIA` in `route.ts`:
     ```typescript
     {
         category: 'Wildlife Habitat',
         name: 'TNC Resilient Sites',
         score: 1,
         serviceUrl: 'YOUR_SERVICE_URL_HERE',
     }
     ```
  4. Remove from `unimplementedCriteria` array

### 2. NYNHP Modeled Rare Species
- **Score**: 1.5 points (variable: 1 point for 1-2 species, 2 points for 3+ species)
- **Data File**: `nynhp_modeled_rare_species.shp`
- **Source**: Contact NY Natural Heritage Program
- **How to Obtain**:
  1. Contact NYNHP at [nynhp@dec.ny.gov](mailto:nynhp@dec.ny.gov)
  2. Request modeled rare species habitat data
  3. May require data sharing agreement
- **Integration Steps**:
  1. Upload to feature service
  2. Query should count number of species per parcel
  3. Implement scoring logic:
     - 1-2 species = 1 point
     - 3+ species = 2 points
  4. Update code to handle variable scoring based on species count

### 3. Ulster County Habitat Cores
- **Score**: 1 point
- **Data File**: `ulster_habitat_cores.shp`
- **Source**: Ulster County Planning Department
- **How to Obtain**:
  1. Contact Ulster County Planning Department
  2. Website: [Ulster County GIS](https://ulstercountyny.gov/planning/)
  3. Request habitat cores/corridors dataset
- **Integration Steps**:
  1. Same as TNC Resilient Sites above
  2. Add to `SCORING_CRITERIA` with serviceUrl

### 4. Vernal Pool with 750' Buffer
- **Score**: 1 point
- **Data File**: `vernal_pools_buffered.shp`
- **Source**: Hudsonia Ltd. or local inventories
- **Notes**: Includes Intermittent Woodland Pools with 750' buffer per Hudsonia Report
- **How to Obtain**:
  1. Contact [Hudsonia Ltd.](https://hudsonia.org/)
  2. Request vernal pool inventory data
  3. Check local conservation organizations for additional inventories
  4. See `/src/static/VERNAL_POOL_SOURCES.md` for species indicators
- **Integration Steps**:
  1. If data doesn't include 750' buffer, create buffer in GIS software
  2. Upload to feature service
  3. Add to `SCORING_CRITERIA`:
     ```typescript
     {
         category: 'Wildlife Habitat',
         name: 'Vernal Pool with 750\' buffer',
         score: 1,
         serviceUrl: 'YOUR_SERVICE_URL_HERE',
     }
     ```

### 5. Hudsonia Mapped Crest/Ledge/Talus with 600' Buffer
- **Score**: 1 point
- **Data File**: `hudsonia_crest_ledge_talus.shp`
- **Source**: Hudsonia Ltd.
- **Notes**: 600' buffer based on Hudsonia habitat report
- **How to Obtain**:
  1. Contact [Hudsonia Ltd.](https://hudsonia.org/)
  2. Request mapped habitat data for crest, ledge, and talus features
  3. This data may be municipality-specific
- **Integration Steps**:
  1. Apply 600' buffer if not already included
  2. Upload to feature service
  3. Add to `SCORING_CRITERIA` with serviceUrl

## Other Criteria Categories (Awaiting Data)

### Drinking Water
- **Bedrock Aquifers (Vly School Rondout)**: Check NYS GIS Clearinghouse
- **Ashokan Watershed**: NYS Open Data Portal - search for DEP watershed boundaries
- **DEC Class A Streams**: Available via DEC GIS services, needs filtering by class

### Forests and Woodlands
- **TNC Matrix Forest Blocks or Linkage Zones**: Contact TNC
- **NYNHP Core Forests**: Check NYS GIS Clearinghouse
- **NYNHP High Ranking Forests (60+ percentile)**: Check NYS GIS Clearinghouse
- **NYNHP Roadless Blocks (100+ acres)**: Check NYS GIS Clearinghouse
- **Adjacent to protected land**: Requires NYPAD (www.nypad.org - requires survey for access)

### Streams and Wetlands
- **FEMA Flood Hazard Areas**: Available via NYS GIS Clearinghouse and ArcGIS Online
- **NYNHP Riparian Buffers**: Calculate from DEC streams layer with 100'/650' buffers
- **NRCS Hydric Soils**: Web Soil Survey or Soil Data Access API

### Recreation and Trails
- **Adjacent to protected lands**: NYPAD (www.nypad.org)
- **Adjacent to Existing Trails**: Check DEC or Parks data
- **Adjacent to Mohonk Preserve**: Contact Mohonk Preserve
- **Within potential trail connection area**: Custom analysis
- **Within 1 mile of hamlet centers**: Census TIGER data + 1 mile buffer

### Scenic Areas
- **Adjacent to SMSB**: NYS DOT or tourism data
- **Adjacent to local scenic roads**: Local designation data
- **Areas visible from SMSB and local scenic roads**: Viewshed analysis from DEM
- **Areas visible from-to Sky Top**: Viewshed analysis from DEM
- **Gateway areas**: Custom analysis

### Historic and Cultural
- **Designated Historic Sites and Districts OR Houses built prior to 1900**: NPS National Register GIS data
- **Historic Marker sites**: State Historic Preservation Office
- **Adjacent to D&H Canal**: Historical canal routes
- **Adjacent to Special Properties**: Custom list
- **Cemeteries**: County GIS or USGS GNIS

### Agricultural
- **Prime or Statewide Important Farmland Soils**: USDA NRCS SSURGO - Web Soil Survey
- **Prime Soils if Drained**: SSURGO attribute
- **Coded as an Active farm and/or Receiving an Ag Tax exemption**: County tax assessor data
- **Adjacent to protected land**: NYPAD
- **Century Farms**: NYS Ag & Markets

## General Integration Workflow

For any static data source:

1. **Obtain Data**:
   - Download from source or request access
   - Verify data format (shapefiles, GeoJSON, etc.)
   - Check spatial reference system (should be EPSG:3857 or EPSG:4326)

2. **Host Data**:
   - **Option A**: Upload to ArcGIS Online as a feature layer
   - **Option B**: Import to PostGIS database and serve via GeoServer
   - **Option C**: Convert to GeoJSON and serve via custom API endpoint

3. **Update Code**:
   - Move criterion from `unimplementedCriteria` to `SCORING_CRITERIA` in `route.ts`
   - Add `serviceUrl` parameter
   - Add `buffer` parameter if needed (in feet)
   - Add `layers` array if querying multiple sublayers

4. **Test**:
   - Query the service manually to verify it works
   - Run parcel scoring API with test address
   - Verify criterion appears in results with correct score

5. **Update Documentation**:
   - Update `scoring_criteria_status.md`
   - Mark criterion as fully implemented
   - Document any special considerations

## Resources

- **NYS GIS Clearinghouse**: https://gis.ny.gov/
- **NYS Open Data Portal**: https://data.ny.gov/
- **DEC GIS Services**: https://gisservices.dec.ny.gov/
- **Natural Heritage Program**: https://www.dec.ny.gov/animals/29338.html
- **NYPAD**: https://www.nypad.org/
- **Hudsonia Ltd**: https://hudsonia.org/
- **TNC Data Basin**: https://databasin.org/
- **USDA Web Soil Survey**: https://websoilsurvey.nrcs.usda.gov/

## Questions?

For implementation questions or assistance obtaining data sources, see the methodology documentation in `parcel_scoring_methodology.csv` or consult with the original Hudsonia-style scoring methodology documentation.

