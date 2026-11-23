#!/usr/bin/env python3
"""Synthetic placement-policy exercise; not a network scanner or legal checker."""
from copy import deepcopy
import json

def edge(name,location='KZ',approved=True,retention='defined',owner='IT'):
 return dict(name=name,location=location,approved=approved,retention=retention,owner=owner,contains_content=True)
BASE=[edge(n) for n in ['intake','runtime','model','memory','logs','backup','support','result']]
def inspect(edges):
 required={e['name'] for e in BASE}
 if len(edges)!=8 or {e['name'] for e in edges}!=required:return {'ready':False,'local_only':False,'reasons':['incomplete-map']}
 reasons=[]
 for e in edges:
  if not e.get('owner'):reasons.append(e['name']+':owner')
  if e.get('location') in [None,'','UNKNOWN']:reasons.append(e['name']+':location')
  if e.get('approved') is not True:reasons.append(e['name']+':approval')
  if e.get('retention') in [None,'','UNKNOWN']:reasons.append(e['name']+':retention')
 return {'ready':not reasons,'local_only':not reasons and all(e['location']=='KZ' for e in edges if e['contains_content']),'reasons':reasons}
def changed(name,**fields):
 rows=deepcopy(BASE);next(e for e in rows if e['name']==name).update(fields);return rows
if __name__=='__main__':
 cases=[('all-local-documented',BASE,True,True),('approved-hybrid',changed('model',location='EXTERNAL'),True,False),('unknown-model',changed('model',location='UNKNOWN'),False,False),('unapproved-model',changed('model',location='EXTERNAL',approved=False),False,False),('external-backup',changed('backup',location='EXTERNAL'),True,False),('unknown-log-retention',changed('logs',retention='UNKNOWN'),False,False),('support-no-owner',changed('support',owner=''),False,False),('external-support',changed('support',location='EXTERNAL'),True,False),('missing-backup',BASE[:-3]+BASE[-2:],False,False),('duplicate-path',BASE[:-1]+[deepcopy(BASE[0])],False,False),('unapproved-result',changed('result',approved=False),False,False)]
 rows=changed('model',location='EXTERNAL',approved=False);next(e for e in rows if e['name']=='support').update(location='UNKNOWN',approved=False);cases.append(('article-example',rows,False,False))
 out=[]
 for name,rows,ready,local in cases:
  result=inspect(rows);assert (result['ready'],result['local_only'])==(ready,local),name;out.append({'case':name,**result,'PASS':True})
 print(json.dumps({'synthetic':True,'scope':'12 deterministic checks of declared map fields only; no network, AI, residency or legal compliance test','passed':len(out),'total':len(cases),'cases':out},indent=2))
