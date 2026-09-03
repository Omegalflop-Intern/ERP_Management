// Parse comma-separated env vars into arrays
const parseEnvList = (val) =>
  (val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.APP_URL,
  process.env.ALLOWED_ORIGIN,
  ...parseEnvList(process.env.SHOP_URLS),
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
];

const allowedOrigins = rawOrigins
  .filter(Boolean)
  .flatMap((item) => item.split(','))
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('[CORS] No allowed origins configured. Set CLIENT_URL, APP_URL, ALLOWED_ORIGIN, or SHOP_URLS env vars.');
}

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
