#!/bin/bash
set -e
cd /home/z/my-project

echo "=== Preparando build estático para APK ==="

# 1. Mover API routes fuera de src/app (no se necesitan en el APK)
if [ -d "src/app/api" ]; then
  mkdir -p /tmp/api-backup
  cp -r src/app/api/* /tmp/api-backup/
  rm -rf src/app/api
  echo "✓ API routes movidas fuera"
fi

# 2. Limpiar build anterior
rm -rf out .next

# 3. Build estático
echo "=== Generando build estático ==="
BUILD_APK=true bun run build 2>&1 | tail -15

# 4. Restaurar API routes
if [ -d "/tmp/api-backup" ]; then
  mkdir -p src/app/api
  cp -r /tmp/api-backup/* src/app/api/
  rm -rf /tmp/api-backup
  echo "✓ API routes restauradas"
fi

echo "=== Build estático completado ==="
ls -la out/ 2>/dev/null | head -10 || echo "No se generó out/"
