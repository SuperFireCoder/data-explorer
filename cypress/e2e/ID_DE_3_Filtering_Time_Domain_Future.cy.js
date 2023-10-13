/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_3_Filtering_Time_Domain_Future;
 */

describe("filtering Time Domain Future", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/");
        cy.intercept("POST", DATA_EXPLORER_API + "/api/es/search/dataset").as(
            "searchResult"
        );
    });

    it("Filter Time Domain Future", () => {
        // I remove "Current/Historic" from Time Domain option
        cy.get('[data-cy=facetTimeDomain]')
            .contains("Current/Historic")
            .parent()
            .find(".bp5-tag-remove")
            .click()

        // I remove "Unclassified" from Time Domain option
        cy.get('[data-cy=facetTimeDomain]')
            .contains("Unclassified")
            .parent()
            .find(".bp5-tag-remove")
            .click()

        cy.wait("@searchResult")

        // I select "Future" from Time Domain option
        cy.get('[data-cy=facetTimeDomain]')
            .click()
        cy.get('.bp5-multi-select-popover .bp5-popover-content')
            .contains("Future")
            .click()
            // click outside
            .get("body")
            .click(10, 10)

        // assert 1 Time Domain options chosen (Future)
        cy.get('[data-cy=facetTimeDomain]')
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        // assert only 1 Month Domain option is chosen (Non monthly data)
        cy.get('[data-cy=facetMonth]')
            .should("contain", "Non monthly data")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        cy.wait("@searchResult")

        // I should see page with filtered datasets set in future years
        // get year text
        cy.contains("button", "Last refreshed at").click()
        cy.wait("@searchResult");
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            .then(($text) => {
                // get year
                var regEx = /\b[0-9]{4}/
                const yearText = parseInt(regEx.exec($text)[0])
                // assert year is in future
                expect(yearText).to.be.above(2023)
            });
    });
});
