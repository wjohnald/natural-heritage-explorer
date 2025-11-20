'use client';

import { useState } from 'react';
import { GBIFGroupedObservation } from '@/types';

interface GBIFSpeciesListWrapperProps {
    groups: GBIFGroupedObservation[];
    children: React.ReactNode;
}

export default function GBIFSpeciesListWrapper({ groups, children }: GBIFSpeciesListWrapperProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate statistics
    const uniqueSpeciesCount = groups.length;
    
    // Count unique species by conservation status
    const statusCounts = {
        endangered: 0,
        threatened: 0,
        specialConcern: 0,
        sgcn: 0,
    };

    groups.forEach(group => {
        const obs = group.observations[0];
        if (obs.stateProtection === 'Endangered') {
            statusCounts.endangered++;
        } else if (obs.stateProtection === 'Threatened') {
            statusCounts.threatened++;
        } else if (obs.stateProtection === 'Special Concern') {
            statusCounts.specialConcern++;
        } else if (obs.conservationNeed) {
            statusCounts.sgcn++;
        }
    });

    const hasConservationStatus = 
        statusCounts.endangered > 0 || 
        statusCounts.threatened > 0 || 
        statusCounts.specialConcern > 0 || 
        statusCounts.sgcn > 0;

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
                                style={{ width: '1.25rem', height: '1.25rem', color: '#4285f4' }}
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                            >
                                <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                            </svg>
                            <span style={{ 
                                fontWeight: 600, 
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                            }}>
                                Data Source: GBIF
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
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
        </div>
    );
}

