import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRoutes } from './routes/index.js';

export async function buildServer() {
	const app = Fastify({ logger: true });
	await app.register(cors, { origin: true });
	await registerRoutes(app);
	return app;
}
