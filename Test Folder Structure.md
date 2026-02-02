🧪 1. Test Folder Structure

Inside automation-engine/tests/:

`
tests/
  ├── unit/
  │   ├── workflowEngine.test.ts
  │   ├── ledgerService.test.ts
  │   ├── kycAdapter.test.ts
  │   └── disbursementOrchestrator.test.ts
  ├── integration/
  │   ├── api_kyc.test.ts
  │   ├── api_milestones.test.ts
  │   ├── api_loans.test.ts
  │   ├── api_disbursements.test.ts
  │   └── api_governance.test.ts
  └── e2e/
      └── founderLoanLifecycle.test.ts
`

This gives you three layers of confidence:

- Unit = correctness  
- Integration = wiring  
- E2E = real behavior  

---

🧱 2. Unit Test: Workflow Engine

tests/unit/workflowEngine.test.ts

`ts
import { WorkflowEngine } from '../../src/workflow/WorkflowEngine';
import { LedgerService } from '../../src/ledger/LedgerService';
import { DisbursementOrchestrator } from '../../src/payments/DisbursementOrchestrator';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let ledger: LedgerService;

  beforeEach(() => {
    ledger = new LedgerService();
    const disbursements = new DisbursementOrchestrator(ledger);
    engine = new WorkflowEngine(ledger, disbursements);
  });

  it('transitions NEW → ELIGIBLEFORLOAN on KYC_APPROVED', async () => {
    await ledger.save({
      loan_id: 'L1',
      founder_id: 'F1',
      status_state: 'NEW',
      milestones: {},
      disbursements: {},
      ledger_log: []
    });

    await engine.handleEvent({
      type: 'KYC_APPROVED',
      loanId: 'L1',
      founderId: 'F1',
      occurredAt: new Date().toISOString()
    });

    const loan = await ledger.getLoan('L1');
    expect(loan.statusstate).toBe('ELIGIBLEFOR_LOAN');
  });
});
`

---

📚 3. Unit Test: Ledger Service

tests/unit/ledgerService.test.ts

`ts
import { LedgerService } from '../../src/ledger/LedgerService';

describe('LedgerService', () => {
  let ledger: LedgerService;

  beforeEach(() => {
    ledger = new LedgerService();
  });

  it('writes and reads loan records', async () => {
    await ledger.loanRepo.save({
      loan_id: 'L1',
      founder_id: 'F1',
      status_state: 'NEW',
      milestones: {},
      disbursements: {},
      ledger_log: []
    });

    const loan = await ledger.getLoan('L1');
    expect(loan.loan_id).toBe('L1');
  });
});
`

---

🔌 4. Unit Test: KYC Adapter

tests/unit/kycAdapter.test.ts

`ts
import { KycAdapter } from '../../src/kyc/KycAdapter';

describe('KycAdapter', () => {
  it('emits KYC_APPROVED event when validator succeeds', async () => {
    const mockValidator = {
      verifyKyc: async () => ({ success: true })
    };

    const mockWorkflow = {
      handleEvent: jest.fn()
    };

    const adapter = new KycAdapter(mockValidator, mockWorkflow);
    await adapter.handleKycSubmission('F1', 'L1');

    expect(mockWorkflow.handleEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'KYC_APPROVED' })
    );
  });
});
`

---

💸 5. Unit Test: Disbursement Orchestrator

tests/unit/disbursementOrchestrator.test.ts

`ts
import { DisbursementOrchestrator } from '../../src/payments/DisbursementOrchestrator';
import { LedgerService } from '../../src/ledger/LedgerService';

describe('DisbursementOrchestrator', () => {
  it('creates disbursement records', async () => {
    const ledger = new LedgerService();
    const orchestrator = new DisbursementOrchestrator(ledger);

    await orchestrator.createDisbursement('L1', 'D1FILINGFEE');

    const record = await ledger.disbursementRepo.get('L1', 'D1FILINGFEE');
    expect(record.disbursementid).toBe('D1FILING_FEE');
  });
});
`

---

🌐 6. Integration Test: KYC API

tests/integration/api_kyc.test.ts

`ts
import request from 'supertest';
import app from '../../src/index';

describe('KYC API', () => {
  it('submits KYC and returns IN_REVIEW', async () => {
    const res = await request(app)
      .post('/kyc/submit')
      .send({ founderid: 'F1', loanid: 'L1' });

    expect(res.body.status).toBe('IN_REVIEW');
  });
});
`

---

🧩 7. Integration Test: Milestones API

tests/integration/api_milestones.test.ts

`ts
import request from 'supertest';
import app from '../../src/index';

describe('Milestones API', () => {
  it('submits milestone and returns IN_REVIEW', async () => {
    const res = await request(app)
      .post('/milestones/submit')
      .send({
        milestoneid: 'M1FORMATION_DOCS',
        founder_id: 'F1',
        loan_id: 'L1',
        payload: {}
      });

    expect(res.body.status).toBe('IN_REVIEW');
  });
});
`

---

🧪 8. End‑to‑End Test: Full Founder Loan Lifecycle

This is the crown jewel — a full simulation of your entire system.

tests/e2e/founderLoanLifecycle.test.ts

`ts
import request from 'supertest';
import app from '../../src/index';

describe('Founder Loan Lifecycle (E2E)', () => {
  it('runs the full workflow', async () => {
    // 1. Submit KYC
    await request(app)
      .post('/kyc/submit')
      .send({ founderid: 'F1', loanid: 'L1' });

    // 2. Issue loan
    await request(app)
      .post('/loans/issue')
      .send({ founderid: 'F1', loanid: 'L1' });

    // 3. Submit M1
    await request(app)
      .post('/milestones/submit')
      .send({
        milestoneid: 'M1FORMATION_DOCS',
        founder_id: 'F1',
        loan_id: 'L1',
        payload: {}
      });

    // 4. Submit M2
    await request(app)
      .post('/milestones/submit')
      .send({
        milestoneid: 'M2BUSINESSBANKACCOUNT',
        founder_id: 'F1',
        loan_id: 'L1',
        payload: {}
      });

    // 5. Governance decision
    await request(app)
      .post('/governance/resolve')
      .send({
        loan_id: 'L1',
        actiontype: 'GOVERNANCEDECISIONKEEPZERO_INTEREST'
      });

    // 6. Verify final state
    const loan = await request(app).get('/loans/L1');
    expect(loan.body.statusstate).toBe('LOANIN_REPAYMENT');
  });
});
`

This test proves your entire system works as designed.

---
