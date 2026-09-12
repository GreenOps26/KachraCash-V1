import { loadLocalEnv } from './load-env.js';

loadLocalEnv();

async function start() {
	const { buildServer } = await import('./app.js');
	const port = Number(process.env.PORT ?? 3000);
	const app = await buildServer();
	await app.listen({ port, host: '0.0.0.0' });
}

start().catch((error) => {
	console.error(error);
	process.exit(1);
});
