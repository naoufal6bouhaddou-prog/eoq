import { describe, expect, it } from 'vitest';

import { checkField } from './validate';

describe('field checks', () => {
  it('accepts a positive value and hands back the parsed number', () => {
    const result = checkField('annualDemand', '10 000', 'fr', { rule: 'positive', required: true });
    expect(result.value).toBe(10_000);
    expect(result.issue).toBeNull();
  });

  it('rejects zero and negatives where the model needs a positive value', () => {
    for (const raw of ['0', '-5']) {
      expect(checkField('orderCost', raw, 'en', { rule: 'positive', required: true }).issue).toEqual(
        { field: 'orderCost', code: 'must-be-positive' },
      );
    }
  });

  it('allows zero for a standard deviation', () => {
    const result = checkField('safetyStock', '0', 'en', { rule: 'nonNegative', required: false });
    expect(result.value).toBe(0);
    expect(result.issue).toBeNull();
  });

  it('holds the holding rate above 0 and at or below 1', () => {
    expect(checkField('holdingRate', '0,2', 'fr', { rule: 'rate', required: true }).value).toBeCloseTo(
      0.2,
      10,
    );
    expect(checkField('holdingRate', '0', 'en', { rule: 'rate', required: true }).issue?.code).toBe(
      'rate-out-of-range',
    );
    expect(checkField('holdingRate', '1.5', 'en', { rule: 'rate', required: true }).issue?.code).toBe(
      'rate-out-of-range',
    );
    expect(checkField('holdingRate', '1', 'en', { rule: 'rate', required: true }).issue).toBeNull();
  });


  it('separates an empty required field from unreadable text', () => {
    expect(checkField('annualDemand', '', 'en', { rule: 'positive', required: true }).issue?.code).toBe(
      'required',
    );
    expect(
      checkField('annualDemand', 'quinze', 'en', { rule: 'positive', required: true }).issue?.code,
    ).toBe('not-a-number');
  });

  it('leaves an empty optional field alone', () => {
    const result = checkField('unitCost', '', 'en', { rule: 'positive', required: false });
    expect(result.value).toBeNull();
    expect(result.issue).toBeNull();
  });
});
