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
                    <h3 className="group-title">{group.commonName}</h3>
                    <p className="group-subtitle">{group.scientificName}</p>
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
