import { Router } from 'express';
import asyncHandler from 'express-async-handler';

import { IdSchema } from '@prairielearn/zod';

import { getStudentAvatarImage } from '../../lib/student-profile.js';

const router = Router();

router.get(
  '/:user_id(\\d+)',
  asyncHandler(async (req, res) => {
    const userId = IdSchema.parse(req.params.user_id);
    const img = await getStudentAvatarImage(userId);
    if (!img) {
      res.setHeader('Cache-Control', 'no-store');
      res.status(404).end();
      return;
    }

    const etag = `W/"av-${img.avatarVersion}"`;
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', img.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('ETag', etag);
    res.setHeader(
      'Cache-Control',
      req.query.v ? 'private, max-age=31536000, immutable' : 'private, max-age=300',
    );
    res.send(img.buffer);
  }),
);

export default router;
