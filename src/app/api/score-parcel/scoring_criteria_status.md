# Parcel Scoring Criteria Implementation Status

This checklist tracks the implementation status of all scoring criteria defined in the methodology.

**Legend:**
- ✅ **Fully Implemented**: Criteria is active and querying public REST APIs
- ✅ **Implemented (awaiting data)**: Code structure is ready, but requires static data files (shapefiles) to be obtained and hosted
  - See `parcel_scoring_methodology.csv` for data source details
  - Once data is obtained and uploaded as a feature service, simply update the `serviceUrl` in `route.ts`

## Drinking Water
- [x] EPA Principal Aquifers
- [ ] Bedrock Aquifers (Vly School Rondout)
- [ ] Ashokan Watershed
- [ ] DEC Class A Streams outside of Ashokan Watershed

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
- [ ] NYNHP Core Forests
- [ ] NYNHP High Ranking Forests (60+ percentile)
- [ ] NYNHP Roadless Blocks (100+ acres)
- [ ] Adjacent to protected land

## Streams and Wetlands
- [x] Wetland with 100' buffer
- [x] NYNHP Important Areas for Fish
- [ ] FEMA Flood Hazard Areas
- [ ] NYNHP Riparian Buffers or w/in 100' of stream or 650' of Rondout Creek and tribs
- [ ] NRCS Hydric Soils

## Recreation and Trails
- [ ] Adjacent to protected lands
- [ ] Adjacent to Existing Trails
- [ ] Adjacent to Mohonk Preserve
- [ ] Within potential trail connection area
- [ ] Within 1 mile of hamlet centers

## Scenic Areas
- [ ] Adjacent to SMSB
- [ ] Adjacent to local scenic roads
- [ ] Areas visible from SMSB and local scenic roads
- [ ] Areas visible from-to Sky Top
- [ ] Gateway areas

## Historic and Cultural
- [ ] Designated Historic Sites and Districts OR Houses built prior to 1900
- [ ] Historic Marker sites
- [ ] Adjacent to D&H Canal
- [ ] Adjacent to Special Properties
- [ ] Cemeteries

## Agricultural
- [x] Agricultural District
- [ ] Prime or Statewide Important Farmland Soils
- [ ] Prime Soils if Drained
- [ ] Coded as an Active farm and/or Receiving an Ag Tax exemption
- [ ] Adjacent to protected land
- [ ] Century Farms
