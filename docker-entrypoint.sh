#!/bin/sh
set -e

# GitFileDock Docker Entrypoint
# - Creates data directory if not exists
# - Runs Prisma migrations (creates/updates tables)
# - Seeds default admin user if not exists

echo "[GitFileDock] Starting initialization..."

# Ensure data directory exists
mkdir -p /app/data/repos

# Run Prisma schema push (creates/updates tables without data loss)
echo "[GitFileDock] Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null || {
  echo "[GitFileDock] Prisma db push failed, trying migrate..."
  npx prisma migrate deploy --skip-generate 2>/dev/null || {
    echo "[GitFileDock] WARNING: Could not run database migrations. The database schema may need manual setup."
  }
}

# Seed default admin user using Node.js (no tsx dependency needed in production)
echo "[GitFileDock] Checking admin user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
async function main() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!existing) {
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: { username: 'admin', passwordHash: hash, mustChangePwd: true },
      });
      console.log('[GitFileDock] Default admin user created: admin / admin123');
    } else {
      console.log('[GitFileDock] Admin user already exists, skipping seed.');
    }
  } finally {
    await prisma.\$disconnect();
  }
}
main().catch(e => { console.error(e); process.exit(1); });
"

echo "[GitFileDock] Initialization complete. Starting server..."

# Execute the main command (node server.js)
exec "$@"
