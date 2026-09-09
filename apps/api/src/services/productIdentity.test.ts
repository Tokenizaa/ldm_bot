import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductIdentityKey, sameProductIdentity } from '@forge-deals/shared';

test('identity ignores price, description and URL changes', () => {
  const a = buildProductIdentityKey({
    brand: 'Marca Á',
    productName: 'Modelo X',
    category: 'Ferramentas',
    variant: '110V',
    voltage: '110 V',
  });
  const b = buildProductIdentityKey({
    brand: 'marca a',
    productName: 'modelo x',
    category: 'ferramentas',
    variant: '110v',
    voltage: '110-v',
  });

  assert.equal(a, b);
});

test('SKU has priority over descriptive attributes', () => {
  const a = buildProductIdentityKey({ sku: 'ABC-123', brand: 'Marca A', productName: 'Modelo X', category: 'Cat A' });
  const b = buildProductIdentityKey({ sku: 'abc 123', brand: 'Outra Marca', productName: 'Outro Modelo', category: 'Cat B' });

  assert.equal(a, b);
  assert.equal(a, 'sku|abc-123');
});

test('different stable product attributes produce different identities', () => {
  assert.notEqual(
    buildProductIdentityKey({ brand: 'Marca A', productName: 'Modelo X', category: 'Cat A' }),
    buildProductIdentityKey({ brand: 'Marca A', productName: 'Modelo Y', category: 'Cat A' }),
  );
});

test('sameProductIdentity is deterministic', () => {
  assert.equal(
    sameProductIdentity(
      { brand: 'Marca', productName: 'Produto', category: 'Categoria', variant: 'Premium' },
      { brand: 'marca', productName: 'produto', category: 'categoria', variant: 'premium' },
    ),
    true,
  );
});
