🔌 1. Update src/index.ts to Construct the Engine + Adapter

This file becomes the “composition root” of your service.

`ts
import express from 'express';
import { registerRoutes } from './api/index';

import { LedgerService } from './ledger/LedgerService';
import { WorkflowEngine } from './workflow/WorkflowEngine';
import { DisbursementOrchestrator } from './payments/DisbursementOrchestrator';

import { HybridKycValidator } from '@GitDigital/Identity-Verification-KYC-AML';
import { KycAdapter } from './kyc/KycAdapter';

const app = express();
app.use(express.json());

// Core services
const ledger = new LedgerService();
const disbursements = new DisbursementOrchestrator(ledger);
const workflow = new WorkflowEngine(ledger, disbursements);

// KYC validator (hybrid mode)
const validator = new HybridKycValidator(process.env.KYC_PROVIDER || 'mock');
const kycAdapter = new KycAdapter(validator, workflow);

// Register API routes with dependencies
registerRoutes(app, { kycAdapter, workflow, ledger });

app.listen(3000, () => {
  console.log('Automation Engine running on port 3000');
});
`

This is the central wiring point.

---

🌐 2. Update src/api/index.ts to Accept Dependencies

`ts
import { Express } from 'express';
import kycRoutes from './kyc.routes';
import milestoneRoutes from './milestones.routes';
import loanRoutes from './loans.routes';
import disbursementRoutes from './disbursements.routes';
import governanceRoutes from './governance.routes';

export function registerRoutes(app: Express, deps: any) {
  app.use('/kyc', kycRoutes(deps));
  app.use('/milestones', milestoneRoutes(deps));
  app.use('/loans', loanRoutes(deps));
  app.use('/disbursements', disbursementRoutes(deps));
  app.use('/governance', governanceRoutes(deps));
}
`

Now each route gets the engine + adapter injected.

---

🧩 3. Wire the KYC Routes

src/api/kyc.routes.ts

`ts
import { Router } from 'express';

export default function({ kycAdapter }) {
  const router = Router();

  router.post('/submit', async (req, res) => {
    const { founderid, loanid } = req.body;
    await kycAdapter.handleKycSubmission(founderid, loanid);
    res.json({ status: 'IN_REVIEW' });
  });

  return router;
}
`

This now triggers the full KYC → workflow → ledger pipeline.

---

🧩 4. Wire the Milestone Routes

src/api/milestones.routes.ts

`ts
import { Router } from 'express';

export default function({ kycAdapter }) {
  const router = Router();

  router.post('/submit', async (req, res) => {
    await kycAdapter.handleMilestoneSubmission(req.body);
    res.json({ status: 'IN_REVIEW' });
  });

  return router;
}
`

This now triggers:

- Hybrid validator  
- WorkflowEngine  
- Ledger updates  
- Disbursement creation  

---

🧩 5. Wire the Loan Routes

src/api/loans.routes.ts

`ts
import { Router } from 'express';

export default function({ workflow, ledger }) {
  const router = Router();

  router.get('/:loan_id', async (req, res) => {
    const loan = await ledger.getLoan(req.params.loan_id);
    res.json(loan);
  });

  router.post('/issue', async (req, res) => {
    const { loanid, founderid } = req.body;

    await workflow.handleEvent({
      type: 'LOAN_ISSUED',
      loanId: loan_id,
      founderId: founder_id,
      occurredAt: new Date().toISOString()
    });

    res.json({ event: 'LOAN_ISSUED' });
  });

  return router;
}
`

---

🧩 6. Wire the Disbursement Routes

src/api/disbursements.routes.ts

`ts
import { Router } from 'express';

export default function({ ledger }) {
  const router = Router();

  router.get('/:id', async (req, res) => {
    const [loanId, disbursementId] = req.params.id.split('_');
    const record = await ledger.disbursementRepo.get(loanId, disbursementId);
    res.json(record);
  });

  router.post('/mark-paid', async (req, res) => {
    const { loanid, disbursementid } = req.body;
    await ledger.markDisbursementPaid(loanid, disbursementid);
    res.json({ status: 'PAID' });
  });

  return router;
}
`

---

🧩 7. Wire the Governance Routes

src/api/governance.routes.ts

`ts
import { Router } from 'express';

export default function({ workflow, ledger }) {
  const router = Router();

  router.post('/sign', async (req, res) => {
    // TODO: governance signature logic
    res.json({ status: 'PENDING' });
  });

  router.post('/resolve', async (req, res) => {
    const { loanid, actiontype } = req.body;

    await workflow.handleEvent({
      type: action_type,
      loanId: loan_id,
      founderId: 'governance',
      occurredAt: new Date().toISOString()
    });

    res.json({ event: action_type });
  });

  return router;
}
`

Governance is now fully event‑driven.

---
