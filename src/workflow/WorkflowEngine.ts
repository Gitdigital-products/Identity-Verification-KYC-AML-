🧠 src/workflow/WorkflowEngine.ts (Full Implementation)

`ts
import { LedgerService } from '../ledger/LedgerService';
import { DisbursementOrchestrator } from '../payments/DisbursementOrchestrator';
import { loadWorkflow } from './WorkflowLoader';

interface WorkflowEvent {
  type: string;
  loanId: string;
  founderId: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
}

export class WorkflowEngine {
  private workflow: any;

  constructor(
    private ledger: LedgerService,
    private disbursements: DisbursementOrchestrator
  ) {
    this.workflow = loadWorkflow('config/workflows/founderloanv1.yaml');
  }

  async handleEvent(event: WorkflowEvent): Promise<void> {
    const loan = await this.ledger.getLoan(event.loanId);

    if (!loan) {
      throw new Error(Loan not found: ${event.loanId});
    }

    const currentState = loan.status_state;
    const stateConfig = this.workflow.states.find((s: any) => s.id === currentState);

    if (!stateConfig) {
      throw new Error(Unknown workflow state: ${currentState});
    }

    const transition = stateConfig.transitions?.find(
      (t: any) => t.on === event.type
    );

    if (!transition) {
      await this.ledger.appendLog(event.loanId, {
        timestamp: event.occurredAt,
        actor: 'system',
        event: IGNOREDEVENT${event.type},
        details: No transition from state ${currentState}
      });
      return;
    }

    // Handle actions (disbursements, notifications, etc.)
    if (transition.actions) {
      for (const action of transition.actions) {
        await this.handleAction(action, loan, event);
      }
    }

    // Move to next state
    await this.ledger.updateState(event.loanId, transition.to);

    // Log transition
    await this.ledger.appendLog(event.loanId, {
      timestamp: event.occurredAt,
      actor: 'system',
      event: STATETRANSITION${currentState}TO${transition.to},
      details: Triggered by event ${event.type}
    });
  }

  private async handleAction(action: any, loan: any, event: WorkflowEvent) {
    switch (action.trigger) {
      case 'DISBURSEMENT_1':
        await this.disbursements.createDisbursement(
          loan.loan_id,
          'D1FILINGFEE'
        );
        await this.ledger.appendLog(loan.loan_id, {
          timestamp: event.occurredAt,
          actor: 'system',
          event: 'DISBURSEMENT1CREATED',
          details: 'Created filing fee disbursement'
        });
        break;

      case 'DISBURSEMENT_2':
        await this.disbursements.createDisbursement(
          loan.loan_id,
          'D2REMAININGFUNDS'
        );
        await this.ledger.appendLog(loan.loan_id, {
          timestamp: event.occurredAt,
          actor: 'system',
          event: 'DISBURSEMENT2CREATED',
          details: 'Created remaining funds disbursement'
        });
        break;

      default:
        await this.ledger.appendLog(loan.loan_id, {
          timestamp: event.occurredAt,
          actor: 'system',
          event: UNKNOWNACTION${action.trigger},
          details: ''
        });
    }
  }
}
`

---

🧩 What This Engine Actually Does

1. Loads your workflow spec
From config/workflows/founderloanv1.yaml.

2. Reads the current loan state
From the ledger.

3. Checks if the incoming event is valid
Based on the workflow transitions.

4. Applies actions
Such as:
- Creating disbursement records  
- Logging events  
- Triggering notifications (optional)

5. Moves the loan to the next state
And logs the transition.

6. Writes everything to the ledger
Ensuring a perfect audit trail.

---

