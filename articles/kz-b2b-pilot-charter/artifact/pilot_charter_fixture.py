"""Declared-field teaching classifier, NOT authorization or production validation.
Run beside pilot-charter.sample.json. No third-party packages or network.
"""
import copy
import json
from pathlib import Path


def classify(c):
    required = ('process', 'input', 'output', 'excluded', 'data_rule',
                'manual_fallback', 'change_owner', 'review_date', 'success_rule')
    if any(not c.get(k) for k in required):
        return 'INCOMPLETE_CHARTER'
    if any(not c.get('owners', {}).get(k) for k in ('process', 'reviewer', 'it', 'integrator')):
        return 'MISSING_OWNER'
    if c.get('scope_version') != c.get('evidence_scope_version'):
        return 'SCOPE_CHANGED'
    if len(c.get('interfaces', [])) != 1:
        return 'OUTSIDE_ONE_INTERFACE_SCOPE'
    if c.get('external_send'):
        return 'OUTSIDE_DRAFT_SCOPE'
    if c.get('open_dependencies'):
        return 'DEPENDENCY_OPEN'
    e = c.get('evidence', {})
    if not e.get('access'):
        return 'SCOPED_ONLY'
    if not e.get('integration'):
        return 'ACCESS_ONLY'
    if not e.get('acceptance'):
        return 'INTEGRATION_ONLY'
    if c.get('pilot_decision') == 'stop':
        return 'STOPPED'
    if c.get('pilot_decision') != 'continue':
        return 'PILOT_DECISION_REQUIRED'
    if not e.get('training') or not e.get('support_owner'):
        return 'HANDOVER_INCOMPLETE'
    if not e.get('rollout_authorization'):
        return 'ROLLOUT_DECISION_MISSING'
    return 'DECLARED_ROLLOUT_DECISION'


def main():
    sample = json.loads(Path(__file__).with_name('pilot-charter.sample.json').read_text())
    ready = copy.deepcopy(sample)
    ready['evidence'].update(integration='synthetic-integration-record-v1', acceptance='synthetic-acceptance-record-v1',
        training='synthetic-training-record-v1', support_owner='synthetic-support-role', rollout_authorization='synthetic-customer-decision-v1')
    ready['pilot_decision'] = 'continue'
    cases = []
    def add(name, expected, alter=lambda x: None, base=ready):
        c = copy.deepcopy(base)
        alter(c)
        cases.append((name, expected, classify(c)))
    add('access alone is not rollout', 'ACCESS_ONLY', base=sample)
    add('all declarations filled', 'DECLARED_ROLLOUT_DECISION')
    add('missing process owner', 'MISSING_OWNER', lambda c: c['owners'].update(process=''))
    add('missing expected output', 'INCOMPLETE_CHARTER', lambda c: c.update(output=''))
    add('second interface', 'OUTSIDE_ONE_INTERFACE_SCOPE', lambda c: c['interfaces'].append('mail-test'))
    add('external sending requested', 'OUTSIDE_DRAFT_SCOPE', lambda c: c.update(external_send=True))
    add('changed scope invalidates evidence', 'SCOPE_CHANGED', lambda c: c.update(scope_version='v2'))
    add('unresolved field access', 'DEPENDENCY_OPEN', lambda c: c['open_dependencies'].append('date-field-unverified'))
    add('no access evidence', 'SCOPED_ONLY', lambda c: c['evidence'].update(access=''))
    add('no integration evidence', 'ACCESS_ONLY', lambda c: c['evidence'].update(integration=''))
    add('no acceptance evidence', 'INTEGRATION_ONLY', lambda c: c['evidence'].update(acceptance=''))
    add('no training evidence', 'HANDOVER_INCOMPLETE', lambda c: c['evidence'].update(training=''))
    add('no rollout decision', 'ROLLOUT_DECISION_MISSING', lambda c: c['evidence'].update(rollout_authorization=''))
    add('stop remains an acceptable decision', 'STOPPED', lambda c: c.update(pilot_decision='stop'))
    assert all(expected == actual for _, expected, actual in cases), cases
    print(json.dumps({'passed': len(cases), 'total': len(cases), 'sampleStatus': classify(sample),
        'scope': 'Local checks of declared strings and scope fields only; no document authentication, model, network, CRM, security, quality or deployment test.',
        'cases': [{'name': n, 'expected': e, 'actual': a} for n,e,a in cases]}, indent=2))

if __name__ == '__main__':
    main()
