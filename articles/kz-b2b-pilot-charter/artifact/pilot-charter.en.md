# Pilot charter: working template

Author-created discussion tool, not a contract, technical guarantee or launch authorization. Name real people for each role. The teaching example is synthetic.

## One-page agreement

- Process and business question: [fill in].
- One system, version, environment, testable interface and owner: [fill in; mark unknowns].
- Input, permitted fields and RU/KK/other languages: [fill in].
- Verifiable output, draft location and internal recipient: [fill in].
- Excluded actions: [fill in].
- Process owner / reviewer / IT / integrator: [name each responsible person].
- Permitted data, model path and processing restrictions: [link separate agreement].
- Open dependency → owner → closure evidence → next review date: [fill in].
- Ordinary and difficult examples, expected behavior, acceptance criteria and method: [agree before testing].
- Evidence: scope → access test → integration record → acceptance finding → training and separate rollout decision: [link, version, owner for each].
- Manual fallback and support: [owner, instructions, terms; do not infer an SLA].
- Decision: continue / change scope / stop; decision owner and review date: [fill after dependency investigation].

## Teaching example

Open orders → local draft clarification list for a manager. One read-only test-register interface. 30 synthetic rows: 20 ordinary, 5 missing a date, 5 with conflicting fields; not model results. No order changes, email, supplier-date promises or payments. Only a synthetic access receipt exists: ACCESS_ONLY, not production-ready. In a real charter, interface and field availability remain an open dependency until verified.

## Change procedure

New system, recipient or action → new scope version → owner → additional checks → cost and timeline review → agreed decision. Old evidence cannot automatically be carried to the expanded scope. Adding email sending is outside the original local-draft boundary.

## Reproduction

Download pilot-charter.sample.json and pilot_charter_fixture.py from this directory into one local folder. Run: python3 pilot_charter_fixture.py. Expected: 14/14 checks; sampleStatus=ACCESS_ONLY. Complete declarations produce DECLARED_ROLLOUT_DECISION. This checks strings and declared fields, not document authenticity, model quality, CRM, security or actual authority to launch. Labels execute no actions. A responsible person must read and confirm actual evidence.
