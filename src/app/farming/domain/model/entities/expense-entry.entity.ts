import { BaseEntity } from '../../../../shared/domain/model/base-entity';
import { Money } from '../../../../shared/domain/model/money';

export enum ExpenseCategory {
  INPUTS = 'INPUTS', // seeds, fertilizers...
  LABOR = 'LABOR', // daily wages
  FREIGHT = 'FREIGHT',
}

/** One expense of the ledger. */
export class ExpenseEntry extends BaseEntity {
  private _ledgerId: number;
  private _category: ExpenseCategory;
  private _description: string;
  private _quantity: number;
  private _unitPrice: Money;
  private _expenseDate: Date;
  private _notes: string;
  private _clientSyncId: string;

  constructor(props: {
    id: number;
    ledgerId: number;
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: Money;
    expenseDate: Date;
    notes?: string;
    clientSyncId?: string;
  }) {
    super({ id: props.id });
    this._ledgerId = props.ledgerId;
    this._category = props.category;
    this._description = props.description;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._expenseDate = props.expenseDate;
    this._notes = props.notes ?? '';
    this._clientSyncId = props.clientSyncId ?? '';
  }

  get ledgerId(): number {
    return this._ledgerId;
  }

  set ledgerId(value: number) {
    this._ledgerId = value;
  }

  get category(): ExpenseCategory {
    return this._category;
  }

  set category(value: ExpenseCategory) {
    this._category = value;
  }

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get quantity(): number {
    return this._quantity;
  }

  set quantity(value: number) {
    this._quantity = value;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  set unitPrice(value: Money) {
    this._unitPrice = value;
  }

  get expenseDate(): Date {
    return this._expenseDate;
  }

  set expenseDate(value: Date) {
    this._expenseDate = value;
  }

  get notes(): string {
    return this._notes;
  }

  set notes(value: string) {
    this._notes = value;
  }

  /** Id created on the device when the expense is saved offline. */
  get clientSyncId(): string {
    return this._clientSyncId;
  }

  set clientSyncId(value: string) {
    this._clientSyncId = value;
  }

  /** quantity * unit price */
  total(): Money {
    return this._unitPrice.multiply(this._quantity);
  }
}
