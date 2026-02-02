🌍 Environment Setup (Full Documentation Section)

`md

Environment Setup

This guide explains how to configure and operate all environments used by the GitDigital Automation Engine:

- Local Development
- Staging
- Production
- Secrets Management
- Environment Variables
- Directory Structure
- Deployment Behavior

Each environment is isolated, deterministic, and governed by strict safety rules.

---

1. Environment Overview

The system uses three environments:

| Environment | Branch | Purpose |
|------------|--------|---------|
| Local | n/a | Development, testing, debugging |
| Staging | dev | Pre‑production validation |
| Production | main | Live automation engine |

Each environment has its own:

- .env file  
- Ledger directory  
- Docker container  
- Deployment workflow  
- Slack notifications  

---

2. Local Environment

Purpose
- Development  
- Running tests  
- Debugging workflow transitions  
- Running the Postman collection  
- Experimenting with the hybrid KYC validator  

Setup

Clone the repo:

`bash
git clone https://github.com/GitDigital-products/automation-engine.git
cd automation-engine
`

Install dependencies:

`bash
npm install
`

Create .env:

`
NODE_ENV=development
KYC_PROVIDER=mock
PORT=3000
LOG_LEVEL=debug
`

Start the server:

`bash
npm run dev
`

Verify:

`bash
curl http://localhost:3000/health
`

Local Ledger

Stored in:

`
ledger/
  loans/
  milestones/
  disbursements/
`

Never modify these files manually.

---

3. Staging Environment

Purpose
- Validate new features  
- Run smoke tests  
- Validate workflow transitions  
- Validate ledger writes  
- Validate governance actions  
- Validate KYC provider integration  

Deployment Trigger
Pushing to the dev branch.

Server Directory Layout

`
/srv/automation-engine-staging/
  ├── .env
  ├── data/
  │     └── ledger/
  └── docker-compose.yml
`

Staging .env

`
NODE_ENV=staging
KYC_PROVIDER=mock
PORT=3001
LOG_LEVEL=info
`

Deployment Flow

1. CI runs  
2. Docker image built  
3. Image tagged dev  
4. Staging server pulls image  
5. Container restarted  
6. Slack notification sent  

Staging URL

`
https://staging.gitdigital.dev
`

---

4. Production Environment

Purpose
- Live automation engine  
- Real founder workflows  
- Real governance actions  
- Real ledger writes  
- Real KYC provider integration (optional)  

Deployment Trigger
Pushing to the main branch.

Server Directory Layout

`
/srv/automation-engine/
  ├── .env
  ├── data/
  │     └── ledger/
  └── docker-compose.yml
`

Production .env

`
NODE_ENV=production
KYC_PROVIDER=persona
PORT=3000
LOG_LEVEL=warn
`

Deployment Flow

1. CI runs  
2. Docker image built  
3. Image tagged main  
4. Production server pulls image  
5. Container restarted  
6. Slack notification sent  

Production URL

`
https://api.gitdigital.dev
`

---

5. Secrets Management

Secrets are stored in:

GitHub Actions Secrets
- STAGINGSERVERHOST
- STAGINGSERVERUSER
- STAGINGSERVERSSH_KEY
- PRODSERVERHOST
- PRODSERVERUSER
- PRODSERVERSSH_KEY
- SLACKWEBHOOKURL

Server .env Files
Stored only on the server:

`
/srv/automation-engine/.env
/srv/automation-engine-staging/.env
`

Never Commit Secrets
.env is always in .gitignore.

---

6. Environment Variables

Core Variables

| Variable | Description |
|----------|-------------|
| NODE_ENV | development, staging, production |
| KYC_PROVIDER | mock, persona, alloy, stripe |
| PORT | API port |
| LOG_LEVEL | debug, info, warn, error |

Optional Variables

| Variable | Description |
|----------|-------------|
| PERSONAAPIKEY | Real KYC provider |
| ALLOYAPIKEY | Real KYC provider |
| STRIPEIDENTITYKEY | Real KYC provider |

---

7. Directory Structure (All Environments)

`
/srv/automation-engine/
  ├── .env
  ├── data/
  │     └── ledger/
  ├── docker-compose.yml
  └── logs/
`

Ledger Directory

`
data/ledger/
  loans/
  milestones/
  disbursements/
`

Logs Directory

`
logs/
  app.log
  error.log
`

---

8. Health Checks

Every environment exposes:

`
GET /health
`

Response:

`json
{
  "status": "ok",
  "timestamp": 1700000000000
}
`

Used for:

- CI/CD validation  
- Zero‑downtime deployments  
- Monitoring  

---

9. Zero‑Downtime Deployment

Production uses a blue/green pattern:

1. Pull new image  
2. Start new container on port 3001  
3. Health check  
4. Swap containers  
5. Remove old container  

This ensures:

- No downtime  
- No partial deploys  
- Safe rollbacks  

---

10. Rollback Procedure

If a deploy fails:

`bash
docker logs automation-engine-new
docker rm -f automation-engine-new
docker start automation-engine
`

Rollback is instant.

---

🎉 What You Now Have

You now have a complete Environment Setup documentation section that:

- Defines local, staging, and production  
- Documents secrets and env vars  
- Documents directory structure  
- Documents deployment behavior  
- Documents health checks  
- Documents rollback strategy  
- Documents governance and safety rules  

This is the kind of clarity that makes GitDigital feel like a real platform, not a prototype.

---

🎯 Next Step in Order

Now that the environment setup is complete, the next logical step is:

👉 Generate the full “API Gateway” documentation (architecture, routing, dependency injection, request flow, error handling).

If you want that, just say “Continue”.
To use your own domain:

1. Add a CNAME file in docs/static/:

`
docs.gitdigital.dev
`

2. In GitHub → Settings → Pages:

- Set Custom Domain to docs.gitdigital.dev
- Enable Enforce HTTPS

3. In your DNS provider:

Add a CNAME record:

`
docs.gitdigital.dev → <your-org>.github.io
`

That’s it — GitHub Pages handles the SSL certificate automatically.

---

🎨 Optional: Add Slack Notifications for Docs Deployments

If you want visibility in your workspace, add this to the end of the workflow:

`yaml
      - name: Slack Notification
        if: always()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": ":book: Documentation Deployment",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && '#36a64f' || '#ff0000' }}",
                  "fields": [
                    { "title": "Status", "value": "${{ job.status }}", "short": true },
                    { "title": "Branch", "value": "${{ github.ref }}", "short": true }
                  ]
                }
              ]
            }
        env:
          SLACKWEBHOOKURL: ${{ secrets.SLACKWEBHOOKURL }}
`

---

🎉 What You Now Have

You now have:

- A complete Docusaurus documentation site  
- A full sidebar + navigation system  
- All content pages generated  
- A GitHub Pages deployment workflow  
- Optional Slack notifications  
- Support for custom domain docs.gitdigital.dev  

This is a real, production‑grade, auto‑deploying documentation portal.

---

🎯 Next Step in Order

Now that your docs site is deployable, the next logical step is:

👉 Generate the full contributor onboarding guide (the “Start Here” guide for new developers).

If you want that, just say “Continue”.
3. In your DNS provider:

Add a CNAME record:

`
docs.gitdigital.dev → <your-org>.github.io
`

That’s it — GitHub Pages handles the SSL certificate automatically.

---

🎨 Optional: Add Slack Notifications for Docs Deployments

If you want visibility in your workspace, add this to the end of the workflow:

`yaml
      - name: Slack Notification
        if: always()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": ":book: Documentation Deployment",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && '#36a64f' || '#ff0000' }}",
                  "fields": [
                    { "title": "Status", "value": "${{ job.status }}", "short": true },
                    { "title": "Branch", "value": "${{ github.ref }}", "short": true }
                  ]
                }
              ]
            }
        env:
          SLACKWEBHOOKURL: ${{ secrets.SLACKWEBHOOKURL }}
`

---

