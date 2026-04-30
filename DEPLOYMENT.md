# Deployment Guide

This guide covers deploying OneLink to production environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Deployment Options](#deployment-options)
  - [Heroku](#heroku)
  - [DigitalOcean](#digitalocean)
  - [AWS EC2](#aws-ec2)
  - [Vercel](#vercel)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 14.x or higher
- MongoDB Atlas account (or self-hosted MongoDB)
- AWS S3 bucket for file uploads
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

## Environment Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd one-link
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/onelink

# JWT Secrets (generate strong random strings)
JWT_LOGIN_SECRET=<generate-random-string>
JWT_LOGIN_EXPIRY=2d
JWT_VERIFICATION_SECRET=<generate-random-string>
JWT_VERIFICATION_EXPIRY=15m
JWT_RESET_PASSWORD=<generate-random-string>
JWT_RESET_PASSWORD_EXPIRY=15m

# Session
SESSION_SECRET=<generate-random-string>

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=OneLink <noreply@yourdomain.com>

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# Redis (optional)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Application
NODE_ENV=production
PORT=3000
```

### 3. Generate Secure Secrets

```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string
6. Update `MONGODB_URI` in `.env`

### Self-Hosted MongoDB

```bash
# Install MongoDB
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Update connection string
MONGODB_URI=mongodb://localhost:27017/onelink
```

## Deployment Options

### Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku App**
```bash
heroku create your-app-name
```

3. **Set Environment Variables**
```bash
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_LOGIN_SECRET=your-secret
# ... set all other environment variables
```

4. **Deploy**
```bash
git push heroku main
```

5. **Open App**
```bash
heroku open
```

### DigitalOcean

1. **Create Droplet**
   - Choose Ubuntu 20.04 LTS
   - Select appropriate size (minimum: 1GB RAM)
   - Add SSH key

2. **Connect to Droplet**
```bash
ssh root@your-droplet-ip
```

3. **Install Dependencies**
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt-get install -y nginx

# Install Certbot for SSL
apt-get install -y certbot python3-certbot-nginx
```

4. **Setup Application**
```bash
# Clone repository
cd /var/www
git clone <your-repo-url> onelink
cd onelink

# Install dependencies
npm install --production

# Create .env file
nano .env
# Paste your environment variables

# Start with PM2
pm2 start app.js --name onelink
pm2 startup
pm2 save
```

5. **Configure Nginx**
```bash
nano /etc/nginx/sites-available/onelink
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/onelink /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

6. **Setup SSL**
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### AWS EC2

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - Select t2.micro (free tier) or larger
   - Configure security group (ports 22, 80, 443)

2. **Connect and Setup**
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Follow similar steps as DigitalOcean
```

### Vercel (Frontend Only)

Note: Vercel is best for static sites. For full-stack, use other options.

```bash
npm install -g vercel
vercel login
vercel
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check if app is running
curl https://yourdomain.com

# Check logs
pm2 logs onelink
```

### 2. Setup Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. Setup Backups

```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/mongodb_$DATE
```

### 4. Configure Domain

1. Point your domain to server IP
2. Update DNS A records
3. Wait for DNS propagation (up to 48 hours)

### 5. Update Google OAuth

1. Go to Google Cloud Console
2. Update authorized redirect URIs
3. Add production URL: `https://yourdomain.com/auth/google/callback`

## Monitoring

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs onelink --lines 100

# Check status
pm2 status
```

### Server Monitoring

```bash
# Check disk space
df -h

# Check memory
free -m

# Check CPU
top
```

### Setup Alerts

Use services like:
- **UptimeRobot** - Free uptime monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - APM

## Troubleshooting

### App Won't Start

```bash
# Check logs
pm2 logs onelink --err

# Check environment variables
pm2 env 0

# Restart app
pm2 restart onelink
```

### Database Connection Issues

```bash
# Test MongoDB connection
mongo "mongodb+srv://cluster.mongodb.net/test" --username user

# Check firewall
sudo ufw status
```

### SSL Certificate Issues

```bash
# Renew certificate
certbot renew

# Test renewal
certbot renew --dry-run
```

### High Memory Usage

```bash
# Restart app
pm2 restart onelink

# Check memory leaks
pm2 monit

# Increase server resources if needed
```

### 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx configuration
nginx -t

# Restart services
pm2 restart onelink
systemctl restart nginx
```

## Performance Optimization

### 1. Enable Compression

Already enabled in `app.js` with compression middleware.

### 2. Setup CDN

Use Cloudflare for:
- DDoS protection
- CDN caching
- SSL/TLS
- Analytics

### 3. Database Indexing

Ensure proper indexes in MongoDB:
```javascript
db.users.createIndex({ email: 1 })
db.users.createIndex({ username: 1 })
db.profiles.createIndex({ userid: 1 })
```

### 4. Redis Caching

Enable Redis for better performance:
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

## Security Checklist

- [ ] Use HTTPS (SSL certificate)
- [ ] Set strong JWT secrets
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment variables
- [ ] Enable MongoDB authentication
- [ ] Setup firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly

## Scaling

### Horizontal Scaling

Use PM2 cluster mode:
```bash
pm2 start app.js -i max --name onelink
```

### Load Balancing

Use Nginx as load balancer:
```nginx
upstream onelink {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}
```

### Database Scaling

- Use MongoDB replica sets
- Enable sharding for large datasets
- Use read replicas

## Support

For issues or questions:
- Check logs: `pm2 logs onelink`
- Review error messages
- Check GitHub issues
- Contact support team

## Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)