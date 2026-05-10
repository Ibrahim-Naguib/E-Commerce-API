import { describe, expect, it } from 'vitest';
import { ApiFeatures } from '../src/lib/apiFeatures.js';
import { Category } from '../src/models/Category.js';

describe('ApiFeatures pagination count', () => {
  it('uses filtered count for pagination metadata', async () => {
    await Category.create({ name: 'AlphaCat', slug: 'alpha-cat' });
    await Category.create({ name: 'BetaCat', slug: 'beta-cat' });
    const filter = { slug: 'alpha-cat' };
    const count = await Category.countDocuments(filter);
    const features = new ApiFeatures(Category.find(filter), {}).sort().paginate(count);
    const docs = await features.mongooseQuery;
    expect(docs).toHaveLength(1);
    expect(count).toBe(1);
  });
});
