"""Synthetic answer key and declared skills-card routing; no live learner/model test."""
from pathlib import Path
import json

def decide(card):
    scores=card['scores']
    if len(scores)!=4 or any(type(x) is not int or x<0 or x>2 for x in scores):
        return 'INVALID_CARD'
    if len(card['evidence'])!=4:
        return 'INVALID_CARD'
    ready=(sum(scores)>=7 and card['criticalErrors']==0 and card['hints']==0
           and card['newVariants'] is True and all(card['evidence'])
           and card['ownerApproved'] is True)
    return 'LIMITED_INDEPENDENT' if ready else 'ASSISTED_ONLY'

def run():
    d=json.loads(Path(__file__).with_name('training-example.json').read_text())
    checks=[]
    def check(name,ok):
        checks.append({'name':name,'result':'PASS' if ok else 'FAIL'})
        assert ok,name
    check('synthetic labelled',d['synthetic'] is True)
    check('four distinct exercises',len({x['id'] for x in d['cases']})==4)
    check('current source v2',d['sourceRevision']=='v2')
    check('shortage is4boxes',max(0,d['quantityRequestedBoxes']-d['currentStockBoxes'])==4)
    check('old20wouldmaskshortage',d['supersededStockBoxes']>=d['quantityRequestedBoxes'])
    check('packsizeunknown',d['packSize'] is None)
    for card in d['cards']:
        check('routing:'+card['id'],decide(card)==card['expected'])
    base=d['cards'][1]
    check('perfectscorecannotcancelcriticalerror',decide(d['cards'][0])=='ASSISTED_ONLY')
    check('invalidscorefailsclosed',decide({**base,'scores':[2,2,2,3]})=='INVALID_CARD')
    check('missingscorefailsclosed',decide({**base,'scores':[2,2,2]})=='INVALID_CARD')
    check('malformedevidencefailsclosed',decide({**base,'evidence':['e1']})=='INVALID_CARD')
    check('onlyBlimited',sum(decide(c)=='LIMITED_INDEPENDENT' for c in d['cards'])==1)
    return {'result':'PASS','scope':'18 local arithmetic and declared routing checks; not human competency,LLM,language,security or liveintegration benchmark','checks':checks,'shortageBoxes':4,'cardResults':{c['id']:decide(c) for c in d['cards']}}

if __name__=='__main__':print(json.dumps(run(),ensure_ascii=False,indent=2))
