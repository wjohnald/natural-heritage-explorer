import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

// Mock fs.promises
vi.mock('fs', () => ({
    default: {
        promises: {
            readFile: vi.fn(),
        },
    },
}));

describe('conservationStatus', () => {
    const mockCsvContent = `Scientific name,Status url,Primary common name,Class,Order,Family,Global conservation status rank,State conservation status rank,Federal protection,State protection,Species of greatest conservation need,Track status code,Animal / Plant
"Species A","url","Common A","Class","Order","Family","G5","S1","","Endangered","High Priority","","Animal"
"Species B","url","Common B","Class","Order","Family","G5","S2","","Threatened","","","Animal"
"Species C","url","Common C","Class","Order","Family","G5","S3","","Special Concern","Medium Priority","","Animal"
"Species D","url","Common D","Class","Order","Family","G5","S4","","Not Listed","","","Animal"
"Species E","url","Common E","Class","Order","Family","G5","S5","","","","","Animal"
`;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('should load conservation statuses and return correct data for Endangered species', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        const status = await getConservationStatus('Species A');
        expect(status).toEqual({
            stateProtection: 'Endangered',
            conservationNeed: 'High Priority',
        });

        expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    });

    it('should return correct data for Threatened species', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        const status = await getConservationStatus('Species B');
        expect(status).toEqual({
            stateProtection: 'Threatened',
            conservationNeed: null,
        });
    });

    it('should return correct data for Special Concern species', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        const status = await getConservationStatus('Species C');
        expect(status).toEqual({
            stateProtection: 'Special Concern',
            conservationNeed: 'Medium Priority',
        });
    });

    it('should filter out non-regulatory state protections', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        const status = await getConservationStatus('Species D');
        expect(status).toEqual({
            stateProtection: null, // "Not Listed" is not in the regulatory list
            conservationNeed: null,
        });
    });

    it('should return null for species not in the list', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        const status = await getConservationStatus('Unknown Species');
        expect(status).toBeNull();
    });

    it('should handle file read errors gracefully', async () => {
        vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const status = await getConservationStatus('Species A');
        expect(status).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should cache the results', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getConservationStatus } = await import('./conservationStatus');

        await getConservationStatus('Species A');
        await getConservationStatus('Species B');

        expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    });
});
