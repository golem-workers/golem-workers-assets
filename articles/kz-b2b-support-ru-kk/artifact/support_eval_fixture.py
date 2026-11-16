"""Deterministic authored-fixture audit; no LLM, helpdesk or customer data."""
from pathlib import Path
import json,collections
P=Path(__file__).parent

def passes(r):
 s=r['scores'];return not r['critical'] and s['facts']==2 and s['route']==2 and min(s.values())>=1 and sum(s.values())>=7

def transfer_state(requested,queued,ack,available=True):
 if not requested:return 'not_requested'
 if not available:return 'pending_unavailable'
 if not queued:return 'requested'
 if ack is None:return 'queued'
 if ack!='same-request-and-queue':return 'receipt_mismatch'
 return 'acknowledged'

def main():
 cases=json.loads((P/'support-cases.json').read_text())['cases'];results=json.loads((P/'synthetic-results.json').read_text())['results']
 assert len(cases)==24 and len({c['id'] for c in cases})==24
 assert collections.Counter(c['targetLanguage'] for c in cases)=={'ru':12,'kk':12}
 assert len(next(c for c in cases if c['id']=='M4')['history'])==2
 assert {r['id'] for r in results}=={c['id'] for c in cases}
 assert all(r['targetLanguage']==next(c['targetLanguage'] for c in cases if c['id']==r['id']) for r in results)
 for pair in [str(i).zfill(2) for i in range(1,11)]:
  a,b=[c for c in cases if c['pair']==pair];assert a['expectedRoute']==b['expectedRoute'] and a['source']==b['source'] and a['expected']==b['expected']
 probes=[((False,False,None),'not_requested'),((True,False,None),'requested'),((True,True,None),'queued'),((True,True,'same-request-and-queue'),'acknowledged'),((True,True,'other'),'receipt_mismatch'),((True,False,None,False),'pending_unavailable'),((True,True,None,False),'pending_unavailable'),((True,False,'same-request-and-queue'),'requested')]
 for args,expected in probes:assert transfer_state(*args)==expected
 stats={l:{'passed':sum(passes(r) for r in results if r['targetLanguage']==l),'total':12} for l in ['ru','kk']}
 critical=sum(r['critical'] for r in results);assert stats['ru']['passed']==10 and stats['kk']['passed']==8 and critical==2
 out={'result':'PASS','scope':'Fixtureintegrity,pairedroute/sourceexpectations,arithmeticandhandoffstatepolicyONLY;noliveLLMorhelpdesk','inputCount':24,'pairedIntentCount':10,'extraMixedCases':4,'handoffStateProbes':8,'syntheticDemonstration':stats,'combinedPercent':100*18/24,'criticalErrorsInSyntheticDemo':critical,'pilotAccepted':False}
 (P/'artifact-qa.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
if __name__=='__main__':main()
