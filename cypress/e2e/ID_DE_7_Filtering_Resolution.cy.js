/// <reference types="cypress" />

/**
 * Feature: ID_DE_7_Filtering_Resolution;
 */

describe("filtering Resolution", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/");
    });

    it("Filter Resolution 36 arcsec", () => {
        // I select "36 arcsec (~1km)" from Resolution option
        cy.get('[placeholder="Filter by resolution..."]')
            .click()
            .get(".bp5-menu")
            .contains("36 arcsec (~1km)")
            .click()

        cy.wait("@searchDataset")
        cy.wait(500)

            // assert only 2 Time Domain, 1 Month Filter, 1 Resolution is selected
            .get(".bp5-tag")
            .its("length")
            .should("eq", 4)
            // I should see page with filtered datasets in 36 arcsec (~1km) resolution
            // get text
            .get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is in 36 arcsec (~1km) resolution
            .should("contain", "36 arcsec (~1km)");
    });

    it("Filter Resolution 3 arcmin", () => {
        // I select "3 arcmin (~5km)" from Resolution option
        cy.get('[placeholder="Filter by resolution..."]')
            .click()
            .get(".bp5-menu")
            .contains("3 arcmin (~5km)")
            .click()

        cy.wait("@searchDataset")
        cy.wait(500)
        
            // assert only 2 Time Domain, 1 Month Filter, 1 Resolution is selected
            .get(".bp5-tag")
            .its("length")
            .should("eq", 4)
            // I should see page with filtered datasets in 3 arcmin (~5km) resolution
            // get text
            .get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is in 3 arcmin (~5km) resolution
            .should("contain", "3 arcmin (~5km)");
    });
});
