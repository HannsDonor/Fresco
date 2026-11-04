describe("Admin authentication", () => {
  it("blocks admin pages until signed in and leaves public routes available", () => {
    cy.visit("/admin/orders");
    cy.location("pathname").should("eq", "/admin/login");
    cy.visit("/");
    cy.contains("h1", "Made Simple.").should("be.visible");
  });

  it("rejects invalid credentials", () => {
    cy.visit("/admin/login");
    cy.get('[data-cy="login-form"][data-ready="true"]').should("be.visible");
    cy.get('[data-cy="username"]').type("cypress_admin");
    cy.get('[data-cy="password"]').type("not-the-test-password");
    cy.get('[data-cy="login-button"]').click();
    cy.get('[role="alert"]').should("contain.text", "Invalid credentials.");
    cy.location("pathname").should("eq", "/admin/login");
  });

  it("logs in with the test fixture and issues a one-hour session cookie", () => {
    cy.env(["adminUsername", "adminPassword"]).then(({ adminUsername, adminPassword }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/login",
        body: { username: adminUsername, password: adminPassword },
      }).then((response) => {
        expect(response.status).to.eq(200);
        const setCookie = response.headers["set-cookie"];
        expect(Array.isArray(setCookie) ? setCookie.join("; ") : setCookie).to.include("Max-Age=3600");
      });
    });
    cy.clearCookie("fresco_admin_session");

    cy.loginAsAdmin();
    cy.visit("/admin");
    cy.contains("h1", "Dashboard").should("be.visible");
    cy.logoutAdmin();
    cy.request({ url: "/api/auth/profile", failOnStatusCode: false })
      .its("status")
      .should("eq", 401);
  });
});
