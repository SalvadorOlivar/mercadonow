export class InvalidStateTransitionError extends Error {
  readonly code = "INVALID_STATE_TRANSITION";

  constructor(entity: string, from: string, to: string) {
    super(`${entity} cannot transition from ${from} to ${to}`);
    this.name = "InvalidStateTransitionError";
  }
}

