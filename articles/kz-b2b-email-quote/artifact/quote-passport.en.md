# Quote passport — blank template and synthetic example

This is material for discussing a pilot, not a live commercial offer. The prices, products, roles and rules are training examples. The check does not connect to email, a model or a CRM.

| Field | Complete for the pilot | Synthetic example |
| --- | --- | --- |
| Email / deal | Identifiers and links | TEST-MSG-001 / TEST-DEAL-001 |
| Recipient / language | Verified address and response language | buyer@example.invalid / ru — the language in the original synthetic example |
| Request lines | Source excerpt, SKU, quantity, unit and match accuracy | P-100: 3 units; M-20: 2 kits; exact matches in the training example |
| Price source | Revision, rows and applicability to the customer and date | PB-2026-11-15-r1: row-P100 and row-M20 |
| Prices and currency | Confirmed values only | 48000.00 and 18000.00 KZT |
| Goods subtotal | Recalculate independently | 180000.00 KZT |
| Discount | Requested discount, approved discount and policy revision | Requested: 8%; approved: unknown; DISCOUNT-r1 |
| Price approver | Authorized role | Up to and including 5%: manager; above 5%: sales head; synthetic rule |
| Alternatives | Do not present a calculation as authorization | 8%: discount 14400.00, goods subtotal 165600.00 KZT; 5%: discount 9000.00, goods subtotal 171000.00 KZT |
| Tax basis | Confirmation of applicability and inclusion in price | Unknown; no rate assumed |
| Delivery | Cost, terms and confirmation | Unknown, not zero |
| Availability / delivery date | Source, check time, freshness and confirmed date | Unknown; the requested “by Friday” is not a delivery promise |
| Payment / quote validity | Confirmed terms | Unknown |
| Checksum | Content, sources, recipient, language and text | SHA-256 of the local revision; not a digital signature |
| Send authorization | Who authorized which revision, and when | None |
| Actual sending | Result ID / status; reconcile an uncertain result before retrying | Not sent |

Goods calculation: 3 × 48000.00 = 144000.00 KZT and 2 × 18000.00 = 36000.00 KZT, giving 180000.00 KZT. The requested 8% discount is 14400.00 KZT, leaving a goods subtotal of 165600.00 KZT. Under the 5% alternative, the discount is 9000.00 KZT and the goods subtotal is 171000.00 KZT. These are scenario calculations, not approvals. The 5% option still requires manager approval; sending requires separate permission. Because the tax basis and delivery are unknown, the final payable total remains unknown (`finalPayableTotal: null`).

## Resolving unknowns and obtaining fresh approval

1. Clarify an ambiguous SKU; if there is no applicable price, do not invent one.
2. If the tax basis or delivery is unknown, do not show a final payable total.
3. If the pricebook, line items, recipient, terms or text change, do not carry the previous approval over. A change to the document language also changes the fingerprint and requires fresh approval.
4. An approved price does not constitute permission to send.
5. After authorization, check the same revision and the freshness of the data immediately before the action; the hash alone does not eliminate the race between checking and acting.
6. If the send result is uncertain, reconcile the actual status first; do not resend blindly.

SHA-256 does not guarantee the authenticity of an approval record or an atomic send transaction. Approval-store authenticity, authorized roles, checks at the time of use, and sending and retry status must be implemented separately.

## Reproducing the check

Save `quote_fixture.py` and `synthetic-input.json` in the same directory and run `python3 quote_fixture.py`. The script creates `artifact-qa.json`: 12/12 expected local outcomes match, with principal goods amounts of 180000.00 / 165600.00 / 171000.00 KZT.

| No. | Synthetic case | Expected outcome |
| --- | --- | --- |
| 01 | Goods and discount arithmetic | `true` |
| 02 | The email leaves commercial terms unknown | `CLARIFY_TERMS` |
| 03 | A manager cannot approve an 8% discount | `ESCALATE_PRICE` |
| 04 | The exact, fully specified revision is approved and sending is authorized | `HAND_TO_HUMAN_FOR_SENDING` |
| 05 | A newer pricebook, PB-2026-11-15-r2, is observed | `REFRESH_PRICEBOOK` |
| 06 | The recipient changes | `REAPPROVE_REVISION` |
| 07 | The document text changes | `REAPPROVE_REVISION` |
| 08 | Stock information is stale: 16 minutes against a 15-minute limit | `REFRESH_STOCK` |
| 09 | Delivery terms are unknown | `CLARIFY_TERMS` |
| 10 | The item is not unambiguously matched | `CLARIFY_LINE` |
| 11 | The unsupported currency USD is supplied | `HOLD_CURRENCY` |
| 12 | Permission to send is missing | `AWAIT_SEND_PERMISSION` |

In the successful training case, all unknown terms are replaced with explicitly synthetic confirmations. These are not facts established by the customer’s email. That case returns only `HAND_TO_HUMAN_FOR_SENDING` and sends nothing.

The 15-minute stock freshness threshold and the 5% discount threshold are policy examples, not industry standards. This is a local deterministic policy check accompanying source analysis. It does not assess email extraction, LLM quality, legal applicability, Gmail/CRM security, approver authenticity or atomic sending. No live LLM, CRM or email test is performed.

