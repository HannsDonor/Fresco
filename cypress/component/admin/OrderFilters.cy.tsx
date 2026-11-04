import OrdersManager from "@/components/admin/OrdersManager";

describe("OrdersManager filters", () => {
  it("sends status and payment filters to the orders API", () => {
    cy.intercept("GET", "**/api/admin/orders?*", { body: { success: true, orders: [] } }).as("orders");
    cy.mount(<OrdersManager />);
    cy.wait("@orders");
    cy.get('[data-cy="orders-manager"][data-ready="true"]').should("be.visible");

    cy.get('select[aria-label="Filter by status"]').select("Accepted");
    cy.wait("@orders").its("request.url").should("include", "status=Accepted");
    cy.get('select[aria-label="Filter by payment status"]').select("Unpaid");
    cy.wait("@orders").its("request.url").should("include", "payment=Unpaid");
  });

  it("shows an empty state when no orders match the search", () => {
    cy.intercept("GET", "**/api/admin/orders?*", { body: { success: true, orders: [] } }).as("orders");
    cy.mount(<OrdersManager />);
    cy.wait("@orders");
    cy.get('[data-cy="orders-search"]').type("FRC-NOT-FOUND");
    cy.wait("@orders").its("request.url").should("include", "q=FRC-NOT-FOUND");
    cy.contains("No orders found").should("be.visible");
  });
});
