import type { MigrationInterface, QueryRunner } from "typeorm";

export class OneActivePaymentPerOrder1754352001000
  implements MigrationInterface
{
  name = "OneActivePaymentPerOrder1754352001000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX payments_one_active_per_order_uq
        ON payments(order_id)
        WHERE status IN ('PENDING', 'AUTHORIZED')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX payments_one_active_per_order_uq");
  }
}
