import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { connectDatabase } from './config/database.js';
import { attachmentsDir } from './config/paths.js';
import { ensureDataDir } from './utils/fileSystem.js';
import { setWebSocketServer } from './utils/websocket.js';
import articleRoutes from './routes/articleRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

app.get('/api/health', (_req, res) => {
	res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', commentRoutes);
app.use('/api', attachmentRoutes);

connectDatabase()
	.finally(() => {
		const maxRetries = 10;
		let attempt = 0;

		function tryListen(port) {
			server.once('error', (err) => {
				if (err && err.code === 'EADDRINUSE' && attempt < maxRetries) {
					console.warn(`Port ${port} in use, trying ${port + 1}...`);
					attempt += 1;
					tryListen(port + 1);
				} else {
					console.error('Server failed to start:', err.message || err);
					process.exit(1);
				}
			});

			server.listen(port, () => {
				ensureDataDir();
				console.log(`Server listening on http://localhost:${port}`);
				try {
					const wss = new WebSocketServer({ server });
					wss.on('error', (err) => console.warn('WebSocketServer error:', err && err.message));
					setWebSocketServer(wss);
					console.log(`WebSocket server ready on ws://localhost:${port}`);
				} catch (err) {
					console.warn('Failed to create WebSocket server:', err && err.message);
				}
			});
		}

		tryListen(PORT);
	});
