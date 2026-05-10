import request from 'supertest';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { getEnv } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';

const longDesc = 'Description long enough for validation rules here';

async function seedProducts() {
  const cat = await Category.create({ name: 'PagCat', slug: `pag-${crypto.randomBytes(4).toString('hex')}` });
  const mk = (title: string, slug: string, price: number) =>
    Product.create({
      title,
      slug,
      description: longDesc,
      quantity: 10,
      price,
      imageCover: 'https://cdn.example.com/p.jpg',
      category: cat._id,
    });
  await mk('Cheap item', `cheap-${crypto.randomBytes(4).toString('hex')}`, 5);
  for (let i = 0; i < 5; i += 1) {
    await mk(`Mid item ${i}`, `mid-${i}-${crypto.randomBytes(4).toString('hex')}`, 20);
  }
  return cat;
}

describe('product list pagination', () => {
  it('counts documents after query-string filters, not only base filter', async () => {
    await seedProducts();
    const app = createApp(getEnv());
    const res = await request(app).get('/api/v1/products').query({ 'price[gte]': 10, limit: 2, page: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.paginationData.numberOfPages).toBe(3);
    expect(res.body.paginationData.page).toBe(1);
  });
});
