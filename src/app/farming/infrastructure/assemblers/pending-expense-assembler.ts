import { fromApiDate, toApiDate } from '../../../shared/infrastructure/api-date';
import { PendingOperation, PendingOperationType } from '../offline/pending-operation';
import { RecordDailyLaborExpenseCommand } from '../../domain/model/commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../../domain/model/commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../../domain/model/commands/record-input-expense.command';
import { ExpenseCategory } from '../../domain/model/entities/expense-entry.entity';

/** Any of the three expense commands of the cost ledger. */
export type ExpenseCommand =
  RecordInputExpenseCommand | RecordDailyLaborExpenseCommand | RecordFieldFreightExpenseCommand;

/** An expense command as it is kept on the device (dates as `YYYY-MM-DD`). */
export type PendingExpensePayload =
  | {
      category: ExpenseCategory.INPUTS;
      ledgerId: number;
      clientSyncId: string;
      expenseDate: string;
      inputName: string;
      quantity: number;
      unitPrice: number;
    }
  | {
      category: ExpenseCategory.LABOR;
      ledgerId: number;
      clientSyncId: string;
      expenseDate: string;
      activity: string;
      workers: number;
      days: number;
      dailyWage: number;
    }
  | {
      category: ExpenseCategory.FREIGHT;
      ledgerId: number;
      clientSyncId: string;
      expenseDate: string;
      route: string;
      cost: number;
    };

/**
 * Maps the expense commands recorded without connection to the operations that
 * `OfflineSync` keeps on the device, and back.
 */
export class PendingExpenseAssembler {
  /**
   * Converts an expense command to a pending operation.
   * @param command - The expense recorded without connection.
   */
  toOperation = (command: ExpenseCommand): PendingOperation<PendingExpensePayload> => ({
    uuid: command.clientSyncId,
    type: PendingOperationType.FIELD_EXPENSE,
    payload: this.toPayload(command),
    createdAt: new Date().toISOString(),
  });

  /**
   * Converts a pending operation back to its expense command.
   * @param operation - Operation kept on the device.
   */
  toCommand = (operation: PendingOperation<PendingExpensePayload>): ExpenseCommand => {
    const record = operation.payload;
    const expenseDate = fromApiDate(record.expenseDate);
    switch (record.category) {
      case ExpenseCategory.INPUTS:
        return new RecordInputExpenseCommand({ ...record, expenseDate });
      case ExpenseCategory.LABOR:
        return new RecordDailyLaborExpenseCommand({ ...record, expenseDate });
      case ExpenseCategory.FREIGHT:
        return new RecordFieldFreightExpenseCommand({ ...record, expenseDate });
    }
  };

  private toPayload(command: ExpenseCommand): PendingExpensePayload {
    const base = {
      ledgerId: command.ledgerId,
      clientSyncId: command.clientSyncId,
      expenseDate: toApiDate(command.expenseDate),
    };
    if (command instanceof RecordInputExpenseCommand) {
      return {
        ...base,
        category: ExpenseCategory.INPUTS,
        inputName: command.inputName,
        quantity: command.quantity,
        unitPrice: command.unitPrice,
      };
    }
    if (command instanceof RecordDailyLaborExpenseCommand) {
      return {
        ...base,
        category: ExpenseCategory.LABOR,
        activity: command.activity,
        workers: command.workers,
        days: command.days,
        dailyWage: command.dailyWage,
      };
    }
    return { ...base, category: ExpenseCategory.FREIGHT, route: command.route, cost: command.cost };
  }
}
