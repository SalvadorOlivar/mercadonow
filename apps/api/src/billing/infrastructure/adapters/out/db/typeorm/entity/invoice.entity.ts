import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "invoices" })
@Index("invoices_order_id_idx", ["orderId"])
@Check("invoices_total_amount_check", "total_amount >= 0")
@Check("invoices_currency_check", "currency IN ('ARS', 'USD', 'EUR')")
@Check(
  "invoices_status_check",
  "status IN ('DRAFT', 'ISSUED', 'PAID', 'CANCELLED')",
)
export class InvoiceEntity {
  @PrimaryColumn({ type: "uuid" })
  declare id: string;

  @Column({ name: "order_id", type: "uuid" })
  declare orderId: string;

  @Column({ name: "payment_id", type: "uuid", unique: true })
  declare paymentId: string;

  @Column({ name: "total_amount", type: "bigint" })
  declare totalAmount: string;

  @Column({ type: "text" })
  declare currency: string;

  @Column({ type: "text" })
  declare status: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  declare createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  declare updatedAt: Date;
}
