#!/bin/bash
set -e
cd /home/z/my-project

echo "=== Preparando build estático para APK ==="

# Guardar las APIs y restaurarlas SIEMPRE, incluso si el build falla
API_BACKUP="/tmp/api-backup-apk"
RESTORE_API() {
  if [ -d "$API_BACKUP" ]; then
    mkdir -p src/app/api
    cp -r "$API_BACKUP"/* src/app/api/ 2>/dev/null || true
    rm -rf "$API_BACKUP"
    echo "✓ API routes restauradas"
  fi
}
trap RESTORE_API EXIT

# 1. Respaldar API routes
if [ -d "src/app/api" ]; then
  mkdir -p "$API_BACKUP"
  cp -r src/app/api/* "$API_BACKUP/" 2>/dev/null || true
  rm -rf src/app/api
  echo "✓ API routes respaldadas"
fi

# 2. Build estático
echo "=== Generando build estático ==="
BUILD_APK=true bun run build 2>&1 | tail -5 || true

# 3. Restaurar API routes (también se hace en trap por si falla)
RESTORE_API

echo "=== Build estático completado ==="
ls -la out/ 2>/dev/null | head -5 || echo "No se generó out/"
