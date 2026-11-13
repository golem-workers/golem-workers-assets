"""Synthetic decision-policy illustration only: no network, AI model or CRM writes.
Run: python3 intake_fixture.py. Not a production adapter or exactly-once system.
"""
import json, hashlib
from pathlib import Path

def digest(payload):
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()

def decide(event, receipt=None):
    if not all(event.get(x) for x in ("organization", "source", "eventId")):
        return "HOLD_SOURCE"
    receipt = receipt or {}
    current = digest(event["payload"])
    if receipt.get("payloadHash") and receipt["payloadHash"] != current:
        return "HOLD_CONFLICT"
    if receipt.get("taskState") == "confirmed" and receipt.get("leadId") and receipt.get("taskId"):
        return "RETURN_RECEIPT"
    if receipt.get("leadState") == "unknown":
        return "RECONCILE_LEAD"
    if receipt.get("taskState") == "unknown":
        return "RECONCILE_TASK"
    if not event["payload"].get("contact"):
        return "ASK_CONTACT"
    if len(event.get("candidateIds", [])) > 1:
        return "REVIEW_MATCHES"
    if not event.get("approvedExactPayload"):
        return "WAIT_APPROVAL"
    if receipt.get("leadId") and receipt.get("leadState") == "confirmed":
        return "CREATE_TASK"
    return "CREATE_LEAD"

if __name__ == "__main__":
    cases=json.loads(Path(__file__).with_name("acceptance-cases.json").read_text())
    results=[{"case":c["case"],"expected":c["expected"],"actual":decide(c["event"],c.get("receipt"))} for c in cases]
    assert all(x["expected"]==x["actual"] for x in results), results
    print(json.dumps({"result":"PASS","cases":len(results),"results":results,"scope":"local deterministic policy; no model, network, live CRM or side effects"},ensure_ascii=False,indent=2))
