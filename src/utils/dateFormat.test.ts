import { describe, it, expect } from 'vitest';
import { formatObservationDate } from './dateFormat';
import { iNaturalistObservation } from '@/types';

describe('formatObservationDate', () => {
    it('should format a valid date string correctly', () => {
        const obs = { observed_on_string: '2023-11-15 14:30:00' } as iNaturalistObservation;
        expect(formatObservationDate(obs)).toBe('2023-11-15');
    });

    it('should format a date string with different format', () => {
        const obs = { observed_on_string: 'November 15, 2023' } as iNaturalistObservation;
        expect(formatObservationDate(obs)).toBe('2023-11-15');
    });

    it('should return empty string if observed_on_string is missing', () => {
        const obs = { observed_on_string: '' } as iNaturalistObservation;
        expect(formatObservationDate(obs)).toBe('');
    });

    it('should return empty string if observed_on_string is null or undefined', () => {
        // @ts-ignore - testing runtime behavior for potentially missing property
        const obs = {} as iNaturalistObservation;
        expect(formatObservationDate(obs)).toBe('');
    });

    it('should return empty string for invalid date string', () => {
        const obs = { observed_on_string: 'Not a date' } as iNaturalistObservation;
        expect(formatObservationDate(obs)).toBe('');
    });

    it('should handle single digit month and day correctly', () => {
        // Use a time to avoid timezone issues (midnight UTC can be previous day in local time)
        const obs = { observed_on_string: '2023-01-05T12:00:00' } as iNaturalistObservation;
        expect(formatObservationDate(obs)).toBe('2023-01-05');
    });
});
