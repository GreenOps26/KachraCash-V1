import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();

const port = process.env['PORT'] || 4000;

app.listen(port, () => {
  console.log(`🚀 KachraCash Core API Server running on port ${port} in ${process.env['NODE_ENV'] || 'development'} mode`);
  console.log(`📍 Guwahati Operational Zone: Beltola, Jayanagar, Ganeshguri, Noonmati, Wireless`);
});
