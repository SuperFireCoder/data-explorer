/// <reference types="cypress" />

/**
 * Feature: ID_DE_9_Filtering_Spatial_Type;
 */

describe("filtering SpatialType", () => {
    beforeEach(() => {
        // Given I am on the "dataset" tab
        // And on "Explore EcoCommons Data"
        cy.visit("/")
    })

    it("Filter SpatialType Categorical", () => {
        // I select "Categorical" from SpatialType option
        cy.get('[data-cy=facetSpatialType] .bp5-input')
            .click()
            .get(".bp5-menu")
            .contains("Categorical")
            .click()

        cy.wait("@searchDataset")
        cy.wait(500)

        // I should see page with filtered datasets in Categorical
        // get text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is Categorical
            .should("contain", "Forests of Australia, 2018")
    })

    it("Filter SpatialType Point", () => {
        // I select "Point" from SpatialType option
        cy.get('[data-cy=facetSpatialType] .bp5-input')
            .click()
            .get(".bp5-menu")
            .contains("Point")
            .click()
            
        cy.wait("@searchDataset")
        cy.wait(500)
        
        // I should see page with filtered datasets in Point
        // get text
        cy.get('[data-cy="DatasetCard-card"]')
            .first()
            .invoke("text")
            // assert result is Point
            .should("contain", "Airport dataset, Australia")
    })

});
