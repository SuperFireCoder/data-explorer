/// <reference types="cypress" />

const specTitle = require('cypress-sonarqube-reporter/specTitle');

describe(specTitle('login and show fitering on the basis of users on datasets'), () => {
    beforeEach(() => {
        cy.login();
        cy.visit('/?tab=eco-data?')
        cy.get('[data-cy="explore-eco-data"]', { timeout: 5000 })
        .should('contain', 'Explore EcoCommons Data').click({ force: true });
        cy.get('[data-cy="show-privacy"]', { timeout: 5000 })
        .should('contain', 'Privacy')
    })

    it('Show all the datasets', () => {
        cy.get('[data-cy="show-all-data-set"]', { timeout: 5000 }).should('contain','Show all datasets', { force: true })
        cy.get('[data-cy="dataset-heading-data"]').should('contain', 'accuCLIM (Wet Tropics Australia), 30-year average either side of (1965), 9 arcsec (~250m)').first()
        .click({ force: true })
        cy.wait(3000);
    })

    it('Show only my datasets', () => {
       // cy.get('[data-cy="show-all-data-set"]', { timeout: 5000 }).should('contain','Show all datasets', { force: true })
        cy.get('[data-cy="show-all-data-set"]', { timeout: 5000 }).should('contain','Show only my datasets', { force: true })
        cy.get('[data-cy="dataset-heading-data"]').should('contain', 'Litoria electrica occurrences from ALA - 17-May-2022-06:46:47.744952').first()
        .click({ force: true })
        cy.wait(3000);
    })

    it('Show shared datasets', () => {
        cy.get('[data-cy="show-all-data-set"]', { timeout: 5000 }).should('contain','Show all datasets', { force: true })
        cy.get('[data-cy="show-datasets"]', { timeout: 5000 }).select('contain','Show shared datasets', { force: true })
        cy.get('[data-cy="dataset-heading-data"]').should('contain', 'seema-test-shared')
        .click({ force: true })
         cy.wait(3000);
    })
})