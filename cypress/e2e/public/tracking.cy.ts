describe("Order tracking", () => {
  it("loads the booked order and displays its status", () => {
    cy.createTestBooking().then(({ tracking_token, order_reference }) => {
      cy.intercept("GET", `/api/tracking/${tracking_token}`).as("tracking");
      cy.visit(`/track/${tracking_token}`);
      cy.wait("@tracking").its("response.statusCode").should("eq", 200);
      cy.contains(order_reference).should("be.visible");
      cy.contains("Request Received").should("be.visible");
      cy.contains("Pending").should("be.visible");
    });
  });

  it("shows an error for an unknown tracking token", () => {
    cy.visit("/track/TRK-INVALID9");
    cy.get('[data-cy="tracking-view"][data-ready="true"]').should("be.visible");
    cy.contains("h1", "Order not found").should("be.visible");
  });

  it("requires a valid token to look up an order", () => {
    cy.visit("/tracking");
    cy.get('[data-cy="tracking-form"][data-ready="true"]').should("be.visible");
    cy.get('[data-cy="tracking-input"]').type("INVALID9");
    cy.get('[data-cy="tracking-submit"]').click();
    cy.location("pathname").should("eq", "/track/TRK-INVALID9");
    cy.get('[data-cy="tracking-view"][data-ready="true"]').should("be.visible");
    cy.contains("h1", "Order not found").should("be.visible");
  });
});
