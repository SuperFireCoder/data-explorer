/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_2_Filtering_Time_Domain_Current_Historic;
 */
describe("filtering Time Domain Current/Historic", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab and on "Explore EcoCommons Data"
        // And on "Explore EcoCommons Data"
        cy.visit("/");
    });

    it("Filter Time Domain Current/Historic", () => {
        // Time Domain is set to Current/Historic, Unclassified
        cy.get('[data-cy=facetTimeDomain]')
            .should("contain", "Current/Historic")
            .should("contain", "Unclassified")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 2)

        // assert only 1 Month Domain option is chosen
        cy.get('[data-cy=facetMonth]')
            .should("contain", "Non monthly data")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        // I should see page with filtered datasets set in current/historic years
        // get year text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            .then(($text) => {
                // get year
                var regEx = /\b[0-9]{4}/;
                const yearText = parseInt(regEx.exec($text)[0]);
                // assert year is current to historic
                expect(yearText).to.be.below(2024);
            });
    });
});
