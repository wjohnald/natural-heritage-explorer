# Newly Implemented Scoring Criteria

This document summarizes the scoring criteria that were just implemented using publicly available REST APIs (no self-hosted shapefiles required).

## Summary

**6 new criteria implemented** using publicly available ArcGIS REST services!

### New Criteria Added

| Category | Criterion | Score | Data Source |
|----------|-----------|-------|-------------|
| **Streams and Wetlands** | FEMA Flood Hazard Areas | 1 pt | FEMA NFHL MapServer |
| **Streams and Wetlands** | NRCS Hydric Soils | 1 pt | SSURGO Map Units |
| **Agricultural** | Prime or Statewide Important Farmland Soils | 2 pts | SSURGO Map Units |
| **Forests and Woodlands** | Adjacent to protected land | 1 pt | PAD-US 3.0 |
| **Recreation and Trails** | Adjacent to protected lands | 1.5 pts | PAD-US 3.0 |
| **Agricultural** | Adjacent to protected land | 1 pt | PAD-US 3.0 |

**Total new points possible**: 7.5 points

## Implementation Details

### 1. FEMA Flood Hazard Areas
- **Service URL**: `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28`
- **Layer**: Special Flood Hazard Areas
- **Method**: Direct spatial intersection query
- **Category**: Streams and Wetlands
- **Score**: 1 point

### 2. NRCS Hydric Soils
- **Service URL**: `https://landscape11.arcgis.com/arcgis/rest/services/USA_Soils_Map_Units/MapServer/0`
- **Data**: SSURGO Map Units
- **Method**: Query for soil map unit key (mukey), then check hydric rating
- **Category**: Streams and Wetlands
- **Score**: 1 point
- **Note**: May require additional attribute lookup for hydric rating

### 3. Prime or Statewide Important Farmland Soils
- **Service URL**: `https://landscape11.arcgis.com/arcgis/rest/services/USA_Soils_Map_Units/MapServer/0`
- **Data**: SSURGO Map Units
- **Method**: Query for soil map unit key (mukey), then check if Prime Farmland or Statewide Important
- **Category**: Agricultural
- **Score**: 2 points (highest value agricultural soil criterion)
- **Note**: May require additional attribute lookup for farmland classification

### 4-6. Adjacent to Protected Land (3 criteria)
- **Service URL**: `https://services1.arcgis.com/ERdCHt0GP5kZ89ro/arcgis/rest/services/PAD_US3_0Combined/FeatureServer/0`
- **Data**: Protected Areas Database of the United States (PAD-US 3.0)
- **Method**: Check for spatial adjacency/touching (buffer = 0)
- **Categories**: 
  - Forests and Woodlands (1 pt)
  - Recreation and Trails (1.5 pts)
  - Agricultural (1 pt)
- **Combined Score**: 3.5 points

## Updated Scoring System Statistics

### Before This Implementation
- **Active Criteria**: 10
- **Total Possible Score**: 10 points

### After This Implementation  
- **Active Criteria**: 16
- **Total Possible Score**: 17.5 points
- **Increase**: +6 criteria, +7.5 points possible

### Coverage by Category

| Category | Active Criteria | Points Possible |
|----------|----------------|-----------------|
| Drinking Water | 1 | 1 |
| Wildlife Habitat | 5 | 5 |
| Forests and Woodlands | 2 (+1) | 2 |
| Streams and Wetlands | 4 (+2) | 4 |
| Recreation and Trails | 1 (+1) | 1.5 |
| Scenic Areas | 0 | 0 |
| Historic and Cultural | 0 | 0 |
| Agricultural | 3 (+2) | 4 |
| **TOTAL** | **16** | **17.5** |

## Service Information

### FEMA National Flood Hazard Layer (NFHL)
- **Provider**: Federal Emergency Management Agency
- **Hosting**: FEMA GIS Services
- **Access**: Public, no authentication required
- **Update Frequency**: Ongoing (as flood maps are updated)
- **Coverage**: National (all FEMA-mapped areas)

### SSURGO Soils Data
- **Provider**: USDA Natural Resources Conservation Service (NRCS)
- **Hosting**: Esri Living Atlas (landscape11.arcgis.com)
- **Access**: Public, no authentication required
- **Update Frequency**: Annual updates
- **Coverage**: Nationwide (all surveyed areas)
- **Note**: This service provides map unit geometries. Full soil attributes may require additional SSURGO queries.

### PAD-US 3.0
- **Provider**: U.S. Geological Survey (USGS) Gap Analysis Project
- **Hosting**: Esri/USGS ArcGIS Online
- **Access**: Public, no authentication required
- **Update Frequency**: Periodic (major releases approximately every 2-3 years)
- **Coverage**: All U.S. protected areas including federal, state, local, and non-profit lands
- **Version**: 3.0 (latest as of implementation)

## Important Notes

### Soil Data Considerations
The SSURGO Map Units service provides the spatial geometries of soil map units. To fully implement the soil-based criteria, additional processing may be needed:

1. **Query the service** to get the soil map unit key (mukey) for the parcel
2. **Look up attributes** using the mukey to determine:
   - Hydric soil rating
   - Prime farmland classification
   - Farmland of statewide importance classification
   - Prime farmland if drained classification

This may require:
- Additional queries to SSURGO attribute tables
- Using NRCS Soil Data Access (SDA) web service for attribute lookups
- Pre-processing and caching soil attributes

### PAD-US Adjacency
The implementation checks for direct adjacency (touching) between parcel boundaries and protected areas. This uses a buffer of 0 feet, meaning the parcel must share a boundary with or overlap a protected area.

### Testing Recommendations
Before deploying to production, test these new criteria with:
1. Parcels known to be in flood zones
2. Parcels with prime agricultural soils
3. Parcels adjacent to state parks or other protected areas
4. Parcels in various counties to ensure data availability

## Future Enhancements

### Potential Additional Criteria
Other criteria that could be implemented with public REST APIs:
- National Register of Historic Places (if NPS provides REST service)
- Census-designated place data for hamlet centers
- DEC streams for riparian buffers
- Additional NYNHP forest layers (if available via REST)

### Soil Attribute Integration
Consider implementing a caching layer or attribute lookup service for SSURGO data to:
- Improve performance
- Enable full soil classification
- Support "Prime Soils if Drained" criterion

### Performance Optimization
- Monitor query response times for the new services
- Consider caching results for frequently queried parcels
- Implement timeout handling for slow services

## Documentation Updates

The following documentation files have been updated:
- ✅ `route.ts` - Added 6 new scoring criteria
- ✅ `scoring_criteria_status.md` - Updated status and added data source notes
- ✅ This document (`NEWLY_IMPLEMENTED.md`) - Created to summarize changes

## How to Verify Implementation

1. **Test API Endpoint**:
   ```bash
   curl "http://localhost:3000/api/score-parcel?address=123+Main+St,+New+Paltz,+NY"
   ```

2. **Check Response** for new criteria:
   - Look for "FEMA Flood Hazard Areas" in criteriaSummary
   - Look for "NRCS Hydric Soils" in criteriaSummary
   - Look for "Prime or Statewide Important Farmland Soils" in criteriaSummary
   - Look for "Adjacent to protected land" (multiple instances) in criteriaSummary

3. **Verify Scores**:
   - Check that `totalScore` reflects any newly matched criteria
   - Check that `maxPossibleScore` has increased to 17.5 or higher (depending on other criteria)

4. **Inspect criteriaSummary**:
   ```json
   {
     "name": "FEMA Flood Hazard Areas",
     "category": "Streams and Wetlands",
     "maxScore": 1,
     "earnedScore": 1,
     "matched": true,
     "implemented": true
   }
   ```

## Troubleshooting

If a criterion is not working:

1. **Check service availability**:
   - Visit the service URL in a browser
   - Verify it returns valid JSON metadata

2. **Check query parameters**:
   - Ensure geometry is in correct spatial reference
   - Verify layer IDs are correct

3. **Review console logs**:
   - Look for error messages in server logs
   - Check for failed HTTP requests

4. **Test service manually**:
   - Use ArcGIS REST API Query page to test queries
   - Verify service supports required spatial operations

## Conclusion

This implementation adds 6 new scoring criteria (7.5 possible points) to the parcel scoring system, all using publicly available REST APIs that require no self-hosted data or shapefiles. The system now scores parcels across 16 criteria with a maximum possible score of 17.5 points.

The new criteria significantly enhance coverage in the Streams and Wetlands, Agricultural, and Protected Lands categories, providing a more comprehensive assessment of parcel conservation value.

