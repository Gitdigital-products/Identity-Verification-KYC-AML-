📘 Getting Started → Installation

`md

Installation

This guide walks you through installing and running the GitDigital Automation Engine locally.

Requirements

Before you begin, ensure you have the following installed:

- Node.js 20+
- npm 9+
- Git
- Docker (optional, for containerized development)
- Postman or curl (optional, for API testing)

Clone the Repository

`bash
git clone https://github.com/GitDigital-products/automation-engine.git
cd automation-engine
`

Install Dependencies

`bash
npm install
`

Environment Variables

Create a .env file in the project root:

`
NODE_ENV=development
KYC_PROVIDER=mock
PORT=3000
`

Start the Development Server

`bash
npm run dev
`

The API will be available at:

`
http://localhost:3000
`

Verify Installation

Check the health endpoint:

`bash
curl http://localhost:3000/health
`

You should see:

`json
{ "status": "ok", "timestamp": 1700000000000 }
`

Your environment is now ready.
`

---

🧱 Getting Started → Local Development

`md

Local Development

This guide explains how to run, test, and extend the GitDigital Automation Engine locally.

Project Structure

`
src/
  api/
  ledger/
  workflow/
  kyc/
  payments/
  utils/
tests/
docs/
`

Running the Server

`bash
npm run dev
`

This uses ts-node for hot‑reloading TypeScript.

Running Tests

Unit tests

`bash
npm run test
`

Integration tests

`bash
npm run test:integration
`

End‑to‑end tests

`bash
npm run test:e2e
`

Using Docker (Optional)

Build and run the container:

`bash
docker build -t automation-engine .
docker run -p 3000:3000 automation-engine
`

Using the Ledger

The ledger is stored in:

`
ledger/
  loans/
  milestones/
  disbursements/
`

Each record is a JSON file.  
Never modify ledger files manually — always use the API or engine.
`

---

🧠 Architecture → Workflow Engine

`md

Workflow Engine

The Workflow Engine is the core of the automation system.  
It processes events, validates transitions, triggers actions, and updates the ledger.

Key Responsibilities

- Load workflow definitions from YAML
- Validate state transitions
- Execute actions (e.g., disbursements)
- Write audit logs
- Emit next workflow state

Event-Driven Design

Every change in the system is triggered by an event:

- KYC_APPROVED
- M1_APPROVED
- M2_APPROVED
- LOAN_ISSUED
- GOVERNANCEDECISIONKEEPZEROINTEREST
- LOANPAIDOFF

State Machine

The engine uses a deterministic state machine defined in:

`
config/workflows/founderloanv1.yaml
`

Each state includes:

- Allowed transitions
- Required events
- Actions to execute

Example Transition

`yaml
- id: LOAN_ACTIVE
  transitions:
    - on: M1_APPROVED
      to: M1_COMPLETED
      actions:
        - trigger: DISBURSEMENT_1
`

Audit Logging

Every transition writes a log entry:

`json
{
  "timestamp": "2026-01-01T12:00:00Z",
  "actor": "system",
  "event": "STATETRANSITIONLOANACTIVETOM1COMPLETED"
}
`

This ensures full traceability.
`

---

📒 Architecture → Ledger Architecture

`md

Ledger Architecture

The ledger is a JSON‑backed, append‑only storage layer designed for:

- Auditability
- Determinism
- Zero external dependencies
- Human readability

Directory Structure

`
ledger/
  loans/
  milestones/
  disbursements/
`

Loan Record Format

`json
{
  "loan_id": "L1",
  "founder_id": "F1",
  "statusstate": "M1COMPLETED",
  "milestones": {
    "M1": "COMPLETED",
    "M2": "PENDING"
  },
  "disbursements": {},
  "ledger_log": []
}
`

Milestone Record Format

`json
{
  "milestoneid": "M1FORMATION_DOCS",
  "loan_id": "L1",
  "status": "APPROVED",
  "submitted_at": "...",
  "approved_at": "...",
  "validator_metadata": {}
}
`

Disbursement Record Format

`json
{
  "disbursementid": "D1FILING_FEE",
  "loan_id": "L1",
  "amount": 50,
  "status": "NOT_PAID",
  "ledger_log": []
}
`

Why JSON?

- Easy to inspect  
- Easy to diff  
- Easy to version  
- Perfect for early‑stage automation systems  
`

---

🔐 Architecture → Hybrid KYC Validator

`md

Hybrid KYC Validator

The Hybrid KYC Validator supports both:

- Mock validation (default)
- Real provider validation (Persona, Alloy, Stripe Identity)

Why Hybrid?

- Fast local development
- Deterministic tests
- Optional real verification
- Zero provider lock‑in

Provider Switching

Set in .env:

`
KYC_PROVIDER=mock
`

or:

`
KYC_PROVIDER=persona
`

Validator Contract

`ts
interface KycValidator {
  verifyKyc(founderId: string): Promise<KycResult>;
  verifyMilestone(submission: MilestoneSubmission): Promise<MilestoneResult>;
}
`

Mock Provider

Always returns success:

`json
{ "success": true }
`

Real Providers

Stubs exist for:

- Persona
- Alloy
- Stripe Identity

You can implement them incrementally.
`

---
