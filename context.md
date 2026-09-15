# FRESCO – SMART LAUNDRY MANAGEMENT SYSTEM
## Project Context for OpenCode

---

# 1. PROJECT OVERVIEW

Fresco is a web-based laundry management system designed for a small/local laundry business.

The system helps the laundry shop manage:

- Customer laundry requests
- Laundry orders
- Order status
- Pickup schedules
- Services offered
- Payments
- Shop information
- Customer order tracking
- Admin dashboard

The main problem being solved is the use of manual logbooks, paper records, and messaging to manage laundry orders. These methods can cause:

- Lost or incomplete records
- Difficulty tracking order status
- Missed customer updates
- Difficulty checking daily orders
- Difficulty monitoring payments
- Disorganized laundry records

Fresco centralizes these processes into one system.

IMPORTANT:

This is a LOCAL laundry management system.

There is NO delivery feature.

Laundry orders are for CUSTOMER PICKUP only.

---

# 2. MAIN USERS

There are only TWO types of system users:

## Customer

Customers do NOT create accounts.

Customers can:

- Visit the public landing page
- View laundry services
- Submit a laundry booking/request
- Provide their contact information
- Select a laundry service
- Provide laundry details
- Select preferred pickup date/time
- Receive an order reference
- Receive a tracking token
- Track their laundry order through a public tracking page

Customers cannot:

- Log into an account
- Change order status
- Access the admin dashboard
- Modify orders directly
- Manage services
- Manage payments

Customer tracking is done through a unique tracking token/link.

Example:

/track/TRK-VJ7RW2

---

## Admin / Owner

There is ONLY ONE internal role:

ADMIN / OWNER

The Admin/Owner can:

- Log in
- View dashboard
- View orders
- Accept orders
- Update laundry status
- View customer information
- Manage services
- Manage shop information
- Record payments
- View payment status
- View order history
- Monitor daily laundry orders

Do NOT create separate Staff, Manager, or Employee roles unless explicitly requested.

---

# 3. TECHNOLOGY STACK

Frontend / Full-stack framework:

- Next.js

Database:

- MySQL

Local database environment:

- XAMPP
- MySQL
- localhost

Database name:

fresco_laundry

The application should use Next.js server-side/API functionality to communicate with MySQL.

IMPORTANT:

DO NOT connect directly to MySQL from client-side React components.

Preferred architecture:

Browser
    ↓
Next.js frontend
    ↓
Next.js API routes / server-side logic
    ↓
MySQL
    ↓
XAMPP

---

# 4. SYSTEM ARCHITECTURE

The system follows a simple web application architecture.

```text
                    ┌─────────────────────┐
                    │      CUSTOMER       │
                    │                     │
                    │ Landing Page        │
                    │ Booking Form        │
                    │ Tracking Page       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      NEXT.JS        │
                    │                     │
                    │ Public Frontend     │
                    │ Admin Frontend      │
                    │ API Routes          │
                    │ Server Logic        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       MYSQL         │
                    │   fresco_laundry    │
                    │                     │
                    │ admins              │
                    │ customers           │
                    │ services_offered    │
                    │ shop_information    │
                    │ laundry_orders      │
                    │ order_items         │
                    │ payments            │
                    │ order_status_history│
                    └──────────┬──────────┘
                               ▲
                               │
                    ┌──────────┴──────────┐
                    │    ADMIN / OWNER    │
                    │                     │
                    │ Dashboard           │
                    │ Orders              │
                    │ Services            │
                    │ Payments            │
                    │ Shop Information    │
                    └─────────────────────┘