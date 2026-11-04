describe("Admin order management", () => {
  it("searches for a newly created test booking and opens its details", () => {
    cy.createTestBooking().then(({ order_reference }) => {
      cy.intercept("GET", /\/api\/admin\/orders\?/).as("orders");
      cy.visitAdminPage("/admin/orders");
      cy.wait("@orders").its("response.statusCode").should("eq", 200);
      cy.get('[data-cy="orders-search"]').type(order_reference);
      cy.get('[data-cy="orders-table"]').contains(order_reference).should("be.visible").click();
      cy.contains("h2", "Order Details").should("be.visible");
      cy.contains(order_reference).should("be.visible");
    });
  });

  it("supports the order status filter", () => {
    cy.visitAdminPage("/admin/orders");
    cy.get('[data-cy="orders-manager"][data-ready="true"]').should("be.visible");
    cy.intercept({ method: "GET", pathname: "/api/admin/orders", query: { status: "Pending" } }).as("pending");
    cy.get('select[aria-label="Filter by status"]').select("Pending");
    cy.wait("@pending");

    cy.intercept({ method: "GET", pathname: "/api/admin/orders", query: { status: "Pending", date: "today" } }).as("today");
    cy.get('select[aria-label="Filter by date"]').select("today");
    cy.wait("@today");
    cy.intercept({ method: "GET", pathname: "/api/admin/orders", query: { status: "Pending", date: "today", payment: "Paid" } }).as("payment");
    cy.get('select[aria-label="Filter by payment status"]').select("Paid");
    cy.wait("@payment");
  });
});
