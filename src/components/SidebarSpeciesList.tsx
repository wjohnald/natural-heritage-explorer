'use client';

import { useState, useEffect } from 'react';
import { Coordinates } from '@/types';
import { fetchSpeciesCounts } from '@/services/inaturalist';

interface SidebarSpeciesListProps {
    coordinates: Coordinates | null;
    radius: number;
    filterTerm: string;
    selectedStatuses: Set<string>;
    selectedVernalPoolStatuses: Set<string>;
    showSGCN: boolean;
}

interface SpeciesCount {
    count: number;
    taxon: {
        name: string;
        preferred_common_name?: string;
        default_photo?: {
            medium_url?: string;
        };
    };
    stateProtection?: string;
    conservationNeed?: boolean;
    vernalPoolStatus?: string;
}

export default function SidebarSpeciesList({
    coordinates,
    radius,
    filterTerm,
    selectedStatuses,
    selectedVernalPoolStatuses,
    showSGCN
}: SidebarSpeciesListProps) {
    const [species, setSpecies] = useState<SpeciesCount[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadSpecies() {
            if (!coordinates) {
                setSpecies([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const results = await fetchSpeciesCounts(coordinates, radius);
                setSpecies(results);
            } catch (err) {
                setError('Failed to load species list');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadSpecies();
    }, [coordinates, radius]);

    if (!coordinates) return null;

    // Filter species
    const filteredSpecies = species.filter(item => {
        // Filter by search term
        if (filterTerm.trim()) {
            const term = filterTerm.toLowerCase();
            const commonName = item.taxon.preferred_common_name || '';
            const scientificName = item.taxon.name || '';
            if (!commonName.toLowerCase().includes(term) && !scientificName.toLowerCase().includes(term)) {
                return false;
            }
        }

        // Filter by conservation status and vernal pool status
        if (selectedStatuses.size > 0 || showSGCN || selectedVernalPoolStatuses.size > 0) {
            const matchesStatus = selectedStatuses.size > 0 &&
                item.stateProtection &&
                selectedStatuses.has(item.stateProtection);

            const matchesSGCN = showSGCN && item.conservationNeed;

            const matchesVernalPool = selectedVernalPoolStatuses.size > 0 &&
                item.vernalPoolStatus &&
                selectedVernalPoolStatuses.has(item.vernalPoolStatus);

            return matchesStatus || matchesSGCN || matchesVernalPool;
        }

        return true;
    });

    return (
        <div className="species-list-sidebar mt-8 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Species in this Area
                    {filteredSpecies.length !== species.length && (
                        <span className="ml-2 text-sm font-normal text-[var(--text-secondary)]">
                            ({filteredSpecies.length} of {species.length})
                        </span>
                    )}
                </h3>
                <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
                    iNaturalist
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <div className="spinner w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <p className="text-red-500 text-sm">{error}</p>
            ) : filteredSpecies.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">No species match your filters.</p>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredSpecies.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex flex-col">
                                <span className="font-medium text-[var(--text-primary)]">
                                    {item.taxon.preferred_common_name || item.taxon.name}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)] italic">
                                    {item.taxon.name}
                                </span>
                            </div>
                            <span className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded-full text-xs font-mono">
                                {item.count}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
