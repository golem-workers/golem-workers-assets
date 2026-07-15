# DNSid lab fixture

This dependency-free Node.js fixture implements a private `lab-json-v1` profile for evaluating `draft-ihsanullah-dnsid-01` record canonicalization, ES256 signatures, separate entity and operational keys, bilateral ISSUANCE signatures, key binding, and fresh ACTIVE status.

It is intentionally not a production DNSid implementation. The base draft does not define a concrete lifecycle-log binding or universal event serialization, and this fixture does not validate DNSSEC or a live TLS peer.

Run with Node.js 22 or newer:

```sh
npm test
npm run demo
```
