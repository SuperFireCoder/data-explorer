
| [Main](README.md) | Installation | [Quick Start](quick_start.md) | [Testing](testing.md) | [Dependencies](dependencies.md) | [Credits](credits.md) |
|------|-------|-------|--------|--------|-------|

## Installation

This is a template only. Replace the following lines with your own content.

To install this module, choose one of the sections below: 

- Stand-Alone: 
    - to install this module locally without the use of Docker, follow the steps described in this section.
- Docker Compose: 
    - we recommend to use docker-compose
    - to execute this module locally, follow the steps described in this section.


### Clone this Project

```shell script
git clone https://gitlab.com/ecocommons-australia/ecocommons-platform/ui-client.git
```

### Stand-Alone


```shell script

# download node from nodejs.org/en/
# install node

npm init
npm install npm@latest -g
npm install -g yarn
...
yarn init
yarn install
yarn run
```

### Docker Compose

To build the project for the first time:

```shell script
docker-compose build
```

To run the project:

```shell script
docker-compose up
```

To stop the project:

```shell script
docker-compose stop
```