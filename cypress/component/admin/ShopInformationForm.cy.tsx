import ShopInfoManager from "@/components/admin/ShopInfoManager";
import type { AdminShopInfo } from "@/lib/types";

const shopInfo: AdminShopInfo = {
  shop_id: 1,
  shop_name: "Fresco Test Shop",
  phone: "09123456789",
  email: "hello@example.test",
  address: "12 Test Street",
  gcash_number: null,
  gcash_qr_path: null,
  daily_capacity_kg: 100,
  small_load_kg: 3,
  medium_load_kg: 5,
  large_load_kg: 8,
  hours: {
    monday: { open: "07:00", close: "19:00" },
    tuesday: { open: "07:00", close: "19:00" },
    wednesday: { open: "07:00", close: "19:00" },
    thursday: { open: "07:00", close: "19:00" },
    friday: { open: "07:00", close: "19:00" },
    saturday: { open: "08:00", close: "18:00" },
    sunday: { open: "09:00", close: "15:00" },
  },
};

describe("ShopInfoManager", () => {
  it("renders contact details and saves edited contact information", () => {
    cy.intercept("GET", "/api/admin/shop-information", {
      body: { success: true, data: shopInfo },
    }).as("shopInfo");
    cy.intercept("PATCH", "/api/admin/shop-information", {
      body: { success: true },
    }).as("saveShopInfo");
    cy.mount(<ShopInfoManager />);

    cy.wait("@shopInfo");
    cy.get('[data-cy="shop-phone"]').should("have.value", "09123456789");
    cy.get('[data-cy="shop-email"]').should("have.value", "hello@example.test");
    cy.get('[data-cy="shop-address"]').should("have.value", "12 Test Street");
    cy.get('[data-cy="shop-phone"]').clear().type("09223334444");
    cy.get('[data-cy="shop-save"]').click();

    cy.wait("@saveShopInfo").its("request.body.phone").should("eq", "09223334444");
    cy.contains("Shop information saved successfully.").should("be.visible");
  });

  it("shows a retry state when the shop information cannot be loaded", () => {
    cy.intercept("GET", "/api/admin/shop-information", { statusCode: 500, body: {} }).as("shopInfo");
    cy.mount(<ShopInfoManager />);

    cy.wait("@shopInfo");
    cy.contains("Unable to load shop information.").should("be.visible");
    cy.contains("button", "Retry").should("be.enabled");
  });
});
