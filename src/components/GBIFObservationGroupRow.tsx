'use client';

import { useState } from 'react';
import { GBIFGroupedObservation, Coordinates } from '@/types';
import GBIFObservationCard from './GBIFObservationCard';

interface GBIFObservationGroupRowProps {
    group: GBIFGroupedObservation;
    searchCoordinates?: Coordinates;
    onHover?: (scientificName: string) => void;
    onHoverEnd?: () => void;
}

export default function GBIFObservationGroupRow({ group, searchCoordinates, onHover, onHoverEnd }: GBIFObservationGroupRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div 
            className={`group-row ${isExpanded ? 'expanded' : ''}`}
            onMouseEnter={() => onHover?.(group.scientificName)}
            onMouseLeave={() => onHoverEnd?.()}
        >
            <div
                className="group-summary"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="group-info">
                    <div className="group-title-section">
                        <h3 className="group-title">{group.commonName}</h3>
                        <span className="group-subtitle">{group.scientificName}</span>
                        {/* Conservation badges */}
                        {group.observations.length > 0 && (group.observations[0].stateProtection || group.observations[0].conservationNeed) && (
                            <div className="conservation-badges">
                                {group.observations[0].stateProtection && (
                                    <span 
                                        className={`badge-state ${
                                            group.observations[0].stateProtection === 'Endangered' ? 'badge-endangered' :
                                            group.observations[0].stateProtection === 'Threatened' ? 'badge-threatened' :
                                            group.observations[0].stateProtection === 'Special Concern' ? 'badge-special-concern' :
                                            ''
                                        }`}
                                        title={`NYS Protection Status: ${group.observations[0].stateProtection}`}
                                    >
                                        {group.observations[0].stateProtection === 'Endangered' && (
                                            <svg className="badge-icon" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {group.observations[0].stateProtection}
                                    </span>
                                )}
                                {group.observations[0].conservationNeed && (
                                    <span className="badge-sgcn" title="Species of Greatest Conservation Need">
                                        SGCN
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="group-stats">
                    <div className="stat-item">
                        <span className="stat-label">Count</span>
                        <span className="stat-value">{group.totalCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Closest</span>
                        <span className="stat-value">
                            {group.closestDistance !== Infinity
                                ? `${group.closestDistance.toFixed(1)} mi`
                                : 'N/A'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Latest</span>
                        <span className="stat-value">{group.mostRecentDate || 'N/A'}</span>
                    </div>
                </div>

                <div className={`group-toggle ${isExpanded ? 'rotated' : ''}`}>
                    <svg
                        className="w-6 h-6"
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

            {isExpanded && (
                <div className="group-content">
                    <div className="observations-grid">
                        {group.observations.map((observation) => (
                            <GBIFObservationCard
                                key={observation.key}
                                observation={observation}
                                searchCoordinates={searchCoordinates}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

