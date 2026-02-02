🌐 Staging Environment Pipeline (dev → staging → production)

We’ll extend your CI/CD pipeline into a multi‑environment deployment system:

- dev branch → deploys to staging server  
- main branch → deploys to production server  

Each environment has:

- Its own server  
- Its own .env  
- Its own Docker container  
- Its own Slack notifications  

Let’s build it.

---

🟦 1. Updated CI/CD Pipeline with Staging + Production

Place this in:

`
.github/workflows/ci-cd.yml
`

`yaml
name: GitDigital Automation Engine CI/CD

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  ci:
    name: Build & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: TypeScript compile check
        run: npm run build --if-present

      - name: Run unit tests
        run: npm run test --if-present

      - name: Start automation engine (background)
        run: |
          nohup npm run dev > server.log 2>&1 &
          sleep 5

      - name: Run integration tests
        run: npm run test:integration --if-present

      - name: Run E2E tests
        run: npm run test:e2e --if-present

      - name: Upload server logs on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: server-logs
          path: server.log

      - name: Slack Notification
        if: always()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": ":robot_face: CI Completed",
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

  docker-build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: ci

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}/automation-engine:${{ github.ref_name }} .

      - name: Push Docker image
        run: |
          docker push ghcr.io/${{ github.repository }}/automation-engine:${{ github.ref_name }}

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/dev'

    steps:
      - name: SSH into staging server and deploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGINGSERVERHOST }}
          username: ${{ secrets.STAGINGSERVERUSER }}
          key: ${{ secrets.STAGINGSERVERSSH_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository }}/automation-engine:dev
            docker stop automation-engine-staging || true
            docker rm automation-engine-staging || true
            docker run -d \
              --name automation-engine-staging \
              -p 3001:3000 \
              --env-file /srv/automation-engine-staging/.env \
              ghcr.io/${{ github.repository }}/automation-engine:dev

      - name: Slack Notification
        if: always()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": ":test_tube: Staging Deployment Completed",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && '#36a64f' || '#ff0000' }}",
                  "fields": [
                    { "title": "Environment", "value": "Staging", "short": true },
                    { "title": "Status", "value": "${{ job.status }}", "short": true }
                  ]
                }
              ]
            }
        env:
          SLACKWEBHOOKURL: ${{ secrets.SLACKWEBHOOKURL }}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/main'

    steps:
      - name: SSH into production server and deploy
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PRODSERVERHOST }}
          username: ${{ secrets.PRODSERVERUSER }}
          key: ${{ secrets.PRODSERVERSSH_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository }}/automation-engine:main
            docker stop automation-engine || true
            docker rm automation-engine || true
            docker run -d \
              --name automation-engine \
              -p 3000:3000 \
              --env-file /srv/automation-engine/.env \
              ghcr.io/${{ github.repository }}/automation-engine:main

      - name: Slack Notification
        if: always()
        uses: slackapi/slack-github-action@v1.24.0
        with:
          payload: |
            {
              "text": ":rocket: Production Deployment Completed",
              "attachments": [
                {
                  "color": "${{ job.status == 'success' && '#36a64f' || '#ff0000' }}",
                  "fields": [
                    { "title": "Environment", "value": "Production", "short": true },
                    { "title": "Status", "value": "${{ job.status }}", "short": true }
                  ]
                }
              ]
            }
        env:
          SLACKWEBHOOKURL: ${{ secrets.SLACKWEBHOOKURL }}
`

---

🧠 Image: ghcr.io/GitDigital/automation-engine:latest
`

Deployment Failed
`
🔥 Deployment Failed
Check logs immediately
`

These messages give your team instant visibility.

---

🧠 Why This Matters

Slack notifications turn your pipeline into a real operational control system:

- Contributors know when their PRs pass  
- Founders know when production deploys  
- Failures are surfaced instantly  
- No one needs to check GitHub manually  
- You get a clean audit trail of deploys  

This is the kind of polish that makes GitDigital feel like a world‑class ecosystem.

---
