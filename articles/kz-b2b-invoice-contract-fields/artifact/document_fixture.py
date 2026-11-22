#!/usr/bin/env python3
"""Ten synthetic field-packet checks. No OCR, model, payment, ERP or network."""
from decimal import Decimal, InvalidOperation
from copy import deepcopy
import json
from pathlib import Path

BASE = {
 "document_id":"DEMO-INV-09-r1","kind":"payment_request","page":1,
 "supplier_id":"DEMO-SUP-A","invoice_no":"DEMO-009","invoice_date":"2026-11-22",
 "currency":"KZT","lines":[{"qty":"10","unit_price":"12500"},{"qty":"2","unit_price":"7500"}],
 "printed_total":"140000","adjustments":"0","source_ref":"synthetic-documents.txt#invoice",
 "already_seen":False,"bank_changed":False,"source_checked":True,
 "deadline_text":None,"deadline_event_confirmed":False,"calendar_agreed":False,
 "legal_effect":"not_assessed","confidence":0.99
}
def route(p):
 if not p.get("source_ref") or not p.get("source_checked"):return "CHECK_SOURCE"
 if p.get("kind")=="contract":
  if not p.get("deadline_event_confirmed") or not p.get("calendar_agreed"):return "CLARIFY_DEADLINE"
  return "CONTRACT_REVIEW"
 if not all(p.get(k) for k in ["supplier_id","invoice_no","invoice_date","currency"]):return "MISSING_FIELD"
 if p["currency"]!="KZT":return "CHECK_CURRENCY"
 try:
  total=sum(Decimal(x["qty"])*Decimal(x["unit_price"]) for x in p["lines"])+Decimal(p["adjustments"])
  printed=Decimal(p["printed_total"])
  if not total.is_finite() or not printed.is_finite():return "CHECK_NUMBER"
 except (InvalidOperation,KeyError,TypeError):return "CHECK_NUMBER"
 if total!=printed:return "AMOUNT_MISMATCH"
 if p["already_seen"]:return "CHECK_DUPLICATE"
 if p["bank_changed"]:return "VERIFY_BANK_CHANGE"
 return "READY_FOR_HUMAN_REVIEW"

def main():
 cases=[]
 def add(name,changes,expected):
  p=deepcopy(BASE);p.update(changes);actual=route(p)
  cases.append({"case":name,"expected":expected,"actual":actual,"passed":actual==expected,
   "input":p,"paymentAuthorized":False})
 add("clean source-backed packet",{},"READY_FOR_HUMAN_REVIEW")
 add("printed148000 vs lines140000",{"printed_total":"148000"},"AMOUNT_MISMATCH")
 add("OCR letter O is not digit zero",{"printed_total":"14O000"},"CHECK_NUMBER")
 add("missing supplier remains unknown",{"supplier_id":None},"MISSING_FIELD")
 add("rescan same business identity",{"already_seen":True,"file_hash":"new-scan-hash"},"CHECK_DUPLICATE")
 add("currency absent",{"currency":None},"MISSING_FIELD")
 add("another currency not silently converted",{"currency":"USD"},"CHECK_CURRENCY")
 add("contract ten working days after acceptance",{"kind":"contract","deadline_text":"10 working days after signed acceptance"},"CLARIFY_DEADLINE")
 add("bank details changed",{"bank_changed":True},"VERIFY_BANK_CHANGE")
 add("field exists but source was not checked",{"source_checked":False},"CHECK_SOURCE")
 result={"result":"PASS" if all(x["passed"] for x in cases) else "FAIL","passed":sum(x["passed"] for x in cases),
 "total":len(cases),"synthetic":True,"scope":"Deterministic local field validation only; not OCR, LLM, extraction quality, legal review or integration security.",
 "calculation":{"lineTotalKZT":"140000","printedTotalKZT":"148000","differenceKZT":"8000"},
 "important":"Even READY_FOR_HUMAN_REVIEW does not authorize any payment, contract signature or accounting write.",
 "cases":cases}
 print(json.dumps(result,ensure_ascii=False,indent=2))
 if result["result"]!="PASS":raise SystemExit(1)
if __name__=="__main__":main()
