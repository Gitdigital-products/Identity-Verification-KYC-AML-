🧱 1. Directory Structure (inside src/ledger/)

`
src/ledger/
  ├── LedgerService.ts
  ├── LoanRepository.ts
  ├── MilestoneRepository.ts
  ├── DisbursementRepository.ts
  ├── fileHelpers.ts
  └── types.ts
`

---

📄 2. types.ts — Shared Types

`ts
export interface LoanRecord {
  loan_id: string;
  founder_id: string;
  cofounderid: string;
  principal_amount: number;
  status: string;
  status_state: string;
  milestones: Record<string, string>;
  disbursements: Record<string, any>;
  ledger_log: any[];
}

export interface MilestoneRecord {
  milestone_id: string;
  loan_id: string;
  founder_id: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  validator_metadata: Record<string, unknown>;
}

export interface DisbursementRecord {
  disbursement_id: string;
  loan_id: string;
  founder_id: string;
  amount: number;
  pay_to: string;
  status: string;
  paid_at: string | null;
  governance_signatures: any[];
  ledger_log: any[];
}
`

---

📁 3. fileHelpers.ts — File I/O Utilities

These helpers abstract JSON read/write so the rest of the system stays clean.

`ts
import fs from 'fs-extra';
import path from 'path';

const BASE = path.join(process.cwd(), 'ledger');

export async function readJson(filePath: string) {
  const full = path.join(BASE, filePath);
  if (!fs.existsSync(full)) return null;
  return fs.readJson(full);
}

export async function writeJson(filePath: string, data: any) {
  const full = path.join(BASE, filePath);
  await fs.ensureDir(path.dirname(full));
  await fs.writeJson(full, data, { spaces: 2 });
}

export async function appendLog(filePath: string, entry: any) {
  const record = await readJson(filePath);
  if (!record.ledgerlog) record.ledgerlog = [];
  record.ledger_log.push(entry);
  await writeJson(filePath, record);
}
`

---

📘 4. LoanRepository.ts

`ts
import { readJson, writeJson, appendLog } from './fileHelpers';
import { LoanRecord } from './types';

export class LoanRepository {
  async get(loanId: string): Promise<LoanRecord> {
    return readJson(loans/${loanId}.json);
  }

  async save(loan: LoanRecord): Promise<void> {
    await writeJson(loans/${loan.loan_id}.json, loan);
  }

  async updateState(loanId: string, newState: string) {
    const loan = await this.get(loanId);
    loan.status_state = newState;

    await appendLog(loans/${loanId}.json, {
      timestamp: new Date().toISOString(),
      actor: 'system',
      event: STATECHANGEDTO_${newState},
      details: ''
    });

    await this.save(loan);
  }

  async log(loanId: string, entry: any) {
    await appendLog(loans/${loanId}.json, entry);
  }
}
`

---

📄 5. MilestoneRepository.ts

`ts
import { readJson, writeJson } from './fileHelpers';
import { MilestoneRecord } from './types';

export class MilestoneRepository {
  async get(loanId: string, milestoneId: string): Promise<MilestoneRecord> {
    return readJson(milestones/${loanId}_${milestoneId}.json);
  }

  async save(record: MilestoneRecord) {
    await writeJson(
      milestones/${record.loanid}${record.milestone_id}.json,
      record
    );
  }

  async updateStatus(
    loanId: string,
    milestoneId: string,
    status: string,
    metadata: any
  ) {
    const record = await this.get(loanId, milestoneId);
    record.status = status;

    if (status === 'APPROVED') record.approved_at = new Date().toISOString();
    if (status === 'REJECTED') record.rejected_at = new Date().toISOString();

    record.validator_metadata = metadata;

    await this.save(record);
  }
}
`

---

💸 6. DisbursementRepository.ts

`ts
import { readJson, writeJson, appendLog } from './fileHelpers';
import { DisbursementRecord } from './types';

export class DisbursementRepository {
  async get(loanId: string, disbursementId: string): Promise<DisbursementRecord> {
    return readJson(disbursements/${loanId}_${disbursementId}.json);
  }

  async create(record: DisbursementRecord) {
    await writeJson(
      disbursements/${record.loanid}${record.disbursement_id}.json,
      record
    );
  }

  async markPaid(loanId: string, disbursementId: string) {
    const record = await this.get(loanId, disbursementId);
    record.status = 'PAID';
    record.paid_at = new Date().toISOString();

    await appendLog(
      disbursements/${loanId}_${disbursementId}.json,
      {
        timestamp: new Date().toISOString(),
        event: 'DISBURSEMENTMARKEDPAID',
        details: ''
      }
    );

    await this.create(record);
  }
}
`

---

🧠 7. LedgerService.ts — High‑Level Ledger API

This is what the WorkflowEngine talks to.

`ts
import { LoanRepository } from './LoanRepository';
import { MilestoneRepository } from './MilestoneRepository';
import { DisbursementRepository } from './DisbursementRepository';

export class LedgerService {
  loanRepo = new LoanRepository();
  milestoneRepo = new MilestoneRepository();
  disbursementRepo = new DisbursementRepository();

  async getLoan(loanId: string) {
    return this.loanRepo.get(loanId);
  }

  async updateState(loanId: string, newState: string) {
    return this.loanRepo.updateState(loanId, newState);
  }

  async appendLog(loanId: string, entry: any) {
    return this.loanRepo.log(loanId, entry);
  }

  async updateMilestone(loanId: string, milestoneId: string, status: string, metadata: any) {
    return this.milestoneRepo.updateStatus(loanId, milestoneId, status, metadata);
  }

  async createDisbursement(record: any) {
    return this.disbursementRepo.create(record);
  }

  async markDisbursementPaid(loanId: string, disbursementId: string) {
    return this.disbursementRepo.markPaid(loanId, disbursementId);
  }
}
`

---

