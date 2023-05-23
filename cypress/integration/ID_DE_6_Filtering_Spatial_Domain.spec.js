/// <reference types="cypress" />

const specTitle = require("cypress-sonarqube-reporter/specTitle");

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_6_Filtering_Spatial_Domain; 
 */

describe(
    specTitle("filtering Spatial Domain"),
    () => {
        beforeEach(() => {
            // Given I am on the "dataset" tab
            // And on "Explore EcoCommons Data"
            cy.visit('/');
        });

        it("Filter Spatial Domain Australia", () => {
                // I select "Australia" from Spatial Domain option
                cy.get('[placeholder="Filter by spatial domain..."]').click()
                .get('.bp3-menu').contains('Australia').click()
                .wait(2000)
                // assert only 1 Time Domain, 1 Month Filter, 1 Spatial Domain is selected
                .get('.bp3-tag').its('length').should('eq', 3)
                // I should see page with filtered datasets with Australia data
                // get text
                .get('[data-cy="DatasetCard-card"]').first()
                .invoke('text')
                // assert result is within spatial domain
                .should('contain', 'Australia')
        });

        it("Filter Spatial Domain Global", () => {
            // I select "Global" from Spatial Domain option
            cy.get('[placeholder="Filter by spatial domain..."]').click()
            .get('.bp3-menu').contains('Global').click()
            .wait(2000)
            // assert only 1 Time Domain, 1 Month Filter, 1 Spatial Domain is selected
            .get('.bp3-tag').its('length').should('eq', 3)
            // I should see page with filtered datasets with Australia data
            // get text
            cy.get('[data-cy="DatasetCard-card"]').first()
            .invoke('text').then(($text)=>{
                // assert result is within global domain
                // define global keywords
                var globalKeywords = /Global|WorldClim|CHELSA|CliMond/
                // find global keywords within text
                const globalText = globalKeywords.exec($text)
                // expect text to have keyword
                expect(globalText).to.not.be.null
            })
        });

        it("Filter Spatial Domain Regional", () => {
            // I select "Regional" from Spatial Domain option
            cy.get('[placeholder="Filter by spatial domain..."]').click()
            .get('.bp3-menu').contains('Regional').click()
            .wait(2000)
            // assert only 1 Time Domain, 1 Month Filter, 1 Spatial Domain is selected
            .get('.bp3-tag').its('length').should('eq', 3)
            // I should see page with filtered datasets with Australia data
            // get text
            cy.get('[data-cy="DatasetCard-card"]').first()
            .invoke('text').then(($text)=>{
                // assert result is within regional domain
                // define regional keywords
                var regionalKeywords = /Tasmania|Wet Tropics Australia|South-East Australia/
                // find regional keywords within text
                const regionalText = regionalKeywords.exec($text)
                // expect text to have keyword
                expect(regionalText).to.not.be.null
            })
        });
    }
);