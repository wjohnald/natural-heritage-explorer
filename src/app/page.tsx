'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import AddressSearch from '@/components/AddressSearch';
import { geocodeAddress } from '@/services/geocoding';
import {
  iNaturalistObservation,
  GBIFObservation,
  Coordinates,
  SortField,
  SortOrder,
  ObservationResponse,
  GBIFObservationResponse
} from '@/types';
import { groupObservations } from '@/utils/grouping';
import { groupGBIFObservations } from '@/utils/gbifGrouping';
import ObservationGroupRow from '@/components/ObservationGroupRow';
import GBIFObservationGroupRow from '@/components/GBIFObservationGroupRow';
import ObservationFilters from '@/components/ObservationFilters';
import ConservationFilters from '@/components/ConservationFilters';
import SpeciesListWrapper from '@/components/SpeciesListWrapper';
import GBIFSpeciesListWrapper from '@/components/GBIFSpeciesListWrapper';

// Dynamically import the map component to avoid SSR issues with Leaflet
const ObservationMap = dynamic(() => import('@/components/ObservationMap'), {
  ssr: false,
  loading: () => (
    <div className="map-container" style={{ height: '400px', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [gbifObservations, setGbifObservations] = useState<GBIFObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gbifLoading, setGbifLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gbifError, setGbifError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [gbifProgressCurrent, setGbifProgressCurrent] = useState(0);
  const [gbifProgressTotal, setGbifProgressTotal] = useState(0);
  const [radius, setRadius] = useState(0.5); // Default 0.5 miles
  const [searchCoordinates, setSearchCoordinates] = useState<Coordinates | null>(null);

  // Filter and Sort State
  const [filterTerm, setFilterTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedVernalPoolStatuses, setSelectedVernalPoolStatuses] = useState<Set<string>>(new Set());
  const [showSGCN, setShowSGCN] = useState(false);
  const [hoveredSpecies, setHoveredSpecies] = useState<string | null>(null);

  // Get unique conservation statuses from observations
  const availableStatuses = ["Endangered", "Threatened", "Special Concern"];
  const availableVernalPoolStatuses = ["Obligate", "Facultative"];

  // Check if any observations have SGCN status
  const hasSGCN = observations.some(obs => obs.conservationNeed) || gbifObservations.some(obs => obs.conservationNeed);

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

  const handleVernalPoolStatusToggle = (status: string) => {
    setSelectedVernalPoolStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleSGCNToggle = () => {
    setShowSGCN(prev => !prev);
  };

  // Filter individual observations for the map
  const getFilteredObservations = () => {
    let filtered = observations;

    // Filter by search term
    if (filterTerm.trim()) {
      const term = filterTerm.toLowerCase();
      filtered = filtered.filter((obs) => {
        const commonName = obs.taxon?.preferred_common_name || obs.species_guess || '';
        const scientificName = obs.taxon?.name || '';
        return (
          commonName.toLowerCase().includes(term) ||
          scientificName.toLowerCase().includes(term)
        );
      });
    }

    // Filter by conservation status and vernal pool status
    if (selectedStatuses.size > 0 || showSGCN || selectedVernalPoolStatuses.size > 0) {
      filtered = filtered.filter(obs => {
        const matchesStatus = selectedStatuses.size > 0 &&
          obs.stateProtection &&
          selectedStatuses.has(obs.stateProtection);

        const matchesSGCN = showSGCN && obs.conservationNeed;

        const matchesVernalPool = selectedVernalPoolStatuses.size > 0 &&
          obs.vernalPoolStatus &&
          selectedVernalPoolStatuses.has(obs.vernalPoolStatus);

        return matchesStatus || matchesSGCN || matchesVernalPool;
      });
    }

    return filtered;
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

    // Filter by conservation status and vernal pool status
    if (selectedStatuses.size > 0 || showSGCN || selectedVernalPoolStatuses.size > 0) {
      filtered = filtered.filter(g => {
        // Check if species matches any selected protection status
        const matchesStatus = selectedStatuses.size > 0 && g.observations.some(obs =>
          obs.stateProtection && selectedStatuses.has(obs.stateProtection)
        );

        // Check if species has SGCN designation (when SGCN filter is active)
        const matchesSGCN = showSGCN && g.observations.some(obs => obs.conservationNeed);

        // Check if species matches any selected vernal pool status
        const matchesVernalPool = selectedVernalPoolStatuses.size > 0 && g.observations.some(obs =>
          obs.vernalPoolStatus && selectedVernalPoolStatuses.has(obs.vernalPoolStatus)
        );

        // Return true if matches ANY of the selected criteria (OR logic)
        return matchesStatus || matchesSGCN || matchesVernalPool;
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.commonName.localeCompare(b.commonName);
          break;
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
        case 'status':
          // Conservation status priority: Endangered > Threatened > Special Concern > SGCN > None
          const getStatusPriority = (group: typeof a) => {
            const obs = group.observations[0];
            if (obs.stateProtection === 'Endangered') return 6;
            if (obs.stateProtection === 'Threatened') return 5;
            if (obs.stateProtection === 'Special Concern') return 4;
            if (obs.conservationNeed) return 3;
            if (obs.vernalPoolStatus === 'Obligate') return 2;
            if (obs.vernalPoolStatus === 'Facultative') return 1;
            return 0;
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Get filtered GBIF observations for the map
  const getFilteredGBIFObservations = () => {
    let filtered = gbifObservations;

    // Filter by search term
    if (filterTerm.trim()) {
      const term = filterTerm.toLowerCase();
      filtered = filtered.filter((obs) => {
        const commonName = obs.vernacularName || '';
        const scientificName = obs.scientificName || '';
        return (
          commonName.toLowerCase().includes(term) ||
          scientificName.toLowerCase().includes(term)
        );
      });
    }

    // Filter by conservation status and vernal pool status
    if (selectedStatuses.size > 0 || showSGCN || selectedVernalPoolStatuses.size > 0) {
      filtered = filtered.filter(obs => {
        const matchesStatus = selectedStatuses.size > 0 &&
          obs.stateProtection &&
          selectedStatuses.has(obs.stateProtection);

        const matchesSGCN = showSGCN && obs.conservationNeed;

        const matchesVernalPool = selectedVernalPoolStatuses.size > 0 &&
          obs.vernalPoolStatus &&
          selectedVernalPoolStatuses.has(obs.vernalPoolStatus);

        return matchesStatus || matchesSGCN || matchesVernalPool;
      });
    }

    return filtered;
  };

  const getFilteredAndSortedGBIFGroups = () => {
    const groups = groupGBIFObservations(gbifObservations, searchCoordinates || undefined);

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

    // Filter by conservation status and vernal pool status
    if (selectedStatuses.size > 0 || showSGCN || selectedVernalPoolStatuses.size > 0) {
      filtered = filtered.filter(g => {
        const matchesStatus = selectedStatuses.size > 0 && g.observations.some(obs =>
          obs.stateProtection && selectedStatuses.has(obs.stateProtection)
        );

        const matchesSGCN = showSGCN && g.observations.some(obs => obs.conservationNeed);

        const matchesVernalPool = selectedVernalPoolStatuses.size > 0 && g.observations.some(obs =>
          obs.vernalPoolStatus && selectedVernalPoolStatuses.has(obs.vernalPoolStatus)
        );

        return matchesStatus || matchesSGCN || matchesVernalPool;
      });
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.commonName.localeCompare(b.commonName);
          break;
        case 'count':
          comparison = a.totalCount - b.totalCount;
          break;
        case 'distance':
          comparison = a.closestDistance - b.closestDistance;
          break;
        case 'date':
          if (a.mostRecentDate < b.mostRecentDate) comparison = -1;
          if (a.mostRecentDate > b.mostRecentDate) comparison = 1;
          break;
        case 'status':
          const getStatusPriority = (group: typeof a) => {
            const obs = group.observations[0];
            if (obs.stateProtection === 'Endangered') return 6;
            if (obs.stateProtection === 'Threatened') return 5;
            if (obs.stateProtection === 'Special Concern') return 4;
            if (obs.conservationNeed) return 3;
            if (obs.vernalPoolStatus === 'Obligate') return 2;
            if (obs.vernalPoolStatus === 'Facultative') return 1;
            return 0;
          };
          comparison = getStatusPriority(a) - getStatusPriority(b);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredObservations = getFilteredObservations();
  const filteredAndSortedGroups = getFilteredAndSortedGroups();
  const filteredGBIFObservations = getFilteredGBIFObservations();
  const filteredAndSortedGBIFGroups = getFilteredAndSortedGBIFGroups();

  const handleSearch = async (address: string, searchRadius: number) => {
    setLoading(true);
    setGbifLoading(true);
    setError(null);
    setGbifError(null);
    setObservations([]);
    setGbifObservations([]);
    setSearchedLocation(null);
    setProgressCurrent(0);
    setProgressTotal(0);
    setGbifProgressCurrent(0);
    setGbifProgressTotal(0);

    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress(address);
      setSearchedLocation(geocodeResult.displayName);
      const { lat, lon } = geocodeResult.coordinates;
      setSearchCoordinates({ lat, lon });

      // Fetch from both sources in parallel
      const fetchINaturalist = async () => {
        try {
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
            if (allObservations.length >= data.total_results || newObservations.length === 0) {
              hasMore = false;
            } else {
              currentPage++;
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };

      const fetchGBIF = async () => {
        try {
          let currentPage = 1;
          let hasMore = true;
          let allObservations: GBIFObservation[] = [];

          while (hasMore) {
            const response = await fetch(
              `/api/gbif-observations?lat=${lat}&lon=${lon}&radius=${searchRadius}&page=${currentPage}`
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data: GBIFObservationResponse = await response.json();

            if (data.error) {
              throw new Error(data.error);
            }

            const newObservations = data.observations;
            allObservations = [...allObservations, ...newObservations];

            // Update state incrementally
            setGbifObservations(prev => [...prev, ...newObservations]);

            // Update progress
            setGbifProgressCurrent(allObservations.length);
            setGbifProgressTotal(data.total_results);

            // Check if we should fetch more
            if (allObservations.length >= data.total_results || newObservations.length === 0) {
              hasMore = false;
            } else {
              currentPage++;
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (err) {
          setGbifError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setGbifLoading(false);
        }
      };

      // Fetch from both sources in parallel
      await Promise.all([fetchINaturalist(), fetchGBIF()]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      setGbifLoading(false);
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

          {(observations.length > 0 || gbifObservations.length > 0) && (availableStatuses.length > 0 || hasSGCN || availableVernalPoolStatuses.length > 0) && (
            <ConservationFilters
              availableStatuses={availableStatuses}
              selectedStatuses={selectedStatuses}
              onStatusToggle={handleStatusToggle}
              hasSGCN={hasSGCN}
              showSGCN={showSGCN}
              onSGCNToggle={handleSGCNToggle}
              availableVernalPoolStatuses={availableVernalPoolStatuses}
              selectedVernalPoolStatuses={selectedVernalPoolStatuses}
              onVernalPoolStatusToggle={handleVernalPoolStatusToggle}
            />
          )}

          {(observations.length > 0 || gbifObservations.length > 0) && (
            <div style={{ marginTop: '2rem' }}>
              <ObservationFilters
                searchTerm={filterTerm}
                onSearchChange={setFilterTerm}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(field, order) => {
                  setSortBy(field);
                  setSortOrder(order);
                }}
              />
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="results-column">
          <div className="results-container">
            {(loading && observations.length === 0 && gbifObservations.length === 0) ? (
              <div className="loading-container">
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
                <p className="loading-text">Searching for observations...</p>
              </div>
            ) : (observations.length > 0 || gbifObservations.length > 0) ? (
              <div className="observations-section">
                <div className="observations-header">
                  <h2 className="observations-title">
                    {(loading || gbifLoading) ? (
                      <>
                        Loading observations...
                        {loading && progressTotal > 0 && (
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                            (iNaturalist: {observations.length.toLocaleString()}/{progressTotal.toLocaleString()})
                          </span>
                        )}
                        {gbifLoading && gbifProgressTotal > 0 && (
                          <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                            (GBIF: {gbifObservations.length.toLocaleString()}/{gbifProgressTotal.toLocaleString()})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        Found {(observations.length + gbifObservations.length).toLocaleString()} total observation{(observations.length + gbifObservations.length) !== 1 ? 's' : ''}
                      </>
                    )}
                  </h2>
                </div>

                <ObservationMap
                  observations={[...filteredObservations, ...filteredGBIFObservations]}
                  searchCoordinates={searchCoordinates || undefined}
                  radius={radius}
                  hoveredSpecies={hoveredSpecies}
                />

                <div className="observations-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* iNaturalist Data Source */}
                  {filteredAndSortedGroups.length > 0 && (
                    <SpeciesListWrapper groups={filteredAndSortedGroups}>
                      {filteredAndSortedGroups.map((group, index) => (
                        <ObservationGroupRow
                          key={`inat-${group.scientificName}-${index}`}
                          group={group}
                          searchCoordinates={searchCoordinates || undefined}
                          onHover={(scientificName) => setHoveredSpecies(scientificName)}
                          onHoverEnd={() => setHoveredSpecies(null)}
                        />
                      ))}
                      {loading && (
                        <div className="loading-more">
                          <div className="loading-spinner">
                            <div className="spinner"></div>
                          </div>
                          <p className="loading-text">Loading more iNaturalist species...</p>
                        </div>
                      )}
                    </SpeciesListWrapper>
                  )}

                  {/* GBIF Data Source */}
                  {filteredAndSortedGBIFGroups.length > 0 && (
                    <GBIFSpeciesListWrapper groups={filteredAndSortedGBIFGroups}>
                      {filteredAndSortedGBIFGroups.map((group, index) => (
                        <GBIFObservationGroupRow
                          key={`gbif-${group.scientificName}-${index}`}
                          group={group}
                          searchCoordinates={searchCoordinates || undefined}
                          onHover={(scientificName) => setHoveredSpecies(scientificName)}
                          onHoverEnd={() => setHoveredSpecies(null)}
                        />
                      ))}
                      {gbifLoading && (
                        <div className="loading-more">
                          <div className="loading-spinner">
                            <div className="spinner"></div>
                          </div>
                          <p className="loading-text">Loading more GBIF species...</p>
                        </div>
                      )}
                    </GBIFSpeciesListWrapper>
                  )}

                  {/* Empty state when filters return no results */}
                  {filteredAndSortedGroups.length === 0 && filteredAndSortedGBIFGroups.length === 0 && (
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
          {' and '}
          <a
            href="https://www.gbif.org"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GBIF
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
