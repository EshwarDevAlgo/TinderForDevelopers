// Triggered by s3:ObjectCreated on raw/<userId>/<uuid>.
// Downscales the image (fewer pixels + lower JPEG quality) and writes media/<userId>/<uuid>.jpg.
const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Jimp = require('jimp');

const s3 = new S3Client({});
const MAX_DIMENSION = Number.parseInt(process.env.MAX_DIMENSION || '320', 10);
const JPEG_QUALITY = Number.parseInt(process.env.JPEG_QUALITY || '55', 10);
const MAX_INPUT_BYTES = 5 * 1024 * 1024;

async function degrade(input) {
  const image = await Jimp.read(input);
  const { width, height } = image.bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) image.scaleToFit(MAX_DIMENSION, MAX_DIMENSION);
  return image.quality(JPEG_QUALITY).getBufferAsync(Jimp.MIME_JPEG);
}

function outputKey(rawKey) {
  const match = /^raw\/(\d+)\/([0-9a-f-]{36})$/.exec(rawKey);
  return match ? `media/${match[1]}/${match[2]}.jpg` : null;
}

exports.handler = async (event) => {
  for (const record of event.Records || []) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const outKey = outputKey(key);
    if (!outKey) {
      console.warn(`Skipping unexpected key ${key}`);
      continue;
    }
    try {
      if (record.s3.object.size > MAX_INPUT_BYTES) throw new Error('Input too large');
      const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const input = Buffer.from(await obj.Body.transformToByteArray());
      const output = await degrade(input);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: outKey,
          Body: output,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      console.log(JSON.stringify({ key, outKey, inBytes: input.length, outBytes: output.length }));
    } catch (err) {
      console.error(`Failed to process ${key}:`, err);
    } finally {
      // Never keep the original full-resolution upload.
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
    }
  }
};

exports.degrade = degrade;
exports.outputKey = outputKey;
