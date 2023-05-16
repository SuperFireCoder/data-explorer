/// <reference types="cypress" />

const specTitle = require("cypress-sonarqube-reporter/specTitle");

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_2_Filtering_Time_Domain_Current_Historic; 
 */

describe(
    specTitle("filtering Time Domain Current/Historic"),
    () => {
        beforeEach(() => {
            // Given I am on the "dataset" tab
            cy.visit('http://localhost:3000/');
            // And on "Explore EcoCommons Data"
            cy.get('[data-cy="ExploreEcoDataTab"]');
            cy.get('.Header-module_subBarLinkActive__-4KUy').should(
                "contain",
                "Explore EcoCommons Data"
            );
        });

        it("Filter Time Domain Current/Historic", () => {
                // Time Domain is set to Current/Historic
                cy.get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]').last().should('contain', 'Current/Historic')
                // assert only 1 Time Domain and 1 Month Domain option is chosen
                cy.get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]').first().should('contain', 'Non monthly data')
                cy.get('.bp3-tag').its('length').should('eq', 2)
                cy.wait(2000);
                // I should see page with filtered datasets set in current/historic years
                // get year text
                cy.get('[data-cy="DatasetCard-card"]').first()
                .invoke('text').then(($text)=>{
                    // get year
                    var regEx = /(?:\bdigit-|\s|^)(\d{4})(?=[.?\s]|-digit\b|)/;
                    const yearText = parseInt(regEx.exec($text)[0])
                    // assert year is current to historic
                    expect(yearText).to.be.below(2024)
                })
        });
    }
);