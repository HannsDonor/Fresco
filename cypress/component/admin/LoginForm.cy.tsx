import AdminLoginForm from "@/components/AdminLoginForm";

describe("AdminLoginForm", () => {
  it("requires both username and password", () => {
    cy.mount(<AdminLoginForm />);
    cy.get('[data-cy="login-form"][data-ready="true"]').should("be.visible");
    cy.get('[data-cy="login-button"]').click();
    cy.get('[role="alert"]').should("contain.text", "Please enter your username and password.");
  });

  it("displays the API error for invalid credentials", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: { error: "Invalid credentials." },
    }).as("login");
    cy.mount(<AdminLoginForm />);

    cy.get('[data-cy="username"]').type("invalid_admin");
    cy.get('[data-cy="password"]').type("wrong-password");
    cy.get('[data-cy="login-button"]').click();
    cy.wait("@login");
    cy.get('[role="alert"]').should("contain.text", "Invalid credentials.");
  });

  it("routes to the admin dashboard after a successful login", () => {
    const push = cy.stub().as("routerPush");
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: { success: true },
    }).as("login");
    cy.mount(<AdminLoginForm />, { router: { push } });

    cy.get('[data-cy="username"]').type("cypress_admin");
    cy.get('[data-cy="password"]').type("fixture-password");
    cy.get('[data-cy="login-button"]').click();
    cy.wait("@login");
    cy.get("@routerPush").should("have.been.calledWith", "/admin");
  });
});
