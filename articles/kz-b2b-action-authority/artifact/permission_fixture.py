"""Synthetic authority-passport checks, Python3 standard library only.
Not IAM introspection, real approval, execution, persistence or security testing.
Run: python3 permission_fixture.py
"""
import copy,json

def row(action,principal,grants,approval):
    return dict(action=action,enabled=True,principal=principal,grants=grants,
                owner='process-owner',revoker='IT-duty',proof='synthetic-denial-test-r1',
                approval=approval,exact_binding=True,reconcile='destination-readback',
                outcome_log=True,policy_version=2)

PASSPORT=[row('read_selected','reader',['read_selected'],'none'),
          row('draft_local','drafter',['draft_local'],'none'),
          row('create_crm_note','crm-writer',['create_crm_note'],'human'),
          row('send_quote','sender',['send_quote'],'human'),
          dict(action='pay_invoice',enabled=False,principal=None,grants=[]),
          dict(action='delete_record',enabled=False,principal=None,grants=[])]

def audit(rows):
    errors=[];seen=set();principals={}
    allowed={'read_selected','draft_local','create_crm_note','send_quote'}
    expected=allowed|{'pay_invoice','delete_record'}
    if {x.get('action') for x in rows}!=expected:errors.append('ACTION_COVERAGE')
    for x in rows:
        a=x.get('action')
        if a in seen:errors.append('DUPLICATE_ACTION')
        seen.add(a)
        if not x.get('enabled'):
            if x.get('principal') or x.get('grants'):errors.append('FORBIDDEN_GRANT')
            continue
        if a not in allowed:errors.append('FORBIDDEN_ENABLED')
        p=x.get('principal')
        if p not in {'reader','drafter','crm-writer','sender'}:errors.append('UNKNOWN_IDENTITY')
        if p in principals and principals[p]!=a:errors.append('SHARED_IDENTITY')
        principals[p]=a
        if set(x.get('grants',[]))!={a}:errors.append('GRANT_MISMATCH')
        for field in ['owner','revoker','proof','outcome_log']:
            if not x.get(field):errors.append('MISSING_'+field.upper())
        if x.get('policy_version')!=2:errors.append('POLICY_VERSION')
        if a in {'create_crm_note','send_quote'}:
            if x.get('approval')!='human':errors.append('APPROVAL_MISSING')
            if not x.get('exact_binding'):errors.append('BINDING_MISSING')
            if not x.get('reconcile'):errors.append('RECONCILIATION_MISSING')
    return sorted(set(errors))

def main():
    variants=[('declared baseline',None,None,None),
      ('sender can delete',3,'grants',['send_quote','delete_record']),
      ('reader can write',0,'grants',['read_selected','create_crm_note']),
      ('shared read and write account',2,'principal','reader'),
      ('unknown identity',3,'principal','administrator'),
      ('missing process owner',3,'owner',None),
      ('missing revocation owner',3,'revoker',None),
      ('send without human approval',3,'approval','none'),
      ('approval not bound to exact action',3,'exact_binding',False),
      ('no uncertain-result route',3,'reconcile',None),
      ('no outcome logging',2,'outcome_log',False),
      ('action lacks its grant',2,'grants',[]),
      ('payment tool enabled',4,'enabled',True),
      ('forbidden payment credential retained',4,'grants',['pay_invoice']),
      ('old policy version',3,'policy_version',1),
      ('no denial-test evidence',0,'proof',None)]
    results=[]
    for name,index,field,value in variants:
        rows=copy.deepcopy(PASSPORT)
        if index is not None:rows[index][field]=value
        errors=audit(rows);expected=index is not None
        assert bool(errors)==expected,(name,errors)
        results.append(dict(probe=name,expected='BLOCK' if expected else 'DECLARED_FIELDS_PASS',
                            actual='BLOCK' if errors else 'DECLARED_FIELDS_PASS',errors=errors,passed=True))
    print(json.dumps(dict(scope='Synthetic declared-field audit only; not live IAM, credential revocation, approval, concurrency, LLM, CRM, email or security test',passed=len(results),total=len(variants),results=results),indent=2))
if __name__=='__main__':main()
