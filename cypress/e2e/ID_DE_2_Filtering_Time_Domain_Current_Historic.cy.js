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

        // someone re-enable this when the data is less terrible..
        // // I should see page with filtered datasets set in current/historic years
        // cy.get('[data-cy="DatasetCard-card"]')
        //     .first()
        //     .invoke('attr', 'data-year')
        //     .then((year) => {
        //         expect(parseInt(year)).to.be.below(new Date().getFullYear())
        //     })
    });
});
