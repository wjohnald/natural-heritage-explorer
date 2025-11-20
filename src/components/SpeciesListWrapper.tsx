'use client';

import { useState } from 'react';
import { GroupedObservation } from '@/types';

interface SpeciesListWrapperProps {
    groups: GroupedObservation[];
    children: React.ReactNode;
}

export default function SpeciesListWrapper({ groups, children }: SpeciesListWrapperProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Calculate statistics
    const uniqueSpeciesCount = groups.length;
    
    // Group species by conservation status
    const statusGroups = {
        endangered: groups.filter(g => g.observations[0]?.stateProtection === 'Endangered'),
        threatened: groups.filter(g => g.observations[0]?.stateProtection === 'Threatened'),
        specialConcern: groups.filter(g => g.observations[0]?.stateProtection === 'Special Concern'),
        sgcn: groups.filter(g => !g.observations[0]?.stateProtection && g.observations[0]?.conservationNeed),
    };

    // Group species by vernal pool status
    const vernalPoolGroups = {
        obligate: groups.filter(g => g.observations[0]?.vernalPoolStatus === 'Obligate'),
        facultative: groups.filter(g => g.observations[0]?.vernalPoolStatus === 'Facultative'),
    };

    const statusCounts = {
        endangered: statusGroups.endangered.length,
        threatened: statusGroups.threatened.length,
        specialConcern: statusGroups.specialConcern.length,
        sgcn: statusGroups.sgcn.length,
    };

    const vernalPoolCounts = {
        obligate: vernalPoolGroups.obligate.length,
        facultative: vernalPoolGroups.facultative.length,
    };

    const hasConservationStatus = 
        statusCounts.endangered > 0 || 
        statusCounts.threatened > 0 || 
        statusCounts.specialConcern > 0 || 
        statusCounts.sgcn > 0;

    const hasVernalPoolStatus = 
        vernalPoolCounts.obligate > 0 || 
        vernalPoolCounts.facultative > 0;

    const handleStatusHover = (status: string, event: React.MouseEvent) => {
        setHoveredStatus(status);
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleStatusLeave = () => {
        setHoveredStatus(null);
    };

    const getSpeciesForStatus = (status: string): GroupedObservation[] => {
        switch (status) {
            case 'endangered': return statusGroups.endangered;
            case 'threatened': return statusGroups.threatened;
            case 'specialConcern': return statusGroups.specialConcern;
            case 'sgcn': return statusGroups.sgcn;
            default: return [];
        }
    };

    const getSpeciesForVernalPoolStatus = (status: string): GroupedObservation[] => {
        switch (status) {
            case 'obligate': return vernalPoolGroups.obligate;
            case 'facultative': return vernalPoolGroups.facultative;
            default: return [];
        }
    };

    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-primary)',
        }}>
            {/* Collapsible Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {/* Data Source and Species Count */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg 
                                style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-accent)' }}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            <span style={{ 
                                fontWeight: 600, 
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                            }}>
                                Data Source: iNaturalist
                            </span>
                        </div>
                        <span style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                        }}>
                            {uniqueSpeciesCount} {uniqueSpeciesCount === 1 ? 'Species' : 'Species'}
                        </span>
                    </div>

                    {/* Conservation Status Breakdown */}
                    {hasConservationStatus && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            flexWrap: 'wrap',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                        }}>
                            <span style={{ fontWeight: 500 }}>Conservation Status:</span>
                            {statusCounts.endangered > 0 && (
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => handleStatusHover('endangered', e)}
                                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={handleStatusLeave}
                                    onClickCapture={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        width: '0.5rem',
                                        height: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#dc2626',
                                    }} />
                                    <span><strong>{statusCounts.endangered}</strong> Endangered</span>
                                </div>
                            )}
                            {statusCounts.threatened > 0 && (
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => handleStatusHover('threatened', e)}
                                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={handleStatusLeave}
                                    onClickCapture={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        width: '0.5rem',
                                        height: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#f59e0b',
                                    }} />
                                    <span><strong>{statusCounts.threatened}</strong> Threatened</span>
                                </div>
                            )}
                            {statusCounts.specialConcern > 0 && (
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => handleStatusHover('specialConcern', e)}
                                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={handleStatusLeave}
                                    onClickCapture={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        width: '0.5rem',
                                        height: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#eab308',
                                    }} />
                                    <span><strong>{statusCounts.specialConcern}</strong> Special Concern</span>
                                </div>
                            )}
                            {statusCounts.sgcn > 0 && (
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => handleStatusHover('sgcn', e)}
                                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={handleStatusLeave}
                                    onClickCapture={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        width: '0.5rem',
                                        height: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#3b82f6',
                                    }} />
                                    <span><strong>{statusCounts.sgcn}</strong> SGCN</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vernal Pool Status Breakdown */}
                    {hasVernalPoolStatus && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem', 
                            flexWrap: 'wrap',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            borderLeft: '1px solid var(--border-color)',
                            paddingLeft: '0.75rem',
                        }}>
                            <span style={{ fontWeight: 500 }}>Vernal Pool Species:</span>
                            {vernalPoolCounts.obligate > 0 && (
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => handleStatusHover('obligate', e)}
                                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={handleStatusLeave}
                                    onClickCapture={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        width: '0.5rem',
                                        height: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#0ea5e9',
                                    }} />
                                    <span><strong>{vernalPoolCounts.obligate}</strong> Obligate</span>
                                </div>
                            )}
                            {vernalPoolCounts.facultative > 0 && (
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.375rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => handleStatusHover('facultative', e)}
                                    onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                                    onMouseLeave={handleStatusLeave}
                                    onClickCapture={(e) => e.stopPropagation()}
                                >
                                    <div style={{
                                        width: '0.5rem',
                                        height: '0.5rem',
                                        borderRadius: '50%',
                                        backgroundColor: '#6366f1',
                                    }} />
                                    <span><strong>{vernalPoolCounts.facultative}</strong> Facultative</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Toggle Icon */}
                <div style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <svg
                        style={{ 
                            width: '1.5rem', 
                            height: '1.5rem',
                            color: 'var(--text-secondary)',
                        }}
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

            {/* Collapsible Content */}
            {isExpanded && (
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                }}>
                    {children}
                </div>
            )}

            {/* Hover Modal */}
            {hoveredStatus && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y + 10}px`,
                        backgroundColor: 'var(--bg-primary)',
                        border: '2px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                        zIndex: 1000,
                        maxWidth: '300px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        pointerEvents: 'none',
                    }}
                >
                    <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        marginBottom: '0.5rem',
                        color: 'var(--text-primary)',
                    }}>
                        {hoveredStatus === 'endangered' && 'Endangered Species'}
                        {hoveredStatus === 'threatened' && 'Threatened Species'}
                        {hoveredStatus === 'specialConcern' && 'Special Concern Species'}
                        {hoveredStatus === 'sgcn' && 'Species of Greatest Conservation Need'}
                        {hoveredStatus === 'obligate' && 'Obligate Vernal Pool Species'}
                        {hoveredStatus === 'facultative' && 'Facultative Vernal Pool Species'}
                    </div>
                    <div style={{ 
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                    }}>
                        {(hoveredStatus === 'obligate' || hoveredStatus === 'facultative' 
                            ? getSpeciesForVernalPoolStatus(hoveredStatus) 
                            : getSpeciesForStatus(hoveredStatus)
                        ).map((group, index) => (
                            <div 
                                key={group.scientificName}
                                style={{ 
                                    padding: '0.25rem 0',
                                    borderBottom: index < (hoveredStatus === 'obligate' || hoveredStatus === 'facultative' 
                                        ? getSpeciesForVernalPoolStatus(hoveredStatus) 
                                        : getSpeciesForStatus(hoveredStatus)
                                    ).length - 1 ? '1px solid var(--border-color)' : 'none',
                                }}
                            >
                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {group.commonName}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

