import PaymentsManager from "@/components/admin/PaymentsManager";
import StatusBadge, { PaymentBadge } from "@/components/admin/StatusBadge";

describe("StatusBadge", () => {
  it("renders the order status with its matching color", () => {
    cy.mount(<StatusBadge status="Pending" />);

    cy.contains("Pending")
      .should("be.visible")
      .and("have.class", "bg-amber-100")
      .and("have.class", "text-amber-700");
  });

  it("uses a neutral color for an unknown status", () => {
    cy.mount(<StatusBadge status="Awaiting Review" />);

    cy.contains("Awaiting Review")
      .should("be.visible")
      .and("have.class", "bg-slate-100")
      .and("have.class", "text-slate-600");
  });

  it("renders the payment status", () => {
    cy.mount(<PaymentBadge status="Paid" />);

    cy.contains("Paid")
      .should("be.visible")
      .and("have.class", "bg-emerald-100")
      .and("have.class", "text-emerald-700");
  });
});

describe("PaymentsManager", () => {
  it("marks a pending payment as paid and displays success feedback", () => {
    let isPaid = false;
    cy.intercept("GET", "**/api/admin/payments*", (request) => {
      request.reply({
        body: {
          success: true,
          payments: [{
            payment_id: 7,
            order_id: 42,
            amount: "120.00",
            payment_method: "Cash",
            payment_status: isPaid ? "Paid" : "Pending",
            payment_date: null,
            created_at: "2026-11-01T09:00:00.000Z",
            order_reference: "FRC-0042",
            customer_name: "Maria Santos",
          }],
        },
      });
    }).as("payments");
    cy.intercept("PATCH", "/api/admin/payments/7", (request) => {
      expect(request.body).to.deep.equal({ payment_status: "Paid" });
      isPaid = true;
      request.reply({ body: { success: true } });
    }).as("markPaid");
    cy.mount(<PaymentsManager />);

    cy.wait("@payments");
    cy.contains("tr", "FRC-0042").contains("button", "Mark Paid").filter(":visible").click();
    cy.wait("@markPaid");
    cy.contains("Payment marked as Paid.").should("be.visible");
    cy.wait("@payments");
    cy.contains("tr", "FRC-0042").should("contain.text", "Paid");
  });
});
