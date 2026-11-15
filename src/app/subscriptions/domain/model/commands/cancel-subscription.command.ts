/** Stops the renewal of a paid plan; the access stays until the end date*/
export class CancelSubscriptionCommand {
  readonly subscriptionId: number;

  constructor(props: { subscriptionId: number }) {
    this.subscriptionId = props.subscriptionId;
  }
}
