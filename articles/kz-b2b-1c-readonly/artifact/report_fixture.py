"""Synthetic acceptance policy only; no network, 1C, credentials or LLM."""
import copy,json
from pathlib import Path
from decimal import Decimal
P=Path(__file__).parent
BASE={'organization':'DEMO-KZ-A','asOf':'2026-11-14T09:00:00+05:00','snapshotAt':'2026-11-14T09:02:00+05:00','complete':True,'source':'approved-test-report-v1','rows':[{'document':'DEMO-101','organization':'DEMO-KZ-A','remaining':'120000.00','currency':'KZT'},{'document':'DEMO-102','organization':'DEMO-KZ-A','remaining':'80000.00','currency':'KZT'}]}
FIELDS={'document','organization','remaining','currency'}
def evaluate(s,method='GET'):
 if method!='GET':return {'status':'DENY_METHOD','total':None}
 if s is None:return {'status':'UNKNOWN_READ','total':None}
 if s.get('organization')!='DEMO-KZ-A' or any(r.get('organization')!='DEMO-KZ-A' for r in s.get('rows',[])):return {'status':'DENY_SCOPE','total':None}
 if s.get('asOf')!=BASE['asOf'] or s.get('snapshotAt')!=BASE['snapshotAt']:return {'status':'HOLD_TIME','total':None}
 if s.get('complete') is not True:return {'status':'HOLD_PARTIAL','total':None}
 if s.get('source')!=BASE['source']:return {'status':'HOLD_SOURCE','total':None}
 if not isinstance(s.get('rows'),list):return {'status':'HOLD_SCHEMA','total':None}
 for r in s['rows']:
  if set(r)!=FIELDS:return {'status':'DENY_FIELDS','total':None}
  if r['currency']!='KZT':return {'status':'HOLD_CURRENCY','total':None}
  try:
   n=Decimal(r['remaining'])
   if not n.is_finite() or n<0:return {'status':'HOLD_AMOUNT','total':None}
  except Exception:return {'status':'HOLD_AMOUNT','total':None}
 return {'status':'READY' if s['rows'] else 'EMPTY_CONFIRMED','total':str(sum((Decimal(r['remaining']) for r in s['rows']),Decimal('0.00')))}
def main():
 cases=[]
 def check(name,s,expected,method='GET',total=None):
  actual=evaluate(s,method);assert actual['status']==expected,(name,actual);assert actual['total']==total,(name,actual);cases.append({'case':name,'expected':expected,'actual':actual,'pass':True})
 check('complete approved KZT snapshot',copy.deepcopy(BASE),'READY',total='200000.00')
 check('POST blocked',copy.deepcopy(BASE),'DENY_METHOD',method='POST')
 s=copy.deepcopy(BASE);s['rows'][0]['organization']='DEMO-KZ-B';check('foreign organization',s,'DENY_SCOPE')
 s=copy.deepcopy(BASE);s['rows'][0]['bankAccount']='SYNTHETIC';check('extra field',s,'DENY_FIELDS')
 s=copy.deepcopy(BASE);s['complete']=False;check('partial response',s,'HOLD_PARTIAL')
 s=copy.deepcopy(BASE);s['asOf']='2026-11-13T09:00:00+05:00';check('wrong report time',s,'HOLD_TIME')
 s=copy.deepcopy(BASE);s['rows'][1]['currency']='USD';check('mixed currency',s,'HOLD_CURRENCY')
 s=copy.deepcopy(BASE);s['rows']=[];check('complete empty result',s,'EMPTY_CONFIRMED',total='0.00')
 check('failed read is unknown',None,'UNKNOWN_READ')
 s=copy.deepcopy(BASE);s['source']='other';check('wrong source report',s,'HOLD_SOURCE')
 (P/'synthetic-input.json').write_text(json.dumps(BASE,ensure_ascii=False,indent=2))
 (P/'artifact-qa.json').write_text(json.dumps({'result':'PASS','cases':cases,'scope':'10 deterministic synthetic policy cases; no 1C/LLM/live access validation'},indent=2));print(json.dumps({'result':'PASS','cases':len(cases)}))
if __name__=='__main__':main()
