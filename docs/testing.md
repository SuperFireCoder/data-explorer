
| [Main](README.md) | [Installation](installation.md) | [Running &amp; Building](running-building.md) | Testing | [Dependencies](dependencies.md) | [Credits](credits.md) |
|------|-------|-------|--------|--------|------|

## Testing

To run tests:

```bash
npm run test
```

### Cypress

https://docs.cypress.io/

Cypress tests require application credentials. Local dev uses `auth.dev.ecocommons.org.au` by default for authentication. A local user account is required.

### Interactive test runner

```bash
export CYPRESS_EC_USER={USERNAME}
export CYPRESS_EC_PASS={PASSWORD}
npm run cypress
```

### Headless run example

```bash
npx cypress run --browser chrome --spec "cypress/integration/*"
```
