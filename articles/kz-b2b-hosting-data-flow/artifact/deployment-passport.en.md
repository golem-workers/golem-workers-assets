# AI agent deployment passport: data paths

Checked23 November 2026. Educational artifact for article10. Not a legal opinion, network audit or verification of a real installation.

## Process owner's decision

Process: ______. Output: ______. Data categories: ______. Content that must not be transferred: ______. Process owner: ______. IT / security / personal-data owners: ______.

One process, one map. Update it for a new channel, tool or document class. Do not add secrets or customer documents.

## Eight paths in the teaching example

| Path | Teaching value | Fill for a real system |
| --- | --- | --- |
| intake | KZ, text and attachment | Source, minimum fields, operator |
| runtime | KZ, temporary file | Host, directories, deletion |
| model | EXTERNAL, transfer unapproved | Model, endpoint, processor, region, account terms |
| memory | KZ, chunks and history | Databases, index, separate embedding service |
| logs | KZ, error and possible content | Actual recorded fields and deletion period |
| backup | KZ, file and memory copy | Copy location, retention, restoration |
| support | UNKNOWN, transfer unapproved | Recipient, access country, bundle contents |
| result | KZ, draft for employee | Delivery channel, copies, forwarding |

For EVERY path: content; processing location; storage location; recipients and support access; retention and deletion; accountable owner; approval status; evidence and check date. Generic cloud or ownership labels do not fill the region field.

Six internal paths do not make the whole example local-only. Changing only model leaves support unresolved. Declared KZ values are assumptions, not measured locations.

## Architecture choice

1. Runtime and model inside the agreed environment: verify compute, RU/KK quality, operations, updates and every external tool.
2. Runtime in KZ, model outside: inspect the actual request, minimization, transfer grounds, region and feature/account terms. Describe it as a hybrid.
3. Runtime and model with providers: separately agree regions, retention, support, export, deletion and operating responsibilities.

Server / model-account owner: ______. Who pays compute / model / integration: ______. Who can repeat verification and train employees: ______. No price or SLA is established here.

## Acceptance sequence

- Inspect an actual model request with synthetic content.
- Check OCR, embeddings, search and messaging if used.
- Show an error record and support bundle without working data.
- Verify backup location and perform a trial restore.
- Check content deletion and backup retention conditions.
- Record unknown destinations; keep working data out until resolved.
- Give the map to the personal-data owner and legal counsel: Articles 12 and 16 address separate questions; sector restrictions require separate review.

## Reproduce the exercise

Download flow_fixture.py from the same artifact directory and run `python3 flow_fixture.py`. Expect12/12 checks. This validates declared map fields only, not a network, model, security, law or real system. `ready` = this schema's fields are complete and approved; `local_only` = all its paths are declared KZ. An approved external path can yield ready=true and local_only=false. Both are false for the article's example. Add real paths missing from the teaching map; the program cannot discover them.
