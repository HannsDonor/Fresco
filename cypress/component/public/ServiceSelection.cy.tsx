import BookingWizard from "@/components/BookingWizard";

describe("BookingWizard service selection", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/services", {
      body: {
        success: true,
        services: [
          { service_id: 1, name: "Wash and Fold", description: "Everyday laundry care.", starting_price: 80, icon: "wash" },
          { service_id: 2, name: "Dry Cleaning", description: "Care for delicate garments.", starting_price: 150, icon: "sparkles" },
        ],
      },
    }).as("services");
    cy.intercept("GET", "/api/shop-information", {
      body: { success: true, data: { shop_name: "Fresco Test Shop" } },
    }).as("shopInfo");
    cy.mount(<BookingWizard />);
    cy.wait(["@services", "@shopInfo"]);
    cy.get('[data-cy="booking-name"]').type("Maria Santos");
    cy.get('[data-cy="booking-phone"]').type("9171234567");
    cy.get('[data-cy="booking-address"]').type("12 Test Street");
    cy.get('[data-cy="booking-continue"]').click();
  });

  it("lists services and marks the selected service and load type", () => {
    cy.contains("h1", "Laundry Details").should("be.visible");
    cy.get('[data-cy="service-option"]').should("have.length", 2);
    cy.contains("button", "Wash and Fold").click();
    cy.get('[data-cy="service-option"]').first().should("have.attr", "aria-pressed", "true");
    cy.get('[data-cy="load-type-Medium"]').click();
    cy.get('[data-cy="load-type-Medium"]').should("have.attr", "aria-pressed", "true");
  });

  it("requires a service and load type before continuing", () => {
    cy.get('[data-cy="booking-continue"]').click();
    cy.contains("Please select a service.").should("be.visible");
    cy.contains("Please select a load type.").should("be.visible");
    cy.contains("h1", "Laundry Details").should("be.visible");
  });
});
