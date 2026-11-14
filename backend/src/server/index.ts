import 'dotenv/config';
import express from 'express';
import type { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../routes/index';
import ErrorHandler from '../middlewares/error';
import { errorResponse } from '../utils/response';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1', routes);

// Route yang tidak dikenal -> 404 envelope spec v2 §4.2
app.use((_req, res): void => {
  errorResponse(res, 'Resource tidak ditemukan', 'NOT_FOUND', null, 404);
});
app.use(ErrorHandler);

export default app;
