'use client';

import { useState, useMemo } from 'react';
import { GroupedObservation, Coordinates, iNaturalistObservation } from '@/types';
import ObservationCard from './ObservationCard';
import { calculateDistance } from '@/utils/distance';
import { formatObservationDate } from '@/utils/dateFormat';

interface ObservationGroupRowProps {
    group: GroupedObservation;
    searchCoordinates?: Coordinates;
    radius?: number;
    onHover?: (scientificName: string) => void;
    onHoverEnd?: () => void;
    onExpand?: (scientificName: string, observations: iNaturalistObservation[]) => void;
    onCollapse?: () => void;
}

export default function ObservationGroupRow({ group, searchCoordinates, radius = 0.5, onHover, onHoverEnd, onExpand, onCollapse }: ObservationGroupRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate stats from loaded observations
    const observationStats = useMemo(() => {
        if (observations.length === 0 || !searchCoordinates) {
            return { closestDistance: null, mostRecentDate: null };
        }

        let closestDistance = Infinity;
        let mostRecentDate = '';

        observations.forEach((obs) => {
            // Calculate distance
            let lat: number | undefined = obs.latitude;
            let lon: number | undefined = obs.longitude;

            if (!lat || !lon) {
                if (obs.geojson?.coordinates) {
                    lon = obs.geojson.coordinates[0];
                    lat = obs.geojson.coordinates[1];
                } else if (obs.location) {
                    const parts = obs.location.split(',');
                    if (parts.length === 2) {
                        lat = parseFloat(parts[0]);
                        lon = parseFloat(parts[1]);
                    }
                }
            }

            if (lat !== undefined && lon !== undefined) {
                const distance = calculateDistance(
                    searchCoordinates.lat,
                    searchCoordinates.lon,
                    lat,
                    lon
                );
                if (distance < closestDistance) {
                    closestDistance = distance;
                }
            }

            // Track most recent date
            const dateStr = formatObservationDate(obs);
            if (dateStr && (!mostRecentDate || dateStr > mostRecentDate)) {
                mostRecentDate = dateStr;
            }
        });

        return {
            closestDistance: closestDistance !== Infinity ? closestDistance : null,
            mostRecentDate: mostRecentDate || null
        };
    }, [observations, searchCoordinates]);

    const handleToggle = async () => {
        const willExpand = !isExpanded;
        
        if (willExpand) {
            // Expand immediately (optimistically)
            setIsExpanded(true);
            
            if (observations.length === 0 && searchCoordinates) {
                // Load observations for the first time
                setLoading(true);
                setError(null);
                try {
                    const taxonId = group.observations[0]?.taxon?.id;
                    if (!taxonId) {
                        throw new Error('No taxon ID available');
                    }

                    const response = await fetch(
                        `/api/observations?lat=${searchCoordinates.lat}&lon=${searchCoordinates.lon}&radius=${radius}&taxonId=${taxonId}`
                    );

                    if (!response.ok) {
                        throw new Error('Failed to load observations');
                    }

                    const data = await response.json();
                    setObservations(data.observations);
                    // Notify parent with observations for map plotting
                    if (onExpand) {
                        onExpand(group.scientificName, data.observations);
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to load observations');
                } finally {
                    setLoading(false);
                }
            } else if (observations.length > 0) {
                // Already have observations, notify parent
                if (onExpand) {
                    onExpand(group.scientificName, observations);
                }
            }
        } else {
            // Collapsing
            setIsExpanded(false);
            if (onCollapse) {
                onCollapse();
            }
        }
    };
    return (
        <div
            className="group-row"
            onMouseEnter={() => onHover?.(group.scientificName)}
            onMouseLeave={() => onHoverEnd?.()}
        >
            <div
                className="group-summary"
                onClick={handleToggle}
                style={{ cursor: 'pointer' }}
            >
                <div className="group-info">
                    <div className="group-title-section">
                        <h3 className="group-title">{group.commonName}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="group-subtitle">{group.scientificName}</span>
                            {/* Conservation and Vernal Pool badges */}
                            {group.observations.length > 0 && (group.observations[0].stateProtection || group.observations[0].conservationNeed || group.observations[0].vernalPoolStatus) && (
                                <>
                                    {group.observations[0].stateProtection && (
                                        <span
                                            className={`badge-state badge-inline ${group.observations[0].stateProtection === 'Endangered' ? 'badge-endangered' :
                                                    group.observations[0].stateProtection === 'Threatened' ? 'badge-threatened' :
                                                        group.observations[0].stateProtection === 'Special Concern' ? 'badge-special-concern' :
                                                            ''
                                                }`}
                                            title={`NYS Protection Status: ${group.observations[0].stateProtection}`}
                                        >
                                            {group.observations[0].stateProtection === 'Endangered' ? 'END' :
                                             group.observations[0].stateProtection === 'Threatened' ? 'THR' :
                                             group.observations[0].stateProtection === 'Special Concern' ? 'SC' :
                                             group.observations[0].stateProtection}
                                        </span>
                                    )}
                                    {group.observations[0].conservationNeed && (
                                        <span className="badge-sgcn badge-inline" title="Species of Greatest Conservation Need">
                                            SGCN
                                        </span>
                                    )}
                                    {group.observations[0].vernalPoolStatus && (
                                        <span
                                            className={`badge-vernal badge-inline ${group.observations[0].vernalPoolStatus === 'Obligate' ? 'badge-vernal-obligate' : 'badge-vernal-facultative'
                                                }`}
                                            title={`Vernal Pool Species - ${group.observations[0].vernalPoolStatus}`}
                                        >
                                            VP-{group.observations[0].vernalPoolStatus === 'Obligate' ? 'OBL' : 'FAC'}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="group-stats">
                    <div className="stat-item">
                        <span className="stat-label">Count</span>
                        <span className="stat-value">{group.totalCount}</span>
                    </div>
                    <div className="stat-item">
                        <svg
                            style={{
                                width: '1.25rem',
                                height: '1.25rem',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                                color: 'var(--text-secondary)',
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Expanded observations */}
            {isExpanded && (
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div className="spinner" style={{
                                width: '2rem',
                                height: '2rem',
                                border: '3px solid var(--border-color)',
                                borderTop: '3px solid var(--accent-primary)',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto',
                            }}></div>
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading observations...</p>
                        </div>
                    )}
                    {error && (
                        <div style={{ padding: '1rem', color: 'var(--color-error)' }}>
                            Error: {error}
                        </div>
                    )}
                    {!loading && !error && observations.length > 0 && (
                        <>
                            {/* Stats summary */}
                            <div style={{
                                display: 'flex',
                                gap: '2rem',
                                marginBottom: '1rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                        Closest:
                                    </span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                                        {observationStats.closestDistance !== null
                                            ? `${observationStats.closestDistance.toFixed(1)} mi`
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                                        Latest:
                                    </span>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                                        {observationStats.mostRecentDate || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Observation cards grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '1rem',
                            }}>
                                {observations.map((obs) => (
                                    <ObservationCard
                                        key={obs.id}
                                        observation={obs}
                                        searchCoordinates={searchCoordinates}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                    {!loading && !error && observations.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No observations found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
