# Marbletown CPP Composite Scoring Methodology

## Overview

The Marbletown Community Preservation Plan (CPP) uses a **composite scoring system** to prioritize parcels for conservation based on their natural resource values. Each parcel receives a composite score that reflects the cumulative priority across eight resource categories.

This document describes the official methodology as defined in the [Marbletown CPP Version 2c (2022-05-31)](file:///Users/wjohnalder/Documents/nys-heritage-mapper/inaturalist-address-search/MarbletownScoringMethodologyAndMaps/marbletown-cpp-version-2c-2022-05-31.pdf).

---

## Three-Step Scoring Process

### Step 1: Calculate Raw Scores by Criterion

For each parcel, individual geographic and environmental criteria are evaluated. Each criterion that a parcel meets contributes a **raw score** (a positive integer value).

**Example:**
- A parcel intersecting a wetland with 300' buffer earns a raw score
- A parcel containing NYNHP Important Areas earns a raw score
- A parcel with prime agricultural soils earns a raw score

**Key Point:** Raw scores vary by criterion and reflect the relative importance of each environmental feature.

---

### Step 2: Sum Raw Scores by Resource Category

Raw scores are summed within each of the **eight resource categories**:

1. Drinking Water
2. Wildlife Habitat (Habitats)
3. Forests and Woodlands
4. Streams and Wetlands
5. Recreation and Trails
6. Scenic Areas
7. Historic and Cultural
8. Agricultural

**Example:**
```
Wildlife Habitat Category:
  Wetland w/300' buffer:        3
  NYNHP Important Areas:        2
  Ulster County Habitat Cores:  1
  ─────────────────────────────
  Category Raw Score Total:     6
```

---

### Step 3: Map Category Totals to Priority Scores

Each resource category's raw score total is mapped to a **Priority Score** (High, Medium, or Low) using category-specific thresholds defined in **Table 2.2**.

**Example:**
```
Wildlife Habitat Category Raw Score: 6
According to Table 2.2: 6-9 = High Priority
Priority Score: High (assigned value per table)
```

---

### Step 4: Calculate Composite Score

The **Composite Score** is the sum of all eight priority score values.

**Formula:**
```
Composite Score = Σ (Priority Score Value for each of 8 Resource Categories)
```

**Example:**
```
Drinking Water:           High (3)
Wildlife Habitat:         High (9)
Forests and Woodlands:    Medium (3)
Streams and Wetlands:     Medium (2)
Recreation and Trails:    Low (1)
Scenic Areas:             Low (1)
Historic and Cultural:    Low (1)
Agricultural:             Medium (3)
──────────────────────────────────
Composite Score:          23
```


---

## Resource Categories and Criteria

The following sections describe the criteria evaluated within each resource category. Each criterion contributes to the category's raw score total.

### 1. Drinking Water

**Criteria:**
- EPA Principal Aquifers
- Bedrock Aquifers (Vly School Rondout)
- Ashokan Watershed
- DEC Class A Streams

**Priority Thresholds (Table 2.2):**
- High Priority: 3
- Medium Priority: 2
- Low Priority: 1

---

### 2. Wildlife Habitat (Habitats)

**Criteria:**
- Wetland w/300' buffer
- NYNHP Important Areas for Rare Animals
- NYNHP Significant Communities
- TNC Resilient Sites
- Ulster County Habitat Cores
- Vernal Pool with 750' buffer
- Hudsonia Mapped Crest/ledge/talus w/600' buffer
- Additional Significant Habitat

**Priority Thresholds (Table 2.2):**
- High Priority: 6-9
- Medium Priority: 4-5
- Low Priority: 1-3

---

### 3. Forests and Woodlands

**Criteria:**
- TNC Matrix Forest Blocks or Linkage Zones
- NYNHP Core Forests
- NYNHP High Ranking Forests (60+ percentile)
- NYNHP Roadless Blocks (100+ acres)
- NYNHP Important Areas for Rare Plants
- Adjacent to Protected Lands

**Priority Thresholds (Table 2.2):**
- High Priority: 4-6
- Medium Priority: 3
- Low Priority: 1-2

---

### 4. Streams and Wetlands

**Priority Thresholds (Table 2.2):**
- High Priority: 3-5
- Medium Priority: 2
- Low Priority: 1

> [!NOTE]
> Specific criteria for this category are documented in the full CPP report and Hudsonia data sources.

---

### 5. Recreation and Trails

**Priority Thresholds (Table 2.2):**
- High Priority: 3-6
- Medium Priority: 2
- Low Priority: 1

> [!NOTE]
> Specific criteria for this category are documented in the full CPP report and Hudsonia data sources.

---

### 6. Scenic Areas

**Priority Thresholds (Table 2.2):**
- High Priority: 3-5
- Medium Priority: 2
- Low Priority: 1

> [!NOTE]
> Specific criteria for this category are documented in the full CPP report and Hudsonia data sources.

---

### 7. Historic and Cultural

**Priority Thresholds (Table 2.2):**
- High Priority: 3-4
- Medium Priority: 2
- Low Priority: 1

> [!NOTE]
> Specific criteria for this category are documented in the full CPP report and Hudsonia data sources.

---

### 8. Agricultural

**Criteria (partial list):**
- Prime Soils if Drained
- Agricultural Districts
- Adjacent to Farms
- Protected Farmland
- Century Farms

**Priority Thresholds (Table 2.2):**
- High Priority: 4-6
- Medium Priority: 3
- Low Priority: 1-2

---

## Key Methodology Principles

### 1. Category-Based Aggregation

Raw scores are **not summed globally**. Instead, they are first summed **within each category**, then mapped to priority levels specific to that category.

### 2. Category-Specific Thresholds

Each resource category has **different thresholds** for determining High/Medium/Low priority. For example:
- Drinking Water: High = 3, Medium = 2, Low = 1
- Habitats: High = 6-9, Medium = 4-5, Low = 1-3

This reflects the different scales and importance of criteria within each category.

### 3. Priority Score Values

The priority score values (High, Medium, Low) shown in Table 2.2 represent the **actual numeric values** that are summed to create the composite score.

> [!IMPORTANT]
> **Critical Distinction:** The composite score is NOT a simple sum of all raw criterion scores. It is the sum of priority scores after each category's raw total has been mapped to its priority level.

---

## Worked Example

Let's walk through a complete example for a hypothetical parcel:

### Step 1: Evaluate Individual Criteria and Assign Raw Scores

| Category | Criterion | Raw Score |
|----------|-----------|-----------|
| Drinking Water | EPA Principal Aquifers | 1 |
| Drinking Water | DEC Class A Streams | 1 |
| Wildlife Habitat | Wetland w/300' buffer | 3 |
| Wildlife Habitat | NYNHP Important Areas | 2 |
| Wildlife Habitat | Ulster County Habitat Cores | 1 |
| Forests and Woodlands | TNC Matrix Forest Blocks | 2 |
| Forests and Woodlands | Adjacent to Protected Lands | 1 |
| Agricultural | Prime Soils if Drained | 2 |
| Agricultural | Agricultural Districts | 1 |

### Step 2: Sum Raw Scores by Category

| Category | Criterion Scores | Category Total |
|----------|------------------|----------------|
| Drinking Water | 1 + 1 | **2** |
| Wildlife Habitat | 3 + 2 + 1 | **6** |
| Forests and Woodlands | 2 + 1 | **3** |
| Agricultural | 2 + 1 | **3** |

### Step 3: Map to Priority Levels Using Table 2.2

| Category | Raw Total | Priority Level | Priority Score Value |
|----------|-----------|----------------|----------------------|
| Drinking Water | 2 | Medium | 2 |
| Wildlife Habitat | 6 | High | 6 (lower bound of 6-9 range) |
| Forests and Woodlands | 3 | Medium | 3 |
| Agricultural | 3 | Medium | 3 |

### Step 4: Calculate Composite Score

```
Composite Score = 2 + 6 + 3 + 1 + 1 + 1 + 1 + 3 = 18
```

This parcel receives a **composite score of 18**, indicating moderate-to-high conservation priority.

---

## Interpreting Composite Scores

### Score Ranges

While the CPP document doesn't explicitly define composite score ranges, we can infer reasonable interpretations:

| Composite Score Range | Interpretation |
|----------------------|----------------|
| **24-38** | Very High Priority - Multiple high-value resources |
| **16-23** | High Priority - Several significant resources |
| **10-15** | Moderate Priority - Some valuable resources |
| **8-9** | Low Priority - Minimal resource values |

> [!NOTE]
> The theoretical minimum is 8 (all categories at Low priority = 1 each), and the theoretical maximum depends on the actual priority score values assigned in Table 2.2.

---

## Data Sources and References

### Primary Documents

- **[Marbletown CPP Version 2c (2022-05-31)](file:///Users/wjohnalder/Documents/nys-heritage-mapper/inaturalist-address-search/MarbletownScoringMethodologyAndMaps/marbletown-cpp-version-2c-2022-05-31.pdf)** - Official methodology document containing Table 2.2 and full scoring details

- **[Appendix B: Detailed Resource Category Maps](file:///Users/wjohnalder/Documents/nys-heritage-mapper/inaturalist-address-search/MarbletownScoringMethodologyAndMaps/appendix_b_cpp_detailed_resource_category_maps.pdf)** - Geographic visualization of all scoring criteria

- **[Appendix D: Resource Category Data Sources](file:///Users/wjohnalder/Documents/nys-heritage-mapper/inaturalist-address-search/MarbletownScoringMethodologyAndMaps/appendix_d_resource_category_data_sources_points.pdf)** - Detailed provenance for all data layers

### Data Provider

**Hudsonia Ltd.** - Environmental research institute that prepared the parcel scoring analysis and provided the raw score data files.

---

## Visual Reference

The following table from the official CPP document (Table 2.2) defines the priority score values for each resource category:

![Table 2.2: Priority Parcel Score Values for each Resource Category](/Users/wjohnalder/.gemini/antigravity/brain/ab3fdba8-eb7b-4e3c-b379-888c801114fa/uploaded_image_1763917565093.png)

