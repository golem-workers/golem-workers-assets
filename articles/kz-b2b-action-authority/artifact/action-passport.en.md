# AI agent authority passport

Synthetic training example; not an IAM configuration or an audit of a real system. All identities, amounts and states are synthetic.

## 1. Action

| Action | Business decision | Separate identity | Required grant | Approval |
|---|---|---|---|---|
| Read selected corpus | allowed | reader | read_selected | owner approves corpus |
| Prepare local draft | allowed | drafter | draft_local | review before further use |
| Add CRM note | decision required | crm-writer | create_crm_note on selected objects | exact write |
| Send response | decision required | sender | send_quote via separate executor | content and recipient |
| Pay invoice | forbidden in pilot | none | none | outside pilot |
| Delete record | forbidden in pilot | none | none | outside pilot |

## 2. Complete for each permitted row

Process/company and object scope; business permission source; exposed tools; actual grants/roles and configuration reference; process owner; credential issuer; access/session revocation owner; policy revision; denial-test result; evidence location. Mark NOT VERIFIED until actual grants and denial are checked. Never insert secrets.

## 3. Approval packet

Operation identifier; action; object and revision; executor/company; recipient; immutable content and attachments; material amounts/currency; policy revision; approver identity/role; decision; expiry. Example:240000KZT,buyer@example.test.245000KZT or a new recipient requires a new decision. Not a service price or final payable total.

## 4. Log

operation_id | timestamp+timezone | policy_version | object_revision | executor | approver | decision | execution_status | destination_receipt | stop_reason. States: proposed → awaiting decision → authorized → executing → confirmed; uncertain outcome → reconciliation required. Approval is not execution. Without destination evidence, neither claim success nor retry blindly. Store no keys or full customer documents.

## 5. Stop drill

Pause new jobs; block execution path; revoke access/active sessions through supported controls; prove a new operation is denied; reconcile in-flight and unknown outcomes. Name a primary and backup owner. Measure actual stop time rather than promise it. Revocation does not undo a previous side effect.

## 6. Reproduction

Download permission_fixture.py from the same folder and run python3 permission_fixture.py. Expected passed=16,total=16:one valid passport and15altered declarations. These are16local declared-field checks, not a model,CRM,email,IAM,live-revocation,concurrency or security test.
