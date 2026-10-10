import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateFormulaEngine,
  getCustomInputDescriptors,
} from './formulaEngine';
import { COMPREHENSIVE_DATASET } from '../../data/comprehensiveDataset';
import {
  EstimatorInput,
  ServiceCalculationConfig,
  CompleteDataset,
} from '../../types/domain';

test('STEP 5C: Dynamic Custom Input Contract & Estimator Binding Tests', async (t) => {
  const dataset: CompleteDataset = JSON.parse(JSON.stringify(COMPREHENSIVE_DATASET));

  await t.test('1. getCustomInputDescriptors extracts active custom_input steps in deterministic order', () => {
    const config: ServiceCalculationConfig = {
      serviceId: 'svc-test-custom',
      steps: [
        {
          id: 'step-lampu',
          name: 'Pemasangan Titik Lampu',
          enabled: true,
          order: 2,
          valueSource: 'custom_input',
          priceSource: 'custom_rate',
          customRate: 100000,
          customInputConfig: {
            label: 'Jumlah Titik Lampu',
            unit: 'titik',
            defaultValue: 4,
          },
        },
        {
          id: 'step-standard-mat',
          name: 'Atap Main',
          enabled: true,
          order: 1,
          valueSource: 'area',
          priceSource: 'material',
        },
        {
          id: 'step-stopkontak',
          name: 'Titik Stop Kontak Extra',
          enabled: true,
          order: 3,
          valueSource: 'custom_input',
          priceSource: 'custom_rate',
          customRate: 50000,
          customInputConfig: {
            label: 'Jumlah Stop Kontak',
            unit: 'titik',
            defaultValue: 2,
          },
        },
        {
          id: 'step-disabled-custom',
          name: 'Custom Step Nonaktif',
          enabled: false,
          order: 4,
          valueSource: 'custom_input',
          priceSource: 'custom_rate',
        },
      ],
    };

    const descriptors = getCustomInputDescriptors(config);

    // Disabled step must be excluded
    assert.equal(descriptors.length, 2);

    // Sorted by order (order 2 then order 3)
    assert.equal(descriptors[0].key, 'step-lampu');
    assert.equal(descriptors[0].stepId, 'step-lampu');
    assert.equal(descriptors[0].label, 'Jumlah Titik Lampu');
    assert.equal(descriptors[0].unit, 'titik');
    assert.equal(descriptors[0].defaultValue, 4);

    assert.equal(descriptors[1].key, 'step-stopkontak');
    assert.equal(descriptors[1].stepId, 'step-stopkontak');
    assert.equal(descriptors[1].label, 'Jumlah Stop Kontak');
    assert.equal(descriptors[1].unit, 'titik');
    assert.equal(descriptors[1].defaultValue, 2);
  });

  await t.test('2. Canonical step.id binding key maps runtime inputs to formulaEngine accurately', () => {
    const customDataset: CompleteDataset = JSON.parse(JSON.stringify(dataset));
    const config: ServiceCalculationConfig = {
      serviceId: 'svc-kanopi-alderon',
      steps: [
        {
          id: 'step-titik-lampu-01',
          name: 'Instalasi Titik Lampu Void',
          enabled: true,
          order: 1,
          componentType: 'addon',
          valueSource: 'custom_input',
          priceSource: 'custom_rate',
          customRate: 150000,
          customInputConfig: {
            label: 'Jumlah Titik Lampu Spot',
            unit: 'titik',
            defaultValue: 2,
          },
        },
        {
          id: 'step-siku-02',
          name: 'Siku Penguat Besi Extra',
          enabled: true,
          order: 2,
          componentType: 'addon',
          valueSource: 'custom_input',
          priceSource: 'custom_rate',
          customRate: 35000,
          customInputConfig: {
            label: 'Jumlah Siku Penguat',
            unit: 'pcs',
            defaultValue: 4,
          },
        },
      ],
    };

    customDataset.calculationConfigs = [config];

    // Bound via canonical key step.id
    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      customInputs: {
        'step-titik-lampu-01': 5, // 5 titik * 150.000 = 750.000
        'step-siku-02': 10,       // 10 pcs * 35.000 = 350.000
      },
    };

    const res = evaluateFormulaEngine(input, customDataset);

    assert.equal(res.steps.length, 2);

    assert.equal(res.steps[0].stepId, 'step-titik-lampu-01');
    assert.equal(res.steps[0].value, 5);
    assert.equal(res.steps[0].unitLabel, 'titik');
    assert.equal(res.steps[0].subtotal, 750000);

    assert.equal(res.steps[1].stepId, 'step-siku-02');
    assert.equal(res.steps[1].value, 10);
    assert.equal(res.steps[1].unitLabel, 'pcs');
    assert.equal(res.steps[1].subtotal, 350000);

    assert.equal(res.subtotal, 1100000);
  });

  await t.test('3. Fallback to defaultValue occurs when customInputs map entry is missing', () => {
    const customDataset: CompleteDataset = JSON.parse(JSON.stringify(dataset));
    const config: ServiceCalculationConfig = {
      serviceId: 'svc-kanopi-alderon',
      steps: [
        {
          id: 'step-titik-lampu-fallback',
          name: 'Instalasi Titik Lampu Void',
          enabled: true,
          order: 1,
          valueSource: 'custom_input',
          priceSource: 'custom_rate',
          customRate: 100000,
          customInputConfig: {
            label: 'Jumlah Titik Lampu',
            unit: 'titik',
            defaultValue: 3,
          },
        },
      ],
    };

    customDataset.calculationConfigs = [config];

    const inputEmptyCustom: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      customInputs: {},
    };

    const res = evaluateFormulaEngine(inputEmptyCustom, customDataset);

    assert.equal(res.steps[0].value, 3); // Default value 3
    assert.equal(res.steps[0].unitLabel, 'titik');
    assert.equal(res.subtotal, 300000);
  });

  await t.test('4. Legacy formula without customInputConfig continues working without breaking', () => {
    const customDataset: CompleteDataset = JSON.parse(JSON.stringify(dataset));
    const config: ServiceCalculationConfig = {
      serviceId: 'svc-kanopi-alderon',
      steps: [
        {
          id: 'step-legacy-plain',
          name: 'Langkah Legacy',
          enabled: true,
          order: 1,
          valueSource: 'area',
          priceSource: 'custom_rate',
          customRate: 200000,
        },
      ],
    };

    customDataset.calculationConfigs = [config];

    const descriptors = getCustomInputDescriptors(config);
    assert.equal(descriptors.length, 0);

    const input: EstimatorInput = {
      serviceId: 'svc-kanopi-alderon',
      length: 4,
      width: 5,
    };

    const res = evaluateFormulaEngine(input, customDataset);
    assert.equal(res.subtotal, 4000000); // 20m² * 200.000
  });
});
