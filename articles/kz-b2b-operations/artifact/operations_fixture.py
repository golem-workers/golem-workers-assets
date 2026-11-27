"""Run beside operations-example.json. Synthetic declared-state checks, not live QA."""
import json
from pathlib import Path
from collections import Counter

def route(task,idempotency_verified=False,authorized=False):
    state=task['outcome']
    if state=='confirmed':return 'LINK_EXISTING'
    if state=='unknown':return 'HOLD_RECONCILE'
    if state=='absent':return 'CONTROLLED_RETRY_CANDIDATE' if idempotency_verified and authorized else 'HOLD_AUTH_AND_DUPLICATE_CHECK'
    raise ValueError('Unknown outcome; fail closed')

def recovery(case,evidence):
    required=case['repairEvidence']+case['commonEvidence']
    return 'LIMITED_RETURN' if all(evidence.get(k) is True for k in required) else 'STOPPED'

def main():
    data=json.loads(Path(__file__).with_name('operations-example.json').read_text());checks=[]
    def check(name,value):
        checks.append({'name':name,'passed':bool(value)})
        assert value,name
    check('synthetic and non-live labels',data['synthetic'] and data['notLiveTest'])
    q=data['queue'];c=Counter(t['outcome'] for t in q)
    check('eight unique tasks',len(q)==8 and len({t['id'] for t in q})==8)
    check('queue partition3+2+3',c=={'confirmed':3,'absent':2,'unknown':3})
    check('confirmed are linked not replayed',all(route(t,True,True)=='LINK_EXISTING' for t in q if t['outcome']=='confirmed'))
    check('unknown stay held even with authorization',all(route(t,True,True)=='HOLD_RECONCILE' for t in q if t['outcome']=='unknown'))
    for iv,auth in [(False,False),(False,True),(True,False)]:
        check(f'absent held iv={iv} auth={auth}',all(route(t,iv,auth)=='HOLD_AUTH_AND_DUPLICATE_CHECK' for t in q if t['outcome']=='absent'))
    check('only2controlled retry candidates',sum(route(t,True,True)=='CONTROLLED_RETRY_CANDIDATE' for t in q)==2)
    check('one A and at least one R per activity',all(sum('A' in v for v in row.values())==1 and any('R' in v for v in row.values()) for row in data['raci'].values()))
    check('retired model rollback unavailable',not data['cases'][1]['rollbackAvailable'])
    check('obsolete rule rollback disallowed',not data['cases'][2]['rollbackAvailable'])
    for case in data['cases']:
        check(case['id']+' starts stopped',case['initialState']=='STOPPED' and recovery(case,{})=='STOPPED')
        evidence={k:True for k in case['repairEvidence']+case['commonEvidence']}
        check(case['id']+' limited return only with all evidence',recovery(case,evidence)=='LIMITED_RETURN')
        check(case['id']+' every missing item blocks return',all(recovery(case,{**evidence,k:False})=='STOPPED' for k in evidence))
    check('no assumed service coverage',data['coverage']['sla']=='NOT_PROMISED' and data['coverage']['hours']=='TO_AGREE')
    print(json.dumps({'result':'PASS','scope':data['limits'],'checks':checks},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
