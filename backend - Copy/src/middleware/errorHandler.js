export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message || 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error('[Error]', err.stack || err.message);
  }
  res.status(status).json({ message, ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}) });
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
}
