🧠 1. Integration Architecture (Simple + Powerful)

The KYC validator plugs into the automation engine through two channels:

A) KYC submission → validator → callback
Used for identity verification.

B) Milestone submission → validator → callback
Used for:
- M1: Formation docs  
- M2: Business bank account  

The validator never touches money.  
It only emits events.

---

🔌 2. The KYC Adapter (Your Integration Layer)

This is the glue between:

- Your validator  
- The workflow engine  
- The ledger  

Here’s the repo‑ready file:

---

📄 src/kyc/KycAdapter.ts

`ts
import { WorkflowEngine } from '../workflow/WorkflowEngine';
import { KycValidator, MilestoneSubmission } from './validatorTypes';

export class KycAdapter {
  constructor(
    private validator: KycValidator,
    private workflow: WorkflowEngine
  ) {}

  async handleKycSubmission(founderId: string, loanId: string) {
    const result = await this.validator.verifyKyc(founderId);

    const eventType = result.success ? 'KYCAPPROVED' : 'KYCREJECTED';

    await this.workflow.handleEvent({
      type: eventType,
      founderId,
      loanId,
      occurredAt: new Date().toISOString(),
      payload: result.metadata || {}
    });
  }

  async handleMilestoneSubmission(submission: MilestoneSubmission) {
    const result = await this.validator.verifyMilestone(submission);

    const eventType =
      submission.milestoneId === 'M1FORMATIONDOCS'
        ? result.approved
          ? 'M1_APPROVED'
          : 'M1_REJECTED'
        : result.approved
        ? 'M2_APPROVED'
        : 'M2_REJECTED';

    await this.workflow.handleEvent({
      type: eventType,
      founderId: submission.context.founderId,
      loanId: submission.context.loanId,
      occurredAt: new Date().toISOString(),
      payload: result.metadata || {}
    });
  }
}
`

This adapter is intentionally tiny and deterministic.

---

🧩 3. The Validator Contract (What Your Validator Must Output)

Your validator only needs to implement two functions:

---

📄 src/kyc/validatorTypes.ts

`ts
export interface KycResult {
  success: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface MilestoneSubmission {
  milestoneId: 'M1FORMATIONDOCS' | 'M2BUSINESSBANK_ACCOUNT';
  context: {
    founderId: string;
    loanId: string;
  };
  payload: Record<string, unknown>;
}

export interface MilestoneResult {
  approved: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface KycValidator {
  verifyKyc(founderId: string): Promise<KycResult>;
  verifyMilestone(submission: MilestoneSubmission): Promise<MilestoneResult>;
}
`

This is the contract your validator must satisfy.

---

🔁 4. Event Flow (How the Integration Works)

1. Founder submits KYC
POST /kyc/submit

→ KycAdapter calls validator.verifyKyc()  
→ Validator returns { success: true }  
→ Adapter emits KYC_APPROVED  
→ Workflow engine moves to ELIGIBLEFORLOAN

---

2. Founder submits M1 (formation docs)
POST /milestones/submit

→ KycAdapter calls validator.verifyMilestone()  
→ Validator returns { approved: true }  
→ Adapter emits M1_APPROVED  
→ Engine:
- Marks milestone complete  
- Creates disbursement record for $50  
- Moves to M1_COMPLETED

---

3. Founder submits M2 (bank account)
Same flow → M2_APPROVED → engine creates remaining disbursement.

---

🧱 5. Wiring the Adapter Into the Engine

In your main entrypoint:

---

📄 src/index.ts

`ts
import express from 'express';
import { registerRoutes } from './api/index';
import { WorkflowEngine } from './workflow/WorkflowEngine';
import { LedgerService } from './ledger/LedgerService';
import { DisbursementOrchestrator } from './payments/DisbursementOrchestrator';
import { KycAdapter } from './kyc/KycAdapter';
import { MyKycValidator } from './kyc/MyKycValidator'; // your implementation

const ledger = new LedgerService();
const workflow = new WorkflowEngine(ledger, new DisbursementOrchestrator(ledger));
const kycAdapter = new KycAdapter(new MyKycValidator(), workflow);

const app = express();
app.use(express.json());

// Pass adapter to routes
registerRoutes(app, kycAdapter);

app.listen(3000, () => {
  console.log('Automation Engine running on port 3000');
});
`

---

🌐 6. Routing Integration

Your routes now receive the adapter:

---

📄 src/api/kyc.routes.ts

`ts
import { Router } from 'express';

export default function(kycAdapter) {
  const router = Router();

  router.post('/submit', async (req, res) => {
    const { founderid, loanid } = req.body;
    await kycAdapter.handleKycSubmission(founderid, loanid);
    res.json({ status: 'IN_REVIEW' });
  });

  router.post('/callback', async (req, res) => {
    // If your validator calls back externally, handle here
    res.json({ received: true });
  });

  return router;
}
`

---

📄 src/api/milestones.routes.ts

`ts
export default function(kycAdapter) {
  const router = Router();

  router.post('/submit', async (req, res) => {
    await kycAdapter.handleMilestoneSubmission(req.body);
    res.json({ status: 'IN_REVIEW' });
  });

  return router;
}
`

---
