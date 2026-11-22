# Field-and-exception passport

Synthetic teaching set for an incoming payment request and contract clause. Not customer data, a legal opinion or a payment instruction.

## Blank worksheet: copy for your pilot

- Document class and approved input channel: ______
- Reviewer/process owner: ______
- Document ID, page, original passage: ______
- Raw value / normalized value: ______
- Validation rule / result / reason: ______
- Supplier verification and changed bank details: ______
- Duplicate suspicion / compared revision: ______
- Next action / responsible person: ______
- Prohibited actions / retention period: ______

## DEMO-009

Teaching invoice DEMO-009, 22 November 2026, page 1, supplier DEMO-SUP-A is a fictional master-data key, not a BIN. Lines: 10 × 12500 = 125000 KZT; 2 × 7500 = 15000 KZT. Line sum 140000 KZT; printed 148000 KZT; difference 8000 KZT. No tax, freight, discount or other adjustment exists in this example. Route AMOUNT_MISMATCH. Do not repair the source; request an explanation or corrected document.

## DEMO-CONTRACT-09-r1

DEMO-CONTRACT-09-r1, page 2, clause 4.2: within 10 working days after signed acceptance. No acceptance date or agreed working-day calendar is supplied. Calculated due date: null; route CLARIFY_DEADLINE. The responsible reviewer must check applicable revisions and amendments.

## Case → expected route

- 1. Clean source-checked packet → `READY_FOR_HUMAN_REVIEW`
- 2. Printed 148000 vs lines 140000 → `AMOUNT_MISMATCH`
- 3. Letter O in 14O000 → `CHECK_NUMBER`
- 4. Missing supplier → `MISSING_FIELD`
- 5. Different scan of same invoice → `CHECK_DUPLICATE`
- 6. Currency absent → `MISSING_FIELD`
- 7. USD rather than KZT → `CHECK_CURRENCY`
- 8. Unknown deadline trigger → `CLARIFY_DEADLINE`
- 9. Changed bank details → `VERIFY_BANK_CHANGE`
- 10. Source unchecked → `CHECK_SOURCE`

## Python 3

Download the three files into one directory. Run python 3 document_fixture.py. Expected result: result: PASS, passed: 10, total: 10. This is a deterministic check of pre-extracted fields; it calls no OCR, LLM, ERP, bank or network.

- [document_fixture.py](document_fixture.py)
- [synthetic-documents.txt](synthetic-documents.txt)

READY_FOR_HUMAN_REVIEW authorizes no payment, signature or accounting write. A document and correct arithmetic do not prove delivery. Actual accuracy, permissions and legal requirements need separate checks.
