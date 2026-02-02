💸 Architecture → Disbursement Engine

`md

Disbursement Engine

The Disbursement Engine is responsible for creating, tracking, and updating disbursement records associated with a founder loan.

It is intentionally simple, deterministic, and fully off‑chain.

Responsibilities

- Create disbursement records
- Assign disbursement IDs
- Track payment status
- Write audit logs
- Integrate with the Workflow Engine
- Integrate with the Ledger Service

Disbursement Types

D1 — Filing Fee
Triggered when:
`
M1_APPROVED
`

Amount:
`
$50
`

D2 — Remaining Funds
Triggered when:
`
M2_APPROVED
`

Amount:
`
principal_amount - 50
`

Disbursement Record Format

`json
{
  "disbursementid": "D1FILING_FEE",
  "loan_id": "L1",
  "founder_id": "F1",
  "amount": 50,
  "status": "NOT_PAID",
  "paid_at": null,
  "governance_signatures": [],
  "ledger_log": []
}
`

Payment Flow

1. Disbursement created by Workflow Engine  
2. Ledger writes record  
3. Founder receives funds (manual or automated)  
4. Admin marks disbursement as paid  
5. Ledger updates status  
6. Workflow continues if required  

API Integration

Mark a disbursement as paid:

`
POST /disbursements/mark-paid
`

This updates the ledger and logs the event.
`

---

🌐 API Reference → KYC

`md

KYC API

POST /kyc/submit

Submit KYC for a founder.

Request

`json
{
  "founder_id": "F1",
  "loan_id": "L1"
}
`

Response

`json
{
  "status": "IN_REVIEW"
}
`

Behavior

- Calls Hybrid KYC Validator
- Emits KYCAPPROVED or KYCREJECTED
- Workflow Engine processes event
- Ledger logs event
`

---

🌐 API Reference → Milestones

`md

Milestones API

POST /milestones/submit

Submit a milestone for validation.

Request

`json
{
  "milestoneid": "M1FORMATION_DOCS",
  "founder_id": "F1",
  "loan_id": "L1",
  "payload": {}
}
`

Response

`json
{
  "status": "IN_REVIEW"
}
`

Behavior

- Hybrid validator checks milestone
- Emits M1APPROVED or M1REJECTED
- Workflow Engine processes event
- Disbursement Engine may trigger actions
- Ledger logs everything
`

---

🌐 API Reference → Loans

`md

Loans API

POST /loans/issue

Issue a loan after KYC approval.

Request

`json
{
  "loan_id": "L1",
  "founder_id": "F1",
  "principal_amount": 500
}
`

Response

`json
{
  "event": "LOAN_ISSUED"
}
`

GET /loans/:loan_id

Retrieve loan state.

Response

`json
{
  "loan_id": "L1",
  "statusstate": "M1COMPLETED",
  "milestones": {},
  "disbursements": {},
  "ledger_log": []
}
`
`

---

🌐 API Reference → Disbursements

`md

Disbursements API

GET /disbursements/:id

Retrieve a disbursement record.

Example

`
GET /disbursements/L1D1FILING_FEE
`

POST /disbursements/mark-paid

Mark a disbursement as paid.

Request

`json
{
  "loan_id": "L1",
  "disbursementid": "D1FILING_FEE"
}
`

Response

`json
{
  "status": "PAID"
}
`
`

---

🌐 API Reference → Governance

`md

Governance API

POST /governance/sign

Submit a governance signature.

(Implementation pending)

POST /governance/resolve

Resolve a governance action.

Request

`json
{
  "loan_id": "L1",
  "actiontype": "GOVERNANCEDECISIONKEEPZERO_INTEREST"
}
`

Response

`json
{
  "event": "GOVERNANCEDECISIONKEEPZEROINTEREST"
}
`

Behavior

- Workflow Engine processes event
- Ledger logs decision
- Loan transitions to repayment
`

---

🔄 Workflow Reference → Milestone Logic

`md

Milestone Logic

The founder loan workflow includes two milestones:

M1 — Formation Documents

Requirements:

- Articles of Organization
- State filing receipt
- Matching founder name
- Valid formation date

Triggers:

- DISBURSEMENT_1

M2 — Business Bank Account

Requirements:

- Bank name
- Routing number
- Last 4 of account
- Must match founder identity

Triggers:

- DISBURSEMENT_2
`

---

🛡️ Governance → Interest Review

`md

Interest Review Window

At 12 months, the loan enters:

`
INTERESTREVIEWWINDOW
`

Governance must choose:

- Keep zero interest  
- Apply interest  
- Extend review window  

No automatic interest is ever applied.

Governance Decision Event

`
GOVERNANCEDECISIONKEEPZEROINTEREST
`

This transitions the loan to:

`
LOANINREPAYMENT
`
`

---

👥 Contributor Guide → Repo Structure

`md

Repository Structure

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
.github/
`

Key Directories

src/workflow/
Workflow Engine + YAML loader

src/ledger/
JSON-backed ledger system

src/kyc/
Hybrid KYC validator + adapters

src/payments/
Disbursement orchestrator

tests/
Unit, integration, and E2E tests

docs/
Documentation site
`

---

🧪 Contributor Guide → Testing Guide

`md

Testing Guide

The project includes three test layers:

Unit Tests

Test individual modules.

`bash
npm run test
`

Integration Tests

Test API endpoints.

`bash
npm run test:integration
`

End-to-End Tests

Simulate full founder loan lifecycle.

`bash
npm run test:e2e
`

Postman Collection

Located in:

`
postman/GitDigital-Automation-Engine.postman.json
`
`

---

🔧 CI/CD → Staging Environment

`md

Staging Environment

The staging environment is deployed automatically from the dev branch.

URL

`
https://staging.gitdigital.dev
`

Deployment Flow

1. Push to dev
2. CI runs tests
3. Docker image built
4. Image pushed to GHCR
5. Staging server pulls image
6. Container restarted
7. Slack notification sent

Environment Variables

Stored in:

`
/srv/automation-engine-staging/.env
`
`

---
