import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.join(__dirname, '..', 'uploads');

function safeSegment(segment) {
    return String(segment).replace(/[^a-zA-Z0-9._-]/g, '_');
}

// storagePath looks like "trips/<id>/documents/<ts>_<name>" or "trip-covers/<id>/<ts>_<name>" —
// sanitize each segment individually so path traversal ("..") can't escape uploadsRoot.
function resolveSafePath(bucket, storagePath) {
    const segments = String(storagePath).split('/').map(safeSegment);
    return path.join(uploadsRoot, safeSegment(bucket), ...segments);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.post('/:bucket', requireAuth, upload.single('file'), (req, res) => {
    const { bucket } = req.params;
    const storagePath = req.body?.path;
    if (!storagePath || !req.file) {
        return res.status(400).json({ error: 'path and file are required' });
    }
    const dest = resolveSafePath(bucket, storagePath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, req.file.buffer);
    res.status(201).json({ data: { path: storagePath }, error: null });
});

router.delete('/:bucket', requireAuth, (req, res) => {
    const { bucket } = req.params;
    const paths = req.body?.paths || [];
    for (const p of paths) {
        const dest = resolveSafePath(bucket, p);
        fs.rm(dest, { force: true }, () => {});
    }
    res.json({ data: null, error: null });
});

export default router;
