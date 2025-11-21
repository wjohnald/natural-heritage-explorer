import React, { useState } from 'react';

interface ScoringPanelProps {
    data: any | null;
    loading?: boolean;
    error?: string | null;
    onClose?: () => void;
}

export default function ScoringPanel({ data, loading, error, onClose }: ScoringPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!data && !loading && !error) return null;

    // Helper to get color from yellow to maroon based on percentage
    const getScoreColor = (percentage: number) => {
        // Maroon is #800000 (128, 0, 0)
        // Yellow is #FFFF00 (255, 255, 0)
        const r = Math.round(255 - (percentage / 100) * (255 - 128));
        const g = Math.round(255 - (percentage / 100) * 255);
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
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

    const scorePercent = data.maxPossibleScore > 0
        ? Math.round((data.totalScore / data.maxPossibleScore) * 100)
        : 0;

    // Calculate category scores
    const byCategory: Record<string, { earned: number, max: number }> = {};
    if (data.criteriaSummary) {
        data.criteriaSummary.forEach((c: any) => {
            if (!byCategory[c.category]) {
                byCategory[c.category] = { earned: 0, max: 0 };
            }
            byCategory[c.category].earned += (c.earnedScore || 0);
            byCategory[c.category].max += (c.maxScore || 0);
        });
    }

    // Group detailed criteria
    const criteriaByCategory: Record<string, any[]> = {};
    if (data.criteriaSummary) {
        data.criteriaSummary.forEach((c: any) => {
            if (!criteriaByCategory[c.category]) criteriaByCategory[c.category] = [];
            criteriaByCategory[c.category].push(c);
        });
    }

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

            {/* Score Slider */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                <div style={{ position: 'relative', height: '24px', background: 'linear-gradient(to right, #ffff00, #800000)', borderRadius: '12px', border: '1px solid #d1d5db', marginBottom: '0.5rem' }}>
                    <div style={{
                        position: 'absolute',
                        left: `${Math.max(2, Math.min(98, scorePercent))}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '4px',
                        height: '32px',
                        background: '#000',
                        border: '1px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                    <span>Low Value</span>
                    <span>High Value</span>
                </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(byCategory).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Category Breakdown
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                        {Object.entries(byCategory).map(([category, scores]) => {
                            const catPercent = scores.max > 0 ? (scores.earned / scores.max) * 100 : 0;
                            const indicatorColor = getScoreColor(catPercent);

                            return (
                                <div key={category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: '#fff', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                        <div style={{ flexShrink: 0, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: indicatorColor, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={category}>{category}</div>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#800000', marginLeft: '0.5rem' }}>
                                        {scores.earned} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>/ {scores.max}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Parcel Info */}
            {data.parcelInfo && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}><strong>Address:</strong> {data.parcelInfo.address || 'N/A'}</div>
                    <div style={{ marginBottom: '0.25rem' }}><strong>Municipality:</strong> {data.parcelInfo.municipality || 'N/A'}, {data.parcelInfo.county || 'N/A'}</div>
                    <div style={{ marginBottom: '0.25rem' }}><strong>Owner:</strong> {data.parcelInfo.owner || 'N/A'}</div>
                    <div style={{ marginBottom: '0.25rem' }}><strong>Parcel ID:</strong> {data.parcelInfo.printKey || 'N/A'}</div>
                    <div><strong>Size:</strong> {data.parcelInfo.acres ? parseFloat(data.parcelInfo.acres).toFixed(2) : 'N/A'} acres</div>
                </div>
            )}

            {/* Detailed Checklist */}
            {Object.keys(criteriaByCategory).length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                        }}
                    >
                        <span>📊 Detailed Criteria Checklist</span>
                        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                    </button>

                    {isExpanded && (
                        <div style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {Object.entries(criteriaByCategory).map(([category, criteria]) => (
                                <div key={category} style={{ marginBottom: '1rem' }}>
                                    <div style={{
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        marginBottom: '0.5rem',
                                        color: 'var(--text-secondary)',
                                        background: '#f3f4f6',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        display: 'inline-block'
                                    }}>
                                        {category}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem' }}>
                                        {criteria.map((c: any, idx: number) => {
                                            const icon = c.matched ? '✅' : c.implemented ? '❌' : '⚪';
                                            const color = c.matched ? '#059669' : c.implemented ? '#9ca3af' : '#d1d5db';
                                            const label = c.implemented ? '' : ' (data unavailable)';
                                            const weight = c.matched ? '600' : '400';

                                            return (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color, fontWeight: weight }}>
                                                    <span style={{ flex: 1, paddingRight: '0.5rem' }}>{icon} {c.name}{label}</span>
                                                    <span>{c.earnedScore}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
