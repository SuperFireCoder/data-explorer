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

        // I search 'bioclim' which are yearly datasets
        cy.get('[data-cy="search-field"]')
            .clear()
            .type(`bioclim{enter}`);
        cy.wait("@esSearchDataset")

        // Time Domain is set to Current/Historic, Unclassified
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .should("contain", "Current/Historic")
            .should("contain", "Unclassified")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 2)

        // assert only 1 Month Domain option is chosen
        cy.get('[data-cy=facetMonth] .bp5-input')
            .should("contain", "Non monthly data")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        // I should see page with filtered datasets set in current/historic years
        // get year text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .find('h5')
            .invoke("text")
            .then(($text) => {
                // get year
                var regEx = /\b[0-9]{4}/;
                var result = regEx.exec($text);
                expect(result).to.be.not.null
                const yearText = parseInt(result[0]);
                // assert year is current to historic
                expect(yearText).to.be.below(2024);
            });
    });
});
