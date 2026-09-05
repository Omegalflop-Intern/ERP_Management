// Parse comma-separated env vars into arrays
const parseEnvList = (val) =>
  (val || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const baseDomain = (process.env.BASE_DOMAIN || 'respawnalley.com').toLowerCase().trim();

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

const explicitOrigins = new Set(
  rawOrigins
    .filter(Boolean)
    .flatMap((item) => item.split(','))
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);

export const isOriginAllowed = (origin) => {
  if (!origin) return true;

  // 1. Exact match with configured explicit origins
  const cleanOrigin = origin.replace(/\/+$/, '');
  if (explicitOrigins.has(cleanOrigin)) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    // 2. Localhost & development subdomains
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.localhost')
    ) {
      return true;
    }

    // 3. Base domain and wildcard subdomains (e.g., respawnalley.com, shop1.respawnalley.com, etc.)
    if (
      baseDomain &&
      (hostname === baseDomain ||
        hostname === `www.${baseDomain}` ||
        hostname === `api.${baseDomain}` ||
        hostname.endsWith(`.${baseDomain}`))
    ) {
      return true;
    }
  } catch {
    // Malformed origin URL
    return false;
  }

  return false;
};

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked]: Origin not allowed: ${origin}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Subdomain',
    'x-subdomain',
    'Accept',
    'Origin',
    'X-Requested-With',
  ],
  exposedHeaders: ['Content-Disposition'],
};

