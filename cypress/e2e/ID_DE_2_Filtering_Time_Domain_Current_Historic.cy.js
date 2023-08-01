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
        // Time Domain is set to Current/Historic
        cy.get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]')
            .last()
            .should("contain", "Current/Historic")
            // assert only 1 Time Domain and 1 Month Domain option is chosen
            .get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]')
            .first()
            .should("contain", "Non monthly data")
            .get(".bp3-tag")
            .its("length")
            .should("eq", 2)
            .wait(2000)
            // I should see page with filtered datasets set in current/historic years
            // get year text
            .get('[data-cy="DatasetCard-card"]')
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
