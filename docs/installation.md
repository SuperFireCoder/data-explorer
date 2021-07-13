
| [Main](README.md) | Installation | [Running &amp; Building](running-building.md) | [Testing](testing.md) | [Dependencies](dependencies.md) | [Credits](credits.md) |
|------|-------|-------|--------|--------|-------|

## Installation

There are 2 methods of running the DataExplorer:
- running in Docker container
- running in local host environment

### Running in Docker Container

1. __Clone the project__

    ```bash
    git clone git@gitlab.com:ecocommons-australia/ecocommons-platform/ui-client.git
    # or
    git clone https://gitlab.com/ecocommons-australia/ecocommons-platform/ui-client.git
    ```

2. __Setup the .env file__

    - Copy the env-example.txt as .env file
    - edit .env to set the NPM_AUTHTOKEN variable to a gitlab personal access token.

### Running in Local Host Environment

1. __Clone the project__

    ```bash
    git clone git@gitlab.com:ecocommons-australia/ecocommons-platform/ui-client.git
    # or
    git clone https://gitlab.com/ecocommons-australia/ecocommons-platform/ui-client.git
    ```

2. __Set up alternative NPM registry__

    Before any `@ecocommons-australia` packages can be installed, you need to set an
    alternative registry into `npm` in order for it to be able to fetch requisite
    dependencies.

    To do this:
    ```bash
    export NPM_AUTHTOKEN=<gitlab persoanl token with api scope> 
    npm config set @ecocommons-australia:registry https://gitlab.com/api/v4/packages/npm/
    npm config set '//gitlab.com/api/v4/packages/npm/:_authToken' $NPM_AUTHTOKEN
    ```

3. __Install dependencies__

    ```bash
    npm ci
    ```
