import React, { useState } from 'react';
import { CategoryScore, PriorityLevel } from '@/services/scoring/types';

interface ScoringPanelProps {
    data: any | null;
    loading?: boolean;
    error?: string | null;
    onClose?: () => void;
}

export default function ScoringPanel({ data, loading, error, onClose }: ScoringPanelProps) {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    if (!data && !loading && !error) return null;

    // Helper to get priority level color
    const getPriorityColor = (level: PriorityLevel) => {
        switch (level) {
            case 'High': return '#A0522D'; // Rust brown (matching "Higher" overall)
            case 'Medium': return '#FFD700'; // Yellow
            case 'Low': return '#FFF8DC'; // Light cream
            case 'None': return '#D3D3D3'; // Light gray
            default: return '#D3D3D3';
        }
    };

    // Helper to get overall priority based on composite score
    // Theoretical max with 4 categories: 12 points
    const getOverallPriority = (compositeScore: number): { level: string; color: string } => {
        if (compositeScore >= 10) return { level: 'Highest', color: '#5C2E0F' }; // Dark brown (83%+)
        if (compositeScore >= 8) return { level: 'Higher', color: '#A0522D' }; // Rust brown (67%+)
        if (compositeScore >= 6) return { level: 'High', color: '#FF8C00' }; // Orange (50%+)
        if (compositeScore >= 3) return { level: 'Medium', color: '#FFD700' }; // Yellow (25%+)
        return { level: 'Low', color: '#FFF8DC' }; // Light cream (0-25%)
    };

    if (loading) {
        return (
            <div className="scoring-panel" style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    🏞️ Conservation Priority Score
                </h3>
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                    <div className="spinner" style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid var(--border-color)',
                        borderTop: '3px solid var(--accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <div>Loading parcel information...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="scoring-panel" style={{
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'var(--bg-primary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        🏞️ Conservation Priority Score
                    </h3>
                    {onClose && (
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                            ✕
                        </button>
                    )}
                </div>
                <div style={{ textAlign: 'center', padding: '2rem 0', color: '#ef4444' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <div style={{ fontWeight: 500 }}>Could not load parcel</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{error}</div>
                </div>
            </div>
        );
    }

    // Extract composite score and categories from new data structure
    const compositeScore = data.compositeScore || 0;
    const categories: CategoryScore[] = data.categories || [];

    return (
        <div className="scoring-panel" style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'var(--bg-primary)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    🏞️ Conservation Priority Score
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            padding: '0.25rem',
                            lineHeight: 1
                        }}
                        aria-label="Close panel"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Composite Score Display */}
            <div style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
                borderRadius: '0.5rem',
                border: `2px solid ${getOverallPriority(compositeScore).color}`,
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    Conservation Priority
                </div>
                <div style={{
                    display: 'inline-block',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    padding: '0.5rem 1.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: getOverallPriority(compositeScore).color,
                    color: compositeScore >= 3 ? 'white' : '#333',
                    marginBottom: '1rem',
                    letterSpacing: '0.05em'
                }}>
                    {getOverallPriority(compositeScore).level.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    <strong>Composite Score:</strong> {compositeScore}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Based on {categories.length} resource categories
                </div>
            </div>

            {/* Category Breakdown */}
            {categories.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Category Breakdown
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categories.map((cat) => {
                            const isExpanded = !!expandedCategories[cat.category];
                            const priorityColor = getPriorityColor(cat.priorityLevel);

                            return (
                                <div key={cat.category} style={{ background: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                    <button
                                        onClick={() => toggleCategory(cat.category)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            width: '100%',
                                            padding: '0.75rem',
                                            background: isExpanded ? '#f9fafb' : '#fff',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
                                            <div style={{
                                                flexShrink: 0,
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: priorityColor,
                                                border: '1px solid rgba(0,0,0,0.1)'
                                            }}></div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                color: '#4b5563',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }} title={cat.category}>
                                                {cat.category}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                backgroundColor: priorityColor,
                                                color: cat.priorityLevel === 'Low' ? '#333' : 'white'
                                            }}>
                                                {cat.priorityLevel}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#800000', minWidth: '60px', textAlign: 'right' }}>
                                                {cat.priorityScore} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>pts</span>
                                            </div>
                                            <div style={{ color: '#9ca3af', fontSize: '0.75rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div style={{ padding: '0.75rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                                <strong>Raw Score:</strong> {cat.rawScore}
                                            </div>
                                            {cat.criteria.length > 0 && (
                                                <>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>
                                                        Met Criteria:
                                                    </div>
                                                    {cat.criteria.map((c, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            padding: '0.25rem 0',
                                                            color: '#059669',
                                                            fontWeight: 600,
                                                            fontSize: '0.8125rem'
                                                        }}>
                                                            <span style={{ flex: 1, paddingRight: '0.5rem' }}>✅ {c.name}</span>
                                                            <span>{c.earnedScore}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
            }

            {/* Parcel Info */}
            {
                data.parcelInfo && (
                    <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                        <div style={{ marginBottom: '0.25rem' }}><strong>Address:</strong> {data.parcelInfo.address || 'N/A'}</div>
                        <div style={{ marginBottom: '0.25rem' }}><strong>Municipality:</strong> {data.parcelInfo.municipality || 'N/A'}, {data.parcelInfo.county || 'N/A'}</div>
                        <div style={{ marginBottom: '0.25rem' }}><strong>Owner:</strong> {data.parcelInfo.owner || 'N/A'}</div>
                        <div style={{ marginBottom: '0.25rem' }}><strong>Parcel ID:</strong> {data.parcelInfo.printKey || 'N/A'}</div>
                        <div><strong>Size:</strong> {data.parcelInfo.acres ? parseFloat(data.parcelInfo.acres).toFixed(2) : 'N/A'} acres</div>
                    </div>
                )
            }
        </div >
    );
}
