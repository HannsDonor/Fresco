describe("Admin shop information", () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    cy.request("PATCH", "/api/admin/shop-information", {
      shop_name: "Fresco Cypress Test Shop",
      phone: "09123456789",
      email: "cypress@example.invalid",
      address: "1 Test Street",
      gcash_number: "",
      gcash_qr_path: null,
      hours: {
        monday: { open: "07:00", close: "19:00" },
        tuesday: { open: "07:00", close: "19:00" },
        wednesday: { open: "07:00", close: "19:00" },
        thursday: { open: "07:00", close: "19:00" },
        friday: { open: "07:00", close: "19:00" },
        saturday: { open: "08:00", close: "18:00" },
        sunday: { open: "09:00", close: "15:00" },
      },
    }).its("status").should("eq", 200);
  });

  afterEach(() => {
    cy.loginAsAdmin();
    cy.request("DELETE", "/api/admin/shop-information/gcash-qr").its("status").should("eq", 200);
  });

  it("loads the contact information and operating hours", () => {
    cy.intercept("GET", "/api/admin/shop-information").as("shopInfo");
    cy.visitAdminPage("/admin/shop-information");
    cy.wait("@shopInfo").its("response.statusCode").should("eq", 200);
    cy.contains("h1", "Shop Information").should("be.visible");
    cy.get('[data-cy="shop-phone"]').should("have.value", "09123456789");
    cy.contains("Operating Hours").should("be.visible");
    cy.contains("GCash Payments").should("be.visible");
  });

  it("saves contact details and operating hours to the test database", () => {
    cy.visitAdminPage("/admin/shop-information");
    cy.get('[data-cy="shop-phone"]').clear().type("09223334444");
    cy.get('[data-cy="shop-address"]').clear().type("2 Cypress Verification Road");
    cy.get("#monday-open").clear().type("08:00");
    cy.get('[data-cy="shop-save"]').click();
    cy.contains("Shop information saved successfully.").should("be.visible");

    cy.reload();
    cy.get('[data-cy="shop-phone"]').should("have.value", "09223334444");
    cy.get('[data-cy="shop-address"]').should("have.value", "2 Cypress Verification Road");
    cy.get("#monday-open").should("have.value", "08:00");
  });

  it("uploads a test QR image, confirms it persists, and removes it", () => {
    cy.visitAdminPage("/admin/shop-information");
    cy.get("#gcash-qr").selectFile("cypress/fixtures/test-qr.png");
    cy.contains("GCash QR code uploaded.").should("be.visible");

    cy.reload();
    cy.get('img[alt="Current GCash QR code"]').should("be.visible");
    cy.contains("button", "Remove image").click();
    cy.contains("GCash QR code removed.").should("be.visible");
    cy.contains("No image set").should("be.visible");
  });
});
