// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

import '@cypress/code-coverage/support';

const DATA_EXPLORER_API = Cypress.env(
    "NEXT_PUBLIC_DATA_EXPLORER_BACKEND_SERVER_URL"
);

const VISUALISER_API = Cypress.env(
    "NEXT_PUBLIC_VISUALISER_CLIENT_GEOSPATIAL_ECMAPVISUALISERREQUEST_BACKEND_SERVER_URL"
);

// Potential workaround for 
// https://github.com/cypress-io/cypress/issues/28728
Cypress.on('uncaught:exception', (error) => {
  // returning false here prevents Cypress from failing the test
  console.error('Caught error', error);
  if (error.stack?.includes('PrimaryOriginCommunicator.toSource')) {
    return false;
  }
  return true;
});

beforeEach(() => {
    cy.intercept("GET", VISUALISER_API + "/api/maps/*/wms/*", {
        fixture: "map.png"
    }).as("getMap");

    cy.intercept("POST", VISUALISER_API + "/api/maps/").as("postMap");
    cy.intercept("GET", VISUALISER_API + "/api/maps/*/status").as("getMapStatus");
    cy.intercept("GET", DATA_EXPLORER_API + "/api/dataset/*").as("getDataset");
    cy.intercept("POST", DATA_EXPLORER_API + "/api/es/search/dataset").as("esSearchDataset");
    cy.intercept("POST", DATA_EXPLORER_API + "/api/es/search/dataset").as("searchDataset");

    // cy.intercept("POST", VISUALISER_API + "/api/maps/", {
    //     fixture: {}
    // }).as("postMap");

    // cy.intercept("GET", VISUALISER_API + "/api/maps/*/status", {
    //     fixture: {}
    // }).as("getMapStatus");
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
