'use client';

import { iNaturalistObservation } from '@/types';
import { getObservationPhotoUrl, getObservationName } from '@/services/inaturalist';
import { useState } from 'react';

interface ObservationCardProps {
    observation: iNaturalistObservation;
}

export default function ObservationCard({ observation }: ObservationCardProps) {
    const [imageError, setImageError] = useState(false);
    const photoUrl = getObservationPhotoUrl(observation);
    const displayName = getObservationName(observation);
    const scientificName = observation.taxon?.name;
    const observedDate = observation.observed_on_string;
    const observer = observation.user?.name || observation.user?.login || 'Unknown';
    const location = observation.place_guess || 'Location unknown';
    const qualityGrade = observation.quality_grade;

    return (
        <div className="observation-card group">
            <div className="card-image-container">
                {photoUrl && !imageError ? (
                    <img
                        src={photoUrl}
                        alt={displayName}
                        className="card-image"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="card-image-placeholder">
                        <svg
                            className="placeholder-icon"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                    </div>
                )}
                {qualityGrade === 'research' && (
                    <div className="quality-badge">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-xs font-medium">Research Grade</span>
                    </div>
                )}
            </div>

            <div className="card-content">
                <div className="card-header">
                    <h3 className="card-title">{displayName}</h3>
                    {scientificName && scientificName !== displayName && (
                        <p className="card-subtitle">{scientificName}</p>
                    )}
                </div>

                <div className="card-details">
                    <div className="detail-item">
                        <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="detail-text">{observedDate}</span>
                    </div>

                    <div className="detail-item">
                        <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <span className="detail-text truncate">{location}</span>
                    </div>

                    <div className="detail-item">
                        <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <span className="detail-text">{observer}</span>
                    </div>
                </div>

                {observation.uri && (
                    <a
                        href={observation.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-link"
                    >
                        View on iNaturalist
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}
