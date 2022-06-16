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

Cypress.Commands.add('login', (username, password) => {
	cy.visit('/?tab=eco-data?');
	cy.get('body').then(($body) => {
		// TODO: add data-cy tags to login button indicating logged in state
		if ($body.text().includes('Sign in / Register')) {
			cy.get('button').contains('Sign in / Register', { timeout: 5000 }).click({ force: true });
			cy.get('#zocial-keycloak-local-account', { timeout: 5000 }).click();
			cy.get('#username').type(username ?? Cypress.env('EC_USER'));
			cy.get('#password').type(password ?? Cypress.env('EC_PASS'));
			cy.get('#kc-form-login').submit();
		}
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


