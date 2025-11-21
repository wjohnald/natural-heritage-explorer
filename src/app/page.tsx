'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import AddressSearch from '@/components/AddressSearch';
import { geocodeAddress } from '@/services/geocoding';
import {
  iNaturalistObservation,
  GBIFObservation,
  Coordinates,
  SortField,
  SortOrder,
  ObservationResponse,
  GBIFObservationResponse,
  GroupedObservation,
  GBIFGroupedObservation
} from '@/types';
import { groupObservations } from '@/utils/grouping';
import { groupGBIFObservations } from '@/utils/gbifGrouping';
import ObservationGroupRow from '@/components/ObservationGroupRow';
import GBIFObservationGroupRow from '@/components/GBIFObservationGroupRow';
import ObservationFilters from '@/components/ObservationFilters';
import ConservationFilters from '@/components/ConservationFilters';
import SpeciesListWrapper from '@/components/SpeciesListWrapper';
import GBIFSpeciesListWrapper from '@/components/GBIFSpeciesListWrapper';
import SidebarSpeciesList from '@/components/SidebarSpeciesList';
import SidebarGBIFSpeciesList from '@/components/SidebarGBIFSpeciesList';
import ScoringPanel from '@/components/ScoringPanel';

// Dynamically import the map component to avoid SSR issues with Leaflet
const ObservationMap = dynamic(() => import('@/components/ObservationMap'), {
  ssr: false,
  loading: () => (
    <div className="map-container" style={{ height: '600px', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading map...</p>
      </div>
    </div>
  ),
});

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [gbifObservations, setGbifObservations] = useState<GBIFObservation[]>([]);
  // Species-centric data from species-counts endpoints
  const [speciesGroups, setSpeciesGroups] = useState<GroupedObservation[]>([]);
  const [gbifSpeciesGroups, setGbifSpeciesGroups] = useState<GBIFGroupedObservation[]>([]);
  const [speciesLoading, setSpeciesLoading] = useState(false);
  const [gbifSpeciesLoading, setGbifSpeciesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gbifLoading, setGbifLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gbifError, setGbifError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string | null>(null);
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [gbifProgressCurrent, setGbifProgressCurrent] = useState(0);
  const [gbifProgressTotal, setGbifProgressTotal] = useState(0);
  const [radius, setRadius] = useState(0.5); // Default 0.5 miles
  const [searchCoordinates, setSearchCoordinates] = useState<Coordinates | null>(null);

  // Filter and Sort State
  const [filterTerm, setFilterTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedVernalPoolStatuses, setSelectedVernalPoolStatuses] = useState<Set<string>>(new Set());
  const [showSGCN, setShowSGCN] = useState(false);
  const [hoveredSpecies, setHoveredSpecies] = useState<string | null>(null);
  const [expandedSpeciesObservations, setExpandedSpeciesObservations] = useState<(iNaturalistObservation | GBIFObservation)[]>([]);

  // Parcel Scoring State
  const [parcelScoreData, setParcelScoreData] = useState<any>(null);
  const [parcelScoreLoading, setParcelScoreLoading] = useState(false);
  const [parcelScoreError, setParcelScoreError] = useState<string | null>(null);

  // Get unique conservation statuses from observations
  const availableStatuses = ["Endangered", "Threatened", "Special Concern"];
  const availableVernalPoolStatuses = ["Obligate", "Facultative"];

  // Check if any observations have SGCN status
  const hasSGCN = observations.some(obs => obs.conservationNeed) || gbifObservations.some(obs => obs.conservationNeed) ||
    speciesGroups.some(g => g.observations.some(obs => obs.conservationNeed)) ||
    gbifSpeciesGroups.some(g => g.observations.some(obs => obs.conservationNeed));

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

  // New function: Filter and sort species groups (from species-counts endpoint)
  const getFilteredAndSortedSpeciesGroups = () => {
    let filtered = speciesGroups;

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
        const matchesStatus = selectedStatuses.size > 0 && g.observations.some((obs: any) =>
          obs.stateProtection && selectedStatuses.has(obs.stateProtection)
        );

        const matchesSGCN = showSGCN && g.observations.some((obs: any) => obs.conservationNeed);

        const matchesVernalPool = selectedVernalPoolStatuses.size > 0 && g.observations.some((obs: any) =>
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

  // New function: Filter and sort GBIF species groups (from gbif-species-counts endpoint)
  const getFilteredAndSortedGBIFSpeciesGroups = () => {
    let filtered = gbifSpeciesGroups;

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
        const matchesStatus = selectedStatuses.size > 0 && g.observations.some((obs: any) =>
          obs.stateProtection && selectedStatuses.has(obs.stateProtection)
        );

        const matchesSGCN = showSGCN && g.observations.some((obs: any) => obs.conservationNeed);

        const matchesVernalPool = selectedVernalPoolStatuses.size > 0 && g.observations.some((obs: any) =>
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

  // Handle deep linking - check URL parameters on mount
  useEffect(() => {
    const address = searchParams.get('address');
    const radiusParam = searchParams.get('radius');

    if (address) {
      const searchRadius = radiusParam ? parseFloat(radiusParam) : 0.5;
      setRadius(searchRadius);
      setSearchedAddress(address);
      // Perform the search
      handleSearch(address, searchRadius);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, not when handleSearch changes

  // Map click now shows wetland info instead of triggering search

  // Handle species row expansion - show observations on map
  const handleSpeciesExpand = (scientificName: string, observations: (iNaturalistObservation | GBIFObservation)[]) => {
    setExpandedSpeciesObservations(observations);
  };

  // Handle species row collapse - clear map observations
  const handleSpeciesCollapse = () => {
    setExpandedSpeciesObservations([]);
  };

  const handleParcelSelected = (data: any, loading: boolean, error: string | null) => {
    setParcelScoreData(data);
    setParcelScoreLoading(loading);
    setParcelScoreError(error);
  };

  const handleCloseScoringPanel = () => {
    setParcelScoreData(null);
    setParcelScoreLoading(false);
    setParcelScoreError(null);
  };

  const filteredObservations = getFilteredObservations();
  const filteredAndSortedGroups = getFilteredAndSortedGroups();
  const filteredAndSortedSpeciesGroups = getFilteredAndSortedSpeciesGroups();
  const filteredGBIFObservations = getFilteredGBIFObservations();
  const filteredAndSortedGBIFGroups = getFilteredAndSortedGBIFGroups();
  const filteredAndSortedGBIFSpeciesGroups = getFilteredAndSortedGBIFSpeciesGroups();

  const handleSearch = async (address: string, searchRadius: number) => {
    setLoading(true);
    setGbifLoading(true);
    setSpeciesLoading(true);
    setGbifSpeciesLoading(true);
    setError(null);
    setGbifError(null);
    setObservations([]);
    setGbifObservations([]);
    setSpeciesGroups([]);
    setGbifSpeciesGroups([]);
    setSearchedLocation(null);
    setSearchedAddress(address);
    setProgressCurrent(0);
    setProgressTotal(0);
    setGbifProgressCurrent(0);
    setGbifProgressTotal(0);

    // Update URL with search parameters
    const params = new URLSearchParams();
    params.set('address', address);
    params.set('radius', searchRadius.toString());
    router.push(`?${params.toString()}`, { scroll: false });

    try {
      // Step 1: Geocode the address
      const geocodeResult = await geocodeAddress(address);
      setSearchedLocation(geocodeResult.displayName);
      const { lat, lon } = geocodeResult.coordinates;
      setSearchCoordinates({ lat, lon });

      // Fetch species-counts data for better performance
      const fetchSpeciesCounts = async () => {
        try {
          const response = await fetch(
            `/api/species-counts?lat=${lat}&lon=${lon}&radius=${searchRadius}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Transform species-counts data to GroupedObservation format
          const groups: GroupedObservation[] = data.results.map((item: any) => ({
            scientificName: item.taxon.name,
            commonName: item.taxon.preferred_common_name || item.taxon.name,
            observations: [{
              id: 0,
              species_guess: item.taxon.name,
              taxon: item.taxon,
              observed_on_string: '',
              stateProtection: item.stateProtection,
              conservationNeed: item.conservationNeed,
              vernalPoolStatus: item.vernalPoolStatus,
            } as iNaturalistObservation],
            totalCount: item.count,
            closestDistance: Infinity, // Species endpoint doesn't provide distance
            mostRecentDate: '', // Species endpoint doesn't provide date
          }));

          setSpeciesGroups(groups);
        } catch (err) {
          console.error('Error fetching iNaturalist species counts:', err);
        } finally {
          setSpeciesLoading(false);
        }
      };

      const fetchGBIFSpeciesCounts = async () => {
        try {
          const response = await fetch(
            `/api/gbif-species-counts?lat=${lat}&lon=${lon}&radius=${searchRadius}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // Transform GBIF species-counts data to GBIFGroupedObservation format
          const groups: GBIFGroupedObservation[] = data.results.map((item: any) => ({
            scientificName: item.taxon.name,
            commonName: item.taxon.preferred_common_name || item.taxon.name,
            observations: [{
              key: 0,
              scientificName: item.taxon.name,
              vernacularName: item.taxon.preferred_common_name,
              stateProtection: item.stateProtection,
              conservationNeed: item.conservationNeed,
              vernalPoolStatus: item.vernalPoolStatus,
            } as GBIFObservation],
            totalCount: item.count,
            closestDistance: Infinity,
            mostRecentDate: '',
          }));

          setGbifSpeciesGroups(groups);
        } catch (err) {
          console.error('Error fetching GBIF species counts:', err);
        } finally {
          setGbifSpeciesLoading(false);
        }
      };

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

      // Fetch species counts only (individual observations no longer needed)
      try {
        await Promise.all([fetchSpeciesCounts(), fetchGBIFSpeciesCounts()]);
      } finally {
        // Always clear main loading states, even if there's an error
        // Individual loading states are handled by their respective functions
        setLoading(false);
        setGbifLoading(false);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      setGbifLoading(false);
      setSpeciesLoading(false);
      setGbifSpeciesLoading(false);
    }
  };


  return (
    <main className="main-container">
      <div className="three-column-layout">
        {/* Left Column - Search and Filters */}
        <div className="search-column">
          <AddressSearch
            onSearch={handleSearch}
            loading={loading}
            radius={radius}
            onRadiusChange={setRadius}
            initialAddress={searchedAddress || ''}
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

          {/* Conservation Filters - Always visible */}
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

          {/* Observation Filters - Always visible */}
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
        </div>

        {/* Middle Column - Map */}
        <div className="map-column">
          <Suspense fallback={
            <div className="map-container" style={{ height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading map...</p>
            </div>
          }>
            <ObservationMap
              observations={expandedSpeciesObservations.length > 0 ? expandedSpeciesObservations : [...filteredObservations, ...filteredGBIFObservations]}
              searchCoordinates={searchCoordinates || undefined}
              radius={radius}
              hoveredSpecies={hoveredSpecies}
              onParcelSelected={handleParcelSelected}
              parcelScoreData={parcelScoreData}
            />
          </Suspense>
        </div>

        {/* Right Column - Species Results */}
        <div className="results-column">
          {error ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="empty-title">Something went wrong</h3>
              <p className="empty-description">{error}</p>
            </div>
          ) : loading || gbifLoading || speciesLoading || gbifSpeciesLoading ? (
            <div className="loading-container">
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
              <p className="loading-text">Searching for species...</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                Found {progressCurrent + gbifProgressCurrent} observations so far...
              </p>
            </div>
          ) : (observations.length === 0 && gbifObservations.length === 0 && speciesGroups.length === 0 && gbifSpeciesGroups.length === 0 && searchedLocation) ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="empty-title">No species found</h3>
              <p className="empty-description">
                Try increasing the search radius or searching for a different location.
              </p>
            </div>
          ) : !searchedLocation ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h3 className="empty-title">Enter a location</h3>
              <p className="empty-description">
                Search for an address to see observed species in the area.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem', padding: '0 0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Observed Species
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Found {filteredAndSortedSpeciesGroups.length + filteredAndSortedGBIFSpeciesGroups.length} unique species
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* iNaturalist Results */}
                {filteredAndSortedSpeciesGroups.length > 0 && (
                  <SpeciesListWrapper
                    groups={filteredAndSortedSpeciesGroups}
                  >
                    {filteredAndSortedSpeciesGroups.map((group) => (
                      <ObservationGroupRow
                        key={`inat-${group.scientificName}`}
                        group={group}
                        searchCoordinates={searchCoordinates || undefined}
                        radius={radius}
                        onExpand={handleSpeciesExpand}
                        onCollapse={handleSpeciesCollapse}
                        onHover={(name) => setHoveredSpecies(name)}
                      />
                    ))}
                  </SpeciesListWrapper>
                )}

                {/* GBIF Results */}
                {filteredAndSortedGBIFSpeciesGroups.length > 0 && (
                  <GBIFSpeciesListWrapper
                    groups={filteredAndSortedGBIFSpeciesGroups}
                  >
                    {filteredAndSortedGBIFSpeciesGroups.map((group) => (
                      <GBIFObservationGroupRow
                        key={`gbif-${group.scientificName}`}
                        group={group}
                        searchCoordinates={searchCoordinates || undefined}
                        radius={radius}
                        onExpand={handleSpeciesExpand}
                        onCollapse={handleSpeciesCollapse}
                        onHover={(name) => setHoveredSpecies(name)}
                      />
                    ))}
                  </GBIFSpeciesListWrapper>
                )}
              </div>

              {/* Scoring Panel */}
              <ScoringPanel
                data={parcelScoreData}
                loading={parcelScoreLoading}
                error={parcelScoreError}
                onClose={handleCloseScoringPanel}
              />
            </>
          )}
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

// Wrap in Suspense to handle useSearchParams() requirement
export default function Home() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTop: '4px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
