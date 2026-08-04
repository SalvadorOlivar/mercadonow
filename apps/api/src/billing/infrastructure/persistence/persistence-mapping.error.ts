export class PersistenceMappingError extends Error {
  readonly code = "PERSISTENCE_MAPPING_ERROR";

  constructor(
    readonly source: string,
    readonly field: string,
    reason: string,
    options?: ErrorOptions,
  ) {
    super(`Invalid persisted value for ${source}.${field}: ${reason}`, options);
    this.name = "PersistenceMappingError";
  }
}
