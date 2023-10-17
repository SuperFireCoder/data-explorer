/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_4_Filtering_Month_Filter_Monthly;
 */

describe("filtering Month Filter Monthly", () => {
    beforeEach(() => {
        cy.intercept("POST", DATA_EXPLORER_API + "/api/es/search/dataset").as(
            "searchDataset"
        );

        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/")
    })

    it("Filter Month Filter Monthly: January", () => {
        cy.wait("@searchDataset")

        // I remove "Non Monthly Data" from Month Filter option
        cy.get('[data-cy=facetMonth]')
            .contains("Non monthly data")
            .parent()
            .find(".bp5-tag-remove")
            .click()
        // click outside
        cy.get("body")
            .click(10, 10)
        cy.get('[data-cy=facetMonth]')
            .should("not.contain", "Non monthly data")

        // I select "January" from Month Filter option
        cy.wait("@searchDataset")
        cy.get('[data-cy=facetMonth]')
            .click()
        cy.get('.bp5-multi-select-popover .bp5-popover-content')
            .contains("January")
            .click()
        // click outside
        cy.get("body")
            .click(10, 10)

        // assert only 1 Month option chosen
        cy.get('[data-cy=facetMonth]')
            .should("contain", "January")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        cy.wait("@searchDataset")
        cy.wait(500)

            // I should see page with datasets set in January
            // get text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is January data
            .should("contain", "January")
    })

    it("Filter Month Filter Monthly: November", () => {
        cy.wait("@searchDataset")

        // I remove "Non Monthly Data" from Month Filter option
        cy.get('[data-cy=facetMonth]')
            .contains("Non monthly data")
            .parent()
            .find(".bp5-tag-remove")
            .click()
        // click outside
        cy.get("body")
            .click(10, 10)
        cy.get('[data-cy=facetMonth]')
            .should("not.contain", "Non monthly data")

        // I select "November" from Month Filter option
        cy.wait("@searchDataset")
        cy.get('[data-cy=facetMonth]')
            .click()
        cy.get('.bp5-multi-select-popover .bp5-popover-content')
            .contains("November")
            .click()
            // click outside
            .get("body")
            .click(10, 10)

        // assert only 1 Month option chosen
        cy.get('[data-cy=facetMonth]')
            .should("contain", "November")
            .find(".bp5-tag")
            .its("length")
            .should("eq", 1)

        cy.wait("@searchDataset")
        cy.wait(500)
        
        // I should see page with datasets set in November
        // get text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is November data
            .should("contain", "November")
    })
})
