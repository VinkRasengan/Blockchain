# MyCoin Deployment Guide

This guide covers how to deploy and distribute MyCoin for different platforms and environments.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Building for Production](#building-for-production)
3. [Platform-Specific Builds](#platform-specific-builds)
4. [Distribution](#distribution)
5. [Docker Deployment](#docker-deployment)
6. [Network Deployment](#network-deployment)
7. [Troubleshooting](#troubleshooting)

## Development Setup

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mycoin.git
   cd mycoin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Building for Production

### Build Process

1. **Clean previous builds**
   ```bash
   npm run clean
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Run production build**
   ```bash
   npm start
   ```

### Build Verification

- Check `dist/` directory contains compiled JavaScript
- Verify `dist/main.js` exists and is executable
- Test wallet functionality in production mode

## Platform-Specific Builds

### Windows

```bash
# Build for Windows
npm run package:win

# Output: release/MyCoin Setup 1.0.0.exe
```

**Requirements:**
- Windows 10 or later
- .NET Framework 4.5 or later

### macOS

```bash
# Build for macOS
npm run package:mac

# Output: release/MyCoin-1.0.0.dmg
```

**Requirements:**
- macOS 10.14 (Mojave) or later
- Code signing certificate (for distribution)

### Linux

```bash
# Build for Linux
npm run package:linux

# Output: release/MyCoin-1.0.0.AppImage
```

**Requirements:**
- Ubuntu 18.04 or equivalent
- GLIBC 2.27 or later

### Cross-Platform Build

```bash
# Build for all platforms
npm run package
```

## Distribution

### GitHub Releases

1. **Create release tag**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

2. **GitHub Actions automatically:**
   - Builds for all platforms
   - Runs tests
   - Creates release artifacts
   - Publishes to GitHub Releases

### Manual Distribution

1. **Build packages**
   ```bash
   npm run package
   ```

2. **Upload to distribution platform:**
   - Windows: Microsoft Store, Chocolatey
   - macOS: Mac App Store, Homebrew
   - Linux: Snap Store, AppImage Hub

### Code Signing

#### Windows
```bash
# Sign Windows executable
signtool sign /f certificate.p12 /p password /t http://timestamp.digicert.com release/MyCoin-Setup-1.0.0.exe
```

#### macOS
```bash
# Sign macOS application
codesign --force --verify --verbose --sign "Developer ID Application: Your Name" release/MyCoin.app
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY src/wallet/ ./src/wallet/

# Expose ports
EXPOSE 3001 6001

# Start application
CMD ["node", "dist/main.js"]
```

### Docker Commands

```bash
# Build Docker image
docker build -t mycoin:latest .

# Run container
docker run -p 3001:3001 -p 6001:6001 mycoin:latest

# Run with persistent storage
docker run -v mycoin-data:/app/data -p 3001:3001 -p 6001:6001 mycoin:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  mycoin:
    build: .
    ports:
      - "3001:3001"
      - "6001:6001"
    volumes:
      - mycoin-data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped

volumes:
  mycoin-data:
```

## Network Deployment

### Single Node Setup

1. **Configure node**
   ```bash
   export MYCOIN_HTTP_PORT=3001
   export MYCOIN_P2P_PORT=6001
   npm start
   ```

2. **Access wallet**
   - Open browser to `http://localhost:3001`
   - Or launch desktop application

### Multi-Node Network

1. **Start first node (seed node)**
   ```bash
   MYCOIN_P2P_PORT=6001 npm start
   ```

2. **Start additional nodes**
   ```bash
   MYCOIN_P2P_PORT=6002 MYCOIN_PEER=ws://localhost:6001 npm start
   ```

3. **Connect nodes via UI**
   - Use Network tab in wallet
   - Add peer URLs manually

### Cloud Deployment

#### AWS EC2

```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --key-name my-key-pair \
  --security-groups mycoin-sg

# Install and run MyCoin
ssh -i my-key-pair.pem ec2-user@instance-ip
sudo yum update -y
sudo yum install -y nodejs npm git
git clone https://github.com/yourusername/mycoin.git
cd mycoin
npm install
npm run build
npm start
```

#### Google Cloud Platform

```bash
# Create VM instance
gcloud compute instances create mycoin-node \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --tags=mycoin-node

# Deploy application
gcloud compute ssh mycoin-node
sudo apt update
sudo apt install -y nodejs npm git
git clone https://github.com/yourusername/mycoin.git
cd mycoin
npm install
npm run build
npm start
```

### Load Balancing

For high-availability deployments:

```nginx
upstream mycoin_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name mycoin.example.com;

    location / {
        proxy_pass http://mycoin_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://mycoin_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Environment Configuration

### Environment Variables

```bash
# Network configuration
MYCOIN_HTTP_PORT=3001
MYCOIN_P2P_PORT=6001
MYCOIN_PEERS=ws://peer1:6001,ws://peer2:6001

# Blockchain configuration
MYCOIN_DIFFICULTY=4
MYCOIN_MINING_REWARD=50
MYCOIN_BLOCK_TIME=60000

# Storage configuration
MYCOIN_DATA_DIR=/var/lib/mycoin
MYCOIN_LOG_LEVEL=info

# Security configuration
MYCOIN_ENABLE_CORS=true
MYCOIN_MAX_PEERS=50
```

### Configuration File

```json
{
  "network": {
    "httpPort": 3001,
    "p2pPort": 6001,
    "peers": ["ws://peer1:6001", "ws://peer2:6001"]
  },
  "blockchain": {
    "difficulty": 4,
    "miningReward": 50,
    "blockTime": 60000
  },
  "storage": {
    "dataDir": "/var/lib/mycoin",
    "logLevel": "info"
  }
}
```

## Monitoring and Logging

### Health Checks

```bash
# Check node health
curl http://localhost:3001/stats

# Check peer connections
curl http://localhost:3001/peers

# Check blockchain status
curl http://localhost:3001/blocks | jq length
```

### Logging

```javascript
// Configure logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.MYCOIN_LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3001
   
   # Use different port
   MYCOIN_HTTP_PORT=3002 npm start
   ```

2. **Permission errors**
   ```bash
   # Fix file permissions
   chmod +x scripts/prepare-release.sh
   
   # Run with sudo if needed
   sudo npm start
   ```

3. **Memory issues**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=4096 dist/main.js
   ```

4. **Network connectivity**
   ```bash
   # Test peer connection
   telnet peer-ip 6001
   
   # Check firewall rules
   sudo ufw status
   ```

### Performance Optimization

1. **Database optimization**
   - Use SSD storage for blockchain data
   - Configure LevelDB cache size
   - Regular database compaction

2. **Network optimization**
   - Limit concurrent peer connections
   - Implement connection pooling
   - Use compression for large messages

3. **Memory optimization**
   - Implement UTXO caching
   - Limit transaction pool size
   - Regular garbage collection

### Security Considerations

1. **Network security**
   - Use firewall to restrict access
   - Enable SSL/TLS for HTTP API
   - Implement rate limiting

2. **Application security**
   - Keep dependencies updated
   - Regular security audits
   - Monitor for vulnerabilities

3. **Operational security**
   - Secure server access
   - Regular backups
   - Monitor system logs

## Support

For deployment issues:
- Check GitHub Issues
- Review documentation
- Contact support team
- Join community discussions
