'use client';

import { SortField, SortOrder } from '@/types';

interface ObservationFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    sortBy: SortField;
    sortOrder: SortOrder;
    onSortChange: (field: SortField, order: SortOrder) => void;
}

export default function ObservationFilters({
    searchTerm,
    onSearchChange,
    sortBy,
    sortOrder,
    onSortChange,
}: ObservationFiltersProps) {
    return (
        <div className="filters-container" style={{ 
            flexDirection: 'column', 
            gap: '1.5rem',
            padding: '1.5rem',
        }}>
            <div className="filter-search" style={{ width: '100%', maxWidth: 'none' }}>
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

            <div className="filter-sort" style={{ 
                paddingTop: '0', 
                borderTop: 'none', 
                marginTop: '0',
                flexDirection: 'column',
                alignItems: 'flex-start',
            }}>
                <span className="sort-label" style={{ marginBottom: '0.75rem' }}>Sort by:</span>
                <div className="sort-options" style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.625rem',
                    width: '100%',
                }}>
                    <button
                        className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
                        onClick={() => onSortChange('name', sortBy === 'name' && sortOrder === 'desc' ? 'asc' : 'desc')}
                    >
                        Name
                        {sortBy === 'name' && (
                            <span className="sort-arrow">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                    </button>
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
                    <button
                        className={`sort-button ${sortBy === 'status' ? 'active' : ''}`}
                        onClick={() => onSortChange('status', sortBy === 'status' && sortOrder === 'desc' ? 'asc' : 'desc')}
                    >
                        Status
                        {sortBy === 'status' && (
                            <span className="sort-arrow">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
