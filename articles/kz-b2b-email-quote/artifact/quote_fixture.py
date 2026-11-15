#!/usr/bin/env python3
"""Local synthetic quote-policy demonstration. No model, network, CRM or email."""
from pathlib import Path
from copy import deepcopy
from decimal import Decimal
import hashlib,json

P=Path(__file__).parent
D=Decimal
def fingerprint(q):
    # Excludes the approval envelope; includes ALL commercial/source/document fields.
    body={k:v for k,v in q.items() if k!='approval'}
    return hashlib.sha256(json.dumps(body,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def goods_amount(q):
    return sum((D(str(x['quantity']))*D(str(x['unitPriceKzt'])) for x in q['lines']),D('0')).quantize(D('.01'))
def assess(q):
    if q['currency']!='KZT':return 'HOLD_CURRENCY'
    if any(not x['exactMatch'] or not x['priceSourceRow'] or D(str(x['quantity']))<=0 for x in q['lines']):return 'CLARIFY_LINE'
    if q['pricebookVersion']!=q['currentPricebookVersion']:return 'REFRESH_PRICEBOOK'
    if q['terms']['stockAgeMinutes']>q['policy']['stockMaxAgeMinutes']:return 'REFRESH_STOCK'
    if any(q['terms'].get(k) in (None,'') for k in ['taxBasis','delivery','availability','deliveryDate','payment','validUntil']):return 'CLARIFY_TERMS'
    a=q.get('approval') or {}
    if a.get('fingerprint')!=fingerprint(q):return 'REAPPROVE_REVISION'
    role='sales-head' if D(str(q['discountPercent']))>D(str(q['policy']['managerMaxDiscountPercent'])) else 'manager'
    if a.get('priceRole')!=role:return 'ESCALATE_PRICE'
    if a.get('sendAuthorized') is not True:return 'AWAIT_SEND_PERMISSION'
    return 'HAND_TO_HUMAN_FOR_SENDING'

def scenario(q,percent):
    amount=goods_amount(q);discount=(amount*D(str(percent))/100).quantize(D('.01'))
    return {'goodsBeforeDiscountKzt':str(amount),'discountPercent':str(percent),'discountKzt':str(discount),'goodsAfterDiscountKzt':str(amount-discount),'finalPayableTotal':None}
def sign(q,role='sales-head',send=True):
    q['approval']={'fingerprint':fingerprint(q),'priceRole':role,'sendAuthorized':send}
    return q
def run():
    q=json.loads((P/'synthetic-input.json').read_text())
    # Fully specified terms below are separate synthetic acceptance inputs, NOT facts from the email.
    complete=deepcopy(q)
    complete['terms'].update(taxBasis='APPROVED_TEST_TAX_BASIS_NO_RATE_ASSERTED',delivery='APPROVED_TEST_DELIVERY_TERMS',availability='APPROVED_TEST_STOCK',deliveryDate='APPROVED_TEST_DATE',payment='APPROVED_TEST_PAYMENT',validUntil='APPROVED_TEST_EXPIRY')
    complete['draftText']='TEST ONLY: confirmed synthetic commercial revision,not a customer offer'
    complete=sign(complete)
    cases=[]
    def add(name,actual,expected):
        cases.append(dict(case=name,actual=actual,expected=expected,pass_=actual==expected))
    a=scenario(q,8);b=scenario(q,5)
    add('01-goods-arithmetic',a=={'goodsBeforeDiscountKzt':'180000.00','discountPercent':'8','discountKzt':'14400.00','goodsAfterDiscountKzt':'165600.00','finalPayableTotal':None} and b['goodsAfterDiscountKzt']=='171000.00',True)
    add('02-email-has-unknown-terms',assess(q),'CLARIFY_TERMS')
    z=deepcopy(complete);sign(z,'manager');add('03-manager-cannot-approve-eight-percent',assess(z),'ESCALATE_PRICE')
    add('04-exact-complete-approved-revision',assess(complete),'HAND_TO_HUMAN_FOR_SENDING')
    z=deepcopy(complete);z['currentPricebookVersion']='PB-2026-11-15-r2';add('05-new-pricebook-observed',assess(z),'REFRESH_PRICEBOOK')
    z=deepcopy(complete);z['recipient']='different-buyer@example.invalid';add('06-recipient-changed',assess(z),'REAPPROVE_REVISION')
    z=deepcopy(complete);z['draftText']+=' edited';add('07-document-text-changed',assess(z),'REAPPROVE_REVISION')
    z=deepcopy(complete);z['terms']['stockAgeMinutes']=16;add('08-stale-stock',assess(z),'REFRESH_STOCK')
    z=deepcopy(complete);z['terms']['delivery']=None;add('09-unknown-delivery',assess(z),'CLARIFY_TERMS')
    z=deepcopy(complete);z['lines'][0]['exactMatch']=False;add('10-ambiguous-item',assess(z),'CLARIFY_LINE')
    z=deepcopy(complete);z['currency']='USD';add('11-unhandled-currency',assess(z),'HOLD_CURRENCY')
    z=deepcopy(complete);sign(z,send=False);add('12-no-send-permission',assess(z),'AWAIT_SEND_PERMISSION')
    result={'result':'PASS' if all(c['pass_'] for c in cases) else 'FAIL','casesFinished':len(cases),'casesPassed':sum(c['pass_'] for c in cases),'scenario8':a,'scenario5':b,'cases':cases,'limits':['Synthetic deterministic policy only;not email extraction,LLM accuracy,live Gmail/CRM or transactional send safety.','Fingerprint not digital signature;approval store authenticity/roles/time-of-use/retry safety require separate implementation.','Tax basis and delivery unknown in input;goods-only totals never final payable totals.','Thresholds5percent and15minutes are synthetic policy,not industry guidance.']}
    (P/'artifact-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False,indent=2))
    return 0 if result['result']=='PASS' else 1
if __name__=='__main__':raise SystemExit(run())
