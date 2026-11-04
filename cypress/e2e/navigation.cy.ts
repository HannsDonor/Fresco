describe("Admin navigation", () => {
  it("opens each protected management page from the admin menu", () => {
    cy.visitAdminPage("/admin");
    const links: [string, string][] = [
      ["Orders", "/admin/orders"],
      ["Payments", "/admin/payments"],
      ["Services", "/admin/services"],
      ["Shop Info", "/admin/shop-information"],
      ["Shop Settings", "/admin/shop-settings"],
      ["Profile", "/admin/profile"],
    ];

    links.forEach(([label, href]) => {
      cy.contains("nav a", label).click();
      cy.location("pathname").should("eq", href);
      cy.contains("nav a", label).should("be.visible");
    });
  });
});
