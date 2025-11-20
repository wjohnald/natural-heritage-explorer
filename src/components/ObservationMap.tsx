'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import { iNaturalistObservation, Coordinates } from '@/types';
import 'leaflet/dist/leaflet.css';

interface ObservationMapProps {
  observations: iNaturalistObservation[];
  searchCoordinates?: Coordinates;
  radius?: number; // in miles
}

const MILES_TO_METERS = 1609.34;

export default function ObservationMap({ observations, searchCoordinates, radius = 0.5 }: ObservationMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration errors by only rendering map on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="map-container" style={{ height: '400px', background: '#e5e7eb', borderRadius: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  // Filter observations that have valid coordinates
  const validObservations = observations.filter(obs => {
    // Check for direct lat/lng
    if (obs.latitude && obs.longitude) return true;
    // Check for geojson coordinates
    if (obs.geojson?.coordinates && obs.geojson.coordinates.length === 2) return true;
    return false;
  });

  if (!searchCoordinates) {
    return null;
  }

  if (validObservations.length === 0) {
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

  // Calculate bounds to fit all observations
  const lats = validObservations.map(obs => obs.latitude!);
  const lngs = validObservations.map(obs => obs.longitude!);
  
  const center: [number, number] = [searchCoordinates.lat, searchCoordinates.lon];
  
  return (
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
        {validObservations.map((obs, index) => {
          // Get coordinates from either direct fields or geojson
          let lat: number, lng: number;
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

          const position: [number, number] = [lat, lng];
          const commonName = obs.taxon?.preferred_common_name || obs.species_guess || 'Unknown species';
          const scientificName = obs.taxon?.name || '';
          
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

          return (
            <CircleMarker
              key={`${obs.id}-${index}`}
              center={position}
              radius={6}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 2,
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
                  {obs.observed_on_string && (
                    <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '4px' }}>
                      {obs.observed_on_string}
                    </div>
                  )}
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
                  {obs.uri && (
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
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

