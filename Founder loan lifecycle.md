🧩 End‑to‑End Flow: Founder Loan Lifecycle

We’ll simulate:

1. Loan creation  
2. KYC submission  
3. KYC approval  
4. Loan issuance  
5. Milestone 1 submission  
6. Milestone 1 approval  
7. Disbursement 1 creation  
8. Milestone 2 submission  
9. Milestone 2 approval  
10. Disbursement 2 creation  
11. 12‑month interest review  
12. Governance decision  
13. Repayment  
14. Loan completion  

This is exactly how your automation engine will behave.

---

🟦 1. Loan Created (NEW)

A loan record exists in the ledger:

`
status_state: NEW
milestones: {
  M1: PENDING,
  M2: PENDING
}
`

---

🟦 2. Founder submits KYC

POST /kyc/submit

Your HybridKycValidator (mock mode) returns:

`
{ success: true }
`

Automation engine receives:

`
KYC_APPROVED
`

State transition:

`
NEW → KYCINREVIEW → ELIGIBLEFORLOAN
`

Ledger log entry:

`
STATETRANSITIONNEWTOELIGIBLEFORLOAN
`

---

🟦 3. Loan Issued

POST /loans/issue

Workflow event:

`
LOAN_ISSUED
`

State transition:

`
ELIGIBLEFORLOAN → LOAN_ACTIVE
`

---

🟦 4. Founder submits Milestone 1 (formation docs)

POST /milestones/submit

Hybrid validator (mock mode):

`
{ approved: true }
`

Workflow event:

`
M1_APPROVED
`

State transition:

`
LOANACTIVE → M1INREVIEW → M1COMPLETED
`

Action triggered:

`
DISBURSEMENT_1
`

Ledger creates:

`
D1FILINGFEE: $50
status: NOT_PAID
`

---

🟦 5. Founder submits Milestone 2 (bank account)

POST /milestones/submit

Hybrid validator:

`
{ approved: true }
`

Workflow event:

`
M2_APPROVED
`

State transition:

`
M1COMPLETED → M2INREVIEW → M2COMPLETED
`

Action triggered:

`
DISBURSEMENT_2
`

Ledger creates:

`
D2REMAININGFUNDS: principal - 50
status: NOT_PAID
`

---

🟦 6. 12‑Month Timer Fires

A cron job emits:

`
LOANAGEREACHED12MONTHS
`

State transition:

`
M2COMPLETED → INTERESTREVIEW_WINDOW
`

Slack notification:

`
"Interest review window opened; governance action required"
`

---

🟦 7. Governance Decision

Two founders sign:

POST /governance/sign  
POST /governance/sign

Then:

POST /governance/resolve

Workflow event:

`
GOVERNANCEDECISIONKEEPZEROINTEREST
`

State transition:

`
INTERESTREVIEWWINDOW → LOANINREPAYMENT
`

---

🟦 8. Repayment Occurs

Manual or automated payments are logged in the ledger.

When balance reaches zero:

Workflow event:

`
LOANPAIDOFF
`

State transition:

`
LOANINREPAYMENT → LOAN_COMPLETED
`

Ledger finalizes:

`
status: COMPLETED
`

---
