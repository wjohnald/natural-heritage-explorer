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
     - Can be toggled on/off using the button
   - **Tax Parcels**: Shows property boundaries
     - Off by default
     - Semi-transparent (70% opacity)
     - Coverage: Statewide (limited availability in Adirondack Park)
     - Can be toggled on/off using the button
   - **DEC Wetlands**: NYS DEC Informational Freshwater Wetland Mapping
     - Off by default
     - Semi-transparent (50% opacity)
     - Shows DEC-mapped informational wetlands for planning purposes
     - **Note**: This is informational only, not regulatory
     - Can be toggled on/off using the button

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

## DEC Informational Freshwater Wetlands

The NYS DEC Informational Freshwater Wetland Mapping layer displays wetlands identified through the DEC's Environmental Resource Mapper (ERM). This layer is provided for **informational and planning purposes only** and is **not regulatory**.

**Key Points:**
- **Source**: NYS Department of Environmental Conservation  
- **Purpose**: Help identify potential wetland areas for planning and conservation  
- **Status**: Informational only - not authoritative for jurisdictional determinations  
- **Coverage**: Statewide  
- **When to Use**: Conservation planning, site screening, comparison with NWI data

**Important**: For definitive wetland determinations, request a jurisdictional determination from the NYS DEC.

## Tips for Use

1. **Click on wetlands** (NWI only) to see detailed information about wetland type, size, and characteristics
2. **Toggle NWI layer** to view federal wetlands inventory with clickable details
3. **Toggle DEC Wetlands** to view state-identified informational wetlands  
4. **Toggle Tax Parcels** to view property boundaries (limited coverage in Adirondack Park)
5. **Switch to Satellite view** with wetland overlays to see actual ground conditions
6. **Use with Vernal Pool filters** to correlate vernal pool species with seasonal wetlands
7. **Check wetland proximity** when evaluating conservation priority species
8. **Compare layers**: Use both NWI and DEC wetlands to get comprehensive context

## Technical Details

### National Wetlands Inventory (NWI)
- **Format**: WMS (Web Map Service)
- **Source**: USFWS  
- **Opacity**: 60%
- **Interactive**: Clickable for feature details

### DEC Informational Wetlands
- **Format**: WMS (Web Map Service)
- **Source**: NYS DEC Environmental Resource Mapper  
- **Opacity**: 50%
- **Status**: Informational only

### Tax Parcels
- **Format**: WMS (Web Map Service)
- **Source**: NYS ITS GIS Services  
- **Opacity**: 70%
- **Coverage**: 36 counties

All layers use Web Mercator projection (EPSG:3857) and are fetched on-demand from their respective servers.

