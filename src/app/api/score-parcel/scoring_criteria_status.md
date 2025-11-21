# Parcel Scoring Criteria Implementation Status

This checklist tracks the implementation status of all scoring criteria defined in the methodology.

**Legend:**
- ✅ **Fully Implemented**: Criteria is active and querying public REST APIs
- ✅ **Implemented (awaiting data)**: Code structure is ready, but requires static data files (shapefiles) to be obtained and hosted
  - See `parcel_scoring_methodology.csv` for data source details
  - Once data is obtained and uploaded as a feature service, simply update the `serviceUrl` in `route.ts`

## Drinking Water
- [x] EPA Principal Aquifers
- [ ] Bedrock Aquifers (Vly School Rondout) *(awaiting data: NYS GIS Clearinghouse)*
- [ ] Ashokan Watershed *(awaiting data: NYS Open Data Portal)*
- [x] DEC Class A Streams outside of Ashokan Watershed *(using NYS DEC Water Quality Classifications REST service)*

## Wildlife Habitat
- [x] DEC SBAs
- [x] NYNHP Important Areas for Rare Animals
- [x] Audubon IBAs
- [x] NYNHP Significant Communities
- [x] Wetland with 300' buffer
- [x] TNC Resilient Sites *(awaiting data: TNC Data Basin - tnc_resilient_sites.shp)*
- [x] NYNHP Modeled Rare Species *(awaiting data: Contact NYNHP - nynhp_modeled_rare_species.shp)*
- [x] Ulster County Habitat Cores *(awaiting data: Ulster County Planning - ulster_habitat_cores.shp)*
- [x] Vernal Pool with 750' buffer *(awaiting data: Hudsonia - vernal_pools_buffered.shp)*
- [x] Hudsonia Mapped Crest/ledge/talus w/600' buffer *(awaiting data: Contact Hudsonia - hudsonia_crest_ledge_talus.shp)*

## Forests and Woodlands
- [x] NYNHP Important Areas for Rare Plants
- [ ] TNC Matrix Forest Blocks or Linkage Zones
- [ ] NYNHP Core Forests *(awaiting data: NYS GIS Clearinghouse)*
- [ ] NYNHP High Ranking Forests (60+ percentile) *(awaiting data: NYS GIS Clearinghouse)*
- [ ] NYNHP Roadless Blocks (100+ acres) *(awaiting data: NYS GIS Clearinghouse)*
- [x] Adjacent to protected land **NEW** *(using PAD-US 3.0)*

## Streams and Wetlands
- [x] Wetland with 100' buffer
- [x] NYNHP Important Areas for Fish
- [x] FEMA Flood Hazard Areas **NEW** *(using FEMA NFHL service)*
- [ ] NYNHP Riparian Buffers or w/in 100' of stream or 650' of Rondout Creek and tribs *(awaiting data: DEC streams layer)*
- [x] NRCS Hydric Soils **NEW** *(using SSURGO Map Units service)*

## Recreation and Trails
- [x] Adjacent to protected lands **NEW** *(using PAD-US 3.0)*
- [ ] Adjacent to Existing Trails *(awaiting data: DEC or Parks data)*
- [ ] Adjacent to Mohonk Preserve *(awaiting data: Contact Mohonk Preserve)*
- [ ] Within potential trail connection area *(requires custom analysis)*
- [x] Within 1 mile of hamlet centers *(using NYS Place Points REST service)*

## Scenic Areas
- [ ] Adjacent to SMSB *(awaiting data: NYS DOT or tourism data)*
- [ ] Adjacent to local scenic roads *(awaiting data: Local designation data)*
- [ ] Areas visible from SMSB and local scenic roads *(requires viewshed analysis from DEM)*
- [ ] Areas visible from-to Sky Top *(requires viewshed analysis from DEM)*
- [ ] Gateway areas *(requires custom analysis)*

## Historic and Cultural
- [x] Designated Historic Sites and Districts *(using NYS OPRHP National Register Building Listings REST service)*
- [ ] Historic Marker sites *(awaiting data: State Historic Preservation Office)*
- [ ] Adjacent to D&H Canal *(awaiting data: Historical canal routes)*
- [ ] Adjacent to Special Properties *(requires custom list)*
- [ ] Cemeteries *(awaiting data: County GIS or USGS GNIS)*

## Agricultural
- [x] Agricultural District
- [x] Prime or Statewide Important Farmland Soils **NEW** *(using SSURGO Map Units service)*
- [ ] Prime Soils if Drained *(awaiting data: SSURGO via Web Soil Survey)*
- [ ] Coded as an Active farm and/or Receiving an Ag Tax exemption *(awaiting data: County tax assessor)*
- [x] Adjacent to protected land **NEW** *(using PAD-US 3.0)*
- [ ] Century Farms *(awaiting data: NYS Ag & Markets)*
