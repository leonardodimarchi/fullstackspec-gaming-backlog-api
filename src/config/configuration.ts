export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/gaming-backlog',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  igdb: {
    clientId: process.env.IGDB_CLIENT_ID ?? '',
    clientSecret: process.env.IGDB_CLIENT_SECRET ?? '',
    cacheTtlSeconds: parseInt(
      process.env.IGDB_CACHE_TTL_SECONDS ?? '604800',
      10,
    ),
    popularCacheTtlSeconds: parseInt(
      process.env.IGDB_POPULAR_CACHE_TTL_SECONDS ?? '86400',
      10,
    ),
    metadataCacheTtlSeconds: parseInt(
      process.env.IGDB_METADATA_CACHE_TTL_SECONDS ?? '604800',
      10,
    ),
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
    password: process.env.ADMIN_PASSWORD ?? 'admin123456',
    name: process.env.ADMIN_NAME ?? 'Admin',
  },
});
