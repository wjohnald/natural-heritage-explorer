'use client';

import { useState } from 'react';
import AddressSearch from '@/components/AddressSearch';
import ObservationList from '@/components/ObservationList';
import { geocodeAddress } from '@/services/geocoding';
import { fetchObservations } from '@/services/inaturalist';
import { iNaturalistObservation } from '@/types';

export default function Home() {
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [radius, setRadius] = useState(3); // Default 3 miles

  const handleSearch = async (address: string, searchRadius: number) => {
    setLoading(true);
    setError(null);
    setObservations([]);
    setSearchedLocation(null);
    setProgressCurrent(0);
    setProgressTotal(0);

    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress(address);
      setSearchedLocation(geocodeResult.displayName);

      // Step 2: Fetch observations with specified radius
      const results = await fetchObservations(
        geocodeResult.coordinates,
        searchRadius,
        (current, total) => {
          setProgressCurrent(current);
          setProgressTotal(total);
        }
      );

      setObservations(results);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="main-container">
      <div className="two-column-layout">
        {/* Left Column - Search */}
        <div className="search-column">
          <AddressSearch
            onSearch={handleSearch}
            loading={loading}
            radius={radius}
            onRadiusChange={setRadius}
          />

          {error && (
            <div className="error-container">
              <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="error-title">Error</h3>
                <p className="error-message">{error}</p>
              </div>
            </div>
          )}

          {searchedLocation && !error && (
            <div className="location-display">
              <svg className="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div>
                <p className="location-label">Searching near:</p>
                <p className="location-text">{searchedLocation}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="results-column">
          <ObservationList
            observations={observations}
            loading={loading}
            totalCount={progressTotal}
            currentCount={progressCurrent}
          />
        </div>
      </div>

      <footer className="footer">
        <p className="footer-text">
          Data provided by{' '}
          <a
            href="https://www.inaturalist.org"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            iNaturalist
          </a>
          {' • '}
          Geocoding by{' '}
          <a
            href="https://www.openstreetmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            OpenStreetMap
          </a>
        </p>
      </footer>
    </main>
  );
}
