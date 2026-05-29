# E-Commerce Backend API

A simple e-commerce backend built using **Node.js**, **Express.js**, **Apollo GraphQL**, **PostgreSQL**, and **JWT Authentication**.

## Features

* GraphQL API using Apollo Server
* PostgreSQL database
* JWT-based authentication
* Product management
* Order management
* User registration and login
* Admin authorization for product management
* User-specific order access

---

## Tech Stack

* Node.js
* Express.js
* Apollo GraphQL
* PostgreSQL
* JWT (JSON Web Tokens)

---

## Live Deployment

### GraphQL Endpoint

```text
https://e-commerce-backend-jtgc.onrender.com/graphql
```

The API can be tested directly using Apollo Sandbox available at the endpoint above.

---

# Database Schema

The application uses four PostgreSQL tables:

## 1. Users

Stores registered users of the system.

| Column   | Type         | Description     |
| -------- | ------------ | --------------- |
| id       | SERIAL       | Primary Key     |
| username | VARCHAR(255) | Unique username |
| password | VARCHAR(255) | Password |

---

## 2. Products

Stores products available in the e-commerce system.

| Column              | Type          | Description         |
| ------------------- | ------------- | ------------------- |
| id                  | SERIAL        | Primary Key         |
| product_name        | VARCHAR(255)  | Product name        |
| product_price       | NUMERIC(10,2) | Product price       |
| product_description | TEXT          | Product description |

---

## 3. Orders

Stores order information placed by users.

| Column           | Type          | Description        |
| ---------------- | ------------- | ------------------ |
| id               | SERIAL        | Primary Key        |
| username         | VARCHAR(255)  | References Users   |
| customer_name    | VARCHAR(255)  | Customer name      |
| shipping_address | VARCHAR(255)  | Delivery address   |
| total            | NUMERIC(10,2) | Total order amount |

---

## 4. Order Items

Stores products included in each order.

| Column     | Type    | Description         |
| ---------- | ------- | ------------------- |
| id         | SERIAL  | Primary Key         |
| order_id   | INTEGER | References Orders   |
| product_id | INTEGER | References Products |
| quantity   | INTEGER | Quantity ordered    |

---

# Relationships

The database follows a many-to-many relationship between **Orders** and **Products**, implemented using the **Order_Items** table.

### User → Orders

* One user can place multiple orders.
* Each order belongs to exactly one user.

**Relationship:** One-to-Many (1:N)

### Orders ↔ Products

* An order can contain multiple products.
* A product can appear in multiple orders.

**Relationship:** Many-to-Many (M:N)

Implemented through the **Order_Items** junction table.

## Entity Relationship Diagram

```text
Users
  │
  │ 1 : N
  ▼
Orders
  │
  │ 1 : N
  ▼
Order_Items
  ▲
  │ N : 1
  │
Products
```

---

# Authentication & Authorization

This API uses JWT authentication.

## Regular User Access

Regular users can:

* Register
* Login
* Create orders
* View their own orders

### Register

```graphql
mutation {
  register(
    username: "john"
    password: "password123"
  )
}
```
Example Response:

```json
{
    "register": "Registration successful. Please Log in"
}
```

### Login

```graphql
mutation {
  login(
    username: "john"
    password: "password123"
  ) {
    token
    message
  }
}
```

Example Response:

```json
{
  "token": "JWT_TOKEN",
  "message": "Customer login successful"
}
```

Use the returned token in request headers:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## Admin Access

The following operations require administrator privileges:

* users
* createProduct
* updateProduct
* deleteProduct

### Admin Credentials

```text
Username: admin
Password: admin123
```

### Admin Login

```graphql
mutation {
  login(
    username: "admin"
    password: "admin123"
  ) {
    token
    message
  }
}
```

Use the returned JWT token for admin-only operations.

---

# GraphQL Schema

## Queries

### Get All Products

Public Query

```graphql
query {
  products {
    id
    product_name
    product_price
    product_description
  }
}
```

---

### Get Product By ID

Public Query

```graphql
query {
  productByID(product_id: 1) {
    id
    product_name
    product_price
    product_description
  }
}
```

---

### Get All Users

Admin Only

```graphql
query {
  users {
    id
    username
  }
}
```

---

### Get My Orders

Authenticated User Required

```graphql
query {
  myOrders {
    id
    username
    customer_name
    shipping_address
    total
    items {
      product_id
      quantity
    }
  }
}
```

---

### Get My Order By ID

Authenticated User Required

```graphql
query {
  myOrderByID(order_id: 1) {
    id
    username
    customer_name
    shipping_address
    total
    items {
      product_id
      quantity
    }
  }
}
```

---

# Mutations

## Register User

Public Mutation

```graphql
mutation {
  register(
    username: "john"
    password: "password123"
  )
}
```

---

## Login User

Public Mutation

```graphql
mutation {
  login(
    username: "john"
    password: "password123"
  ) {
    token
    message
  }
}
```

---

## Create Product

Admin Only

```graphql
mutation {
  createProduct(
    product_name: "Laptop"
    product_price: 59999
    product_description: "16GB RAM, 512GB SSD"
  ) {
    id
    product_name
    product_price
    product_description
  }
}
```

---

## Update Product

Admin Only

```graphql
mutation {
  updateProduct(
    product_id: 1
    product_price: 64999
  ) {
    id
    product_name
    product_price
    product_description
  }
}
```

---

## Delete Product

Admin Only

```graphql
mutation {
  deleteProduct(product_id: 1)
}
```

Response:

```json
true
```

---

## Create Order

Authenticated User Required

```graphql
mutation {
  createOrder(
    input: {
      customer_name: "John Doe"
      shipping_address: "New York"
      items: [
        {
          product_id: 1
          quantity: 2
        }
        {
          product_id: 2
          quantity: 1
        }
      ]
    }
  ) {
    id
    username
    customer_name
    shipping_address
    total
    items {
      product_id
      quantity
    }
  }
}
```