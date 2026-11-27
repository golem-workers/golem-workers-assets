# AI agent maintenance RACI and runbook

Synthetic teaching example. Not a customer deployment, live API/LLM test or SLA promise. Time:27 Nov2026 08:30 Asia/Almaty. Proposal drafts only;no customer messages or payments.

## Roles

B:business process owner;O:operations coordinator;T:technical maintainer;D:data/rule owner. R executes,A is accountable,C is consulted,I is informed. One A per row. Roles may be combined;name a backup.

## Matrix

| Activity | B | O | T | D |
|---|---|---|---|---|
| Receive signal | I | A/R | C | I |
| Contain and activate manual work | C | A/R | R | I |
| Repair API/model | I | C | A/R | C |
| Approve current rule | A | I | C | R |
| Reconcile tasks and effects | A | R | C | C |
| Authorize limited return | A | R | C | C |

## Three independent cases

HTTP200 without required customer field:pause dependent writes,check response schema and adapter. Repair evidence:schemaMatched.

Retired model:a saved prompt cannot restore it. Check a replacement and data boundary:replacementTested,dataBoundaryApproved. Rollback to the retired model is unavailable.

price-v7 after price-v8 takes effect:approve current rule and check source,index,cache:approvedCurrentRule,sourceIndexCacheChecked. Do not roll back to the obsolete rule.

## Queue

T01–T03 confirmed:link existing results,never replay. T04–T05 confirmed absent:controlled retry candidates only after idempotencyVerified and authorized. T06–T08 unknown:HOLD until target-system reconciliation.8 = 3 + 2 + 3;never replay all8.

## Return conditions

Every case also requires testsPassed,manualPathVerified,restartAuthorized. Any missing evidence leaves STOPPED;all evidence yields LIMITED_RETURN,not unrestricted rollout. Check RU and KK separately,failure cases and human handoff.

## Fill before use

Fill names,contacts and backups;Almaty coverage hours,weekends/holidays,channel,acknowledgment and next update. Response,recovery and availability are separate commitments. No24/7 promise. If the manual path is unverified,the process is suspended.

## Incident record

Retain signal/impact,versions,containment proof,manual owner,queue outcomes,repair/authorization,RU/KKchecks,restart volume,observer,stop condition and acknowledged handoff. Restrict access and retention;exclude credentials.

## Reproduce

Download operations-example.json and operations_fixture.py into one folder;run python3 operations_fixture.py. Declared-field and deterministic routing checks do not authenticate evidence or establish working-agent quality.
