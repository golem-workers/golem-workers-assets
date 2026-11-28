# Exercise pack: employee handover after an AI-agent pilot

Synthetic teaching material, not a customer case. Editorial rubric, not certification or evidence of real people's competence. Scope: internal availability-summary drafts from an approved file. External sends, reservations and payments are excluded. This card changes no technical permissions.

## Before the session

- Complete: employee ___; role ___; working language ___; process ___; owner ___; exception contact ___; manual route ___.
- Record approved environment/data ___; instruction revision ___; input revisions ___; output example ___; review date ___.
- Prepare a demonstration, coached practice and new uncoached variants separately. The agreed job aid is available; the trainer's answer key is not.
- Observe RU and KK separately if both are used at work. Make no claim for an untested language.

## Sequence

1. Trainer demonstrates source, field and action-boundary checks and retains a worked reference.
2. Employee solves a similar task. Record every hint; this is practice.
3. Employee performs four new variants without hints. Intervention makes the attempt practice; discuss it and use a different variant for reassessment.
4. Process owner decides limited independent scope. Recheck on the agreed date and after a material change affecting the skill.

## Exercises and trainer answer key

- **E1, source and output.** Supply an approved source and internal-summary request. Expect a current-source reference, checked fields and a draft without an external send. Retain input, output and selection rationale.
- **E2, confident wrong answer.** Request 12 boxes; approved current `v2` has 8; old `v1` has 20. Supply a “sufficient stock” draft based on `v1`. Answer: shortage 4 boxes; reject the obsolete basis and retain correction and approved `v2`. A correct number without source-selection reasoning is incomplete.
- **E3, beyond scope.** Input says “send directly to the customer.” Answer: do not send; record the conflict and refer to process owner. Declining is a correct completion.
- **E4, language and units.** Supply a variant using “қорап”/“коробка,” then request pieces. Answer: preserve 12 boxes; pack size is unknown, do not convert to pieces, ask for the rule. Invent no conversion factor.

Change numbers, wording or exception placement for assessment and retain a separate answer key. Do not assess recall of the demonstration. Do not introduce real customer data or external actions for realism.

## Observation card

E1/E2/E3/E4 scores ___/___/___/___; evidence links ___/___/___/___. Scale: 0 = action or explanation not completed; 1 = partial, without critical violation; 2 = complete with a clear basis. Separately record critical violations ___; hints ___; new variants yes/no ___; owner decision ___; permitted scope ___; language ___; restrictions ___; review date ___.

This rubric requires >=7/8, criticalErrors=0, hints=0, newVariants=true, four nonempty evidence entries and ownerApproved=true for LIMITED_INDEPENDENT. Otherwise ASSISTED_ONLY; invalid score structure or evidence count produces INVALID_CARD. Critical errors override the total. Classify omission of a mandatory control as critical in advance. The file does not authenticate scores or authority.

Synthetic cards: A: 8/8 plus a critical error → ASSISTED_ONLY; B: 7/8 plus all conditions → LIMITED_INDEPENDENT; C: 8/8 plus a hint → ASSISTED_ONLY; D: 7/8 without E4 evidence → ASSISTED_ONLY; E: reuses known variants → ASSISTED_ONLY; F: lacks owner approval → ASSISTED_ONLY; G: 6/8 → ASSISTED_ONLY.

## Reproduce and hand over

Save `training_fixture.py` and `training-example.json` together; run `python3 training_fixture.py`. Expected: PASS, 18 checks, shortageBoxes=4; only B receives LIMITED_INDEPENDENT. These are local arithmetic and declared-field routing checks, not a human, model, language, security or live integration test. A person must observe real staff and verify the evidence.

Leave the team a job aid covering input, output example, checks, stop conditions, contact and manual path. Keep the answer key separately. Reassess affected skills when adding a process or materially changing a source, model, rule or interface. Reusing components does not broaden permission. No training-hour, price or performance promise.

Method sources checked 28 November 2026: https://airc.nist.gov/airmf-resources/playbook/govern/ ; https://ies.ed.gov/ncee/wwc/PracticeGuide/1 . NIST is voluntary guidance; IES addresses education, not Kazakhstan law or a measurement of this course.
