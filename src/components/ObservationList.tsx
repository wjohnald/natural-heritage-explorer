'use client';

import { iNaturalistObservation, Coordinates } from '@/types';
import ObservationCard from './ObservationCard';

interface ObservationListProps {
    observations: iNaturalistObservation[];
    loading?: boolean;
    totalCount?: number;
    currentCount?: number;
    searchCoordinates?: Coordinates;
}

export default function ObservationList({
    observations,
    loading = false,
    totalCount,
    currentCount,
    searchCoordinates,
}: ObservationListProps) {
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
                <p className="loading-text">
                    {totalCount && currentCount
                        ? `Loading observations... ${currentCount} of ${totalCount}`
                        : 'Searching for observations...'}
                </p>
            </div>
        );
    }

    if (observations.length === 0) {
        return (
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
        );
    }

    return (
        <div className="observations-section">
            <div className="observations-header">
                <h2 className="observations-title">
                    Found {observations.length.toLocaleString()} observation{observations.length !== 1 ? 's' : ''}
                </h2>
                <p className="observations-subtitle">
                    Within 3 miles of the searched location
                </p>
            </div>

            <div className="observations-grid">
                {observations.map((observation) => (
                    <ObservationCard
                        key={observation.id}
                        observation={observation}
                        searchCoordinates={searchCoordinates}
                    />
                ))}
            </div>
        </div>
    );
}
