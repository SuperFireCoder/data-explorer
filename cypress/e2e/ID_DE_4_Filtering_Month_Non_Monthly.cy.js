/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_4_Filtering_Month_Filter_Non_Monthly;
 */

describe("filtering Month Filter Non Monthly", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/");
    });

    it("Filter Month Filter Non Monthly", () => {
        // Month Filter is set to 'Non monthly data'
        cy.get('[data-cy=facetMonth]')
            .should("contain", "Non monthly data")

        // I should see page with filtered datasets with non-monthly data
        // get text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            .then(($text) => {
                // assert result is within regional domain
                // define months
                var months =
                    /January|February|March|April|May|June|July|August|September|October|November|December/;
                // find month within text
                const text = months.exec($text);
                // expect to not find month
                expect(text).to.be.null;
            });
    });
});
