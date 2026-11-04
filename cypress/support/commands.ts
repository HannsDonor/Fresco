/// <reference types="cypress" />

import { createdTestOrderIds } from "./test-state";

Cypress.Commands.add("loginAsAdmin", () => {
  cy.env(["adminUsername", "adminPassword"]).then(({ adminUsername, adminPassword }) => {
    cy.session(
      ["cypress-admin", adminUsername],
      () => {
        cy.request({
          method: "POST",
          url: "/api/auth/login",
          body: { username: adminUsername, password: adminPassword },
        }).its("status").should("eq", 200);
      },
      {
        validate() {
          cy.request("/api/auth/profile").its("status").should("eq", 200);
        },
      }
    );
  });
});

Cypress.Commands.add("visitAdminPage", (path: string) => {
  cy.loginAsAdmin();
  cy.visit(path);
});

Cypress.Commands.add("logoutAdmin", () => {
  cy.request("POST", "/api/auth/logout").its("status").should("eq", 200);
  cy.request({ url: "/api/auth/profile", failOnStatusCode: false })
    .its("status")
    .should("eq", 401);
  cy.visit("/admin/orders");
  cy.location("pathname").should("eq", "/admin/login");
});

Cypress.Commands.add("createTestBooking", () => {
  const pickupDate = new Date();
  pickupDate.setDate(pickupDate.getDate() + 2);
  const date = [
    pickupDate.getFullYear(),
    String(pickupDate.getMonth() + 1).padStart(2, "0"),
    String(pickupDate.getDate()).padStart(2, "0"),
  ].join("-");
  const unique = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

  cy.fixture("booking").then((booking) =>
    cy.request("GET", "/api/services").then(({ body }) => {
      const service = body.services.find(
        (item: { name: string }) => item.name === "Cypress Test Service"
      ) ?? body.services[0];
      if (!service) throw new Error("There is no active service for the test booking.");
      return cy.request({
        method: "POST",
        url: "/api/orders",
        body: {
          ...booking,
          name: `Cypress Customer ${unique}`,
          service_id: service.service_id,
          pickup_date: date,
        },
      });
    })
  ).then(({ body }) => {
    createdTestOrderIds.push(body.order_id);
    return body;
  });
});

declare global {
  // Cypress custom commands are augmented through its namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      visitAdminPage(path: string): Chainable<void>;
      logoutAdmin(): Chainable<void>;
      createTestBooking(): Chainable<{
        order_id: number;
        order_reference: string;
        tracking_token: string;
      }>;
      cleanupTestBooking(orderId: number): Chainable<null>;
    }
  }
}

export {};
