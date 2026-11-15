import { YieldUnit } from '../entities/campaign-ledger.entity';

/**
 * Sets the yield the producer expects to harvest.
 */
export class SetExpectedYieldCommand {
  readonly ledgerId: number;
  readonly expectedYield: number;
  readonly unit: YieldUnit;

  constructor(props: { ledgerId: number; expectedYield: number; unit: YieldUnit }) {
    this.ledgerId = props.ledgerId;
    this.expectedYield = props.expectedYield;
    this.unit = props.unit;
  }
}
