/// <reference types="cypress" />

const specTitle = require("cypress-sonarqube-reporter/specTitle");

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_3_Filtering_Time_Domain_Future; 
 */

describe(
    specTitle("filtering Time Domain Future"),
    () => {
        beforeEach(() => {
            // Given I am on the "dataset" tab
            // And on "Explore EcoCommons Data"
            cy.visit('/');
        });

        it("Filter Time Domain Future", () => {
                // I remove "Current/Historic" from Time Domain option
                cy.get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]').last().click()
                .get('.bp3-tag-remove').last().click()
                // I select "Future" from Time Domain option
                cy.contains('Future').click()
                .get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]').first()
                // assert only 1 Time Domain and 1 Month Domain option is chosen
                .get('*[class^="bp3-text-overflow-ellipsis bp3-fill"]').first().should('contain', 'Non monthly data')
                .get('.bp3-tag').its('length').should('eq', 2)
                .wait(2000)
                // I should see page with filtered datasets set in future years
                // get year text
                .get('[data-cy="DatasetCard-card"]').first()
                .invoke('text').then(($text)=>{
                    // get year
                    var regEx = /\b[0-9]{4}/;
                    const yearText = parseInt(regEx.exec($text)[0])
                    // assert year is in future
                    expect(yearText).to.be.above(2023)
                })
        });
    }
);