/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_4_Filtering_Month_Filter_Monthly;
 */

describe("filtering Month Filter Monthly", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/");
    });

    it("Filter Month Filter Monthly: January", () => {
        // I remove "Non Monthly Data" from Month Filter option
        cy.get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .first()
            .click()
            .get(".bp5-tag-remove")
            .first()
            .click();
        // I select "January" from Month Filter option
        cy.contains("January")
            .click()
            .get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .first()
            .should("contain", "January")
            // assert only 1 Time Domain and 1 Month Filter option is chosen
            .get("body")
            .click(10, 10);
        cy.get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .eq(1)
            .should("contain", "Current/Historic")
            .get(".bp5-tag")
            .its("length")
            .should("eq", 2)
            .wait(2000)
            // I should see page with datasets set in January
            // get text
            .get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is January data
            .should("contain", "January");
    });

    it("Filter Month Filter Monthly: November", () => {
        // I remove "Non Monthly Data" from Month Filter option
        cy.get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .first()
            .click()
            .get(".bp5-tag-remove")
            .first()
            .click();
        // I select "November" from Month Filter option
        cy.contains("November")
            .click()
            .get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .first()
            .should("contain", "November")
            // assert only 1 Time Domain and 1 Month Filter option is chosen
            .get("body")
            .click(10, 10);
        cy.get('*[class^="bp5-text-overflow-ellipsis bp5-fill"]')
            .eq(1)
            .should("contain", "Current/Historic")
            .get(".bp5-tag")
            .its("length")
            .should("eq", 2)
            .wait(2000)
            // I should see page with datasets set in November
            // get text
            .get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is November data
            .should("contain", "November");
    });
});
