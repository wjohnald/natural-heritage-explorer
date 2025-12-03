import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVernalPoolStatus } from './vernalPoolStatus';
import fs from 'fs';

// Mock fs.promises
vi.mock('fs', () => ({
    default: {
        promises: {
            readFile: vi.fn(),
        },
    },
}));

describe('vernalPoolStatus', () => {
    const mockCsvContent = `Scientific Name,Common Name,Vernal Pool Status,Taxonomic Group,Notes,Source
"Ambystoma maculatum","Spotted Salamander","Obligate","Amphibian","","Source A"
"Lithobates sylvaticus","Wood Frog","Obligate","Amphibian","","Source B"
"Hemidactylium scutatum","Four-toed Salamander","Facultative","Amphibian","","Source C"
"Not A Vernal Pool Species","Random Species","","","",""
`;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        // Reset the internal cache of the module by re-importing if necessary, 
        // but since we can't easily reset the module-level variable `vernalPoolStatusMap` 
        // without exposing a reset function, we might need to rely on `vi.resetModules()` 
        // and dynamic imports, or just acknowledge that the first test loads it.
        // However, `vi.resetModules()` works best when we import the module INSIDE the test or beforeEach.
        // Let's try to use dynamic import in the tests or just mock the file read for all tests.
    });

    // Since the module has top-level state (vernalPoolStatusMap), we need to be careful.
    // Ideally, we would have a way to reset the cache.
    // For this test, we will mock the file system response before the first call.

    it('should load vernal pool statuses and return correct data for Obligate species', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);

        // We need to re-import the module to ensure the cache is empty if we want to test loading
        // But `vi.resetModules()` should handle this if we use `await import` inside the test?
        // Actually, since we imported it at the top level, it might already be cached.
        // Let's use `vi.resetModules()` and dynamic import for better isolation.
        vi.resetModules();
        const { getVernalPoolStatus } = await import('./vernalPoolStatus');

        const status = await getVernalPoolStatus('Ambystoma maculatum');
        expect(status).toEqual({
            vernalPoolStatus: 'Obligate',
            taxonomicGroup: 'Amphibian',
            notes: null,
        });

        expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    });

    it('should return correct data for Facultative species', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getVernalPoolStatus } = await import('./vernalPoolStatus');

        const status = await getVernalPoolStatus('Hemidactylium scutatum');
        expect(status).toEqual({
            vernalPoolStatus: 'Facultative',
            taxonomicGroup: 'Amphibian',
            notes: null,
        });
    });

    it('should return null for species not in the list', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getVernalPoolStatus } = await import('./vernalPoolStatus');

        const status = await getVernalPoolStatus('Unknown Species');
        expect(status).toBeNull();
    });

    it('should return null for species in list but without Obligate/Facultative status', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getVernalPoolStatus } = await import('./vernalPoolStatus');

        const status = await getVernalPoolStatus('Not A Vernal Pool Species');
        expect(status).toBeNull();
    });

    it('should handle file read errors gracefully', async () => {
        vi.mocked(fs.promises.readFile).mockRejectedValue(new Error('File not found'));
        vi.resetModules();
        const { getVernalPoolStatus } = await import('./vernalPoolStatus');

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const status = await getVernalPoolStatus('Ambystoma maculatum');
        expect(status).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should cache the results and not read file multiple times', async () => {
        vi.mocked(fs.promises.readFile).mockResolvedValue(mockCsvContent);
        vi.resetModules();
        const { getVernalPoolStatus } = await import('./vernalPoolStatus');

        await getVernalPoolStatus('Ambystoma maculatum');
        await getVernalPoolStatus('Lithobates sylvaticus');

        expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    });
});
