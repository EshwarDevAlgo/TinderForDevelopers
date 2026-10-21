const { test } = require('node:test');
const assert = require('node:assert/strict');
const Jimp = require('jimp');
const { degrade, outputKey } = require('./index.js');

test('maps raw keys to media keys', () => {
  assert.equal(
    outputKey('raw/42/123e4567-e89b-12d3-a456-426614174000'),
    'media/42/123e4567-e89b-12d3-a456-426614174000.jpg',
  );
  assert.equal(outputKey('raw/../etc/passwd'), null);
  assert.equal(outputKey('media/1/x.jpg'), null);
});

test('reduces resolution of large images', async () => {
  const big = new Jimp(1600, 1200, 0xff4f6dff);
  const input = await big.getBufferAsync(Jimp.MIME_PNG);
  const out = await Jimp.read(await degrade(input));
  assert.ok(out.bitmap.width <= 320 && out.bitmap.height <= 320);
  assert.equal(out.bitmap.width, 320);
});
