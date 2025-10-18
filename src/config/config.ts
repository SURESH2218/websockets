import "dotenv/config";

export default {
  PORT: process.env.PORT,
  ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN,
};
