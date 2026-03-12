# ---- Build stage ----
FROM node:20-alpine AS build
# Prisma ve Bcrypt için sistem bağımlılıkları
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

# Gerekli dosyaları kopyala
COPY package*.json ./
# Prisma şeması
COPY prisma ./prisma

# Bağımlılıkları kur
RUN npm install --legacy-peer-deps

# Uygulama kaynaklarını kopyala (node_modules hariç)
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY nest-cli.json ./nest-cli.json
COPY prisma.config.ts ./prisma.config.ts
COPY package-lock.json ./package-lock.json

# Generate Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS run
WORKDIR /app/server
ENV NODE_ENV=production

# Prod runtime dosyaları
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Runtime prisma client gerekiyorse
COPY --from=build /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
