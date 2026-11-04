import OrderTracking from "@/components/OrderTracking";

const trackedOrder = {
  order_reference: "FRC-0001",
  tracking_token: "TRK-ABC123",
  order_status: "In Progress",
  total_amount: "120.00",
  created_at: "2026-11-01T09:00:00.000Z",
  service: { name: "Wash and Fold", starting_price: "80.00" },
  load_type: "Medium",
  fulfillment_method: "Pickup",
  payment_method: "Cash",
  special_instructions: null,
  pickup_date: "2026-11-06",
  pickup_time: "10:00:00",
  customer: { name: "Maria Santos" },
  timeline: [{ status_id: 1, status: "Pending", note: "Request received", updated_at: "2026-11-01T09:00:00.000Z" }],
};

describe("OrderTracking", () => {
  it("renders the order status and its timeline", () => {
    cy.intercept("GET", "/api/tracking/TRK-ABC123", {
      body: { success: true, order: trackedOrder },
    }).as("tracking");
    cy.mount(<OrderTracking token="TRK-ABC123" />);

    cy.wait("@tracking");
    cy.contains("FRC-0001").should("be.visible");
    cy.contains("In Progress").should("be.visible");
    cy.contains("Cleaning in Progress").should("be.visible");
    cy.contains("Request received").should("be.visible");
  });

  it("shows a not-found message when the tracking token has no order", () => {
    cy.intercept("GET", "/api/tracking/TRK-MISSING", {
      statusCode: 404,
      body: { success: false },
    }).as("tracking");
    cy.mount(<OrderTracking token="TRK-MISSING" />);

    cy.wait("@tracking");
    cy.contains("h1", "Order not found").should("be.visible");
  });
});
