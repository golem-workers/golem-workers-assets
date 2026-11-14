# Access passport for a read-only 1C pilot

A template for IT, the accountant and the process owner. This is not a ready-made role, connector or legal opinion.

- Configuration / version / extensions / hosting / test environment:
- Report owner / engineer / reader / person who revokes access:
- One business question and what the answer must NOT imply:
- Reference report, version, filters, and methodology for payments and adjustments:
- Organization and row restrictions; who may see the total:
- Permitted fields; prohibited fields; data recipients / model processing environment:
- Report as-of time, time zone, retrieval time and acceptable data age:
- How to demonstrate completion of all pages and reconcile with the reference report:
- Currency and mixed-currency rules (stop if there is no rule):
- Account and verified prohibitions on modification / deletion / posting / unposting:
- Custom HTTP service: inspection of handlers and side effects:
- Logs without unnecessary business data; protected evidence, retention / deletion:
- An access error / timeout / incomplete result ≠ a zero result:
- Acceptance in a test infobase, including direct access within the agreed test:
- Review of RU/KK explanations and referral of exceptions to a human:
- Stop conditions and shutdown procedure:
- Date / signatures / limitations and what requires acceptance to be repeated:

## Completed synthetic example

Organization: `DEMO-KZ-A`; source: `approved-test-report-v1`; `asOf`: `2026-11-14T09:00:00+05:00`; `snapshotAt`: `2026-11-14T09:02:00+05:00`. `DEMO-101`: `remaining` = `120000.00` KZT; `DEMO-102`: `remaining` = `80000.00` KZT. Total: `200000.00` KZT. The illustrative source accounts for agreed payments and adjustments; it does not establish that payment is overdue. Completeness is declared by the training input; a real adapter must demonstrate it. Only `document` / `organization` / `remaining` / `currency` are allowed. POST / another organization / an extra field: deny; incompleteness / a different time / currency / source: hold; a failed read: unknown, with no total (`null`). A complete empty selection means `0.00` only within the agreed scope. This is not production validation.
