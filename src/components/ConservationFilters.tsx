'use client';

interface ConservationFiltersProps {
    availableStatuses: string[];
    selectedStatuses: Set<string>;
    onStatusToggle: (status: string) => void;
    hasSGCN: boolean;
    showSGCN: boolean;
    onSGCNToggle: () => void;
}

export default function ConservationFilters({
    availableStatuses,
    selectedStatuses,
    onStatusToggle,
    hasSGCN,
    showSGCN,
    onSGCNToggle,
}: ConservationFiltersProps) {
    if (availableStatuses.length === 0 && !hasSGCN) {
        return null;
    }

    return (
        <div className="conservation-filters-sidebar">
            <div className="filter-section-header">
                <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                </svg>
                <h3 className="filter-section-title">NYS Conservation Status</h3>
            </div>

            <p className="filter-description">
                Filter species by their New York State conservation status. 
                Select one or more protection levels to view only those species.
            </p>

            <div className="conservation-filter-options">
                <div className="status-checkboxes-sidebar">
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
                    
                    {hasSGCN && (
                        <label className="filter-checkbox-label filter-checkbox-sgcn">
                            <input
                                type="checkbox"
                                checked={showSGCN}
                                onChange={onSGCNToggle}
                                className="filter-checkbox"
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-label-text">
                                SGCN
                                <span className="checkbox-label-subtitle">Species of Greatest Conservation Need</span>
                            </span>
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

