import BookingWizard from "@/components/BookingWizard";

function mountBookingForm() {
  cy.intercept("GET", "/api/services", {
    statusCode: 200,
    body: {
      success: true,
      services: [
        { service_id: 1, name: "Wash and Fold", description: "Everyday laundry care.", starting_price: 80, icon: "wash" },
      ],
    },
  }).as("services");
  cy.intercept("GET", "/api/shop-information", {
    statusCode: 200,
    body: { success: true, data: { shop_name: "Fresco Test Shop", monday_hours: "7 AM–7 PM" } },
  }).as("shopInfo");
  cy.mount(<BookingWizard />);
  cy.wait(["@services", "@shopInfo"]);
}

function futureDate(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

describe("BookingWizard customer form", () => {
  it("shows required field errors when customer information is missing", () => {
    mountBookingForm();

    cy.get('[data-cy="booking-continue"]').click();
    cy.contains("Please enter your full name.").should("be.visible");
    cy.contains("Please enter your contact number.").should("be.visible");
    cy.contains("Please enter your address.").should("be.visible");
  });

  it("rejects an invalid Philippine mobile number", () => {
    mountBookingForm();

    cy.get('[data-cy="booking-name"]').type("Maria Santos");
    cy.get('[data-cy="booking-phone"]').type("123");
    cy.get('[data-cy="booking-address"]').type("12 Test Street");
    cy.get('[data-cy="booking-continue"]').click();

    cy.contains("Enter a valid Philippine mobile number").should("be.visible");
    cy.contains("h1", "Customer Information").should("be.visible");
  });

  it("submits a complete booking and navigates to its confirmation", () => {
    const push = cy.stub().as("routerPush");
    cy.intercept("GET", "/api/services", {
      body: {
        success: true,
        services: [{ service_id: 1, name: "Wash and Fold", description: "Everyday laundry care.", starting_price: 80, icon: "wash" }],
      },
    }).as("services");
    const hours = "7 AM–7 PM";
    cy.intercept("GET", "/api/shop-information", {
      body: {
        success: true,
        data: {
          shop_name: "Fresco Test Shop",
          monday_hours: hours,
          tuesday_hours: hours,
          wednesday_hours: hours,
          thursday_hours: hours,
          friday_hours: hours,
          saturday_hours: hours,
          sunday_hours: hours,
        },
      },
    }).as("shopInfo");
    cy.intercept("POST", "/api/orders", {
      statusCode: 201,
      body: { success: true, tracking_token: "TRK-ABC123" },
    }).as("createOrder");
    cy.mount(<BookingWizard />, { router: { push } });
    cy.wait(["@services", "@shopInfo"]);

    cy.get('[data-cy="booking-name"]').type("Maria Santos");
    cy.get('[data-cy="booking-phone"]').type("9171234567");
    cy.get('[data-cy="booking-address"]').type("12 Test Street");
    cy.get('[data-cy="booking-continue"]').click();
    cy.get('[data-cy="service-option"]').first().click();
    cy.get('[data-cy="load-type-Medium"]').click();
    cy.get('[data-cy="booking-continue"]').click();
    cy.get('[data-cy="fulfillment-Pickup"]').click();
    cy.get('[data-cy="payment-Cash"]').click();
    cy.get('[data-cy="pickup-date"]').type(futureDate(3));
    cy.get('[data-cy="pickup-time-slot"]').first().click();
    cy.get('[data-cy="booking-continue"]').click();
    cy.contains("h1", "Review Your Order").should("be.visible");
    cy.get('[data-cy="booking-submit"]').click();

    cy.wait("@createOrder").its("request.body").should("include", {
      name: "Maria Santos",
      service_id: 1,
      load_type: "Medium",
      fulfillment_method: "Pickup",
      requested_payment_method: "Cash",
    });
    cy.get("@routerPush").should("have.been.calledWith", "/confirmation?token=TRK-ABC123");
  });
});
