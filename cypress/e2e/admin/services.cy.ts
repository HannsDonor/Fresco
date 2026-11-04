describe("Admin service management", () => {
  it("creates, edits, toggles, and removes a synthetic service", () => {
    const serviceName = `Cypress Service ${Date.now()}`;
    const updatedName = `${serviceName} Edited`;
    cy.visitAdminPage("/admin/services");
    cy.get('[data-cy="services-manager"][data-ready="true"]').should("be.visible");
    cy.get('[data-cy="add-service"]').should("be.enabled").click();
    cy.get('[data-cy="service-form-modal"]').should("be.visible");
    cy.get('[data-cy="service-save"]').should("be.visible");
    cy.get('[data-cy="service-name"]').type(serviceName);
    cy.get('[data-cy="service-description"]').type("Created by a repeatable Cypress test.");
    cy.get('[data-cy="service-price"]').clear().type("85");
    cy.intercept("POST", "/api/admin/services").as("saveService");
    cy.get('[data-cy="service-save"]').click();
    cy.wait("@saveService").its("response.statusCode").should("eq", 200);
    cy.contains("Service saved successfully.").should("be.visible");

    cy.contains("tr", serviceName).within(() => cy.contains("button", "Edit").click());
    cy.get('[data-cy="service-name"]').clear().type(updatedName);
    cy.get('[data-cy="service-save"]').click();
    cy.contains("tr", updatedName).should("be.visible");
    cy.get(`[aria-label="Toggle ${updatedName} active"]`).filter(":visible").click();
    cy.contains(`${updatedName} is now inactive.`).should("be.visible");
    cy.get(`[aria-label="Toggle ${updatedName} active"]`).filter(":visible").click();
    cy.contains(`${updatedName} is now active.`).should("be.visible");

    cy.contains("tr", updatedName).as("serviceRow");
    cy.get("@serviceRow").within(() => cy.contains("button", "Delete").filter(":visible").click());
    cy.get("@serviceRow").within(() => cy.contains("button", "Delete").filter(":visible").last().click());
    cy.contains("tr", updatedName).should("not.exist");
  });
});
