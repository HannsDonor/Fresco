describe("Admin payment management", () => {
  it("loads payment records, totals, and status and date filters", () => {
    cy.visitAdminPage("/admin/payments");
    cy.intercept({ method: "GET", pathname: "/api/admin/payments", query: {} }).as("payments");
    cy.wait("@payments").its("response.statusCode").should("eq", 200);
    cy.contains("h1", "Payments").should("be.visible");
    cy.contains("Records").should("be.visible");
    cy.contains("Collected").should("be.visible");
    cy.contains("Pending Amount").should("be.visible");

    cy.intercept({ method: "GET", pathname: "/api/admin/payments", query: { status: "Pending" } }).as("pending");
    cy.get('select[aria-label="Filter by payment status"]').select("Pending");
    cy.wait("@pending");
    cy.intercept({ method: "GET", pathname: "/api/admin/payments", query: { status: "Pending", date: "today" } }).as("today");
    cy.get('select[aria-label="Filter by date"]').select("today");
    cy.wait("@today");
  });

  it("marks a payment for a test booking as paid and verifies the saved status", () => {
    cy.createTestBooking().then(({ order_id, order_reference }) => {
      cy.visitAdminPage("/admin/payments");
      cy.request({
        method: "PATCH",
        url: `/api/admin/orders/${order_id}/payment`,
        body: { amount: 50, payment_method: "Cash", payment_status: "Pending" },
      }).its("status").should("eq", 200);

      cy.intercept("PATCH", "/api/admin/payments/*").as("markPaid");
      cy.get('[data-cy="payments-search"]').type(order_reference);
      cy.contains("tr", order_reference).contains("button", "Mark Paid").click();
      cy.wait("@markPaid").its("response.statusCode").should("eq", 200);
      cy.contains("Payment marked as Paid.").should("be.visible");
      cy.contains("tr", order_reference).should("contain.text", "Paid");
    });
  });
});
