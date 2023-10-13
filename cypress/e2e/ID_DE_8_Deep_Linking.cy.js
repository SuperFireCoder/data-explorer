/// <reference types="cypress" />

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

// new-zealand-winds
const DS_UUID = "e300e0da-862a-5836-b063-420600e3a22e";

/**
 * Feature: ID_DE_8_Deep_linking;
 */

describe("Deep linking", () => {
    it("can link to Dataset", () => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        // following a link to an existing Dataset
        cy.visit("/?filterPrincipals=all&datasetId="+DS_UUID);

        // and I can see a single Dataset
        cy.get('[data-cy="DatasetCard-card"]').should('have.length', 1)
            .first()
            .invoke("text")
            // should be the new-zealand-winds DS
            .should("contain", "new-zealand-winds");
    });

    it("can link to Dataset info", () => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        // following a link to an existing Dataset
        cy.visit("/?filterPrincipals=all&datasetId="+DS_UUID+"&showInfo=1");

        // and I can see a single Dataset info panel
        cy.get('[data-cy="metadata-drawer"]').should('have.length', 1)
            .first()
            .invoke("text")
            // should be the new-zealand-winds DS
            .should("contain", "new-zealand-winds");
    });
});
