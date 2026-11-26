# AI agent pilot acceptance record

Template, not a service acceptance deed or legal opinion. All filled figures below are synthetic teaching inputs; replace them entirely with actual observations.

## Agree before running

- Process owner / reviewer / date: ___ / ___ / ___
- Scenario, permitted action and deliverable: draft request record; no sending or payment.
- Model, instructions, components, sources and interface version: ___
- Frozen task set, reference answers, hash / storage location: ___
- Routine cases, exceptions, RU/KK and risk strata: ___
- Accepted task: every required field, source and permitted route checked; employee decision recorded.
- Threshold in each language stratum: at least 95%; critical errors: 0; cost per accepted result: no more than 450 KZT. Teaching thresholds, not industry standards.
- Critical error: wrong recipient, prohibited disclosure or unauthorized action. Lower cost cannot override the stop condition.
- Permitted correction before acceptance, reviewer and effort: ___
- Repeat policy for variable outputs; separation of tuning and held-out tasks: ___

## One ledger row per task and trial

ID | language | type/risk | baseline minutes | review minutes | correction minutes | manual fallback minutes | waiting minutes | service KZT | accepted 0/1 | critical 0/1 | outcome evidence | reviewer

Keep waiting separate from active person-minutes. Add the effort of two simultaneous employees; record elapsed time separately. Manual completion does not convert a failed agent result into an accepted agent result. Retain all failed-attempt costs in the numerator.

## Teaching result from acceptance-ledger.csv

- 40 matched tasks: RU20, KK20; baseline 40 accepted results and 400 person-minutes.
- Agent-assisted:36 accepted results, RU19/20 and KK17/20;1 critical error;4 unaccepted results handled manually.
- Full human effort:220 minutes including review, correction and manual fallback across all 40 tasks.
- Assumed labor rate:3,000 KZT/hour=50 KZT/minute; service costs 2,400 KZT for all attempts. Not a GolemWorkers tariff.
- Baseline:400×50/40=500 KZT per accepted task.
- Assisted:(220×50+2,400)/36=372.22 KZT per accepted agent result.
- Dividing by 40 gives 335 KZT per attempt, not per successful result.180 minutes released; cash savings not demonstrated.
- Development, training, maintenance, downtime and damage are excluded:account for them separately before a full-budget decision.

## Error register

SYN-20:wrong beneficiary in the draft; employee blocks sending. No actual payment executed. Monetary damage was not modeled; do not record zero as the risk estimate. Exposure, probability, investigation and recovery costs require a separate owner assessment. Correction labor is already in person-minutes; do not double-count it.

## Decision

STOP_CRITICAL. Do not accept the current result or expand:1 critical error; KK85% below the illustrative 95%. Even removing the critical flag leaves RETEST_QUALITY. Correct the cause, preserve the original run and test a new held-out set. A passing retest supports a separate bounded decision; it does not automatically authorize production.

- Cause / fix / new set / date: ___
- Decision:stop / retest / bounded expansion: ___
- Next boundary, owner and manual fallback: ___
- Process owner and accepting party signatures: ___

Reproduce arithmetic with `python 3 acceptance_fixture.py` next to the CSV.17 local field/arithmetic checks do not test a model, language, integration, security or authenticity of the underlying evidence.
