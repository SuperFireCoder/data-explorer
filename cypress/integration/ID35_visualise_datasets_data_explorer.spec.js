/// <reference types="cypress" />

const specTitle = require("cypress-sonarqube-reporter/specTitle");

/**
 * Feature: ID35; Visualise datasets on a map in data explorer
 *
 * ID35.1 As a user I want to visualise occurrence datasets appropriately.
 * ID35.2 As a user I want to visualise environmental datasets form the EcoCommons Data  appropriately.
 * ID35.3 As a user I want to visualise environmental datasets from the Knowledge Network Data appropriately.
 *
 */

const VISUALISER_API = Cypress.env(
    "NEXT_PUBLIC_VISUALISER_CLIENT_GEOSPATIAL_ECMAPVISUALISERREQUEST_BACKEND_SERVER_URL"
);

describe(specTitle("Visualise datasets on a map"), () => {
    beforeEach(() => {
        cy.login();
        cy.intercept("POST", VISUALISER_API + "/api/maps/").as("newVisualiser");
    });

    it("can Visualise occurrence datasets appropriatly in the data explorer", () => {
        // Given I uploaded occurrence data "325Sulfur crested cockatoo.csv"
        // And I am on the "Datasets" tab
        // When I type "325Sulfur crested cockatoo.csv"
        // And press enter
        const datasetName = "Sulphur crested cockatoo small";
        cy.get('[data-cy="search-field"]')
            .clear()
            .type(`${datasetName}{enter}`);
        cy.wait(2000);
        // Then I should see the "325Sulfur crested cockatoo.csv" dataset
        // When I press the "View" button next to the "325Sulfur crested cockatoo.csv" dataset
        // Then I should see occurrence points on the map
        /**
         * outstanding as it's visualiser
         * instead test for getting back a good response
         */
        cy.get(`[data-cy="DatasetCard-card"][data-testid="${datasetName}"]`)
            .first()
            .within(() => {
                cy.get('button[data-testid="view-button"]').click();
            });
        cy.wait("@newVisualiser")
            .its("response")
            .then((r) => {
                expect(r.statusCode).to.be.oneOf([200, 201]);
            });
    });
});
