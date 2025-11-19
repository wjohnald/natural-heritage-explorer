'use client';

import { useState } from 'react';
import { GroupedObservation, Coordinates } from '@/types';
import ObservationCard from './ObservationCard';

interface ObservationGroupRowProps {
    group: GroupedObservation;
    searchCoordinates?: Coordinates;
}

export default function ObservationGroupRow({ group, searchCoordinates }: ObservationGroupRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`group-row ${isExpanded ? 'expanded' : ''}`}>
            <div
                className="group-summary"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="group-info">
                    {/* The original commonName and scientificName display is moved into group-stats */}
                </div>

                <div className="group-stats">
                    <div className="group-title-row">
                        <h3 className="group-scientific-name">{group.scientificName}</h3>
                        <span className="group-common-name">{group.commonName}</span>
                        {/* Check if any observation in the group has state protection (they all should if the species matches) */}
                        {group.observations.length > 0 && group.observations[0].stateProtection && (
                            <div className="conservation-badges">
                                <span className="badge state" title={`State Protection: ${group.observations[0].stateProtection}`}>
                                    State: {group.observations[0].stateProtection}
                                </span>
                            </div>
                        )}
                    </div>
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
                            <ObservationCard
                                key={observation.id}
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
