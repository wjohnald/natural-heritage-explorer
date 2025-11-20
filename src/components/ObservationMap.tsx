'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import { iNaturalistObservation, GBIFObservation, Coordinates } from '@/types';
import 'leaflet/dist/leaflet.css';

interface ObservationMapProps {
  observations: (iNaturalistObservation | GBIFObservation)[];
  searchCoordinates?: Coordinates;
  radius?: number; // in miles
  hoveredSpecies?: string | null;
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

  if (!searchCoordinates) {
    return null;
  }

  if (validObservations.length === 0 && obscuredCount === 0) {
    return (
      <div className="map-wrapper" style={{ marginBottom: '2rem' }}>
        <div style={{ 
          padding: '2rem', 
          background: 'var(--bg-secondary)', 
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <p>Map unavailable: No observations have location coordinates.</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [searchCoordinates.lat, searchCoordinates.lon];
  
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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

      {obscuredCount > 0 && (
        <div style={{
          padding: '0.875rem 1.25rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
        }}>
          <svg 
            style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-accent)', flexShrink: 0 }}
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
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>{obscuredCount}</strong> observation{obscuredCount !== 1 ? 's' : ''} not shown on map due to obscured coordinates (for species protection)
          </span>
        </div>
      )}
    </div>
  );
}

