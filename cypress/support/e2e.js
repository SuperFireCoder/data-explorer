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

const VISUALISER_API = Cypress.env(
    "NEXT_PUBLIC_VISUALISER_CLIENT_GEOSPATIAL_ECMAPVISUALISERREQUEST_BACKEND_SERVER_URL"
);

beforeEach(() => {
    cy.intercept("GET", VISUALISER_API + "/api/maps/*/wms/*", {
        fixture: "map.png"
    }).as("getMap");

    // cy.intercept("POST", VISUALISER_API + "/api/maps/", {
    //     fixture: {}
    // }).as("postMap");

    // cy.intercept("GET", VISUALISER_API + "/api/maps/*/status", {
    //     fixture: {}
    // }).as("getMapStatus");
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
