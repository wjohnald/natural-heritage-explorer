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
  obscured?: boolean;
  geoprivacy?: string | null; // "obscured", "obscured_private", "private", or null for open
  coordinates_obscured?: boolean;
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
  vernalPoolStatus?: string | null; // NYS Heritage Mapper - Vernal Pool Status (Obligate/Facultative)
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

// GBIF Types
export interface GBIFObservation {
  key: number; // GBIF's unique identifier
  scientificName: string;
  vernacularName?: string; // Common name in GBIF
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  taxonRank?: string;
  decimalLatitude?: number;
  decimalLongitude?: number;
  coordinateUncertaintyInMeters?: number;
  eventDate?: string; // ISO format date
  year?: number;
  month?: number;
  day?: number;
  basisOfRecord?: string; // e.g., "HUMAN_OBSERVATION", "PRESERVED_SPECIMEN"
  occurrenceStatus?: string;
  individualCount?: number;
  locality?: string;
  stateProvince?: string;
  country?: string;
  countryCode?: string;
  recordedBy?: string;
  identifiedBy?: string;
  media?: Array<{
    type: string;
    format?: string;
    identifier: string;
    title?: string;
    created?: string;
    creator?: string;
    license?: string;
    rightsHolder?: string;
  }>;
  // Source tracking fields
  institutionCode?: string;
  datasetKey?: string;
  datasetName?: string;
  publishingOrgKey?: string;
  occurrenceID?: string;
  catalogNumber?: string;
  references?: string;
  // NYS Heritage Mapper - Conservation Status
  stateProtection?: string | null;
  conservationNeed?: string | null;
  vernalPoolStatus?: string | null; // NYS Heritage Mapper - Vernal Pool Status (Obligate/Facultative)
  // For compatibility with map code
  geojson?: {
    coordinates: [number, number];
    type: string;
  };
}

export interface GBIFResponse {
  offset: number;
  limit: number;
  endOfRecords: boolean;
  count: number;
  results: GBIFObservation[];
}

export interface GBIFGroupedObservation {
  scientificName: string;
  commonName: string;
  observations: GBIFObservation[];
  totalCount: number;
  closestDistance: number;
  mostRecentDate: string;
}

export interface GBIFObservationResponse {
  total_results: number;
  observations: GBIFObservation[];
  page: number;
  per_page: number;
  error?: string;
}
