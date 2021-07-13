
| [Main](README.md) | [Installation](installation.md) | Running &amp; Building | [Testing](testing.md) | [Dependencies](dependencies.md) | [Credits](credits.md) |
|------|-------|-------|--------|--------|-------|

## Running &amp; Building

### Running in Docker Container

- Start the docker container services:

```bash
docker-compose up -d

```

- Goto http://localhost:3000 on a browser.

- To stop the docker-container service:

```bash
docker-compose down

```


### Running in Local Host Environment

For a quick local development instance, you simply start the Next.js server:
```bash
npm run dev
```

To stop the server:

```bash
npm stop

```


#### Building

To build:
```bash
npm run build
```

The built files will be located in `./.next`. Refer to Next.js documentation for
deployment and other considerations: https://nextjs.org/docs/deployment.

### Debugging

The provided `dev` npm script is set to open up a port for debugging. More info
can be found at https://nextjs.org/docs/advanced-features/debugging.

