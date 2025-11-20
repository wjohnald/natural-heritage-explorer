'use client';

import { useState, FormEvent, useEffect } from 'react';

interface AddressSearchProps {
    onSearch: (address: string, radius: number) => void;
    loading?: boolean;
    radius: number;
    onRadiusChange: (radius: number) => void;
    initialAddress?: string;
}

export default function AddressSearch({
    onSearch,
    loading = false,
    radius,
    onRadiusChange,
    initialAddress = ''
}: AddressSearchProps) {
    const [address, setAddress] = useState(initialAddress);

    // Update address when initialAddress changes
    useEffect(() => {
        if (initialAddress) {
            setAddress(initialAddress);
        }
    }, [initialAddress]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (address.trim() && !loading) {
            onSearch(address.trim(), radius);
        }
    };

    return (
        <div className="search-container">
            <div className="search-header">
                <h1 className="search-title">
                    <span className="title-gradient">Biodiversity</span> Explorer
                </h1>
                <p className="search-description">
                    Discover biodiversity near any location. Enter an address or coordinates (latitude, longitude)
                    and adjust the search radius to explore species in your area.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-wrapper">
                    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter an address or coordinates (e.g., 44.2176, -73.4301)"
                        className="search-input"
                        disabled={loading}
                    />
                </div>

                <button type="submit" className="search-button" disabled={loading || !address.trim()}>
                    {loading ? (
                        <>
                            <div className="button-spinner"></div>
                            Searching...
                        </>
                    ) : (
                        'Search'
                    )}
                </button>
            </form>

            {/* Radius Slider */}
            <div className="radius-control">
                <div className="radius-header">
                    <label htmlFor="radius-slider" className="radius-label">
                        Search Radius
                    </label>
                    <span className="radius-value">{radius} {radius === 1 ? 'mile' : 'miles'}</span>
                </div>
                <input
                    id="radius-slider"
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={radius}
                    onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
                    className="radius-slider"
                    disabled={loading}
                />
                <div className="radius-labels">
                    <span className="radius-label-min">0.5 mi</span>
                    <span className="radius-label-max">10 mi</span>
                </div>
            </div>
        </div>
    );
}
