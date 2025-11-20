'use client';

import { GBIFObservation, Coordinates } from '@/types';
import { getGBIFPhotoUrl, getGBIFObservationName, formatGBIFDate, isFromINaturalist, getINaturalistUrl } from '@/services/gbif';
import { calculateDistance } from '@/utils/distance';
import { useState } from 'react';

interface GBIFObservationCardProps {
    observation: GBIFObservation;
    searchCoordinates?: Coordinates;
}

export default function GBIFObservationCard({ observation, searchCoordinates }: GBIFObservationCardProps) {
    const [imageError, setImageError] = useState(false);
    const photoUrl = getGBIFPhotoUrl(observation);
    const displayName = getGBIFObservationName(observation);
    const scientificName = observation.scientificName;
    const observedDate = formatGBIFDate(observation);
    const observer = observation.recordedBy || 'Unknown';
    const location = observation.locality || observation.stateProvince || 'Location unknown';
    const isResearchGrade = observation.basisOfRecord === 'HUMAN_OBSERVATION';
    const isObscured = observation.coordinateUncertaintyInMeters && observation.coordinateUncertaintyInMeters > 10000;

    // Get coordinates from GBIF
    const lat = observation.decimalLatitude;
    const lon = observation.decimalLongitude;

    // Calculate distance if we have both coordinates
    const distance = searchCoordinates && lat !== undefined && lon !== undefined
        ? calculateDistance(
            searchCoordinates.lat,
            searchCoordinates.lon,
            lat,
            lon
        )
        : null;

    return (
        <div className="observation-card group">
            {photoUrl && (
                <div className="card-image-container">
                    {!imageError ? (
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
                    {isResearchGrade && (
                        <div className="quality-badge">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-xs font-medium">Human Observation</span>
                        </div>
                    )}
                </div>
            )}

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

                    {distance !== null && (
                        <div className="detail-item">
                            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            </svg>
                            <span className="detail-text">{distance} {distance === 1 ? 'mile' : 'miles'} away</span>
                        </div>
                    )}

                    {isObscured && (
                        <div className="detail-item" title="Location coordinates have been obscured to protect this species">
                            <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            <span className="detail-text" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
                                Location obscured
                            </span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {isFromINaturalist(observation) && getINaturalistUrl(observation) && (
                        <a
                            href={getINaturalistUrl(observation)!}
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
                    {observation.key && (
                        <a
                            href={`https://www.gbif.org/occurrence/${observation.key}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-link"
                        >
                            View on GBIF
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
        </div>
    );
}

