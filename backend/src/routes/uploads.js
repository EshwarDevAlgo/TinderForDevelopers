import crypto from 'node:crypto';
import { Router } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
let s3;

/**
 * Returns a presigned POST for a raw avatar upload. The S3 event triggers the
 * image-processor Lambda, which downsizes it and writes media/<user>/<id>.jpg.
 */
router.post('/avatar', async (req, res, next) => {
  try {
    if (!config.s3.uploadsBucket) {
      return res.status(503).json({ error: 'Uploads are not configured in this environment; paste an image URL instead.' });
    }
    const contentType = String(req.body.contentType || '');
    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: `contentType must be one of ${ALLOWED_TYPES.join(', ')}` });
    }
    s3 ??= new S3Client({ region: config.s3.region });
    const id = crypto.randomUUID();
    const key = `raw/${req.userId}/${id}`;
    const post = await createPresignedPost(s3, {
      Bucket: config.s3.uploadsBucket,
      Key: key,
      Conditions: [
        ['content-length-range', 1, config.s3.maxUploadBytes],
        ['eq', '$Content-Type', contentType],
      ],
      Fields: { 'Content-Type': contentType },
      Expires: 300,
    });
    return res.json({
      url: post.url,
      fields: post.fields,
      maxBytes: config.s3.maxUploadBytes,
      avatarUrl: `${config.mediaBaseUrl}/${req.userId}/${id}.jpg`,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
