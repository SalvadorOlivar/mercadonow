import { v7 } from "uuid";

import type { IdGenerator } from "../../../../application/ports/out/id-generator.port";

export class UuidV7IdGenerator<TId extends string>
  implements IdGenerator<TId>
{
  constructor(private readonly toId: (value: string) => TId) {}

  generate(): TId {
    return this.toId(v7());
  }
}
