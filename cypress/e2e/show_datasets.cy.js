/// <reference types="cypress" />

const datasetsSelectionLabels = {
    all_datasets: "All datasets",
    my_datasets: "My datasets",
    shared_datasets: "Shared datasets"
};

describe("login and show filtering on the basis of users on datasets", () => {
    beforeEach(() => {
        cy.login()
        cy.contains("Datasets").click()
    });

    it("shows all the datasets by default", () => {
        cy.get('[data-cy="show-datasets-button"]').should(
            "contain",
            datasetsSelectionLabels.all_datasets
        );
    });

    it("can show only my datasets", () => {
        cy.get('[data-cy="show-datasets-button"]').click()
          .get(
            `a[data-cy="show-datasets-menuItem"][data-testid="${datasetsSelectionLabels.my_datasets}"]`
            ).as("myDatasetLink")
          .get("@myDatasetLink").click({ force: true })
          .get('[data-cy="show-datasets-button"]').should(
            "contain",
            datasetsSelectionLabels.my_datasets
            );
    });

    it("Show shared datasets", () => {
        cy.get('[data-cy="show-datasets-button"]').click()
          .get(
            `a[data-cy="show-datasets-menuItem"][data-testid="${datasetsSelectionLabels.shared_datasets}"]`
            ).as("sharedDatasetLink")
          .get("@sharedDatasetLink").click({ force: true })
          .get('[data-cy="show-datasets-button"]').should(
            "contain",
            datasetsSelectionLabels.shared_datasets
            )
    });

    it("hides `Show Datasets` for guests", () => {
        cy.get('button[data-cy="root-logged-in"]').click()
          .get('a[data-cy="sign-out"]').as("signOutLink")
          .get("@signOutLink").click({ force: true })
          .wait(1000)
          .get('h6[data-cy="show-datasets-label"]').should("not.exist")
    });
});
