import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import type { AdminOrderDetail } from "@/lib/types";

const pendingOrder: AdminOrderDetail = {
  order_id: 42,
  order_reference: "FRC-0042",
  tracking_token: "TRK-ABC123",
  service_id: 1,
  load_type: "Medium",
  fulfillment_method: "Pickup",
  requested_payment_method: "Cash",
  special_instructions: "Use fragrance-free detergent.",
  pickup_date: "2026-11-06",
  pickup_time: "10:00:00",
  order_status: "Pending",
  total_amount: "120.00",
  created_at: "2026-11-01T09:00:00.000Z",
  updated_at: "2026-11-01T09:00:00.000Z",
  customer_id: 10,
  customer_name: "Maria Santos",
  customer_phone: "+639171234567",
  customer_address: "12 Test Street",
  service_name: "Wash and Fold",
  service_description: "Everyday laundry care.",
  service_starting_price: "80.00",
  total_paid: "0.00",
  payment_status: "Pending",
  payment_method: null,
  payments: [],
  timeline: [{ status_id: 1, order_id: 42, status: "Pending", note: "Request received", updated_at: "2026-11-01T09:00:00.000Z" }],
};

describe("OrderDetailsModal", () => {
  it("shows order details, history, and allows the admin to accept it", () => {
    const onUpdated = cy.stub().as("onUpdated");
    cy.intercept("GET", "/api/admin/orders/42", {
      body: { success: true, order: pendingOrder },
    }).as("order");
    cy.intercept("PATCH", "/api/admin/orders/42", {
      body: { success: true },
    }).as("updateStatus");
    cy.mount(<OrderDetailsModal orderId={42} onClose={cy.stub()} onUpdated={onUpdated} />);

    cy.wait("@order");
    cy.contains("h2", "Order Details").should("be.visible");
    cy.contains("Maria Santos").should("be.visible");
    cy.contains("FRC-0042").should("be.visible");
    cy.contains("Use fragrance-free detergent.").should("be.visible");
    cy.contains("Request received").should("be.visible");
    cy.contains("button", "Accept Order").click();

    cy.wait("@updateStatus").its("request.body.order_status").should("eq", "Accepted");
    cy.contains("Order status updated to Accepted.").should("be.visible");
    cy.get("@onUpdated").should("have.been.calledWith", "status");
  });
});
