import app from './server/index';

const host = process.env.HOST;
const port = process.env.PORT;

app.listen(port, () => {
  globalThis.console.log(`Server berjalan http://${host}:${port}`);
});
