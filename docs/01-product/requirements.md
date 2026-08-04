# Requirements

UC-001 Create Order
UC-002 Get Order
UC-003 Process Payment
UC-004 Create Invoice
UC-005 Get Invoice
UC-006 Request Refund
UC-007 Get Refund

## UC-001 Create Order

### Description

A customer creates an order containing one or more products
from a merchant.

### Input

- Customer ID
- Merchant ID
- Products
- Delivery address

### Output

- Order ID
- Order status
- Total amount

### Initial Status

PENDING_PAYMENT

Order
   │
   ▼
Payment
   │
   ▼
Invoice
   │
   ▼
Refund