import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { ParcelScores } from './types';

export class CsvLoader {
    private static instance: CsvLoader;
    private scores: Map<string, ParcelScores> = new Map();
    private loaded = false;

    private constructor() { }

    public static getInstance(): CsvLoader {
        if (!CsvLoader.instance) {
            CsvLoader.instance = new CsvLoader();
        }
        return CsvLoader.instance;
    }

    public getScores(parcelId: string): ParcelScores | undefined {
        if (!this.loaded) {
            this.loadData();
        }
        return this.scores.get(parcelId);
    }

    private loadData() {
        const dataDir = path.join(process.cwd(), 'HudsoniaParcelScores');

        // Load Habitats
        this.loadCsv(path.join(dataDir, 'appx.a.parcelscorehabitats.csv'), (row, scores) => {
            scores.ia = parseInt(row['IA']) || 0;
            scores.communities = parseInt(row['Communities']) || 0;
            scores.resiliency = parseInt(row['Resiliency']) || 0;
            scores.species = parseInt(row['Species']) || 0;
            scores.cores = parseInt(row['Cores']) || 0;
            scores.pools = parseInt(row['Pools']) || 0;
            scores.wetland300 = parseInt(row['Wetland_300']) || 0;
            scores.habitat1 = parseInt(row['Habitat_1']) || 0;
            scores.habitat2 = parseInt(row['Habitat_2']) || 0;
        });

        // Load Agricultural
        this.loadCsv(path.join(dataDir, 'appx.a.parcelscoresagricultural.csv'), (row, scores) => {
            scores.agSoils = parseInt(row['Ag_Soils']) || 0;
            scores.agDistrict = parseInt(row['Ag_District']) || 0;
            scores.farmsAdjacent = parseInt(row['Farms_Adjacent']) || 0;
            scores.protected = parseInt(row['Protected']) || 0;
            scores.centuryFarms = parseInt(row['Century_Farms']) || 0;
        });

        // Load Drinking Water
        this.loadCsv(path.join(dataDir, 'appx.a.parcelscoresdrinkingwater.csv'), (row, scores) => {
            scores.epaAquifers = parseInt(row['EPA_Aquifers']) || 0;
            scores.bedrockAquifers = parseInt(row['Bedrock_Aquifers']) || 0;
            scores.ashokanWatershed = parseInt(row['Ashokan_Watershed']) || 0;
            scores.classAStreams = parseInt(row['Class_A_Streams']) || 0;
        });

        // Load Forest
        this.loadCsv(path.join(dataDir, 'appx.a_.parcelscoresforest.csv'), (row, scores) => {
            scores.matrixForest = parseInt(row['Matrix_Forest']) || 0;
            scores.coreForest = parseInt(row['Core_Forest']) || 0;
            scores.highQualityForest = parseInt(row['High_Quality_Forest']) || 0;
            scores.roadlessBlocks = parseInt(row['Roadless_Blocks']) || 0;
            scores.iaPlants = parseInt(row['IA_Plants']) || 0;
            scores.protectedAdjacent = parseInt(row['Protected_Adjacent']) || 0;
        });

        this.loaded = true;
        console.log(`Loaded scores for ${this.scores.size} parcels`);
    }

    private loadCsv(filePath: string, mapRow: (row: any, scores: ParcelScores) => void) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            for (const row of records as any[]) {
                const parcelId = row['Parcel ID'];
                if (!parcelId) continue;

                let scores = this.scores.get(parcelId);
                if (!scores) {
                    scores = { parcelId };
                    this.scores.set(parcelId, scores);
                }

                mapRow(row, scores);
            }
        } catch (error) {
            console.error(`Error loading CSV ${filePath}:`, error);
        }
    }
}
