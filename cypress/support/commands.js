// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

const KEYCLOAK_AUTH_URL =
    Cypress.env("NEXT_PUBLIC_KEYCLOAK_AUTH_URL") +
    "/realms/" +
    Cypress.env("NEXT_PUBLIC_KEYCLOAK_AUTH_REALM") +
    "/protocol/openid-connect/token";

Cypress.Commands.add("login", (username, password) => {
    cy.session([username, password], () => {
        cy.intercept("POST", KEYCLOAK_AUTH_URL).as("newToken");
        cy.visit("/")
            .get('[class*="Header-module_headerContainer"]')
            .then(($elm) => {
                if ($elm.find("button[data-cy=root-signin]").length > 0) {
                    cy.log("Attempting to login");
                    cy.get('[data-cy="root-signin"]', { timeout: 5000 }).click();
                    cy.get("#zocial-keycloak-local-account", {
                        timeout: 5000
                    }).click();
                    cy.get("#username").type(username ?? Cypress.env("EC_USER"));
                    cy.get("#password").type(password ?? Cypress.env("EC_PASS"));
                    cy.get("#kc-form-login").submit();
                } else {
                    cy.log("Login skipped");
                }
            });
        cy.wait("@newToken")
            .its("response")
            .then((response) => {
                Cypress.env("access_token", response.body.access_token);
            });
    });
});

// // Overwrite 'click' so it always waits for the DOM to stabilize first
// const waitForDom = require('./waitForDom').default
// Cypress.Commands.add('waitForDom', { prevSubject: 'optional' }, waitForDom)
// const originalWithWaitForDom = (originalFn, subject, ...args) => {
//   const options = { period: 700, timeout: 5000 }
//   waitForDom(subject, options)
//   originalFn(subject, ...args)
// }
// Cypress.Commands.overwrite('click', originalWithWaitForDom)
// Cypress.Commands.overwrite('type', originalWithWaitForDom)
