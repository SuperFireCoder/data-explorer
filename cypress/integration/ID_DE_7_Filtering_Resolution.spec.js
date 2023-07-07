/// <reference types="cypress" />

const specTitle = require("cypress-sonarqube-reporter/specTitle");

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

/**
 * Feature: ID_DE_7_Filtering_Resolution; 
 */

describe(
    specTitle("filtering Resolution"),
    () => {
        beforeEach(() => {
            // Given I am on the "dataset" tab
            // And on "Explore EcoCommons Data"
            cy.visit('/');
        });

        it("Filter Resolution 36 arcsec", () => {
                // I select "36 arcsec (~1km)" from Resolution option
                cy.get('[placeholder="Filter by resolution..."]').click()
                .get('.bp3-menu').contains('36 arcsec (~1km)').click()
                .wait(2000)
                // assert only 1 Time Domain, 1 Month Filter, 1 Resolution is selected
                .get('.bp3-tag').its('length').should('eq', 3)
                // I should see page with filtered datasets in 36 arcsec (~1km) resolution
                // get text
                .get('[data-cy="DatasetCard-card"]').first()
                .invoke('text')
                // assert result is in 36 arcsec (~1km) resolution
                .should('contain', '36 arcsec (~1km)')
        });

        it("Filter Resolution 3 arcmin", () => {
            // I select "3 arcmin (~5km)" from Resolution option
            cy.get('[placeholder="Filter by resolution..."]').click()
            .get('.bp3-menu').contains('3 arcmin (~5km)').click()
            .wait(2000)
            // assert only 1 Time Domain, 1 Month Filter, 1 Resolution is selected
            .get('.bp3-tag').its('length').should('eq', 3)
            // I should see page with filtered datasets in 3 arcmin (~5km) resolution
            // get text
            .get('[data-cy="DatasetCard-card"]').first()
            .invoke('text')
            // assert result is in 3 arcmin (~5km) resolution
            .should('contain', '3 arcmin (~5km)')
        });
    }
);