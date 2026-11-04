import { createdTestOrderIds } from "../../support/test-state";

function futureDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

describe("Laundry booking", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/services").as("services");
    cy.intercept("GET", "/api/shop-information").as("shopInformation");
    cy.visit("/book");
    cy.wait("@services");
    cy.wait("@shopInformation");
    cy.get('[data-cy="booking-wizard"][data-ready="true"]').should("be.visible");
  });

  it("validates required customer fields and rejects an invalid phone number", () => {
    cy.get('[data-cy="booking-continue"]').click();
    cy.contains("Please enter your full name.").should("be.visible");
    cy.contains("Please enter your contact number.").should("be.visible");
    cy.contains("Please enter your address.").should("be.visible");

    cy.get('[data-cy="booking-name"]').type("Cypress Invalid Phone");
    cy.get('[data-cy="booking-phone"]').type("123");
    cy.get('[data-cy="booking-address"]').type("1 Cypress Test Street");
    cy.get('[data-cy="booking-continue"]').click();
    cy.contains("Enter a valid Philippine mobile number").should("be.visible");
    cy.location("pathname").should("eq", "/book");
  });

  it("submits a real booking and shows its confirmation and tracking token", () => {
    const customerName = `Cypress UI ${Date.now()}`;
    cy.intercept("POST", "/api/orders").as("createOrder");
    cy.get('[data-cy="booking-name"]').type(customerName);
    cy.get('[data-cy="booking-phone"]').type("9171234567");
    cy.get('[data-cy="booking-address"]').type("1 Cypress Test Street");
    cy.get('[data-cy="booking-continue"]').click();

    cy.get('[data-cy="service-option"]').first().click();
    cy.get('[data-cy="load-type-Medium"]').click();
    cy.get('[data-cy="booking-continue"]').click();

    cy.get('[data-cy="fulfillment-Pickup"]').click();
    cy.get('[data-cy="payment-Cash"]').click();
    cy.get('[data-cy="pickup-date"]').clear().type(futureDate(2));
    cy.get('[data-cy="pickup-time-slot"]').first().click();
    cy.get('[data-cy="booking-continue"]').click();

    cy.contains("h1", "Review Your Order").should("be.visible");
    cy.get('[data-cy="booking-submit"]').click();
    cy.wait("@createOrder").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.tracking_token).to.match(/^TRK-[A-Z0-9]{6}$/);
      createdTestOrderIds.push(response?.body.order_id);
    });

    cy.contains("h1", "Laundry Request Submitted!").should("be.visible");
    cy.contains(customerName).should("be.visible");
    cy.contains(/^TRK-[A-Z0-9]{6}$/).should("be.visible");
    cy.get('a[href^="/track/TRK-"]').should("be.visible");
  });
});
