#!/bin/bash

# Speed Doctor - VPS Deployment Script
echo "🚀 Starting Speed Doctor Deployment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Build all packages
echo "🏗️ Building project..."
pnpm build

# 3. Install Playwright Browsers (Required for audits)
echo "🌐 Installing Playwright browsers..."
npx playwright install --with-deps chromium

# 4. Run Database Migrations
echo "🗄️ Running database migrations..."
# Using Neon - ensuring migrations are applied to cloud DB
pnpm --filter @speed-doctor/db migrate

# 5. Start Services with PM2
echo "🔄 Starting services with PM2..."

# Stop existing processes if they exist
pm2 delete speed-doctor-api speed-doctor-worker speed-doctor-web 2>/dev/null || true

# Start API (Port 3001)
pm2 start "pnpm --filter @speed-doctor/api start" --name speed-doctor-api

# Start Worker (Background)
# This handles the heavy lifting with Playwright/Lighthouse
pm2 start "pnpm --filter @speed-doctor/worker start" --name speed-doctor-worker

# Start Web (Frontend - Port 3000)
# Make sure NEXT_PUBLIC_API_URL is set in your .env before building
pm2 start "pnpm --filter @speed-doctor/web start" --name speed-doctor-web

echo "✅ Deployment Complete!"
echo "📍 API: http://localhost:3001"
echo "📍 Web: http://localhost:3000"
echo "📊 Monitoring: pm2 list"
echo "📜 Logs: pm2 logs"
