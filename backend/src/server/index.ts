import 'dotenv/config';
import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import multer from 'multer';
// import routes from '../routes/index';
// import ErrorHandler from '../midlewares/error';

const app: Application = express();

app.use(express.json());
// app.use(routes);
// app.use(ErrorHandler);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      code: 400,
      status: "failed",
      message: error.message,
      data: null
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      code: error.statusCode,
      status: "failed",
      message: error.message,
      data: null
    });
  }

  console.error(error);

  return res.status(500).json({
    code: 500,
    status: "failed",
    message: "Internal Server Error",
    data: null
  });
});

export default app;
