
| [Main](README.md) | Installation | [Running &amp; Building](running-building.md) | [Testing](testing.md) | [Dependencies](dependencies.md) | [Credits](credits.md) |
|------|-------|-------|--------|--------|-------|

## Installation

1. __Set up alternative NPM registry__

    Before any `@ecocommons-australia` packages can be installed, you need to set an
    alternative registry into `npm` in order for it to be able to fetch requisite
    dependencies.

    To do this:
    ```bash
    npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/
    ```

2. __Clone the project__

    ```bash
    git clone git@gitlab.com:ecocommons-australia/ecocommons-platform/ui-client.git
    # or
    git clone https://gitlab.com/ecocommons-australia/ecocommons-platform/ui-client.git
    ```

3. __Install dependencies__

    ```bash
    npm ci
    ```
