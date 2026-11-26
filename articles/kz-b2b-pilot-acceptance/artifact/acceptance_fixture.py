#!/usr/bin/env python3
"""Synthetic arithmetic fixture; no model, language or integration evaluation."""
import csv,json,sys
from pathlib import Path
from decimal import Decimal as D

def evaluate(rows,critical_override=None):
 n=len(rows)
 if not n:raise ValueError('Empty acceptance set')
 if len({r['id'] for r in rows})!=n:raise ValueError('Duplicate task identifiers')
 for r in rows:
  if any(D(r[k])<0 for k in ['baseline_min','review_min','correction_min','fallback_min','service_kzt']):raise ValueError('Negative resource value')
 accepted=sum(int(r['accepted']) for r in rows);critical=sum(int(r['critical']) for r in rows) if critical_override is None else critical_override
 baseline=sum(D(r['baseline_min']) for r in rows);human=sum(sum(D(r[k]) for k in ['review_min','correction_min','fallback_min']) for r in rows);service=sum(D(r['service_kzt']) for r in rows);total=human*50+service
 strata={l:{'attempts':len([r for r in rows if r['language']==l]),'accepted':sum(int(r['accepted']) for r in rows if r['language']==l)} for l in ['ru','kk']}
 enough=all(D(s['accepted'])/s['attempts']>=D('.95') for s in strata.values());unit=total/accepted if accepted else None
 decision='STOP_CRITICAL' if critical else 'RETEST_QUALITY' if not enough else 'RETEST_COST' if unit is None or unit>450 else 'ELIGIBLE_FOR_BOUNDED_DECISION'
 return {'synthetic':True,'attempts':n,'accepted':accepted,'critical':critical,'baselineMinutes':str(baseline),'humanMinutes':str(human),'serviceKZT':str(service),'humanKZT':str(human*50),'totalKZT':str(total),'baselineUnitKZT':str(baseline*50/n),'perAttemptKZT':str(total/n),'perAcceptedKZT':str(unit.quantize(D('.01'))) if unit else None,'minutesReleased':str(baseline-human),'strata':strata,'decision':decision,'scope':'Declared-row arithmetic,not validation of truth or AIperformance'}
if __name__=='__main__':
 root=Path(__file__).parent;rows=list(csv.DictReader(open(root/'acceptance-ledger.csv')));x=evaluate(rows);tests=[]
 def check(name,cond):
  assert cond,name
  tests.append({'name':name,'result':'PASS'})
 check('40unique matched tasks',x['attempts']==40);check('36accepted',x['accepted']==36);check('one critical',x['critical']==1);check('baseline400',D(x['baselineMinutes'])==400);check('all human effort220',D(x['humanMinutes'])==220);check('service2400',D(x['serviceKZT'])==2400);check('total13400',D(x['totalKZT'])==13400);check('unit372.22',x['perAcceptedKZT']=='372.22');check('wrongdenominator335',D(x['perAttemptKZT'])==335);check('180minutesreleased',D(x['minutesReleased'])==180);check('RU19of20',x['strata']['ru']['accepted']==19);check('KK17of20',x['strata']['kk']['accepted']==17);check('criticaloverrideseconomics',x['decision']=='STOP_CRITICAL');check('removingcriticalstillfailsquality',evaluate(rows,0)['decision']=='RETEST_QUALITY')
 for name,case in [('empty',[]),('duplicated',rows+[rows[0]]),('negative',[{**rows[0],'service_kzt':'-1'}])]:
  try:evaluate(case);raise AssertionError(name+' accepted')
  except ValueError:tests.append({'name':name+' rejected','result':'PASS'})
 print(json.dumps({'result':'PASS','checks':tests,'summary':x},ensure_ascii=False,indent=2))
