Customer
Merchant
Product
Order
OrderItem
Payment
Invoice
InvoiceItem
Refund

Para el MVP empezar con:
Customer
Order
OrderItem
Payment
Invoice
InvoiceItem

Happy Path:
Customer
    │
    │ Create Order
    ▼
Order
    │
    │ Process Payment
    ▼
Payment
    │
    │ Payment Successful
    ▼
Invoice
    │
    │ Invoice Created
    ▼
COMPLETED

## Estados

### Order
PENDING_PAYMENT
PAID
CANCELLED
COMPLETED

### Payment
PENDING
AUTHORIZED
FAILED
REFUNDED

### Invoice
DRAFT
ISSUED
PAID
CANCELLED