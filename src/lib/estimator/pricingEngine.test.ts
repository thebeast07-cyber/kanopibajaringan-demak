import assert from 'node:assert';
import { test, describe } from 'node:test';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import {
  calculateEstimate,
  calculateBillableUnits,
  evaluatePricingRule,
  calculateDurationRange,
} from './pricingEngine';
import { EstimatorInput, PricingRuleSchema } from '../../types/domain';

describe('Pricing Engine Unit Tests', () => {

  test('1. Minimum Billing Rule: Override actual area if below threshold', () => {
    const service = COMPREHENSIVE_DATASET.services.find((s) => s.id === 'svc-kanopi-alderon')!;
    // Service minimumArea is 12 m². Input is 2m x 4m = 8 m²
    const input: EstimatorInput = {
      serviceId: service.id,
      length: 4,
      width: 2,
    };

    const result = calculateBillableUnits(input, service);
    assert.strictEqual(result.actual, 8, 'Actual area should be 8 m²');
    assert.strictEqual(result.applied, 12, 'Applied area should be overridden to minimum 12 m²');
    assert.strictEqual(result.unitType, 'm2');
  });

  test('2. Billable Units: Linear meter calculation', () => {
    const service = COMPREHENSIVE_DATASET.services.find((s) => s.id === 'svc-pagar-minimalis')!;
    // Service minimumLength is 4m. Input is 6m
    const input: EstimatorInput = {
      serviceId: service.id,
      length: 6,
    };

    const result = calculateBillableUnits(input, service);
    assert.strictEqual(result.actual, 6);
    assert.strictEqual(result.applied, 6);
    assert.strictEqual(result.unitType, 'meter');
  });

  test('3. Explicit Percentage vs Multiplier Semantics', () => {
    const subtotal = 1000000;

    const percentageRule: PricingRuleSchema = {
      id: 'p1',
      targetComponent: 'adjustment',
      model: 'percentage',
      rate: 0.15, // 15%
    };

    const multiplierRule: PricingRuleSchema = {
      id: 'm1',
      targetComponent: 'adjustment',
      model: 'multiplier',
      rate: 1.10, // 1.10x
    };

    const percentageEffect = evaluatePricingRule(percentageRule, 1, subtotal);
    const multiplierEffect = Math.round(evaluatePricingRule(multiplierRule, 1, subtotal));

    assert.strictEqual(percentageEffect, 150000, '15% of 1,000,000 must be 150,000');
    assert.strictEqual(multiplierEffect, 100000, '1.10x multiplier on 1,000,000 must produce 100,000 net adjustment');
    assert.notStrictEqual(percentageEffect, multiplierEffect, 'Percentage and Multiplier must have distinct semantic evaluations');
  });

  test('4. Range-based Duration Lookup (JSON-safe maxUnits null)', () => {
    const service = COMPREHENSIVE_DATASET.services.find((s) => s.id === 'svc-kanopi-alderon')!;
    // 15 m² falls in 0-20 m² range (2-3 days)
    const dur1 = calculateDurationRange(15, service);
    assert.strictEqual(dur1.minDays, 2);
    assert.strictEqual(dur1.maxDays, 3);

    // 25 m² falls in 21-40 m² range (3-5 days)
    const dur2 = calculateDurationRange(25, service);
    assert.strictEqual(dur2.minDays, 3);
    assert.strictEqual(dur2.maxDays, 5);

    // 50 m² falls in 41+ m² range (5-8 days)
    const dur3 = calculateDurationRange(50, service);
    assert.strictEqual(dur3.minDays, 5);
    assert.strictEqual(dur3.maxDays, 8);
  });

  test('5. Complete Estimate Calculation & Snapshot Preservation', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4, // 20 m²
      materialId: 'mat-alderon-twinwall', // 320,000 / m²
      frameId: 'frame-hollow-40x60-galvanis', // 220,000 / m²
      laborId: 'labor-std-installation', // 50,000 / m²
      finishingId: 'finish-cat-zinc-chromate', // 45,000 / m²
      addonIds: ['addon-talang-pvc'], // 85,000 / meter (20m billable = 1,700,000)
      siteConditionIds: ['site-floor-2-access'], // 15% percentage surcharge
      notes: 'Lokasi rumah cluster jalan lebar.',
    };

    const { snapshot } = calculateEstimate(input, COMPREHENSIVE_DATASET);

    assert.ok(snapshot.estimateId.startsWith('EST-'));
    assert.strictEqual(snapshot.pricingVersion, COMPREHENSIVE_DATASET.businessConfig.pricingVersion);
    assert.deepStrictEqual(snapshot.input, input, 'Snapshot must preserve exact raw input');
    assert.strictEqual(snapshot.billableUnits.applied, 20);

    // Base = 150k * 20 = 3,000,000
    // Material = 320k * 20 = 6,400,000
    // Frame = 220k * 20 = 4,400,000
    // Labor = 50k * 20 = 1,000,000
    // Finishing = 45k * 20 = 900,000
    // AddOn = 85k * 20 = 1,700,000
    // Subtotal = 17,400,000
    assert.strictEqual(snapshot.breakdown.subtotal, 17400000);

    // Site condition 15% surcharge on 17,400,000 = 2,610,000
    assert.strictEqual(snapshot.breakdown.percentageAdjustmentsTotal, 2610000);

    // Total = 17,400,000 + 2,610,000 = 20,010,000
    assert.strictEqual(snapshot.breakdown.total, 20010000);

    // Deterministic estimate
    assert.strictEqual(snapshot.estimate.min, 20010000);
    assert.strictEqual(snapshot.estimate.max, 20010000);
  });

  test('6. Category-Aware Material Step Title Logic (Canopy vs Gerobak vs Booth)', () => {
    const isGerobakOrBoothCategory = (category: string) => category === 'gerobak' || category === 'booth';
    const getMaterialLabel = (category: string) =>
      isGerobakOrBoothCategory(category) ? 'Material Body & Dinding' : 'Material Atap';
    const getMaterialStepHeading = (category: string) =>
      isGerobakOrBoothCategory(category)
        ? '03. Pilih Material Body & Dinding'
        : '03. Pilih Material Penutup Atap';

    // 1. Canopy service category
    assert.strictEqual(getMaterialLabel('canopy'), 'Material Atap');
    assert.strictEqual(getMaterialStepHeading('canopy'), '03. Pilih Material Penutup Atap');

    // 2. Gerobak service category
    assert.strictEqual(getMaterialLabel('gerobak'), 'Material Body & Dinding');
    assert.strictEqual(getMaterialStepHeading('gerobak'), '03. Pilih Material Body & Dinding');

    // 3. Booth service category
    assert.strictEqual(getMaterialLabel('booth'), 'Material Body & Dinding');
    assert.strictEqual(getMaterialStepHeading('booth'), '03. Pilih Material Body & Dinding');

    // 4. Other service categories (e.g. gate, railing, tralis)
    assert.strictEqual(getMaterialLabel('gate'), 'Material Atap');
    assert.strictEqual(getMaterialStepHeading('gate'), '03. Pilih Material Penutup Atap');
  });
});
