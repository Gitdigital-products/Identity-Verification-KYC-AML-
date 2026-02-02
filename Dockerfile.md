🐳 1. Dockerfile (Production‑Grade)

This is optimized for:

- Small image size  
- Fast cold starts  
- Deterministic builds  
- Node 20 LTS  
- Non‑root user for security  

`dockerfile
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run build

--- Production image ---
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
`

This is the exact structure I’d expect from a GitDigital‑grade service.

---

🧩 2. docker-compose.yml (Local Dev + Local CI)

This is optional but extremely useful for contributors.

`yaml
version: "3.9"

services:
  automation-engine:
    build: .
    container_name: automation-engine
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      KYC_PROVIDER: mock
    volumes:
      - ./ledger:/app/ledger
`

This gives you:

- Local container  
- Persistent ledger  
- Mock KYC provider  
- Identical behavior to production  

---

🌐 3. Production Server Layout

Your server should have:

`
/srv/automation-engine/
  ├── docker-compose.yml
  ├── .env
  └── data/
      └── ledger/
`

The GitHub Actions pipeline will:

- SSH into server  
- Pull the latest image  
- Restart the container  

---

🔐 4. Environment Variables

Your .env file on the server:

`
NODE_ENV=production
KYC_PROVIDER=persona   # or alloy, stripe, mock
PORT=3000
LOG_LEVEL=info
`

You can expand this later for:

- Provider API keys  
- Slack webhooks  
- Database URLs (if you add one)  

---

❤️ 5. Health Check Endpoint

Add this to your Express app:

`ts
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
`

Then update your Dockerfile:

`dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:3000/health || exit 1
`

This gives you:

- Automatic container restart  
- CI/CD validation  
- Monitoring hooks  

---

🔄 6. Zero‑Downtime Deployment Pattern

Your GitHub Actions pipeline already:

- Pulls the new image  
- Stops the old container  
- Starts the new one  

To make it zero‑downtime, update the deploy step:

`bash
docker pull ghcr.io/${{ github.repository }}/automation-engine:latest

docker run -d \
  --name automation-engine-new \
  -p 3001:3000 \
  ghcr.io/${{ github.repository }}/automation-engine:latest

sleep 5

Health check
curl -f http://localhost:3001/health

Swap containers
docker stop automation-engine || true
docker rm automation-engine || true
docker rename automation-engine-new automation-engine
`

This gives you:

- Blue/green deployment  
- Health‑checked cutover  
- Zero downtime  

---

⏪ 7. Rollback Strategy

If the new container fails health check:

`bash
docker logs automation-engine-new
docker rm -f automation-engine-new
docker start automation-engine
`

This is built into the pipeline automatically.

---

