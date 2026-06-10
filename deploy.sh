#!/bin/bash

# Speed Doctor - VPS Deployment Script
echo "🚀 Starting Speed Doctor Deployment..."

# 1. Install dependencies
echo "📦 Checking environment..."
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found! Please create it from .env.example"
    exit 1
fi

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

# Start API (Using port from .env)
pm2 start "pnpm --filter @speed-doctor/api start" --name speed-doctor-api

# Start Worker (Background)
pm2 start "pnpm --filter @speed-doctor/worker start" --name speed-doctor-worker

# Start Web (Frontend - Custom Port 3014)
# We pass PORT=3014 to next start
pm2 start "PORT=3014 pnpm --filter @speed-doctor/web start" --name speed-doctor-web

# 6. Nginx Setup
echo "🌐 Configuring Nginx for speed-doctor.frooxi.com and IP..."
# This assumes you are running as root or have sudo access
if [ -d /etc/nginx/sites-available ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/speed-doctor
    sudo ln -sf /etc/nginx/sites-available/speed-doctor /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx configured and reloaded!"
else
    echo "⚠️ Nginx directory not found. Please manually configure Nginx using the nginx.conf file."
fi

echo "✅ Deployment Complete!"
echo "📍 Domain: http://speed-doctor.frooxi.com"
echo "📍 IP: http://69.62.83.15"
echo "📊 Monitoring: pm2 list"
echo "📜 Logs: pm2 logs"
