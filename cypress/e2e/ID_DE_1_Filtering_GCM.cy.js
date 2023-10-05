/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_1_Filtering_GCM;
 */

describe("filtering GCM", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        cy.visit("/");
        // And on "Explore EcoCommons Data"
        cy.get('[data-cy="ExploreEcoDataTab"]');
        cy.get('[data-cy="header-sub-bar"]').should(
            "contain",
            "Explore EcoCommons Data"
        );
    });

    it("Filter GCM", () => {
        // Select Future from Time Domain
        cy.get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .last()
            .click();
        cy.contains("Future").click();
        // I select <category> from option element "Global Circulation Model"
        cy.get('[placeholder="Filter by GCM..."]').click();
        cy.wait(2000);
        cy.contains("ACCESS-ESM1-5").click();
        // I select a second <category> from option element "Global Circulation Model"
        cy.contains("CCCMA3.1").click();
        //I should see page with filtered datasets
        cy.url().should("include", "ACCESS-ESM1-5").and("include", "CCCMA3.1");
        cy.wait(5000);
        cy.get('[data-testid="results-count"]')
            .invoke("text")
            .then(($count) => {
                // get total
                const num2 = $count;
                // make sure it's what is expected
                expect(num2).to.equal("69 results");
            });
    });
});
