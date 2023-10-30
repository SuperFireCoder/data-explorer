/// <reference types="cypress" />

/**
 * Feature: ID_DE_10_Embed
 */

describe("Embedded selector", () => {
    it("can select Dataset", () => {
        // Given I am invoking the DataExplorer in embed mode
        cy.visit("/?embed=1");

        // and I can select a the Dataset
        cy.get('[data-cy="DatasetCard-card"]').should('have.length.gt', 1)
            .first()
            .find('[data-cy="select-button"]')
            .click()
        
        // and I can see the Dataset is selected
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke('attr', 'data-selected')
            .should('eq', 'true')

    });
});
