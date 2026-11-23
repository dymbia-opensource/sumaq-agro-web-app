import { Money } from '../../../shared/domain/model/money';
import { fromApiDate, toApiDate } from '../../../shared/infrastructure/api-date';
import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { RecordDailyLaborExpenseCommand } from '../../domain/model/commands/record-daily-labor-expense.command';
import { RecordFieldFreightExpenseCommand } from '../../domain/model/commands/record-field-freight-expense.command';
import { RecordInputExpenseCommand } from '../../domain/model/commands/record-input-expense.command';
import { CampaignLedger, YieldUnit } from '../../domain/model/entities/campaign-ledger.entity';
import { ExpenseCategory, ExpenseEntry } from '../../domain/model/entities/expense-entry.entity';
import { RecordDailyLaborExpenseRequest } from '../requests/record-daily-labor-expense.request';
import { RecordFieldFreightExpenseRequest } from '../requests/record-field-freight-expense.request';
import { RecordInputExpenseRequest } from '../requests/record-input-expense.request';
import {
  CampaignLedgerResource,
  CampaignLedgersResponse,
  ExpenseEntryResource,
} from '../responses/campaign-ledgers-response';

/**
 * Maps cost ledger entities (and their expenses) to and from API resources,
 * and the expense commands to the requests of the API.
 */
export class CampaignLedgerAssembler implements BaseAssembler<
  CampaignLedger,
  CampaignLedgerResource,
  CampaignLedgersResponse
> {
  /**
   * Converts a CampaignLedgersResponse to an array of CampaignLedger entities.
   * @param response - The API response containing ledgers.
   * @returns An array of CampaignLedger entities.
   */
  toEntitiesFromResponse = (response: CampaignLedgersResponse): CampaignLedger[] =>
    response.ledgers.map((resource) => this.toEntityFromResource(resource));

  /**
   * Converts a CampaignLedgerResource to a CampaignLedger entity.
   * @param resource - The resource to convert.
   * @returns The converted CampaignLedger entity.
   */
  toEntityFromResource = (resource: CampaignLedgerResource): CampaignLedger =>
    new CampaignLedger({
      id: resource.id,
      campaignId: resource.cropCampaignId,
      entries: (resource.entries ?? []).map((entry) =>
        this.toExpenseEntry(entry, resource.id, resource.currency),
      ),
      expectedYield: resource.expectedYield ?? 0,
      actualYield: resource.actualYield,
      yieldUnit: resource.yieldUnit as YieldUnit,
      frozen: resource.frozen,
      currency: resource.currency,
    });

  /**
   * Converts a CampaignLedger entity to a CampaignLedgerResource.
   * @param entity - The entity to convert.
   * @returns The converted CampaignLedgerResource.
   */
  toResourceFromEntity = (entity: CampaignLedger): CampaignLedgerResource => ({
    id: entity.id as number,
    cropCampaignId: entity.campaignId,
    yieldUnit: entity.yieldUnit,
    expectedYield: entity.expectedYield,
    actualYield: entity.actualYield,
    frozen: entity.frozen,
    currency: entity.currency,
    totalInvestment: entity.totalInvestment().amount,
    breakevenPrice: entity.breakevenPrice().amount,
    entries: entity.entries.map((entry) => this.toExpenseResource(entry)),
  });

  /**
   * Converts an input expense command into its request.
   * @param command - Input bought (US-37).
   */
  toInputExpenseRequestFromCommand = (
    command: RecordInputExpenseCommand,
  ): RecordInputExpenseRequest => ({
    inputName: command.inputName.trim(),
    quantity: command.quantity,
    unitPrice: command.unitPrice,
    expenseDate: toApiDate(command.expenseDate),
    clientSyncId: command.clientSyncId,
  });

  /**
   * Converts a daily labor expense command into its request.
   * @param command - Wages of a field activity (US-38).
   */
  toDailyLaborExpenseRequestFromCommand = (
    command: RecordDailyLaborExpenseCommand,
  ): RecordDailyLaborExpenseRequest => ({
    activity: command.activity.trim(),
    workers: command.workers,
    days: command.days,
    dailyWage: command.dailyWage,
    expenseDate: toApiDate(command.expenseDate),
    clientSyncId: command.clientSyncId,
  });

  /**
   * Converts a field freight expense command into its request.
   * @param command - Cost of one freight (US-39).
   */
  toFieldFreightExpenseRequestFromCommand = (
    command: RecordFieldFreightExpenseCommand,
  ): RecordFieldFreightExpenseRequest => ({
    route: command.route.trim(),
    cost: command.cost,
    expenseDate: toApiDate(command.expenseDate),
    clientSyncId: command.clientSyncId,
  });

  /**
   * Converts an ExpenseEntryResource to an ExpenseEntry entity.
   * @param resource - The expense as the API sends it.
   * @param ledgerId - Ledger that owns the expense.
   * @param currency - Currency of the ledger.
   */
  private toExpenseEntry = (
    resource: ExpenseEntryResource,
    ledgerId: number,
    currency: string,
  ): ExpenseEntry =>
    new ExpenseEntry({
      id: resource.id,
      ledgerId,
      category: resource.category as ExpenseCategory,
      description: resource.description,
      quantity: resource.quantity,
      unitPrice: new Money(resource.unitPrice, currency),
      expenseDate: fromApiDate(resource.expenseDate),
      notes: resource.notes ?? undefined,
      clientSyncId: resource.clientSyncId ?? undefined,
    });

  /**
   * Converts an ExpenseEntry entity to an ExpenseEntryResource.
   * @param entry - The expense to convert.
   */
  private toExpenseResource = (entry: ExpenseEntry): ExpenseEntryResource => ({
    id: entry.id as number,
    category: entry.category,
    description: entry.description,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice.amount,
    total: entry.total().amount,
    expenseDate: toApiDate(entry.expenseDate),
    notes: entry.notes || null,
    clientSyncId: entry.clientSyncId || null,
  });
}
