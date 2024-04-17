/// <reference types="cypress" />

/**
 * Feature: ID_DE_3_Filtering_Time_Domain_Future;
 */

describe("filtering Time Domain Future", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/");
    });

    it("Filter Time Domain Future", () => {
        // I remove "Current/Historic" from Time Domain option
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .contains("Current/Historic")
            .parent()
            .find(".bp5-tag-remove")
            .click()
        // click outside
        cy.get("body")
            .click(10, 10)
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .should("not.contain", "Current/Historic")

        cy.wait("@searchDataset")
        cy.wait(500)

        // I remove "Unclassified" from Time Domain option
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .contains("Unclassified")
            .parent()
            .find(".bp5-tag-remove")
            .click()

        cy.wait("@searchDataset")
        cy.wait(500)

        // click outside
        cy.get("body")
            .click(10, 10)
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .should("not.contain", "Unclassified")

        cy.wait("@searchDataset")
        cy.wait(500)

        // I select "Future" from Time Domain option
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .click()
        cy.get('.bp5-multi-select-popover .bp5-popover-content')
            .contains("Future")
            .click()
            // click outside
            .get("body")
            .click(10, 10)

        cy.wait("@searchDataset")
        cy.wait(500)

        // assert 1 Time Domain options chosen (Future)
        cy.get('[data-cy=facetTimeDomain] .bp5-input')
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        // assert only 1 Month Domain option is chosen (Non monthly data)
        cy.get('[data-cy=facetMonth] .bp5-input')
            .should("contain", "Non monthly data")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        // I should see page with filtered datasets set in future years
        // get year text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .find('h5')
            .invoke("text")
            .then(($text) => {
                // get year
                var regEx = /\b[0-9]{4}/
                const yearText = parseInt(regEx.exec($text)[0])
                // assert year is in future
                expect(yearText).to.be.above(new Date().getFullYear())
            });
    });
});
