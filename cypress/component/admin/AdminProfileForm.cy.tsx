import ProfileManager from "@/components/admin/ProfileManager";

describe("ProfileManager", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/auth/profile", {
      body: { success: true, admin: { name: "Cypress Test Admin", username: "cypress_admin" } },
    }).as("profile");
    cy.intercept("GET", "/api/admin/audit-logs?limit=50", {
      body: { success: true, logs: [] },
    }).as("auditLogs");
  });

  it("renders the loaded profile and an empty audit history", () => {
    cy.mount(<ProfileManager />);
    cy.wait(["@profile", "@auditLogs"]);

    cy.contains("h1", "Profile Settings").should("be.visible");
    cy.get("#profile-name").should("have.value", "Cypress Test Admin");
    cy.get("#profile-username").should("have.value", "cypress_admin");
    cy.contains("0 records").should("be.visible");
    cy.contains("No administrative changes recorded yet.").should("be.visible");
  });

  it("rejects mismatched new password fields before saving", () => {
    cy.mount(<ProfileManager />);
    cy.wait(["@profile", "@auditLogs"]);
    cy.get("#profile-current-password").type("current-password");
    cy.get("#profile-new-password").type("new-password-one");
    cy.get("#profile-confirm-password").type("different-password");
    cy.contains("button", "Save Changes").click();

    cy.get('[role="alert"]').should("contain.text", "New password and confirmation do not match.");
  });

  it("saves profile changes and refreshes the router", () => {
    const refresh = cy.stub().as("routerRefresh");
    cy.intercept("PATCH", "/api/auth/profile", {
      body: { success: true },
    }).as("saveProfile");
    cy.mount(<ProfileManager />, { router: { refresh } });
    cy.wait(["@profile", "@auditLogs"]);

    cy.get("#profile-name").clear().type("Maria Admin");
    cy.get("#profile-current-password").type("current-password");
    cy.contains("button", "Save Changes").click();

    cy.wait("@saveProfile").its("request.body").should("deep.equal", {
      name: "Maria Admin",
      username: "cypress_admin",
      currentPassword: "current-password",
    });
    cy.contains("Profile updated successfully.").should("be.visible");
    cy.get("@routerRefresh").should("have.been.calledOnce");
  });
});
