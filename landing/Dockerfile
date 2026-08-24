# ----------- Stage 1: Build -----------
FROM node:20-alpine AS builder
WORKDIR /app

ENV CI=1
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json* yarn.lock* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

# Build the Next.js application
RUN npm run build

# ----------- Stage 2: Serve -----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080

ENV PORT=8080
CMD ["node", "server.js"]
