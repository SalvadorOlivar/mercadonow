import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBillingTables1754352000000 implements MigrationInterface {
  name = "CreateBillingTables1754352000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE orders (
        id uuid PRIMARY KEY,
        customer_id uuid NOT NULL,
        merchant_id uuid NOT NULL,
        delivery_address text NOT NULL CHECK (length(trim(delivery_address)) > 0),
        status text NOT NULL CHECK (
          status IN ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'COMPLETED')
        ),
        total_amount bigint NOT NULL CHECK (total_amount >= 0),
        currency text NOT NULL CHECK (currency IN ('ARS', 'USD', 'EUR')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE order_items (
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        position integer NOT NULL CHECK (position >= 0),
        product_id text NOT NULL CHECK (length(trim(product_id)) > 0),
        quantity integer NOT NULL CHECK (quantity > 0),
        unit_price_amount bigint NOT NULL CHECK (unit_price_amount >= 0),
        currency text NOT NULL CHECK (currency IN ('ARS', 'USD', 'EUR')),
        PRIMARY KEY (order_id, position)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE payments (
        id uuid PRIMARY KEY,
        order_id uuid NOT NULL REFERENCES orders(id),
        amount bigint NOT NULL CHECK (amount >= 0),
        currency text NOT NULL CHECK (currency IN ('ARS', 'USD', 'EUR')),
        status text NOT NULL CHECK (
          status IN ('PENDING', 'AUTHORIZED', 'FAILED', 'REFUNDED')
        ),
        provider_reference text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX payments_order_id_idx ON payments(order_id)");
    await queryRunner.query(`
      CREATE UNIQUE INDEX payments_provider_reference_uq
        ON payments(provider_reference)
        WHERE provider_reference IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE TABLE invoices (
        id uuid PRIMARY KEY,
        order_id uuid NOT NULL REFERENCES orders(id),
        payment_id uuid NOT NULL UNIQUE REFERENCES payments(id),
        total_amount bigint NOT NULL CHECK (total_amount >= 0),
        currency text NOT NULL CHECK (currency IN ('ARS', 'USD', 'EUR')),
        status text NOT NULL CHECK (
          status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED')
        ),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX invoices_order_id_idx ON invoices(order_id)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE invoices");
    await queryRunner.query("DROP TABLE payments");
    await queryRunner.query("DROP TABLE order_items");
    await queryRunner.query("DROP TABLE orders");
  }
}
