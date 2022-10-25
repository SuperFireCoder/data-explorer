/// <reference types="cypress" />

const specTitle = require('cypress-sonarqube-reporter/specTitle');

describe(specTitle('login and show filtering on the basis of users on datasets'), () => {
    beforeEach(() => {
        cy.login();
        cy.get('[data-cy="explore-eco-data"]', { timeout: 5000 })
            .should('contain', 'Explore EcoCommons Data').click();
        cy.get('[data-cy="show-datasets"]', { timeout: 5000 })
            .should('contain', 'Show Datasets')
    })

    it('Show all the datasets', () => {
        cy.get('[data-cy="datasets"]', { timeout: 5000 }).get('input[type=checkbox]').eq(0).should('have.id', 'All datasets').click({force:true})
        cy.get('body').click(0, 0);
        cy.get('[data-cy="dataset-heading-data"]', { timeout: 5000 }).each(el => {
            if (el.text() === 'accuCLIM (Wet Tropics Australia), 30-year average either side of (1965), 9 arcsec (~250m)') {
                el.text().click()
            }
        });
       
        cy.wait(3000);
    }) 

    it('Show only my datasets', () => {
        cy.get('[data-cy="datasets"]', { timeout: 5000 }).get('input[type=checkbox]').eq(1).should('have.id','My datasets').click({force:true});
        cy.get('body').click(0, 0);
        cy.get('[data-cy="dataset-heading-data"]', { timeout: 5000 }).each(el => {
            if (el.text() === 'Litoria electrica occurrences from ALA - 17-May-2022-06:46:47.744952') {
                el.text().click()
            }
        });
        cy.wait(3000);
    })

    it('Show shared datasets', () => {
        cy.get('[data-cy="datasets"]', { timeout: 5000 }).get('input[type=checkbox]').eq(2).should('have.id','Shared datasets').click({force:true});
        cy.get('body').click(0, 0);
        cy.get('[data-cy="dataset-heading-data"]').should('not.exist'); // as no shared dataset
        cy.wait(3000);
    })
})