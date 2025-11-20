'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, WMSTileLayer, CircleMarker, Popup, Circle, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import { iNaturalistObservation, GBIFObservation, Coordinates } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ObservationMapProps {
  observations: (iNaturalistObservation | GBIFObservation)[];
  searchCoordinates?: Coordinates;
  radius?: number; // in miles
  hoveredSpecies?: string | null;
}

// Component to handle NWI layer clicks and show wetland info
function WetlandInfoHandler() {
  const map = useMap();
  const [wetlandPopup, setWetlandPopup] = useState<L.Popup | null>(null);

  useEffect(() => {
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
  }, [map, wetlandPopup]);

  return null;
}

const MILES_TO_METERS = 1609.34;

export default function ObservationMap({ observations, searchCoordinates, radius = 0.5, hoveredSpecies }: ObservationMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only rendering map on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="map-container" style={{ height: '400px', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
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

  const center: [number, number] = [searchCoordinates.lat, searchCoordinates.lon];

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="map-wrapper" style={{ position: 'relative' }}>
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
          style={{ height: '400px', width: '100%', borderRadius: '0.5rem', cursor: 'pointer' }}
          scrollWheelZoom={true}
        >
          <WetlandInfoHandler />
          
          <LayersControl position="topright">
            {/* Base Layers */}
            <LayersControl.BaseLayer checked name="Topographic">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Street Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            {/* Overlay Layers */}
            <LayersControl.Overlay checked name="National Wetlands Inventory">
              <WMSTileLayer
                url="https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/services/Wetlands/MapServer/WMSServer"
                layers="1"
                format="image/png"
                transparent={true}
                version="1.1.1"
                attribution='<a href="https://www.fws.gov/program/national-wetlands-inventory" target="_blank">USFWS National Wetlands Inventory</a>'
                opacity={0.6}
              />
            </LayersControl.Overlay>
          </LayersControl>

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

      {totalObservations > 0 && (
        <div style={{
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
    </div>
  );
}

