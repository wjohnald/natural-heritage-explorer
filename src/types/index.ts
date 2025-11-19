export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  displayName: string;
}

export interface iNaturalistObservation {
  id: number;
  species_guess: string;
  taxon?: {
    id: number;
    name: string;
    preferred_common_name?: string;
    rank: string;
    iconic_taxon_name?: string;
  };
  observed_on_string: string;
  place_guess?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  user?: {
    id: number;
    login: string;
    name?: string;
  };
  photos?: Array<{
    id: number;
    url: string;
    attribution?: string;
  }>;
  quality_grade?: string;
  uri?: string;
  stateProtection?: string | null; // NYS Heritage Mapper - State Protection Status
  conservationNeed?: string | null; // NYS Heritage Mapper - Species of Greatest Conservation Need
  identifications_count?: number;
  geojson?: {
    coordinates: [number, number];
    type: string;
  };
}

export interface iNaturalistResponse {
  total_results: number;
  page: number;
  per_page: number;
  results: iNaturalistObservation[];
}

export interface GroupedObservation {
  scientificName: string;
  commonName: string;
  observations: iNaturalistObservation[];
  totalCount: number;
  closestDistance: number;
  mostRecentDate: string;
}

export type SortField = 'count' | 'distance' | 'date' | 'name' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface ObservationResponse {
  total_results: number;
  observations: iNaturalistObservation[];
  page: number;
  per_page: number;
  error?: string;
}
