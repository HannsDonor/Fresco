describe("Public landing page", () => {
  it("shows the services and shop information returned by the API", () => {
    cy.intercept("GET", "/api/services").as("services");
    cy.intercept("GET", "/api/shop-information").as("shopInformation");
    cy.visit("/");

    cy.contains("h1", "Made Simple.").should("be.visible");
    cy.wait("@services").its("response.statusCode").should("eq", 200);
    cy.wait("@shopInformation").its("response.body.data.shop_name").should("eq", "Fresco Cypress Test Shop");
    cy.contains("Our Services").should("be.visible");
    cy.contains("Cypress Test Service").should("be.visible");
    cy.contains("Shop Information").should("be.visible");
    cy.get('a[href="/admin/login"]').should("not.exist");
  });

  it("navigates to booking and tracking from the hero", () => {
    cy.visit("/");
    cy.contains("h1", "Made Simple.").should("be.visible");
    cy.contains("a", "Book a Laundry Service").first().click();
    cy.location("pathname").should("eq", "/book");

    cy.visit("/");
    cy.contains("h1", "Made Simple.").should("be.visible");
    cy.contains("a", "Track My Laundry").first().click();
    cy.location("pathname").should("eq", "/tracking");
  });
});
