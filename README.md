This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## End-to-end tests

Cypress E2E tests run against a separate MySQL database named `fresco_laundry_test`. They never point the app at the normal `DB_NAME`. The setup script reads only the `CREATE TABLE` and `ALTER TABLE` statements from `fresco_laundry.sql`; it does not import the dump's customer, order, admin, or shop records. It creates a synthetic shop, service, and admin for the tests. The Cypress helper removes each synthetic booking after its test.

Ensure the local MySQL server is running and the DB connection values in `.env.local` are valid. The E2E scripts use `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD` from `.env.local` (the application default port is `3306`). Only `DB_NAME` is overridden to `fresco_laundry_test`. The database user needs permission to create `fresco_laundry_test` and its tables.

The seeded login is test-only (`cypress_admin` / `Cypress_Test_Only_2026!`) and exists only in `fresco_laundry_test`. Do not reuse it outside local tests.

```powershell
# Prepare the isolated test database and run the suite headlessly
npm run test:e2e

# Open Cypress interactively (also prepares the test database and starts Next.js)
npm run cy:open
```

`npm run cy:run` also prepares the database and starts the test server before running Cypress. Screenshots are captured under `cypress/screenshots` when a test fails.

## Component tests

Cypress component tests mount React components in a real browser using the Next.js Webpack adapter. They do not start the application server or connect to MySQL.

```powershell
# Open Cypress and choose Component Testing
npm run cy:component:open

# Run component specs headlessly
npm run cy:component:run
```

Component specs live in `cypress/component`. Current coverage includes service form validation and requests, plus order and payment status badges.

## QR image storage

In local development, uploaded GCash QR images are stored under `public/images/gcash` and served as static files. On Vercel, uploads use Vercel Blob; create a Blob store from the project's **Storage** tab and connect it to the project so Vercel adds `BLOB_READ_WRITE_TOKEN` to the deployment environment. The QR image is public because customers need to view it during booking. Do not commit uploaded QR files.
