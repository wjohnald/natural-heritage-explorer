'use client';

import { SortField, SortOrder } from '@/types';

interface ObservationFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    sortBy: SortField;
    sortOrder: SortOrder;
    onSortChange: (field: SortField, order: SortOrder) => void;
    availableStatuses: string[];
    selectedStatuses: Set<string>;
    onStatusToggle: (status: string) => void;
}

export default function ObservationFilters({
    searchTerm,
    onSearchChange,
    sortBy,
    sortOrder,
    onSortChange,
    availableStatuses,
    selectedStatuses,
    onStatusToggle,
}: ObservationFiltersProps) {
    return (
        <div className="filters-wrapper">
            <div className="filters-container">
                <div className="filter-search">
                    <svg className="filter-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Filter by species name..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="filter-search-input"
                    />
                </div>

                <div className="filter-sort">
                    <span className="sort-label">Sort by:</span>
                    <div className="sort-options">
                        <button
                            className={`sort-button ${sortBy === 'count' ? 'active' : ''}`}
                            onClick={() => onSortChange('count', sortBy === 'count' && sortOrder === 'desc' ? 'asc' : 'desc')}
                        >
                            Count
                            {sortBy === 'count' && (
                                <span className="sort-arrow">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                            )}
                        </button>
                        <button
                            className={`sort-button ${sortBy === 'distance' ? 'active' : ''}`}
                            onClick={() => onSortChange('distance', sortBy === 'distance' && sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            Distance
                            {sortBy === 'distance' && (
                                <span className="sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </button>
                        <button
                            className={`sort-button ${sortBy === 'date' ? 'active' : ''}`}
                            onClick={() => onSortChange('date', sortBy === 'date' && sortOrder === 'desc' ? 'asc' : 'desc')}
                        >
                            Date
                            {sortBy === 'date' && (
                                <span className="sort-arrow">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="conservation-filters">
                <div className="conservation-filter-options">
                    <div className="status-checkboxes">
                        {availableStatuses.map((status) => (
                            <label key={status} className="filter-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={selectedStatuses.has(status)}
                                    onChange={() => onStatusToggle(status)}
                                    className="filter-checkbox"
                                />
                                <span className="checkbox-custom"></span>
                                <span className="checkbox-label-text">{status}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
