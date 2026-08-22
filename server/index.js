import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.js';
import dbRoutes from './routes/db.js';
import profilesRoutes from './routes/profiles.js';
import invitesRoutes from './routes/invites.js';
import uploadsRoutes, { uploadsRoot } from './routes/uploads.js';
import searchRoutes from './routes/search.js';
import { attachSockets } from './sockets.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(uploadsRoot));

app.use('/api/auth', authRoutes);
app.use('/api/db', dbRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/upload', uploadsRoutes);
app.use('/api/search', searchRoutes);

// Production only: serve the built frontend (app/dist) and fall back to
// index.html for client-side routes, so a single container can run both
// the API and the SPA. In dev this directory doesn't exist and Vite's own
// dev server handles the frontend instead, so this is a silent no-op.
const clientDist = path.join(__dirname, '../app/dist');
app.use(express.static(clientDist));
app.get(/^(?!\/api|\/socket\.io|\/uploads).*/, (req, res, next) => {
    res.sendFile(path.join(clientDist, 'index.html'), err => { if (err) next(); });
});

app.use((err, req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: CLIENT_ORIGIN, credentials: true },
    // Tighter than the socket.io defaults (25s/20s, ~45s worst case) so a
    // hard-killed connection (network drop, crashed tab, unplugged laptop —
    // anything that skips the TCP FIN/socket.io disconnect handshake) stops
    // showing as "present" within ~15s instead of ~45s.
    pingInterval: 10000,
    pingTimeout: 5000,
});
attachSockets(io);

httpServer.listen(PORT, () => {
    console.log(`vacaverse-server listening on http://localhost:${PORT}`);
});
