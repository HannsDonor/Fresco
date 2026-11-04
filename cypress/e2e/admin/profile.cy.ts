describe("Admin profile", () => {
  it("loads the fixture profile and audit history", () => {
    cy.intercept("GET", "/api/auth/profile").as("profile");
    cy.visitAdminPage("/admin/profile");
    cy.wait("@profile").its("response.statusCode").should("eq", 200);
    cy.contains("h1", "Profile Settings").should("be.visible");
    cy.get("#profile-name").should("have.value", "Cypress Test Admin");
    cy.get("#profile-username").should("have.value", "cypress_admin");
    cy.contains("Audit Log").should("be.visible");
  });

  it("updates the fixture name, username, and password, then restores them", () => {
    const updatedUsername = `cypress_admin_${Date.now()}`;
    const updatedPassword = "Cypress_New_Only_2026!";
    cy.visitAdminPage("/admin/profile");
    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      cy.get("#profile-name").clear().type("Cypress Updated Admin");
      cy.get("#profile-username").clear().type(updatedUsername);
      cy.get("#profile-current-password").type(adminPassword, { log: false });
      cy.get("#profile-new-password").type(updatedPassword, { log: false });
      cy.get("#profile-confirm-password").type(updatedPassword, { log: false });
      cy.contains("button", "Save Changes").click();
      cy.contains("Profile updated successfully.").should("be.visible");
      cy.reload();
      cy.get("#profile-name").should("have.value", "Cypress Updated Admin");
      cy.get("#profile-username").should("have.value", updatedUsername);

      cy.get("#profile-name").clear().type("Cypress Test Admin");
      cy.get("#profile-username").clear().type("cypress_admin");
      cy.get("#profile-current-password").type(updatedPassword, { log: false });
      cy.get("#profile-new-password").type(adminPassword, { log: false });
      cy.get("#profile-confirm-password").type(adminPassword, { log: false });
      cy.contains("button", "Save Changes").click();
      cy.contains("Profile updated successfully.").should("be.visible");
      cy.reload();
      cy.get("#profile-name").should("have.value", "Cypress Test Admin");
      cy.get("#profile-username").should("have.value", "cypress_admin");
    });
  });
});
