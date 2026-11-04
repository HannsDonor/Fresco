describe("Admin dashboard", () => {
  it("loads the summary, status overview, latest orders, and pickup schedule", () => {
    cy.intercept("GET", "/api/admin/dashboard").as("dashboard");
    cy.visitAdminPage("/admin");
    cy.wait("@dashboard").its("response.statusCode").should("eq", 200);

    cy.contains("h1", "Dashboard").should("be.visible");
    cy.contains("Total Orders").should("be.visible");
    cy.contains("Pending Orders").should("be.visible");
    cy.contains("Order Status Overview").should("be.visible");
    cy.contains("Recent Orders").should("be.visible");
    cy.contains("Today's Pickup Schedule").should("be.visible");
  });
});
