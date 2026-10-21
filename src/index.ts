const requiredSecrets = [
  'APP_KEYS',
  'API_TOKEN_SALT',
  'ADMIN_JWT_SECRET',
  'TRANSFER_TOKEN_SALT',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
];

export default {
  register() {
    const missing = requiredSecrets.filter((name) => !process.env[name]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
          'Generate each value with: openssl rand -hex 32'
      );
    }
  },

  bootstrap() {},
};
