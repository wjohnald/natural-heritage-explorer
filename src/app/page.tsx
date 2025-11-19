'use client';

import { useState } from 'react';
import AddressSearch from '@/components/AddressSearch';
import ObservationList from '@/components/ObservationList';
import { geocodeAddress } from '@/services/geocoding';
import { fetchObservations } from '@/services/inaturalist';
import { iNaturalistObservation, Coordinates, GroupedObservation, SortField, SortOrder, ObservationResponse } from '@/types';
import { groupObservations } from '@/utils/grouping';
import ObservationGroupRow from '@/components/ObservationGroupRow';
import ObservationFilters from '@/components/ObservationFilters';

export default function Home() {
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [radius, setRadius] = useState(3); // Default 3 miles
  const [searchCoordinates, setSearchCoordinates] = useState<Coordinates | null>(null);

  // Filter and Sort State
  const [filterTerm, setFilterTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showProtectedOnly, setShowProtectedOnly] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());

  // Get unique conservation statuses from observations
  const getAvailableStatuses = (): string[] => {
    const statusSet = new Set<string>();
    observations.forEach(obs => {
      if (obs.stateProtection) {
        statusSet.add(obs.stateProtection);
      }
    });
    return Array.from(statusSet).sort();
  };

  // Get unique conservation statuses from observations
  const availableStatuses = ["Endangered", "Threatened", "Special Concern"];

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleShowProtectedOnlyChange = (value: boolean) => {
    setShowProtectedOnly(value);
    if (!value) {
      // Clear selected statuses when unchecking "protected only"
      setSelectedStatuses(new Set());
    }
  };

  const getFilteredAndSortedGroups = () => {
    const groups = groupObservations(observations, searchCoordinates || undefined);

    // Filter
    let filtered = groups;

    // Filter by search term
    if (filterTerm.trim()) {
      const term = filterTerm.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.commonName.toLowerCase().includes(term) ||
          g.scientificName.toLowerCase().includes(term)
      );
    }

    // Filter by conservation status
    if (showProtectedOnly) {
      filtered = filtered.filter(g => {
        const hasProtection = g.observations.some(obs => obs.stateProtection);
        if (!hasProtection) return false;

        // If specific statuses are selected, check if observation matches any
        if (selectedStatuses.size > 0) {
          return g.observations.some(obs => 
            obs.stateProtection && selectedStatuses.has(obs.stateProtection)
          );
        }

        return true;
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'count':
          comparison = a.totalCount - b.totalCount;
          break;
        case 'distance':
          comparison = a.closestDistance - b.closestDistance;
          break;
        case 'date':
          // Simple string comparison for ISO dates works
          if (a.mostRecentDate < b.mostRecentDate) comparison = -1;
          if (a.mostRecentDate > b.mostRecentDate) comparison = 1;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredAndSortedGroups = getFilteredAndSortedGroups();

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
      const { lat, lon } = geocodeResult.coordinates;
      setSearchCoordinates({ lat, lon });

      // 2. Fetch observations sequentially
      let currentPage = 1;
      let hasMore = true;
      let allObservations: iNaturalistObservation[] = [];

      while (hasMore) {
        const response = await fetch(
          `/api/observations?lat=${lat}&lon=${lon}&radius=${searchRadius}&page=${currentPage}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data: ObservationResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const newObservations = data.observations;
        allObservations = [...allObservations, ...newObservations];

        // Update state incrementally
        setObservations(prev => [...prev, ...newObservations]);

        // Update progress
        setProgressCurrent(allObservations.length);
        setProgressTotal(data.total_results);

        // Check if we should fetch more
        const totalResults = data.total_results;
        const perPage = 200; // Should match API constant

        if (allObservations.length >= totalResults || newObservations.length === 0) {
          hasMore = false;
        } else {
          currentPage++;
          // Optional: Add a small delay to be nice to the API if needed, though the server handles single requests fast.
          // But since we are looping on client, we might want to yield to UI.
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          <div className="results-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
                <p className="loading-text">
                  {progressTotal && progressCurrent
                    ? `Loading observations... ${progressCurrent} of ${progressTotal}`
                    : 'Searching for observations...'}
                </p>
              </div>
            ) : observations.length > 0 ? (
              <div className="observations-section">
                <div className="observations-header">
                  <h2 className="observations-title">
                    Found {observations.length.toLocaleString()} observation{observations.length !== 1 ? 's' : ''}
                  </h2>
                  <p className="observations-subtitle">
                    Within {radius} miles of the searched location
                  </p>
                </div>

                <ObservationFilters
                  searchTerm={filterTerm}
                  onSearchChange={setFilterTerm}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={(field, order) => {
                    setSortBy(field);
                    setSortOrder(order);
                  }}
                  availableStatuses={availableStatuses}
                  selectedStatuses={selectedStatuses}
                  onStatusToggle={handleStatusToggle}
                  showProtectedOnly={showProtectedOnly}
                  onShowProtectedOnlyChange={handleShowProtectedOnlyChange}
                />

                <div className="observations-list">
                  {filteredAndSortedGroups.length > 0 ? (
                    filteredAndSortedGroups.map((group, index) => (
                      <ObservationGroupRow
                        key={`${group.scientificName}-${index}`}
                        group={group}
                        searchCoordinates={searchCoordinates || undefined}
                      />
                    ))
                  ) : (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p className="text-secondary">No species match your filter.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : searchedLocation && !error ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="empty-title">No observations found</h3>
                <p className="empty-description">
                  Try searching for a different location or check back later.
                </p>
              </div>
            ) : null}
          </div>
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
