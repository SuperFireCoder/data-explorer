/// <reference types="cypress" />
// https://on.cypress.io/introduction-to-cypress

const specTitle = require("cypress-sonarqube-reporter/specTitle");

describe(specTitle('index page'), () => {
  beforeEach(() => { 
  })

  it('renders', () => {
    cy.visit('/?tab=eco-data')
    cy.get('button')
      .should('contain', 'Sign in / Register')
  })

  it('embed renders', () => {
    cy.visit('/?tab=eco-data&embed=1')
    cy.get('body')
      .should('not.contain', 'Sign in / Register')
  })

  it('shows user not logged in message', () => {
    cy.visit('/?tab=eco-data')
    cy.get('button')
      .should('contain', 'Sign in / Register')
  })

  it('shows user is able to login with correct credientails', () => {
    cy.login();
    cy.visit('/?tab=eco-data')
  })
})