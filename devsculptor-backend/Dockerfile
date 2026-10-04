# ==============================================================================
# DevSculptor Backend Core - Production Multi-Stage Dockerfile
# Standard: Node.js 20 LTS (Slim Debian)
# Compatible: Render, Railway, Fly.io, Local Docker Engine
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Compile TypeScript
# ------------------------------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias del sistema para compilación si fuesen requeridas
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar manifiestos y lockfile para maximizar el cache de capas de Docker
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies de TypeScript y tsc-alias)
RUN npm ci

# Copiar configuración de TypeScript y código fuente
COPY tsconfig.json ./
COPY src/ ./src/

# Compilar TypeScript y resolver aliases (@config, @modules, etc.) a dist/
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Execution Environment
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifiestos de dependencias
COPY package*.json ./

# Instalar estrictamente dependencias de producción (omitir devDependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos de compilación generados por el builder
COPY --from=builder /app/dist ./dist

# Asignar permisos al usuario no root 'node' por seguridad de ejecución
USER node

# Puerto expuesto por defecto (Render y Railway mapean PORT automáticamente)
EXPOSE 3000

# Comando de inicio del servidor
CMD ["node", "dist/server.js"]
