# Worklog - App de Control y Mantenimiento de Vehículos

Proyecto: Aplicación móvil-first PWA para control y mantenimiento de vehículos.
Stack: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), NextAuth.

---
Task ID: 1
Agent: Main (Z.ai Code)
Task: Configurar esquema Prisma completo para usuarios, vehículos, mantenimientos, refacciones, gastos, combustible, recordatorios y documentos.

Work Log:
- Exploración inicial del proyecto (package.json, schema.prisma, layout, globals.css)
- Diseño del modelo de datos relacional completo
- (en progreso) Escritura del schema.prisma

Stage Summary:
- (pendiente)

---
Task ID: 3-b
Agent: general-purpose (API builder)
Task: Create remaining backend API routes (parts, expenses, fuel, reminders, documents, history, stats, search, dashboard, upload, seed-demo, item routes)

Work Log:
- Leí worklog.md y revisé el contexto existente: schema Prisma, lib/db, lib/session, lib/constants, lib/format y los routes ya existentes (vehicles, vehicle/[id], vehicle/[id]/maintenance).
- Confirmé el patrón: `params: Promise<{ id: string }>` para dynamic routes (Next.js 16), verificación de ownership con `db.vehicle.findFirst({ where: { id, userId } })` y respuestas 401/404.
- Creé los 11 archivos de rutas de lista/creación + los 6 archivos de rutas individuales (PUT/DELETE):
  1. `vehicle/[id]/parts/route.ts` - GET/POST con cálculo de nextChangeKm y actualización de kilometraje del vehículo.
  2. `vehicle/[id]/expenses/route.ts` - GET con filtros `?from&to&category`, POST.
  3. `vehicle/[id]/fuel/route.ts` - GET/POST con cálculo de total, actualización de kilometraje y auto-creación de gasto "FUEL".
  4. `vehicle/[id]/reminders/route.ts` - GET (nulls last), POST con auto-cálculo de nextDueKm/nextDueDate según lógica de intervalos.
  5. `vehicle/[id]/documents/route.ts` - GET/POST.
  6. `vehicle/[id]/history/route.ts` - timeline unificado (maintenance/part/expense/fuel/document), ordenado por fecha desc, limit 100.
  7. `vehicle/[id]/stats/route.ts` - agregados: totalSpend, thisMonth, thisYear, byCategory, maintenanceCount, lastMaintenance, nextReminders (con status), partsCount, fuelStats (avgConsumption, costPerKm), recentActivity.
  8. `search/route.ts` - búsqueda global con `?q=` a través de todos los vehículos del usuario en maintenances, parts, expenses y documents. Agrupado con vehicleName.
  9. `dashboard/route.ts` - vehicles con nextReminder/totalSpend/lastMaintenance, upcomingReminders (top 10 por urgencia), totales mensual/anual/all-time, recentActivity (8), getGreeting().
  10. `upload/route.ts` - POST multipart/form-data, guarda en `public/uploads/`, valida image|pdf, max 10MB, usa crypto.randomUUID para nombre único.
  11. `seed-demo/route.ts` - POST: crea Toyota Sienna 2011 y Mitsubishi Montero 2003 con mantenimientos, refacciones, gastos, combustibles, recordatorios y documentos (placeholder URLs). Devuelve 400 si ya tiene vehículos.
  12. Item routes (PUT/DELETE) para maintenance, parts, reminders; DELETE-only para expenses, fuel, documents. Verifican ownership vía parent vehicle.
- Validé con `bun run lint` → 0 errores. Aparecieron 7 warnings por directivas `@typescript-eslint/no-explicit-any` innecesarias (regla ya deshabilitada globalmente); las limpié con `bun run lint --fix`. Lint final: limpio.
- Verifiqué con `bunx tsc --noEmit` → los únicos errores son en `examples/websocket/*` y `skills/*` (módulos no instalados / preexistentes, fuera del scope). Ningún error en `src/app/api/`.

Stage Summary:
- 17 archivos creados: 11 rutas de colección (list/create) + 6 rutas de ítem individual (PUT/DELETE).
- Decisiones clave:
  - Todas las rutas vehicle-scoped verifican `db.vehicle.findFirst({ where: { id, userId } })` y devuelven 404 si no se encuentra.
  - POST de parts/fuel actualizan `vehicle.mileage` si el kilometraje registrado es mayor (transaccional).
  - POST de fuel crea automáticamente un `Expense` con `category: "FUEL"` (transaccional).
  - Reminders: el auto-cálculo de `nextDueKm`/`nextDueDate` respeta prioridades (lastDoneKm + intervalKm, o vehicle.mileage + intervalKm si no hay lastDoneKm; análogo para fechas con `addDays`).
  - History/Stats/Dashboard reutilizan `getMaintenanceType`, `getPartCategory`, `getExpenseCategory`, `getDocumentType` de `@/lib/constants` para emojis consistentes, y `getReminderStatus`, `getGreeting`, `startOfMonth`, `startOfYear`, `addDays` de `@/lib/format`.
  - Upload valida MIME type + extensión, crea `public/uploads/` si no existe, usa `crypto.randomUUID()` para el nombre único y `Buffer.from(arrayBuffer)` para escribir el archivo.
  - Seed-demo ejecuta todo en una transacción y devuelve conteos.
  - Item routes usan `params: Promise<{ id: string; itemId: string }>` y validan que el item pertenezca a un vehículo del usuario.
- Stack confirmado: Next.js 16 App Router, TypeScript, Prisma (SQLite), zod, NextResponse, next-auth via `getCurrentUser()`.

---
Task ID: 13-img
Agent: general-purpose (image generation)
Task: Generate demo vehicle photos

Work Log:
- Leí worklog.md y cargué la skill `image-generation` para aprender la sintaxis del CLI.
- Verifiqué la disponibilidad del CLI: `z-ai` en `/usr/local/bin/z-ai`, comando `z-ai image -p "..." -o "..." -s "..."`.
- Creé el directorio `public/uploads/` con `mkdir -p` (ya existía `public/` con `icon.svg`, `logo.svg`, `manifest.webmanifest`, `robots.txt`).
- Generé las 3 imágenes prioritarias con tamaño `1344x768` (landscape, ideal para vista lateral de vehículos) usando el CLI `z-ai image`:
  1. `toyota-sienna-2011.jpg` — prompt: "A silver 2011 Toyota Sienna minivan parked on a clean street, side view, daylight, photorealistic, clean background"
  2. `mitsubishi-montero-2003.jpg` — prompt: "A green 2003 Mitsubishi Montero SUV parked on a clean street, side view, daylight, photorealistic, clean background"
  3. `vehicle-default.jpg` — prompt: "A generic modern car illustration, side view, clean minimal style, soft colors"
- Generé adicionalmente un logo/icono cuadrado `1024x1024`: `app-logo.jpg` — prompt: "Modern minimalist app logo icon for a vehicle maintenance app, stylized car with wrench, flat design, blue and white, simple geometric shapes, no text".
- Verifiqué con `file` que los 4 archivos son imágenes JPEG válidas (el CLI emite bytes JPEG sin importar la extensión; por eso renombré `app-logo.png` → `app-logo.jpg` para que la extensión coincida con el contenido real).
- Verifiqué con `ls -la` tamaños finales: toyota 155 KB, mitsubishi 159 KB, default 103 KB, logo 40 KB.

Stage Summary:
- Archivos creados en `/home/z/my-project/public/uploads/`:
  - `toyota-sienna-2011.jpg` (1344x768, 155 KB)
  - `mitsubishi-montero-2003.jpg` (1344x768, 159 KB)
  - `vehicle-default.jpg` (1344x768, 103 KB)
  - `app-logo.jpg` (1024x1024, 40 KB) — bonus, opcional
- Tamaño landscape `1344x768` seleccionado para fotos de vehículos (vista lateral).
- Las rutas relativas desde la app Next.js son `/uploads/toyota-sienna-2011.jpg`, `/uploads/mitsubishi-montero-2003.jpg`, `/uploads/vehicle-default.jpg`, `/uploads/app-logo.jpg`.
- Las 3 primeras pueden usarse en `seed-demo/route.ts` y como `photoUrl`/`imageUrl` de los vehículos Toyota Sienna 2011 y Mitsubishi Montero 2003.

---
Task ID: FINAL
Agent: Main (Z.ai Code)
Task: Construcción completa de la app móvil de control y mantenimiento de vehículos (MVP + extras)

Work Log:
- Diseño e implementación del esquema Prisma completo (User, Vehicle, Maintenance, Part, Expense, Fueling, Reminder, Document)
- Configuración de NextAuth con Credentials provider (bcryptjs) + endpoint /api/register
- Creación de 17 rutas API (vehículos, mantenimiento, refacciones, gastos, combustible, recordatorios, documentos, historial, stats, búsqueda, dashboard, upload, seed-demo + rutas item PUT/DELETE)
- Implementación del store de navegación SPA con Zustand (single-route / app)
- Layout PWA mobile-first con navegación inferior (Inicio, Vehículos, +Registrar FAB, Gastos, Más)
- Pantallas de auth (login/registro/demo) con diseño móvil
- Dashboard inteligente: saludo, tarjetas de vehículos con estado, próximos mantenimientos, gastos (mes/año/histórico), última actividad
- Vista de Vehículos con tarjetas y estadísticas
- Formulario simple de agregar/editar vehículo (campos opcionales colapsables)
- Expediente del vehículo con 5 pestañas (Resumen, Mantenimiento, Refacciones, Gastos, Documentos)
- Flujo rápido de Registrar mantenimiento (< 30s): selector de tipo con emojis → formulario mínimo (km pre-llenado, fecha hoy, costo) → "Agregar más información" opcional
- Vista de Gastos con gráfico de barras (recharts) y desglose por vehículo
- Vista de Recordatorios con estados visuales (🟢🟡🔴) y toggle de activación
- Historial tipo timeline agrupado por día
- Búsqueda global con resultados agrupados por categoría
- Insights: recomendaciones inteligentes (patrones de servicio, proyecciones, consumo de combustible)
- Vista de Documentos con galería de imágenes
- Datos de demostración (Toyota Sienna 2011 + Mitsubishi Montero 2003) con seed completo
- PWA: manifest.webmanifest + icon.svg + viewport meta
- Generación de imágenes de vehículos con image-generation skill
- Verificación con Agent Browser en viewport móvil 390x844 (iPhone 14)
- Corrección de bugs: StatusBadge defensivo, formatRelativeTime para fechas futuras, totalCost override en API, mapeo correcto de campos amount/mileage

Stage Summary:
- App completamente funcional y verificada en navegador móvil
- 0 errores de ESLint, 0 errores en runtime
- Flujos verificados: login demo → dashboard → detalle vehículo → registrar mantenimiento → guardar → ver en historial
- Diseño validado por VLM como "moderno, limpio y profesional"
- Stack: Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), NextAuth, Zustand, React Query, Recharts
