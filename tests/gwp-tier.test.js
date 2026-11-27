const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/global.js'), 'utf8');
const managementSource = source.slice(
  source.indexOf('// GWP Auto-Add/Remove Management'),
  source.indexOf('const headerScroll =')
);

const gift = (overrides = {}) => ({
  variant_id: 100,
  key: '100:gift',
  final_line_price: 0,
  properties: { _free_gift: 'true' },
  ...overrides
});

const tier = (overrides = {}) => ({
  variantId: 100,
  productPrice: 0,
  threshold: 100,
  hiddenFromProgressBar: false,
  nonSaleOnly: true,
  nonSaleCartTotal: 10000,
  ...overrides
});

async function manage(tiers, items, totalPrice) {
  let listener;
  let finishUpdate;
  const calls = [];
  const errors = [];
  const context = {
    document: {
      addEventListener: (_, handler) => { listener = handler; },
      querySelector: () => ({
        getAttribute: () => JSON.stringify(tiers)
      })
    },
    window: { Shopify: { routes: { root: '/' } } },
    console: { error: (...args) => errors.push(args) },
    fetch: async (url, options) => {
      calls.push({ url, body: options?.body ? JSON.parse(options.body) : null });
      return { ok: true, json: async () => ({ header: 'updated' }) };
    },
    cartUpdate: () => {},
    setTimeout: (callback) => { callback(); finishUpdate(); }
  };
  vm.runInNewContext(managementSource, context);
  await new Promise(resolve => {
    finishUpdate = resolve;
    listener({ detail: { cart: { items, total_price: totalPrice } } });
    if (calls.length === 0) resolve();
  });
  assert.deepEqual(errors, []);
  return calls;
}

test('adds at the exact non-sale threshold using the rendered qualifying cents', async () => {
  const calls = await manage([tier()], [], 10000);
  assert.deepEqual(calls[0], {
    url: '/cart/add.js',
    body: { items: [{ id: 100, quantity: 1, properties: { _free_gift: 'true' } }] }
  });
});

test('sale spend cannot push an enabled tier over its threshold', async () => {
  const calls = await manage([tier({ nonSaleCartTotal: 9999 })], [], 50000);
  assert.deepEqual(calls, []);
});

test('removes a free gift when non-sale spend falls one cent short', async () => {
  const calls = await manage([tier({ nonSaleCartTotal: 9999 })], [gift()], 50000);
  assert.deepEqual(calls[0], {
    url: '/cart/update.js',
    body: { updates: { '100:gift': 0 } }
  });
});

test('removes only the auto-added paid gift, preserving a purchased copy', async () => {
  const calls = await manage(
    [tier({ productPrice: 2500, nonSaleCartTotal: 0 })],
    [gift(), gift({ key: '100:purchased', final_line_price: 2500, properties: {} })],
    50000
  );
  assert.deepEqual(calls[0].body, { updates: { '100:gift': 0 } });
});

test('does not remove an unmarked purchased paid product for an enabled tier', async () => {
  const calls = await manage(
    [tier({ productPrice: 2500, nonSaleCartTotal: 0 })],
    [gift({ properties: {}, final_line_price: 2500 })],
    2500
  );
  assert.deepEqual(calls, []);
});

test('does not duplicate a qualifying gift already in cart', async () => {
  assert.deepEqual(await manage([tier()], [gift()], 10000), []);
});

test('disabled tiers continue to count sale spend', async () => {
  const calls = await manage([tier({ nonSaleOnly: false, nonSaleCartTotal: 0 })], [], 10000);
  assert.equal(calls[0].url, '/cart/add.js');
});

test('disabled visible paid tiers retain their existing removal behavior', async () => {
  const calls = await manage(
    [tier({ nonSaleOnly: false, productPrice: 2500 })],
    [gift()],
    0
  );
  assert.deepEqual(calls, []);
});

test('disabled tiers still exclude the gift value from qualifying spend', async () => {
  const calls = await manage(
    [tier({ nonSaleOnly: false })],
    [gift({ final_line_price: 1000 })],
    10000
  );
  assert.deepEqual(calls[0].body, { updates: { 100: 0 } });
});

test('hidden paid gifts still remove by line key when disabled', async () => {
  const calls = await manage(
    [tier({ nonSaleOnly: false, hiddenFromProgressBar: true, productPrice: 2500 })],
    [gift()],
    0
  );
  assert.deepEqual(calls[0].body, { updates: { '100:gift': 0 } });
});

test('tiers independently choose ordinary or non-sale spend in the same cart', async () => {
  const calls = await manage([
    tier({ nonSaleCartTotal: 9999 }),
    tier({ variantId: 200, nonSaleOnly: false })
  ], [], 15000);
  assert.deepEqual(calls[0].body.items.map(item => item.id), [200]);
});
