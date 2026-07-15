# A2A Protocol 1.0 migration fixture

Dependency-free Node.js 22 fixture for the accompanying GolemWorkers article.

It checks four migration boundaries:

- v1 Agent Cards use `supportedInterfaces` with interface-scoped protocol versions;
- v1 JSON-RPC uses `SendMessage`, `ROLE_USER`, and member-based parts without `kind`;
- every request carries an accepted `A2A-Version` header;
- terminal tasks never restart;
- the repository query is constrained by authenticated subject and tenant before records are returned.

Run:

```bash
npm ci
npm test
npm run demo
```

This fixture is a migration and policy harness, not a complete A2A server or a substitute for the official SDK and conformance tests.
