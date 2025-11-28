'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, CircleMarker, Popup, Circle, Polygon, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import { iNaturalistObservation, GBIFObservation, Coordinates } from '@/types';
import L from 'leaflet';
import * as Esri from 'esri-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geometryutil';

interface ObservationMapProps {
  observations: (iNaturalistObservation | GBIFObservation)[];
  searchCoordinates?: Coordinates;
  radius?: number; // in miles
  hoveredSpecies?: string | null;
}

type BasemapType = 'topo' | 'street' | 'satellite';

// Component to handle NWI layer clicks and show wetland info
function WetlandInfoHandler({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const [wetlandPopup, setWetlandPopup] = useState<L.Popup | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      const point = map.latLngToContainerPoint(e.latlng);
      const size = map.getSize();
      const bounds = map.getBounds();
      const bbox = `${bounds.getSouthWest().lng},${bounds.getSouthWest().lat},${bounds.getNorthEast().lng},${bounds.getNorthEast().lat}`;

      const url = new URL('https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer');
      url.searchParams.set('SERVICE', 'WMS');
      url.searchParams.set('VERSION', '1.1.1');
      url.searchParams.set('REQUEST', 'GetFeatureInfo');
      url.searchParams.set('LAYERS', '1');
      url.searchParams.set('QUERY_LAYERS', '1');
      url.searchParams.set('BBOX', bbox);
      url.searchParams.set('WIDTH', size.x.toString());
      url.searchParams.set('HEIGHT', size.y.toString());
      url.searchParams.set('X', Math.floor(point.x).toString());
      url.searchParams.set('Y', Math.floor(point.y).toString());
      url.searchParams.set('INFO_FORMAT', 'text/xml');
      url.searchParams.set('SRS', 'EPSG:4326');
      url.searchParams.set('FEATURE_COUNT', '1');

      try {
        const response = await fetch(url.toString());
        const text = await response.text();

        // Parse XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Check if there's a feature in the response
        const fields = xmlDoc.getElementsByTagName('FIELDS');

        if (fields.length > 0) {
          const fieldData = fields[0];

          // Parse wetland attributes from XML
          const wetlandType = fieldData.getAttribute('WETLAND_TYPE') || fieldData.getAttribute('wetland_type') || 'Unknown';
          const attribute = fieldData.getAttribute('ATTRIBUTE') || fieldData.getAttribute('attribute') || '';
          const acres = fieldData.getAttribute('ACRES') || fieldData.getAttribute('acres');
          const weblink = fieldData.getAttribute('WEBLINK') || fieldData.getAttribute('weblink') || '';

          let popupContent = `
            <div style="padding: 0.5rem;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">
                🌿 Wetland Information
              </h3>
              <div style="font-size: 0.875rem; color: var(--text-primary);">
                <div style="margin-bottom: 0.5rem;">
                  <strong>Type:</strong> ${wetlandType}
                </div>
          `;

          if (attribute) {
            popupContent += `
                <div style="margin-bottom: 0.5rem;">
                  <strong>Attributes:</strong> ${attribute}
                </div>
            `;
          }

          if (acres) {
            popupContent += `
                <div style="margin-bottom: 0.5rem;">
                  <strong>Size:</strong> ${parseFloat(acres).toFixed(2)} acres
                </div>
            `;
          }

          if (weblink) {
            popupContent += `
                <div style="margin-top: 0.75rem;">
                  <a href="${weblink}" target="_blank" rel="noopener noreferrer" 
                     style="color: var(--color-primary); text-decoration: none; font-weight: 500;">
                    View Details on Wetlands Mapper →
                  </a>
                </div>
            `;
          }

          popupContent += `
              </div>
            </div>
          `;

          // Remove existing popup if any
          if (wetlandPopup) {
            map.removeLayer(wetlandPopup);
          }

          // Create and show new popup
          const popup = L.popup()
            .setLatLng(e.latlng)
            .setContent(popupContent)
            .openOn(map);

          setWetlandPopup(popup);
        } else {
          // No wetland feature found at this location
          console.log('No wetland feature found at clicked location');
        }
      } catch (error) {
        console.error('Error fetching wetland info:', error);
      }
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
      if (wetlandPopup) {
        map.removeLayer(wetlandPopup);
      }
    };
  }, [map, enabled]);

  return null;
}

// Component to handle DEC Wetlands layer using esri-leaflet
function DECWetlandsLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const [wetlandPopup, setWetlandPopup] = useState<L.Popup | null>(null);

  useEffect(() => {
    const layer = Esri.dynamicMapLayer({
      url: 'https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer',
      opacity: 0.6,
      f: 'image'
    });

    layer.addTo(map);

    // Add click handler to identify features
    if (!enabled) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const identifyTask = Esri.identifyFeatures({
        url: 'https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer'
      });

      identifyTask
        .on(map)
        .at(e.latlng)
        .tolerance(5)
        .layers('all')
        .run((error: any, featureCollection: any) => {
          if (error) {
            console.error('Error identifying DEC wetland feature:', error);
            return;
          }

          if (featureCollection && featureCollection.features && featureCollection.features.length > 0) {
            const feature = featureCollection.features[0];
            const props = feature.properties;
            const geometry = feature.geometry;

            // Get area in acres
            let areaAcres = 'N/A';

            // First try to get area from SHAPE.AREA property (in square meters)
            // Note: The value might be a string, so we need to parse it
            if (props['SHAPE.AREA']) {
              const areaM2 = parseFloat(props['SHAPE.AREA']);
              if (!isNaN(areaM2)) {
                // Convert from square meters to acres (1 acre = 4046.86 m²)
                areaAcres = (areaM2 / 4046.86).toFixed(2);
              }
            }
            // Fallback: try SHAPE_AREA (alternative field name)
            else if (props['SHAPE_AREA']) {
              const areaM2 = parseFloat(props['SHAPE_AREA']);
              if (!isNaN(areaM2)) {
                areaAcres = (areaM2 / 4046.86).toFixed(2);
              }
            }
            // Fallback: try ACRES if available
            else if (props['ACRES']) {
              const acres = parseFloat(props['ACRES']);
              if (!isNaN(acres)) {
                areaAcres = acres.toFixed(2);
              }
            }
            // Last resort: calculate from geometry
            else if (geometry && geometry.coordinates) {
              try {
                // Create a Leaflet polygon from GeoJSON to calculate area
                const polygon = L.geoJSON(geometry);
                // Get area in square meters
                let areaM2 = 0;
                polygon.eachLayer((layer: any) => {
                  if (layer.getLatLngs) {
                    const latLngs = layer.getLatLngs()[0];
                    // Calculate area using spherical geometry
                    areaM2 = (L as any).GeometryUtil.geodesicArea(latLngs);
                  }
                });
                // Convert to acres (1 acre = 4046.86 m²)
                if (areaM2 > 0) {
                  areaAcres = (areaM2 / 4046.86).toFixed(2);
                }
              } catch (err) {
                console.error('Error calculating area:', err);
              }
            }


            // Build popup content
            let popupContent = `
              <div style="padding: 0.5rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">
                  🌿 NYS DEC Wetland Information
                </h3>
                <div style="font-size: 0.875rem; color: var(--text-primary);">
            `;

            // Add wetland name if available
            if (props.NAME) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Name:</strong> ${props.NAME}
                  </div>
              `;
            }

            // Add wetland ID if available
            if (props.WETID_CNTY) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Wetland ID:</strong> ${props.WETID_CNTY}
                  </div>
              `;
            }

            // Add calculated area
            popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Area:</strong> ${areaAcres} acres
                  </div>
            `;

            // Add class if available
            if (props.CLASS) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Class:</strong> ${props.CLASS}
                  </div>
              `;
            }

            // Add regulatory status note
            popupContent += `
                  <div style="margin-top: 0.75rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 0.375rem; font-size: 0.8125rem;">
                    <strong>Note:</strong> This is informational mapping only. For regulatory determinations, 
                    <a href="https://dec.ny.gov/nature/waterbodies/wetlands/freshwater-wetlands-program" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style="color: var(--color-primary); text-decoration: none; font-weight: 500;">
                      contact DEC
                    </a>.
                  </div>
            `;
            popupContent += `
                </div>
              </div>
            `;

            // Remove existing popup if any
            if (wetlandPopup) {
              map.removeLayer(wetlandPopup);
            }

            // Create and show new popup
            const popup = L.popup()
              .setLatLng(e.latlng)
              .setContent(popupContent)
              .openOn(map);

            setWetlandPopup(popup);
          }
        });
    };

    if (!enabled) return;

    map.on('click', handleClick);

    return () => {
      map.removeLayer(layer);
      map.off('click', handleClick);
      if (wetlandPopup) {
        map.removeLayer(wetlandPopup);
      }
    };
  }, [map, wetlandPopup]);

  return null;
}

// Component to handle Tax Parcel layer using esri-leaflet with EAF Mapper source
function TaxParcelLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const [parcelPopup, setParcelPopup] = useState<L.Popup | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const layer = Esri.dynamicMapLayer({
      url: 'https://gisservices.dec.ny.gov/arcgis/rest/services/EAF/EAF_Mapper/MapServer',
      layers: [1], // Layer 1 is the Tax Parcels layer
      opacity: 0.7,
      f: 'image'
    });

    layer.addTo(map);

    // Add click handler to identify parcel features
    const handleClick = (e: L.LeafletMouseEvent) => {
      const identifyTask = Esri.identifyFeatures({
        url: 'https://gisservices.dec.ny.gov/arcgis/rest/services/EAF/EAF_Mapper/MapServer'
      });

      identifyTask
        .on(map)
        .at(e.latlng)
        .tolerance(3)
        .layers('visible:1') // Only query layer 1 (Tax Parcels)
        .run((error: any, featureCollection: any) => {
          if (error) {
            console.error('Error identifying tax parcel:', error);
            return;
          }

          if (featureCollection && featureCollection.features && featureCollection.features.length > 0) {
            const feature = featureCollection.features[0];
            const props = feature.properties;

            // Build popup content with parcel information
            let popupContent = `
              <div style="padding: 0.5rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">
                  📋 Tax Parcel Information
                </h3>
                <div style="font-size: 0.875rem; color: var(--text-primary);">
            `;

            // Add Print Key (parcel identifier)
            if (props.PRINT_KEY) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Parcel ID:</strong> ${props.PRINT_KEY}
                  </div>
              `;
            }

            // Add SBL (Section-Block-Lot)
            if (props.SBL) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>SBL:</strong> ${props.SBL}
                  </div>
              `;
            }

            // Add County name
            if (props.COUNTY_NAME) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>County:</strong> ${props.COUNTY_NAME}
                  </div>
              `;
            }

            // Add Municipality name
            if (props.MUNI_NAME || props.CITYTOWN_NAME) {
              const muniName = props.MUNI_NAME || props.CITYTOWN_NAME;
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Municipality:</strong> ${muniName}
                  </div>
              `;
            }

            // Add SWIS code
            if (props.SWIS) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>SWIS:</strong> ${props.SWIS}
                  </div>
              `;
            }

            // Add Roll Year
            if (props.ROLL_YR) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Roll Year:</strong> ${props.ROLL_YR}
                  </div>
              `;
            }

            // Add Spatial Year
            if (props.SPATIAL_YR) {
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Spatial Year:</strong> ${props.SPATIAL_YR}
                  </div>
              `;
            }

            // Add area if available
            if (props.Shape_Area) {
              const areaAcres = (props.Shape_Area / 4046.86).toFixed(2);
              popupContent += `
                  <div style="margin-bottom: 0.5rem;">
                    <strong>Area:</strong> ${areaAcres} acres
                  </div>
              `;
            }

            popupContent += `
                </div>
              </div>
            `;

            // Remove existing popup if any
            if (parcelPopup) {
              map.removeLayer(parcelPopup);
            }

            // Create and show new popup
            const popup = L.popup()
              .setLatLng(e.latlng)
              .setContent(popupContent)
              .openOn(map);

            setParcelPopup(popup);
          }
        });
    };

    map.on('click', handleClick);

    return () => {
      map.removeLayer(layer);
      map.off('click', handleClick);
      if (parcelPopup) {
        map.removeLayer(parcelPopup);
      }
    };
  }, [map, enabled, parcelPopup]);

  return null;
}

// Component to update map view when search coordinates change
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}


const MILES_TO_METERS = 1609.34;

export default function ObservationMap({ observations, searchCoordinates, radius = 0.5, hoveredSpecies }: ObservationMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapType>('topo');
  const [showNWI, setShowNWI] = useState(false);
  const [showParcels, setShowParcels] = useState(true);
  const [showInfoWetlands, setShowInfoWetlands] = useState(true);

  const toggleParcels = () => {
    setShowParcels(!showParcels);
  };

  // Memoize center to prevent unnecessary map re-centering
  const center: [number, number] = useMemo(() =>
    searchCoordinates ? [searchCoordinates.lat, searchCoordinates.lon] : [0, 0],
    [searchCoordinates?.lat, searchCoordinates?.lon]
  );

  // Prevent hydration errors by only rendering map on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="map-container" style={{ height: '600px', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  // Helper functions to check observation type
  const isGBIFObservation = (obs: iNaturalistObservation | GBIFObservation): obs is GBIFObservation => {
    return 'key' in obs && 'decimalLatitude' in obs;
  };

  const isObscured = (obs: iNaturalistObservation | GBIFObservation): boolean => {
    if (isGBIFObservation(obs)) {
      return obs.coordinateUncertaintyInMeters !== undefined && obs.coordinateUncertaintyInMeters > 10000;
    } else {
      return !!(obs.obscured || obs.coordinates_obscured || (obs.geoprivacy && obs.geoprivacy !== 'open'));
    }
  };

  const hasValidCoordinates = (obs: iNaturalistObservation | GBIFObservation): boolean => {
    if (isGBIFObservation(obs)) {
      return obs.decimalLatitude !== undefined && obs.decimalLongitude !== undefined;
    } else {
      if (obs.latitude && obs.longitude) return true;
      if (obs.geojson?.coordinates && obs.geojson.coordinates.length === 2) return true;
      return false;
    }
  };

  // Filter observations that have valid coordinates AND are not obscured
  const validObservations = observations.filter(obs => {
    if (isObscured(obs)) return false;
    return hasValidCoordinates(obs);
  });

  // Count obscured observations
  const obscuredCount = observations.filter(obs => isObscured(obs)).length;
  const totalObservations = observations.length;
  const plotted = validObservations.length;

  if (!searchCoordinates) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Map Control Panel - Above the map */}
      <div style={{
        marginBottom: '0.75rem',
        background: 'var(--bg-primary)',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Basemap Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}>
              Basemap:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedBasemap('topo')}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: selectedBasemap === 'topo' ? '#2563eb' : 'white',
                  color: selectedBasemap === 'topo' ? 'white' : '#374151',
                  border: '1.5px solid',
                  borderColor: selectedBasemap === 'topo' ? '#2563eb' : '#d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: selectedBasemap === 'topo' ? '0 1px 3px rgba(37, 99, 235, 0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (selectedBasemap !== 'topo') {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBasemap !== 'topo') {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                🗺️ Topo
              </button>
              <button
                onClick={() => setSelectedBasemap('street')}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: selectedBasemap === 'street' ? '#2563eb' : 'white',
                  color: selectedBasemap === 'street' ? 'white' : '#374151',
                  border: '1.5px solid',
                  borderColor: selectedBasemap === 'street' ? '#2563eb' : '#d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: selectedBasemap === 'street' ? '0 1px 3px rgba(37, 99, 235, 0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (selectedBasemap !== 'street') {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBasemap !== 'street') {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                🛣️ Street
              </button>
              <button
                onClick={() => setSelectedBasemap('satellite')}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: selectedBasemap === 'satellite' ? '#2563eb' : 'white',
                  color: selectedBasemap === 'satellite' ? 'white' : '#374151',
                  border: '1.5px solid',
                  borderColor: selectedBasemap === 'satellite' ? '#2563eb' : '#d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: selectedBasemap === 'satellite' ? '0 1px 3px rgba(37, 99, 235, 0.3)' : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (selectedBasemap !== 'satellite') {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedBasemap !== 'satellite') {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                🛰️ Satellite
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{
            width: '1px',
            height: '1.5rem',
            background: 'var(--border-color)',
          }} />

          {/* Layer Overlays Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.025em',
            }}>
              Overlays:
            </span>
            <button
              onClick={() => setShowNWI(!showNWI)}
              style={{
                padding: '0.375rem 0.75rem',
                background: showNWI ? '#10b981' : 'white',
                color: showNWI ? 'white' : '#374151',
                border: '1.5px solid',
                borderColor: showNWI ? '#10b981' : '#d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: showNWI ? '0 1px 3px rgba(16, 185, 129, 0.3)' : 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!showNWI) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!showNWI) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {showNWI ? '✓' : '○'} Wetlands
            </button>
            <button
              onClick={toggleParcels}
              style={{
                padding: '0.375rem 0.75rem',
                background: showParcels ? '#10b981' : 'white',
                color: showParcels ? 'white' : '#374151',
                border: '1.5px solid',
                borderColor: showParcels ? '#10b981' : '#d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: showParcels ? '0 1px 3px rgba(16, 185, 129, 0.3)' : 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!showParcels) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!showParcels) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {showParcels ? '✓' : '○'} Tax Parcels
            </button>
            <button
              onClick={() => setShowInfoWetlands(!showInfoWetlands)}
              style={{
                padding: '0.375rem 0.75rem',
                background: showInfoWetlands ? '#10b981' : 'white',
                color: showInfoWetlands ? 'white' : '#374151',
                border: '1.5px solid',
                borderColor: showInfoWetlands ? '#10b981' : '#d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: showInfoWetlands ? '0 1px 3px rgba(16, 185, 129, 0.3)' : 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!showInfoWetlands) {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.background = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (!showInfoWetlands) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              {showInfoWetlands ? '✓' : '○'} DEC Wetlands
            </button>
          </div>
        </div>
      </div>

      {totalObservations > 0 && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.875rem 1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg
              style={{ width: '1.25rem', height: '1.25rem', color: 'var(--accent-primary)', flexShrink: 0 }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>{plotted}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalObservations}</strong> observations plotted on map
            </span>
          </div>
          {obscuredCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg
                style={{ width: '1rem', height: '1rem', color: 'var(--color-accent)', flexShrink: 0 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span style={{ fontSize: '0.85rem' }}>
                {obscuredCount} obscured
              </span>
            </div>
          )}
        </div>
      )}

      <div className="map-wrapper" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        {/* Info hint */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          background: 'var(--bg-primary)',
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          pointerEvents: 'none',
        }}>
          💡 Click the map to view wetland information
        </div>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%', borderRadius: '0.5rem', cursor: 'pointer' }}
          scrollWheelZoom={true}
        >
          <MapUpdater center={center} zoom={13} />
          <WetlandInfoHandler enabled={showNWI} />

          {/* Render selected basemap */}
          {selectedBasemap === 'topo' && (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
            />
          )}
          {selectedBasemap === 'street' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}
          {selectedBasemap === 'satellite' && (
            <>
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
                url="https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={22}
                maxNativeZoom={19}
              />
              {/* Add labels overlay for satellite view */}
              <TileLayer
                attribution=''
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.5}
              />
            </>
          )}

          {/* Conditionally render Tax Parcel Layer using EAF Mapper */}
          {showParcels && (
            <TaxParcelLayer enabled={showParcels} />
          )}

          {/* Conditionally render NWI Layer */}
          {showNWI && (
            <WMSTileLayer
              key={`nwi-${selectedBasemap}`}
              url="https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer"
              layers="1"
              format="image/png"
              transparent={true}
              version="1.1.1"
              attribution='<a href="https://www.fws.gov/program/national-wetlands-inventory" target="_blank">USFWS National Wetlands Inventory</a>'
              opacity={0.6}
              maxZoom={22}
              maxNativeZoom={19}
            />
          )}

          {/* Conditionally render DEC Informational Wetlands Layer */}
          {showInfoWetlands && (
            <DECWetlandsLayer enabled={showInfoWetlands} />
          )}

          {/* Search center marker */}
          <CircleMarker
            center={center}
            radius={8}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div>
                <strong>Search Center</strong>
              </div>
            </Popup>
          </CircleMarker>

          {/* Search radius circle */}
          {radius && (
            <Circle
              center={center}
              radius={radius * MILES_TO_METERS}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '5, 5',
              }}
            />
          )}

          {/* Observation markers */}
          {validObservations
            .sort((a, b) => {
              // Sort so hovered species render last (appear on top)
              const aScientificName = isGBIFObservation(a) ? a.scientificName : (a.taxon?.name || '');
              const bScientificName = isGBIFObservation(b) ? b.scientificName : (b.taxon?.name || '');
              const aIsHovered = hoveredSpecies === aScientificName;
              const bIsHovered = hoveredSpecies === bScientificName;

              if (aIsHovered && !bIsHovered) return 1;
              if (!aIsHovered && bIsHovered) return -1;
              return 0;
            })
            .map((obs, index) => {
              // Get coordinates from either direct fields or geojson
              let lat: number, lng: number;
              if (isGBIFObservation(obs)) {
                if (!obs.decimalLatitude || !obs.decimalLongitude) return null;
                lat = obs.decimalLatitude;
                lng = obs.decimalLongitude;
              } else {
                if (obs.latitude && obs.longitude) {
                  lat = obs.latitude;
                  lng = obs.longitude;
                } else if (obs.geojson?.coordinates) {
                  // GeoJSON format is [longitude, latitude]
                  lng = obs.geojson.coordinates[0];
                  lat = obs.geojson.coordinates[1];
                } else {
                  return null; // Skip this observation
                }
              }

              const position: [number, number] = [lat, lng];
              const commonName = isGBIFObservation(obs)
                ? (obs.vernacularName || obs.scientificName || 'Unknown species')
                : (obs.taxon?.preferred_common_name || obs.species_guess || 'Unknown species');
              const scientificName = isGBIFObservation(obs) ? obs.scientificName : (obs.taxon?.name || '');
              const isHovered = hoveredSpecies === scientificName;
              const isDimmed = hoveredSpecies && !isHovered;

              // Color code by conservation status
              let color = '#22c55e'; // default green
              if (obs.stateProtection === 'Endangered') {
                color = '#dc2626'; // red
              } else if (obs.stateProtection === 'Threatened') {
                color = '#f59e0b'; // orange
              } else if (obs.stateProtection === 'Special Concern') {
                color = '#eab308'; // yellow
              } else if (obs.conservationNeed) {
                color = '#3b82f6'; // blue
              }

              // If dimmed, use gray
              const displayColor = isDimmed ? '#6b7280' : color;

              const obsKey = isGBIFObservation(obs) ? `gbif-${obs.key}` : `inat-${obs.id}`;

              return (
                <CircleMarker
                  key={`${obsKey}-${index}`}
                  center={position}
                  radius={isHovered ? 10 : 6}
                  pathOptions={{
                    color: displayColor,
                    fillColor: displayColor,
                    fillOpacity: isDimmed ? 0.1 : (isHovered ? 1 : 0.6),
                    weight: isHovered ? 3 : 2,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: '200px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {commonName}
                      </div>
                      {scientificName && (
                        <div style={{ fontStyle: 'italic', fontSize: '0.875rem', marginBottom: '4px' }}>
                          {scientificName}
                        </div>
                      )}
                      {(() => {
                        if (isGBIFObservation(obs)) {
                          const date = obs.eventDate ? obs.eventDate.split('T')[0] :
                            (obs.year ? `${obs.year}-${String(obs.month || 1).padStart(2, '0')}-${String(obs.day || 1).padStart(2, '0')}` : null);
                          return date ? (
                            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '4px' }}>
                              {date}
                            </div>
                          ) : null;
                        } else {
                          return obs.observed_on_string ? (
                            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '4px' }}>
                              {obs.observed_on_string}
                            </div>
                          ) : null;
                        }
                      })()}
                      {obs.stateProtection && (
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: color,
                          color: 'white',
                          display: 'inline-block',
                          marginTop: '4px',
                        }}>
                          {obs.stateProtection}
                        </div>
                      )}
                      {obs.conservationNeed && !obs.stateProtection && (
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: color,
                          color: 'white',
                          display: 'inline-block',
                          marginTop: '4px',
                        }}>
                          SGCN
                        </div>
                      )}
                      {(() => {
                        if (isGBIFObservation(obs)) {
                          return obs.key ? (
                            <a
                              href={`https://www.gbif.org/occurrence/${obs.key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                marginTop: '8px',
                                fontSize: '0.875rem',
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                            >
                              View on GBIF →
                            </a>
                          ) : null;
                        } else {
                          return obs.uri ? (
                            <a
                              href={obs.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'block',
                                marginTop: '8px',
                                fontSize: '0.875rem',
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                            >
                              View on iNaturalist →
                            </a>
                          ) : null;
                        }
                      })()}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>


    </div>
  );
}

