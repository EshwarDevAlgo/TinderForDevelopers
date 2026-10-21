const env = process.env;

function required(name, fallback) {
  const value = env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

const isProd = env.NODE_ENV === 'production';
const openaiKey = env.OPENAI_API_KEY && env.OPENAI_API_KEY !== 'CHANGE_ME' ? env.OPENAI_API_KEY : '';

export const config = {
  isProd,
  port: Number(env.PORT || 4000),
  databaseUrl: required('DATABASE_URL', isProd ? undefined : 'postgres://devmatch:devmatch@localhost:5432/devmatch'),
  dbSsl: env.DB_SSL === 'true',
  dbCaPath: env.DB_CA_PATH || '/app/certs/rds-global-bundle.pem',
  redisUrl: required('REDIS_URL', isProd ? undefined : 'redis://localhost:6379'),
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-secret-change-me'),
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  corsOrigin: env.CORS_ORIGIN || '',
  profileCacheTtlSeconds: Number(env.PROFILE_CACHE_TTL || 60),
  openai: {
    apiKey: openaiKey,
    model: env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  },
  s3: {
    region: env.AWS_REGION || 'us-east-1',
    uploadsBucket: env.S3_UPLOADS_BUCKET || '',
    maxUploadBytes: Number(env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024),
  },
  mediaBaseUrl: env.MEDIA_BASE_URL || '/media',
  seedOnStart: env.SEED_ON_START === 'true',
};
