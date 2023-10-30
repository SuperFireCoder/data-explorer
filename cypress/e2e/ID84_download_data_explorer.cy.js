/// <reference types="cypress" />

// Example: dataset
// |Australia, Climate Projection, SRESA1B based on INM-CM30, 30 arcsec (~1km) - 2025   |
// |Australia, Climate Projection, SRESA1FI based on NCAR-PCM1, 30 arcsec (~1km) - 2075 |
// |3 second SRTM Derived Digital Elevation Model (DEM) Version 1.0                     |
// |Accommodation Distribution, Australia (2015-2016)                                   |
// |Australia, Soil Grids (2012), 9 arcsec (~250 m)                                     |
// |CRUclim (global), current climate (1976-2005), 30 arcmin (~50km)                    |
// |Global, Potential Evapo-Transpiration and Aridity (1950-2000), 30 arcsec (~1km)     |
// |exCHELSA (extended bioclim) (2013, 30 arcsec (~1km))                                |

const exampleDataset = {
    SRESA1B: "Australia, exCHELSA (extended bioclim) (1980, 30 arcsec (~1km))",
    SRESA1FI:
        "Australia, Climate Projection, SRESA1FI based on NCAR-PCM1, 30 arcsec (~1km) - 2075",
    SRTM: "3 second SRTM Derived Digital Elevation Model (DEM) Version 1.0"
};

/**
 * Feature: ID84; I need to be able download these data files on my computer to use on my local computer
 */

describe("download data from the data explorer on to my local computer", () => {
    beforeEach(() => {
        // Given I am signed in
        cy.login();
        cy.visit("/");
    });

    it("can download 'Australia, Climate Projection, SRESA1B based on INM-CM30, 30 arcsec (~1km) - 2025' ", () => {
        cy.get('[data-cy="DatasetCard-card"]');
        cy.get('[data-cy="search-field"]').type(
            `${exampleDataset.SRESA1B}{enter}`
        );
        // When I press "More" next to <dataset>
        cy.get(
            `[data-cy="DatasetCard-card"][data-testid="${exampleDataset.SRESA1B}"]`
        )
            .first()
            .within(() => {
                cy.get('button[data-cy="more-button"]').click();
            });
        // And I press "Download"
        cy.get('a[data-cy="download-button"]');
    });

    /**
     * outstanding: // Then file is downloaded to my local computer
     * as:
     * Cypress waiting for a new page to load and throwing timed out error
     */
});
