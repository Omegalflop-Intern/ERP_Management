#!/bin/bash

# cPanel Shared Hosting Deployment Script
# Run this locally before uploading to cPanel

set -e

echo "🚀 Starting cPanel deployment build..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Build Client
echo -e "${YELLOW}📦 Building React client...${NC}"
cd client
npm run build
cd ..

# Step 2: Create deployment folder
echo -e "${YELLOW}📁 Creating deployment package...${NC}"
DEPLOY_DIR="cpanel-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Step 3: Copy server files (excluding tests, node_modules, .git)
echo -e "${YELLOW}📋 Copying server files...${NC}"
rsync -av --progress server/ $DEPLOY_DIR/server/ \
  --exclude='node_modules' \
  --exclude='tests' \
  --exclude='.env' \
  --exclude='knexfile.js'

# Step 4: Copy built client to public_html structure
echo -e "${YELLOW}📋 Copying built client...${NC}"
mkdir -p $DEPLOY_DIR/public_html
cp -r client/dist/* $DEPLOY_DIR/public_html/

# Step 5: Copy .htaccess
echo -e "${YELLOW}📋 Copying .htaccess...${NC}"
cp .htaccess $DEPLOY_DIR/public_html/

# Step 6: Copy deployment configs
echo -e "${YELLOW}📋 Copying deployment configs...${NC}"
cp .env.production $DEPLOY_DIR/server/.env
cp cpanel-start.js $DEPLOY_DIR/server/start.js

# Step 7: Create package.json for production
echo -e "${YELLOW}📋 Creating production package.json...${NC}"
cat > $DEPLOY_DIR/server/package.json << 'EOF'
{
  "name": "mobile-shop-erp-server",
  "version": "1.0.0",
  "description": "Backend API for Mobile Shop Management System",
  "main": "start.js",
  "scripts": {
    "start": "node start.js"
  },
  "type": "module",
  "dependencies": {
    "axios": "^1.18.1",
    "bcryptjs": "^2.4.3",
    "bwip-js": "^4.11.2",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^8.6.0",
    "file-type": "^22.0.1",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.2",
    "knex": "^3.3.0",
    "mongoose": "^8.5.1",
    "morgan": "^1.11.0",
    "multer": "^2.2.0",
    "mysql2": "^3.23.2",
    "node-cron": "^4.6.0",
    "nodemailer": "^9.0.3",
    "pdfkit": "^0.19.1",
    "qrcode": "^1.5.4",
    "swagger-jsdoc": "^6.3.0",
    "swagger-ui-express": "^5.0.1",
    "xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz",
    "zod": "^3.23.8"
  }
}
EOF

# Step 8: Create deployment zip
echo -e "${YELLOW}📦 Creating deployment zip...${NC}"
cd $DEPLOY_DIR
zip -r ../deploy-cpanel.zip . -x "*.git*"
cd ..

echo -e "${GREEN}✅ Deployment package created: deploy-cpanel.zip${NC}"
echo ""
echo -e "${GREEN}📤 Upload Instructions:${NC}"
echo "1. Login to cPanel"
echo "2. Go to File Manager"
echo "3. Navigate to public_html"
echo "4. Upload deploy-cpanel.zip"
echo "5. Extract the zip"
echo "6. Move contents of server/ to root"
echo "7. Move contents of public_html/ to public_html"
echo "8. Setup Node.js app in cPanel"
echo "9. Install dependencies: npm install"
echo "10. Start the app"
