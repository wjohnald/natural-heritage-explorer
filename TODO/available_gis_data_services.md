# Available GIS Data Services for Parcel Scoring System

This document catalogs available GIS data services that can be used to implement the Hudsonia-style parcel scoring system based on the criteria in Table 2.3.

## Summary

**Good News:** Most of the required data layers are available as Feature Services or downloadable datasets from NYS GIS Clearinghouse, NYS DEC, and federal agencies.

**Challenge:** Not all data is available as real-time queryable services. Some will require downloading and hosting locally or using pre-computed analysis.

---

## 1. Drinking Water (3 points possible)

### ✅ EPA Principal Aquifers
- **Service**: EPA Sole Source Aquifers Feature Service
- **URL**: `https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/SoleSourceAquifers/FeatureServer`
- **Type**: Feature Service (REST API)
- **Status**: Available

### ✅ Bedrock Aquifers (Vly, School, Rondout)
- **Service**: NYS Unconsolidated Aquifers
- **URL**: Available via NYS GIS Clearinghouse
- **Type**: Feature Service
- **Status**: Available (may need to identify specific aquifer names)

### ✅ Ashokan Watershed
- **Service**: NYS DEP Watershed Boundaries
- **URL**: Check NYS Open Data Portal
- **Type**: Feature Service or downloadable shapefile
- **Status**: Likely available

### ✅ DEC Class A Streams
- **Service**: NYS DEC Streams
- **URL**: Available via DEC GIS Services
- **Type**: Feature Service
- **Status**: Available, need to filter by class

---

## 2. Wildlife Habitat (11 points possible)

### ✅ DEC Significant Biodiversity Areas (SBAs)
- **Service**: Hudson Valley Natural Resource Mapper
- **URL**: `https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer`
- **Layer**: 8 - "Significant Biodiversity Areas in the Hudson River Valley"
- **Type**: MapServer with Identify capability
- **Status**: **Already integrated in your app!**

### ✅ NYNHP Important Areas
- **Service**: Natural Heritage Important Areas NYNHP
- **URL**: Available via NYS GIS Clearinghouse and ArcGIS Online
- **Layers**: Important Areas for Rare Animals, Rare Plants, Terrestrial Animals, Aquatic Animals, Wetland Animals
- **Type**: Feature Service
- **Status**: Available (updated Feb 2024)
- **Also Available**: In Hudson Valley BiodiversityMapServer - Layers 0-6

### ✅ Audubon Important Bird Areas (IBAs)
- **Service**: Audubon Important Bird Areas
- **URL**: Available via NYS GIS Clearinghouse
- **Also Available**: Hudson Valley Biodiversity MapServer - Layer 9
- **Type**: Feature Service / Downloadable Shapefile
- **Status**: Available

### ✅ NYNHP Significant Communities
- **Service**: Hudson Valley Natural Resource Mapper
- **URL**: Same as above
- **Layer**: 7 - "Significant Natural Communities"
- **Type**: MapServer
- **Status**: Available

### ✅ TNC Resilient Sites
- **Service**: The Nature Conservancy datasets
- **URL**: Check TNC Data Basin or contact TNC
- **Type**: May require download/partnership
- **Status**: May need special access

### ⚠️ NYNHP Modeled Rare Species
- **Service**: Natural Heritage Program
- **URL**: May be available via NYNHP directly
- **Type**: Likely downloadable dataset
- **Status**: Check with NYNHP

### ⚠️ Ulster County Habitat Cores
- **Service**: Ulster County GIS
- **URL**: County-specific dataset
- **Type**: Likely downloadable
- **Status**: Contact Ulster County Planning

### ⚠️ Vernal Pools with 750' Buffer
- **Service**: No statewide official vernal pool registry
- **URL**: May need to use Hudsonia data or local inventories
- **Type**: Downloadable or custom dataset
- **Status**: Limited availability

### ✅ Wetlands (Hudsonia, DEC, or NWI) with 100'/300' Buffer
- **DEC Wetlands**: `https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer` ✅ **Already integrated!**
- **NWI Wetlands**: WMS service ✅ **Already integrated!**
- **Type**: MapServer / WMS
- **Status**: Available

### ⚠️ Hudsonia Mapped Crest/Ledge/Talus with 600' Buffer
- **Service**: Hudsonia Ltd. custom mapping
- **URL**: May need to contact Hudsonia or check Dutchess County Habitat Mapper
- **Type**: Downloadable or partnership
- **Status**: Limited to specific municipalities

---

## 3. Forests and Woodlands (6 points possible)

### ⚠️ TNC Matrix Forest Blocks or Linkage Zones
- **Service**: TNC datasets
- **URL**: TNC Data Basin or partnership
- **Type**: Download
- **Status**: May require special access

### ✅ NYNHP Core Forests
- **Service**: Natural Heritage Program
- **URL**: Available via NYS GIS Clearinghouse
- **Type**: Feature Service or Download
- **Status**: Check NYNHP catalog

### ✅ NYNHP High Ranking Forests (60+ percentile)
- **Service**: Natural Heritage Program
- **URL**: Same as above
- **Type**: Feature Service or Download
- **Status**: Check NYNHP catalog

### ✅ NYNHP Roadless Blocks (100+ acres)
- **Service**: Natural Heritage Program
- **URL**: Same as above
- **Type**: Feature Service or Download
- **Status**: Check NYNHP catalog

### ✅ NYNHP Important Areas for Rare Plants
- **Service**: Hudson Valley Biodiversity MapServer
- **URL**: Layer 1 - "Important Known Areas for Rare Plants"
- **Type**: MapServer
- **Status**: **Available**

### ⚠️ Adjacent to Protected Land
- **Service**: NYS Protected Areas Database (NYPAD)
- **URL**: www.nypad.org (requires survey for access)
- **Type**: Feature Service
- **Status**: Available but requires registration

---

## 4. Streams and Wetlands (5 points possible)

### ✅ FEMA Flood Hazard Areas
- **Service**: FEMA Flood Hazard Zones
- **URL**: Available via NYS GIS Clearinghouse and ArcGIS Online
- **Example**: "Special Flood Hazard Areas - NY/NJ" feature layer
- **Type**: Feature Service
- **Status**: Available

### ✅ NYNHP Riparian Buffers (100' from stream or 650' from Rondout Creek)
- **Service**: Can be calculated from DEC streams layer
- **URL**: DEC streams available via GIS services
- **Type**: Feature Service + buffer calculation
- **Status**: Available (requires spatial processing)

### ✅ Wetlands (already covered above)
- **Status**: **Already integrated**

### ✅ NRCS Hydric Soils
- **Service**: USDA NRCS SSURGO
- **URL**: Web Soil Survey (WSS) or Soil Data Access (SDA) API
- **Type**: Feature Service / Web Service
- **Status**: Available

### ✅ NYNHP Important Areas for Fish
- **Service**: Hudson Valley Biodiversity MapServer
- **URL**: Available in biodiversity layers
- **Type**: MapServer
- **Status**: Available

---

## 5. Recreation and Trails (6 points possible)

### ✅ Adjacent to Protected Lands
- **Service**: NYPAD (see above)
- **URL**: www.nypad.org
- **Type**: Feature Service
- **Status**: Available with registration

### ⚠️ Adjacent to Existing Trails
- **Service**: NYS Trails data
- **URL**: Check DEC or Parks data
- **Type**: Downloadable or Feature Service
- **Status**: Check availability

### ⚠️ Adjacent to Mohonk Preserve
- **Service**: Mohonk Preserve boundaries
- **URL**: May need to contact Mohonk Preserve
- **Type**: Download or digitize from public maps
- **Status**: Limited

### ⚠️ Within Potential Trail Connection Area
- **Service**: Custom analysis required
- **Type**: Would need to define criteria
- **Status**: N/A

### ⚠️ Within 1 Mile of Hamlet Centers
- **Service**: NYS hamlet/census designated places
- **URL**: Census TIGER data or NYS GIS Clearinghouse
- **Type**: Feature Service + buffer
- **Status**: Available

---

## 6. Scenic Areas (5 points possible)

### ⚠️ Adjacent to SMSB (Shawangunk Mountains Scenic Byway)
- **Service**: NYS Scenic Byways
- **URL**: NYS DOT or tourism data
- **Type**: Downloadable
- **Status**: Check availability

### ⚠️ Adjacent to Local Scenic Roads
- **Service**: Local designation data
- **URL**: Must be custom dataset from town/county
- **Type**: Custom
- **Status**: Limited

### ⚠️ Areas Visible from SMSB and Local Scenic Roads
- **Service**: Requires viewshed analysis
- **Type**: GIS analysis from DEM + road data
- **Status**: Complex analysis required

### ⚠️ Areas Visible from Sky Top
- **Service**: Requires viewshed analysis
- **Type**: GIS analysis from DEM
- **Status**: Complex analysis required

### ⚠️ Gateway Areas
- **Service**: Custom designation
- **Type**: Must be defined locally
- **Status**: N/A

---

## 7. Historic and Cultural (5 points possible)

### ⚠️ Designated Historic Sites and Districts OR Houses Built Prior to 1900
- **Service**: National Register of Historic Places
- **URL**: NPS National Register GIS data
- **Type**: Point/Polygon data
- **Status**: Available

### ⚠️ Historic Marker Sites
- **Service**: Historical markers database
- **URL**: May be available via state historic preservation office
- **Type**: Points
- **Status**: Check availability

### ⚠️ Adjacent to D&H Canal
- **Service**: D&H Canal corridor data
- **URL**: Historical canal routes
- **Type**: Line data
- **Status**: Check local historical societies

### ⚠️ Adjacent to Special Properties
- **Service**: Custom list
- **Type**: Must be defined locally
- **Status**: N/A

### ⚠️ Cemeteries
- **Service**: Cemetery locations
- **URL**: Check county GIS or USGS GNIS
- **Type**: Points
- **Status**: May be available

---

## 8. Agricultural (2 points possible)

### ✅ Prime or Statewide Important Farmland Soils
- **Service**: USDA NRCS SSURGO - Prime Farmland
- **URL**: Web Soil Survey or ArcGIS Online (Esri updates annually)
- **Type**: Feature Service
- **Status**: **Available**

### ✅ Prime Soils if Drained
- **Service**: SSURGO attribute
- **URL**: Same as above
- **Type**: Feature Service (attribute filter)
- **Status**: Available

### ⚠️ Agricultural District
- **Service**: NYS Agricultural Districts
- **URL**: NYS Ag & Markets or GIS Clearinghouse
- **Type**: Feature Service
- **Status**: Likely available

### ⚠️ Coded as Active Farm and/or Receiving Ag Tax Exemption
- **Service**: Tax assessment data
- **URL**: County tax assessor data
- **Type**: Join tax data to parcels
- **Status**: Available per county

### ⚠️ Adjacent to Protected Land (covered above)

### ⚠️ Century Farms
- **Service**: NYS Century Farms list
- **URL**: May be available from NYS Ag & Markets
- **Type**: List/Points
- **Status**: Check availability

---

## Critical Data: Tax Parcels

### ✅ NYS Tax Parcels Public
- **Service**: NYS Tax Parcels Feature Service
- **URL**: Available via ShareGIS / NYS GIS Clearinghouse
- **Coverage**: 36+ counties (2024 data)
- **Type**: Feature Service (REST API)
- **Attributes**: COUNTY_NAME, MUNI_NAME, PARCEL_ADDR, SBL, PROPERTY_CLASS, ACRES, FULL_MARKET_VAL, etc.
- **Status**: **AVAILABLE!**
- **Note**: Not all counties participate; some require direct contact

---

## Implementation Recommendations

### Tier 1: Readily Available via API (Immediate Implementation)
These can be queried in real-time via REST APIs:
- ✅ Tax Parcels (NYS Public)
- ✅ DEC Wetlands (already integrated)
- ✅ NWI Wetlands (already integrated)
- ✅ NYNHP Important Areas (multiple categories)
- ✅ Significant Biodiversity Areas (already integrated)
- ✅ SSURGO Soils (Prime Farmland, Hydric Soils)
- ✅ FEMA Flood Hazard Areas
- ✅ EPA Aquifers

### Tier 2: Available for Download (Pre-compute or Cache)
These require downloading and hosting locally:
- Audubon IBAs
- NYPAD Protected Areas
- Historic Places
- Agricultural Districts
- Trails data

### Tier 3: Requires Custom Data or Analysis
These need special partnerships, local data, or complex GIS analysis:
- Vernal pools
- Hudsonia-mapped features (crest/ledge/talus)
- TNC datasets
- Viewshed analysis (scenic areas)
- Century Farms
- Local scenic roads
- Hamlet centers (buffered analysis)

---

## Recommended Architecture

Given the data availability:

**Option 1: Hybrid Real-Time + Pre-computed**
1. **Real-time scoring** for Tier 1 criteria (via API queries)
2. **Pre-computed scores** for Tier 2 & 3 criteria (periodically updated)
3. Store pre-computed scores in a database
4. On-demand: fetch parcel, query real-time layers, merge with pre-computed scores

**Option 2: Fully Pre-computed (Most Reliable)**
1. Download all available datasets
2. Run spatial analysis once for all parcels statewide
3. Store composite scores in database
4. Update quarterly or annually
5. Serve via simple API lookup

**Recommended: Start with Option 2**
- More reliable and performant
- Can update scores periodically as data changes
- Simpler implementation
- Better for production use

Then optionally add Option 1 for specific criteria that change frequently.

---

## Next Steps

1. **Access NYS Tax Parcels Feature Service** - This is critical for getting parcel geometries
2. **Download key datasets** from NYS GIS Clearinghouse:
   - NYNHP Important Areas
   - SSURGO Soils
   - FEMA Flood Zones
   - NYPAD Protected Areas
3. **Test API access** to ensure you can query the services
4. **Prototype scoring algorithm** with a small area (one town)
5. **Build backend API** to serve scored parcels
