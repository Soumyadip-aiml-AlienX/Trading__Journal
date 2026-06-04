# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (leverage Docker caching)
COPY package*.json ./
RUN npm ci

# Copy source and configurations
COPY . .

# Generate Prisma Client and build standalone output
RUN npx prisma generate
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use non-root user for execution security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and compiled standalone directory
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
