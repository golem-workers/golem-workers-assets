"""Synthetic metadata fixture. Not a production retriever,semantic judge or LLM test."""
import json,copy
from pathlib import Path
P=Path(__file__).parent
C=json.loads((P/'knowledge-corpus.json').read_text())
D={d['id']:d for d in C['documents']}
def candidates(user,topic,language='ru',docs=None):
    # In a real app user comes from a trusted authenticated session,never the prompt.
    ds=docs if docs is not None else C['documents']
    groups=C['users'].get(user,{}).get('groups',[])
    rows=[d for d in ds if groups and set(groups)&set(d.get('groups',[])) and d.get('status')=='current' and d['topic']==topic]
    if len({d['version'] for d in rows if d['family']=='TRAVEL'})>1:return []
    if any(d['language']==language for d in rows):rows=[d for d in rows if d['language']==language]
    return rows

def citation_ok(user,topic,citation,language='ru',docs=None):
    visible={d['id']:d for d in candidates(user,topic,language,docs)}
    d=visible.get(citation.get('id'))
    return bool(d and citation.get('version')==d['version'] and citation.get('section')==d['section'] and citation.get('quote') and citation['quote'] in d['text'])

def run():
    rows=[]
    def check(n,expected,observed,kind):
        rows.append({'id':n,'kind':kind,'expected':expected,'observed':observed,'pass':expected==observed})
    ids=lambda u,t,l='ru',ds=None:[d['id'] for d in candidates(u,t,l,ds)]
    check('P01',['TRAVEL-RU-2'],ids('A','hotel'),'current RU,not archive')
    check('P02',['TRAVEL-KK-2'],ids('A','hotel','kk'),'current KK')
    check('P03',['RESERVE-RU-1'],ids('B','reserve'),'authorized restricted source')
    check('P04',[],ids('A','reserve'),'denied restricted source')
    check('P05',[],ids('unknown','hotel'),'unknown identity denied')
    noacl=copy.deepcopy(C['documents']);next(d for d in noacl if d['id']=='RESERVE-RU-1').pop('groups')
    check('P06',[],ids('B','reserve',ds=noacl),'missing permission metadata denied')
    revoked=copy.deepcopy(C['documents']);next(d for d in revoked if d['id']=='RESERVE-RU-1')['groups']=[]
    check('P07',[],ids('B','reserve',ds=revoked),'revoked access on next checked request')
    check('P08',[],ids('A','rail-ticket'),'no supporting document')
    conflict=copy.deepcopy(C['documents']);dup=copy.deepcopy(D['TRAVEL-RU-2']);dup.update(id='TRAVEL-RU-3',version=3);conflict.append(dup)
    check('P09',[],ids('A','hotel',ds=conflict),'ambiguous active versions stop')
    # Source note cannot alter groups:fixture never evaluates document text as code/instruction.
    check('P10',[],ids('A','reserve'),'malicious note does not change identity or permissions')
    good={'id':'TRAVEL-RU-2','version':2,'section':'4','quote':D['TRAVEL-RU-2']['text']}
    check('C01',True,citation_ok('A','hotel',good),'allowed exact source metadata')
    bad=copy.deepcopy(good);bad['id']='TRAVEL-RU-1';bad['version']=1
    check('C02',False,citation_ok('A','hotel',bad),'archive citation rejected')
    bad=copy.deepcopy(good);bad['section']='9'
    check('C03',False,citation_ok('A','hotel',bad),'wrong section rejected')
    bad=copy.deepcopy(good);bad['quote']='Согласование не требуется.'
    check('C04',False,citation_ok('A','hotel',bad),'invented quote rejected')
    secret={'id':'RESERVE-RU-1','version':1,'section':'3','quote':D['RESERVE-RU-1']['text']}
    check('C05',False,citation_ok('A','reserve',secret),'cached restricted citation rechecked for A')
    check('C06',False,citation_ok('B','reserve',secret,docs=revoked),'cached restricted citation rechecked after revocation')
    counterexample={'answer':'Согласование превышения не требуется.','citation':good,'metadataAccepted':citation_ok('A','hotel',good),'humanVerdict':'REJECT:the quote states that exceeding the limit requires separate approval;the answer contradicts it.','automaticSemanticVerification':False}
    result={'result':'PASS' if all(x['pass'] for x in rows) else 'FAIL','synthetic':True,'deterministicChecks':len(rows),'passed':sum(x['pass'] for x in rows),'checks':rows,'semanticCounterexample':counterexample,'notMeasured':['LLM quality','retrieval recall','real identity provider','live cache revocation','production isolation','Kazakhstan compliance'],'scope':'Metadata/access design illustration only;the counterexample intentionally passes metadata validation and must fail human semantic review.'}
    (P/'artifact-qa.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2))
    assert result['result']=='PASS'
if __name__=='__main__':run()
