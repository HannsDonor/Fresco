import ServiceFormModal from "@/components/admin/ServiceFormModal";
import type { AdminServiceRow } from "@/lib/types";

const existingService: AdminServiceRow = {
  service_id: 42,
  name: "Wash and Fold",
  description: "Everyday laundry care.",
  starting_price: "80.00",
  icon: "wash",
  is_active: 1,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  order_count: 0,
};

describe("ServiceFormModal", () => {
  it("requires a service name and a valid price", () => {
    cy.mount(<ServiceFormModal onClose={cy.stub()} onSaved={cy.stub()} />);

    cy.get('[data-cy="service-save"]').click();
    cy.get('[role="alert"]').should("contain.text", "Please enter a service name.");

    cy.get('[data-cy="service-name"]').type("Wash and Fold");
    cy.get('[data-cy="service-save"]').click();
    cy.get('[role="alert"]').should("contain.text", "Please enter a valid starting price.");
  });

  it("posts new service details and calls onSaved after success", () => {
    const onSaved = cy.stub().as("onSaved");
    cy.intercept("POST", "/api/admin/services", {
      statusCode: 200,
      body: { success: true },
    }).as("createService");
    cy.mount(<ServiceFormModal onClose={cy.stub()} onSaved={onSaved} />);

    cy.get('[data-cy="service-name"]').type("Wash and Fold");
    cy.get('[data-cy="service-description"]').type("Everyday laundry care.");
    cy.get('[data-cy="service-price"]').type("80");
    cy.get("#service-icon").select("wash");
    cy.get('[data-cy="service-save"]').click();

    cy.wait("@createService").its("request.body").should("deep.equal", {
      name: "Wash and Fold",
      description: "Everyday laundry care.",
      starting_price: 80,
      icon: "wash",
      is_active: true,
    });
    cy.get("@onSaved").should("have.been.calledOnce");
  });

  it("patches the existing service when editing", () => {
    cy.intercept("PATCH", "/api/admin/services/42", {
      statusCode: 200,
      body: { success: true },
    }).as("updateService");
    cy.mount(
      <ServiceFormModal service={existingService} onClose={cy.stub()} onSaved={cy.stub()} />
    );

    cy.get('[data-cy="service-name"]').should("have.value", "Wash and Fold");
    cy.get('[data-cy="service-price"]').should("have.value", "80.00");
    cy.get('[data-cy="service-name"]').clear().type("Wash and Fold Plus");
    cy.get('[data-cy="service-save"]').click();

    cy.wait("@updateService").its("request.body.name").should("eq", "Wash and Fold Plus");
  });
});
