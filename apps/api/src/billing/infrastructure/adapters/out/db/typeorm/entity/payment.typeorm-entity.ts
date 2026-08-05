import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "payments" })
@Index("payments_order_id_idx", ["orderId"])
@Index("payments_provider_reference_uq", ["providerReference"], {
  unique: true,
  where: "provider_reference IS NOT NULL",
})
@Index("payments_one_active_per_order_uq", ["orderId"], {
  unique: true,
  where: "status IN ('PENDING', 'AUTHORIZED')",
})
@Check("payments_amount_check", "amount >= 0")
@Check("payments_currency_check", "currency IN ('ARS', 'USD', 'EUR')")
@Check(
  "payments_status_check",
  "status IN ('PENDING', 'AUTHORIZED', 'FAILED', 'REFUNDED')",
)
export class PaymentTypeOrmEntity {
  @PrimaryColumn({ type: "uuid" })
  declare id: string;

  @Column({ name: "order_id", type: "uuid" })
  declare orderId: string;

  @Column({ type: "bigint" })
  declare amount: string;

  @Column({ type: "text" })
  declare currency: string;

  @Column({ type: "text" })
  declare status: string;

  @Column({ name: "provider_reference", type: "text", nullable: true })
  declare providerReference: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  declare createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  declare updatedAt: Date;
}
