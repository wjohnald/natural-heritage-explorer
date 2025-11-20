# National Wetlands Inventory (NWI) Layers

This application now includes National Wetlands Inventory (NWI) GIS layers from the U.S. Fish & Wildlife Service.

## What is the National Wetlands Inventory?

The National Wetlands Inventory is a program of the U.S. Fish and Wildlife Service that produces information on the characteristics, extent, and status of U.S. wetlands and deepwater habitats. The NWI maps and data are used for:

- Habitat conservation and restoration planning
- Environmental impact assessments
- Species protection (including vernal pool species)
- Land use planning
- Regulatory compliance

## Features in the Map

### Layer Control

The map now includes a **Layer Control** in the top-right corner that allows you to:

1. **Switch Base Layers:**
   - **Topographic** (default): Detailed terrain and features
   - **Street Map**: Standard OpenStreetMap view
   - **Satellite**: High-resolution aerial imagery

2. **Toggle Overlays:**
   - **National Wetlands Inventory**: Shows wetlands and deepwater habitats
     - Automatically enabled by default
     - Semi-transparent (60% opacity) so you can see the base map underneath
     - Can be toggled on/off using the checkbox

### Interactive Wetland Information

**Click anywhere on the map** to view detailed wetland information at that location:

- **Wetland Type**: Classification using the Cowardin system (e.g., "Freshwater Emergent Wetland")
- **Attributes**: Additional characteristics like water regime and vegetation
- **Size**: Area in acres
- **Direct Link**: Opens the USFWS Wetlands Mapper for more details

The information appears in a popup at the clicked location. This feature works best when the NWI overlay is enabled, but will attempt to fetch wetland data at any location you click.

### Wetlands Data

The NWI layer displays:
- **Wetlands**: Including swamps, marshes, bogs, and fens
- **Deepwater habitats**: Lakes, rivers, and ponds
- **Vernal pools**: Temporary seasonal pools (important for many species in this app)

Each wetland feature is classified using the Cowardin Classification System, which categorizes wetlands by:
- System (Marine, Estuarine, Riverine, Lacustrine, Palustrine)
- Class (Rock bottom, Unconsolidated bottom, Aquatic bed, Reef, etc.)
- Water regime (Permanently flooded, Seasonally flooded, etc.)

## Why This Matters for Heritage Species

Many species tracked in this application depend on wetlands for:
- **Breeding habitat**: Especially vernal pool species like salamanders and frogs
- **Feeding areas**: Birds, mammals, and invertebrates
- **Migration stopover sites**: Waterfowl and shorebirds
- **Year-round habitat**: Aquatic and semi-aquatic species

By overlaying the NWI data with species observations, you can:
- Identify critical wetland habitats
- Understand species-habitat relationships
- Prioritize conservation areas
- Plan field surveys more effectively

## Data Source

- **Service**: U.S. Fish and Wildlife Service (USFWS)
- **WMS Endpoint**: https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer
- **Update Frequency**: Biannually
- **Learn More**: https://www.fws.gov/program/national-wetlands-inventory

## Tips for Use

1. **Click on wetlands** to see detailed information about wetland type, size, and characteristics
2. **Toggle the NWI layer** to compare observations with and without wetlands context
3. **Switch to Satellite view** with NWI overlay to see actual wetland conditions
4. **Use with Vernal Pool filters** to correlate vernal pool species with seasonal wetlands
5. **Check wetland proximity** when evaluating conservation priority species
6. **Click near species observations** to see if they're associated with specific wetland types

## Technical Details

- **Format**: WMS (Web Map Service)
- **Projection**: Web Mercator (EPSG:3857)
- **Opacity**: 60% for better visibility with base layers
- **Performance**: Layers are fetched on-demand from USGS servers

