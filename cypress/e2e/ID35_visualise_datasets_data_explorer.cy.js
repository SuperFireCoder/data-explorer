/// <reference types="cypress" />

/**
 * Feature: ID35; Visualise datasets on a map in data explorer
 *
 * ID35.1 As a user I want to visualise occurrence datasets appropriately.
 * ID35.2 As a user I want to visualise environmental datasets from the EcoCommons Data  appropriately.
 * ID35.3 As a user I want to visualise environmental datasets from the Knowledge Network Data appropriately.
 *
 */

describe("Visualise datasets on a map", () => {
    beforeEach(() => {
        cy.login()
        cy.visit("/");

    });

    it("ID35.1 - can Visualise occurrence datasets appropriately", () => {
        // Given I uploaded occurrence data "325Sulfur crested cockatoo.csv"
        // And I am on the "Datasets" tab
        // When I type "325Sulfur crested cockatoo.csv"
        // And press enter
        const datasetName =
            "Australia, exCHELSA (extended bioclim) (1980, 30 arcsec (~1km))";
        cy.get('[data-cy="search-field"]')
            .clear()
            .type(`${datasetName}{enter}`);
        cy.wait("@esSearchDataset")
            .its("response")
            .then((r) => {
                expect(r.statusCode).to.be.oneOf([200, 201]);
            });
            
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
        cy.wait("@postMap")
            .its("response")
            .then((r) => {
                expect(r.statusCode).to.be.oneOf([200, 201]);
            });
    });

    it("ID35.2 - can Visualise environmental datasets from the EcoCommons Data  appropriately", () => {
        // Given I am on the "Datasets" tab
        // And I am on "Explore EcoCommons Data"
        // When I press "View" next to <dataset>
        // Then I should see datalayer on the map
        // When I press <layer1>
        // Then I should see <layer1> on the map
        // When I press <layer2>
        // Then I should see <layer2> on the map
        /**
         * outstanding as it's visualiser
         * instead test for getting back a good response
         */
        var examples = [
            {
                data: "Australia, Water Availability (1996), 3 arcmin (~5km)",
                variables: [
                    // {
                    //     label: "Bioclim 02: Mean Diurnal Range (Mean of monthly (max temp - min temp))"
                    // },
                    {
                        label: "Pann_FWDis', 'annual local discharge (runoff+drainage) (average)"
                    }
                ]
            },
            {
                data: "WorldClim2.1, Altitude, 10 arcmin (~20km)",
                variables: [
                    // {
                    //     label: "Average maximum temperature"
                    // },
                    {
                        label: "Elevation (elevation above sea level)"
                    }
                ]
            }
            // {
            //     data: "Australian NDVI (Normalised Difference Vegetation Index) April 2013",
            //     variables: [
            //         {
            //             label: "Standardised Anomaly Normalised Difference Vegetation Index (NDVI)"
            //         },
            //         {
            //             label: "Average Normalised Difference Vegetation Index (NDVI)"
            //         }
            //     ]
            // }
        ];

        var firstParameter = "";

        function isFirstParameterInTestCase(variables, response) {
            firstParameter = Object.keys(response.body.parameters)[0];
            return variables.filter((v) => v.id == firstParameter).length > 0;
        }

        examples.forEach((example) => {
            cy.get('[data-cy="search-field"]')
                .clear({ force: true })
                .type(`${example.data}{enter}`, { force: true });

            cy.wait("@searchDataset")
            cy.wait(500)

            cy.get(
                `[data-cy="DatasetCard-card"][data-testid="${example.data}"]`
            )
                .first()
                .within(() => {
                    cy.get('button[data-testid="view-button"]').click();
                });
            cy.wait("@getDataset")
                .its("response")
                .then((r) => {
                    expect(r.statusCode).to.be.oneOf([200, 201]);
                    example.variables.map(
                        (v) =>
                            (v.id = Object.keys(r.body.parameters).filter(
                                (p) =>
                                    r.body.parameters[p].observedProperty.label
                                        .en == v.label
                            )[0])
                    );

                    /**
                     * To handle @postMap for the first layer called by default
                     *
                     * 1. check if the first parameter/layer is in the test case (isFirstParameterInTestCase(variables, response))
                     * 2. yes - remove from test case and test seperately (removeFirstParameter)
                     * 3. no - only expect statusCode for the first @postMap
                     *
                     */
                    if (isFirstParameterInTestCase(example.variables, r)) {
                        // test the first layer as it's in the test case
                        cy.wait("@postMap")
                            .its("response")
                            .then((r) => {
                                expect(r.statusCode).to.be.oneOf([200, 201]);
                                expect(r.body.source_data[0].name).to.equal(
                                    firstParameter
                                );
                            });
                        cy.wait(1000);
                    } else {
                        // only expect statusCode for the first @postMap
                        cy.wait("@postMap")
                            .its("response")
                            .then((r) => {
                                expect(r.statusCode).to.be.oneOf([200, 201]);
                            });
                    }

                    // remove the first layer if it's in the test case as the @postMap for it has been used
                    const testVariables = isFirstParameterInTestCase
                        ? example.variables.filter(
                              (v) => v.id !== firstParameter
                          )
                        : example.variables;

                    // test the rest of the test case
                    testVariables.forEach((variable) => {
                        cy.get(
                            `input[type=radio][data-cy="layers-radio"][data-testid="${variable.label}"]`
                        ).check({ force: true });
                        cy.wait("@postMap")
                            .its("response")
                            .then((r) => {
                                expect(r.statusCode).to.be.oneOf([200, 201]);
                                // expect(r.body.source_data[0].name).to.equal(
                                //     variable.id
                                // );
                            });
                    });
                    cy.wait(1000);
                });
        });
    });

    it("ID35.3 - can Visualise environmental datasets from the Knowledge Network Data appropriately", () => {
        // (Need to look at it once knowledge network works again)
    });
});

// Examples:
// | dataset                                                                           | layer1                                                                 | layer2                                                |
// | Australia, Climate Projection, SRESA1B based on INM-CM30, 30 arcsec (~1km) - 2025 | Bioclim 02: Mean Diurnal Range (Mean of monthly (max temp - min temp)) | Bioclim 03: Isothermality (BIO2/BIO7) (* 100)         |
// | WorldClim2.1, precipitation December (1996), 2.5 arcmin (~5km)                    | Average maximum temperature                                            | Average minimum temperature                           |
// | Australian NDVI (Normalised Difference Vegetation Index) April 2013               | Standardised Anomaly Normalised Difference Vegetation Index (NDVI)     | Average Normalised Difference Vegetation Index (NDVI) |
