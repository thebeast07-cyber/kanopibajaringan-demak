import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFormulaEngine, generateBukuHitungan } from './formulaEngine';
import { LocalCmsRepository } from '../cms/localCmsRepository';
import { calculateEstimate } from './pricingEngine';
import { datasetHargaUji } from './fixtureHargaUji';
import { EstimatorInput, FormulaStepConfig, ServiceCalculationConfig } from '../../types/domain';

test('STEP 2: Flexible Calculation Engine & Buku Hitungan Unit Tests', async (t) => {
  const repo = new LocalCmsRepository(datasetHargaUji());
  const dataset = repo.getPublishedDataset();

  await t.test('1. Fixed calculation step', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-fixed',
            name: 'Biaya Mobilisasi Tetap',
            enabled: true,
            componentType: 'base',
            valueSource: 'fixed_value',
            priceSource: 'fixed_amount',
            customRate: 350000,
            operation: 'fixed',
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = { serviceId: 'svc-kanopi-alderon', length: 5, width: 4 };
    const res = evaluateFormulaEngine(input, customDataset);

    assert.equal(res.subtotal, 350000);
    assert.equal(res.grandTotal, 350000);
    assert.equal(res.steps[0].subtotal, 350000);
  });

  await t.test('2. Per-unit calculation step', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-unit',
            name: 'Pasang Tralis Unit',
            enabled: true,
            componentType: 'labor',
            valueSource: 'quantity',
            priceSource: 'custom_rate',
            customRate: 150000,
            operation: 'multiply',
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = { serviceId: 'svc-kanopi-alderon', quantity: 3 };
    const res = evaluateFormulaEngine(input, customDataset);

    assert.equal(res.subtotal, 450000); // 3 units * 150,000
    assert.equal(res.steps[0].value, 3);
    assert.equal(res.steps[0].unitLabel, 'unit');
  });

  await t.test('3. Per-meter calculation step', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-meter',
            name: 'Pagar Per Meter',
            enabled: true,
            componentType: 'base',
            valueSource: 'length',
            priceSource: 'custom_rate',
            customRate: 200000,
            operation: 'multiply',
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = { serviceId: 'svc-kanopi-alderon', length: 8 };
    const res = evaluateFormulaEngine(input, customDataset);

    assert.equal(res.subtotal, 1600000); // 8m * 200,000
    assert.equal(res.steps[0].value, 8);
    assert.equal(res.steps[0].unitLabel, 'meter');
  });

  await t.test('4. Per-m² calculation step', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-area',
            name: 'Material Atap Spandek',
            enabled: true,
            componentType: 'material',
            valueSource: 'area',
            priceSource: 'material',
            operation: 'multiply',
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4, // 20 m2
      materialId: 'mat-alderon-twinwall', // 320,000/m2
    };
    const res = evaluateFormulaEngine(input, customDataset);

    assert.equal(res.subtotal, 6400000); // 20 m2 * 320,000
    assert.equal(res.steps[0].value, 20);
    assert.equal(res.steps[0].unitLabel, 'm²');
  });

  await t.test('5. Mixed calculation in a single product', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-area',
            name: 'Atap (Per m²)',
            enabled: true,
            componentType: 'material',
            valueSource: 'area',
            priceSource: 'material',
            operation: 'multiply',
            order: 1,
          },
          {
            id: 'step-length',
            name: 'Talang (Per Meter)',
            enabled: true,
            componentType: 'addon',
            valueSource: 'length',
            priceSource: 'custom_rate',
            customRate: 85000,
            operation: 'multiply',
            order: 2,
          },
          {
            id: 'step-fixed',
            name: 'Ongkos Bongkar',
            enabled: true,
            componentType: 'base',
            valueSource: 'fixed_value',
            priceSource: 'fixed_amount',
            customRate: 350000,
            operation: 'fixed',
            order: 3,
          },
        ],
      },
    ];

    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 6,
      width: 4, // 24 m2
      materialId: 'mat-alderon-twinwall', // 320,000/m2 -> 7,680,000
    };
    const res = evaluateFormulaEngine(input, customDataset);

    // 7,680,000 (Atap) + 510,000 (6m * 85,000 Talang) + 350,000 (Bongkar) = 8,540,000
    assert.equal(res.subtotal, 8540000);
    assert.equal(res.steps.length, 3);
  });

  await t.test('6. Material price source resolution', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall', // 320,000
    };
    const res = evaluateFormulaEngine(input, dataset);
    const matStep = res.steps.find((s) => s.name.includes('Bahan'));

    assert.ok(matStep);
    assert.equal(matStep?.rate, 320000);
  });

  await t.test('7. Labor price source resolution', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      laborId: 'labor-std-installation', // 50,000
    };
    const res = evaluateFormulaEngine(input, dataset);
    const laborStep = res.steps.find((s) => s.name.includes('Upah'));

    assert.ok(laborStep);
    assert.equal(laborStep?.rate, 50000);
  });

  await t.test('8. Finishing price source resolution', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      finishingId: 'finish-cat-zinc-chromate', // 45,000
    };
    const res = evaluateFormulaEngine(input, dataset);
    const fnStep = res.steps.find((s) => s.name.includes('Finishing'));

    assert.ok(fnStep);
    assert.equal(fnStep?.rate, 45000);
  });

  await t.test('9. Addon price source resolution', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-addon',
            name: 'Talang Air PVC',
            enabled: true,
            componentType: 'addon',
            valueSource: 'length',
            priceSource: 'addon',
            operation: 'multiply',
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      addonIds: ['addon-talang-pvc'], // 85,000 per meter -> 5 * 85,000 = 425,000
    };
    const res = evaluateFormulaEngine(input, customDataset);
    assert.equal(res.subtotal, 425000);
  });

  await t.test('10. Fixed amount operation', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-fixed',
            name: 'Fixed Transport',
            enabled: true,
            componentType: 'adjustment',
            valueSource: 'fixed_value',
            priceSource: 'fixed_amount',
            customRate: 250000,
            operation: 'fixed',
            order: 1,
          },
        ],
      },
    ];

    const res = evaluateFormulaEngine({ serviceId: 'svc-kanopi-alderon' }, customDataset);
    assert.equal(res.subtotal, 250000);
  });

  await t.test('11. Percentage calculation semantics (0.15 = 15%)', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-base',
            name: 'Base Pekerjaan',
            enabled: true,
            componentType: 'base',
            valueSource: 'fixed_value',
            priceSource: 'fixed_amount',
            customRate: 1000000,
            operation: 'fixed',
            order: 1,
          },
          {
            id: 'step-pct',
            name: 'Faktor Kesulitan Lantai 2 (+15%)',
            enabled: true,
            componentType: 'adjustment',
            valueSource: 'subtotal',
            priceSource: 'percentage_rate',
            customRate: 0.15, // 15%
            operation: 'percentage',
            order: 2,
          },
        ],
      },
    ];

    const res = evaluateFormulaEngine({ serviceId: 'svc-kanopi-alderon' }, customDataset);

    assert.equal(res.subtotal, 1000000);
    assert.equal(res.adjustmentsTotal, 150000); // 1,000,000 * 0.15
    assert.equal(res.grandTotal, 1150000);
  });

  await t.test('12. Minimum billing threshold calculation', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 2,
      width: 2, // 4 m2 (below minimum billing 12 m2)
      materialId: 'mat-alderon-twinwall', // 320,000
    };

    const res = evaluateFormulaEngine(input, dataset);

    assert.equal(res.billableUnits.actual, 4);
    assert.equal(res.billableUnits.applied, 12);
    assert.equal(res.billableUnits.minimumApplied, true);
    assert.equal(res.subtotal, 3840000); // 12 m2 * 320,000
  });

  await t.test('13. Quantity input calculation', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 4,
      width: 3,
      quantity: 5,
    };

    const res = evaluateFormulaEngine(input, dataset);
    assert.ok(res.billableUnits.actual >= 1);
  });

  await t.test('14. Multiple calculation steps execution', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
      frameId: 'frame-hollow-40x60-galvanis',
      laborId: 'labor-std-installation',
      finishingId: 'finish-cat-zinc-chromate',
    };

    const res = evaluateFormulaEngine(input, dataset);
    assert.equal(res.steps.length, 4);
  });

  await t.test('15. Step ordering evaluation', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          { id: 's2', name: 'Step Two', order: 2, enabled: true, componentType: 'base', valueSource: 'fixed_value', priceSource: 'fixed_amount', customRate: 200, operation: 'fixed' },
          { id: 's1', name: 'Step One', order: 1, enabled: true, componentType: 'base', valueSource: 'fixed_value', priceSource: 'fixed_amount', customRate: 100, operation: 'fixed' },
        ],
      },
    ];

    const res = evaluateFormulaEngine({ serviceId: 'svc-kanopi-alderon' }, customDataset);
    assert.equal(res.steps[0].name, 'Step One');
    assert.equal(res.steps[1].name, 'Step Two');
  });

  await t.test('16. Disabled steps skipped in calculation', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          { id: 's1', name: 'Step Active', order: 1, enabled: true, componentType: 'base', valueSource: 'fixed_value', priceSource: 'fixed_amount', customRate: 100, operation: 'fixed' },
          { id: 's2', name: 'Step Disabled', order: 2, enabled: false, componentType: 'base', valueSource: 'fixed_value', priceSource: 'fixed_amount', customRate: 500, operation: 'fixed' },
        ],
      },
    ];

    const res = evaluateFormulaEngine({ serviceId: 'svc-kanopi-alderon' }, customDataset);
    assert.equal(res.steps.length, 1);
    assert.equal(res.subtotal, 100);
  });

  await t.test('17. Empty / fallback configuration handling', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [];

    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
    };

    const res = evaluateFormulaEngine(input, customDataset);
    assert.ok(res.grandTotal > 0);
    assert.equal(res.steps.length, 1);
  });

  await t.test('18. Historical calculation reproducibility via dataset snapshot versioning', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
    };

    const res = evaluateFormulaEngine(input, dataset);
    assert.equal(res.snapshot.pricingVersion, dataset.businessConfig.pricingVersion);
  });

  await t.test('19. Buku Hitungan reflects calculation result exactly', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
      frameId: 'frame-hollow-40x60-galvanis',
    };

    const result = evaluateFormulaEngine(input, dataset);
    const doc = generateBukuHitungan(input, dataset);

    assert.equal(doc.grandTotal, result.grandTotal);
    assert.equal(doc.subtotal, result.subtotal);
    assert.equal(doc.steps.length, result.steps.length);
  });

  await t.test('20. Buku Hitungan does not independently recalculate values', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
    };

    const doc = generateBukuHitungan(input, dataset);
    assert.equal(typeof doc.grandTotal, 'number');
    assert.ok(doc.steps[0].formulaText.includes('Rp 320.000'));
  });

  await t.test('21. Existing pricing engine calculateEstimate remains unchanged', () => {
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 5,
      width: 4,
      materialId: 'mat-alderon-twinwall',
    };

    const resPricing = calculateEstimate(input, dataset);
    assert.ok(resPricing.snapshot.breakdown.total > 0);
    assert.equal(resPricing.snapshot.pricingVersion, dataset.businessConfig.pricingVersion);
  });

  await t.test('22. Existing custom_input behavior without customInputConfig remains backward-compatible', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-legacy-custom',
            name: 'Pemasangan Titik Lampu',
            enabled: true,
            componentType: 'addon',
            valueSource: 'custom_input',
            priceSource: 'custom_rate',
            customRate: 75000,
            operation: 'multiply',
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = { serviceId: 'svc-kanopi-alderon', quantity: 4 };
    const res = evaluateFormulaEngine(input, customDataset);

    assert.equal(res.subtotal, 300000); // 4 * 75000
    assert.equal(res.steps[0].unitLabel, 'item');
    assert.equal(res.steps[0].value, 4);
  });

  await t.test('23. customInputConfig is optional and custom input label/unit are preserved in step details', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-custom-lampu',
            name: 'Pemasangan Titik Lampu Spot',
            enabled: true,
            componentType: 'addon',
            valueSource: 'custom_input',
            priceSource: 'custom_rate',
            customRate: 120000,
            operation: 'multiply',
            customInputConfig: {
              label: 'Jumlah Titik Lampu',
              unit: 'titik',
              defaultValue: 2,
            },
            order: 1,
          },
        ],
      },
    ];

    // Case 1: Use default value 2
    const inputDefault: EstimatorInput = { serviceId: 'svc-kanopi-alderon' };
    const resDefault = evaluateFormulaEngine(inputDefault, customDataset);

    assert.equal(resDefault.subtotal, 240000); // 2 titik * 120,000
    assert.equal(resDefault.steps[0].value, 2);
    assert.equal(resDefault.steps[0].unitLabel, 'titik');

    // Case 2: Provide input via customInputs record
    const inputCustom: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      customInputs: {
        'step-custom-lampu': 5,
      },
    };
    const resCustom = evaluateFormulaEngine(inputCustom, customDataset);

    assert.equal(resCustom.subtotal, 600000); // 5 titik * 120,000
    assert.equal(resCustom.steps[0].value, 5);
    assert.equal(resCustom.steps[0].unitLabel, 'titik');
  });

  await t.test('24. Formula Engine remains strictly deterministic with customInputs map', () => {
    const customDataset = JSON.parse(JSON.stringify(dataset));
    customDataset.calculationConfigs = [
      {
        serviceId: 'svc-kanopi-alderon',
        steps: [
          {
            id: 'step-siku',
            name: 'Siku Penguat Pagar',
            enabled: true,
            componentType: 'addon',
            valueSource: 'custom_input',
            priceSource: 'custom_rate',
            customRate: 25000,
            operation: 'multiply',
            customInputConfig: {
              label: 'Jumlah Siku',
              unit: 'pcs',
              defaultValue: 4,
            },
            order: 1,
          },
        ],
      },
    ];

    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      customInputs: { 'Jumlah Siku': 8 },
    };

    const res1 = evaluateFormulaEngine(input, customDataset);
    const res2 = evaluateFormulaEngine(input, customDataset);

    assert.equal(res1.subtotal, 200000); // 8 pcs * 25,000
    assert.equal(res1.subtotal, res2.subtotal);
  });
});
