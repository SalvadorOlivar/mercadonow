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

## Contrato público

Los estados anteriores y las monedas permitidas tienen una única fuente de
verdad en `@mercadonow/shared`. Los importes se representan como enteros seguros
no negativos en la unidad mínima de la moneda. Los identificadores públicos de
agregados son UUID v7 y se convierten a tipos nominales distintos dentro de la
aplicación.

Las órdenes admiten entre 1 y 100 items. La dirección tiene un máximo de 500
caracteres; el identificador de producto, 100; y la cantidad de cada item debe
estar entre 1 y 2.147.483.647. La frontera HTTP y el dominio aplican estas
reglas desde las constantes compartidas. El contrato HTTP completo y su política
de cambios están en [api-contract.md](./api-contract.md).
