import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CompletionRegistry,
  acceptResult,
  assertNegotiated,
  createUrlElicitation,
  validateFormRequest
} from './elicitation-policy.mjs';

test('empty elicitation capability means form-only compatibility', () => {
  assert.doesNotThrow(() => assertNegotiated({ elicitation: {} }, 'form'));
  assert.throws(() => assertNegotiated({ elicitation: {} }, 'url'));
});

test('form validator accepts flat non-sensitive fields', () => {
  assert.equal(validateFormRequest({
    mode: 'form',
    requestedSchema: {
      type: 'object',
      properties: {
        environment: { type: 'string', enum: ['staging', 'production'] },
        dryRun: { type: 'boolean', default: true }
      }
    }
  }), true);
});

test('form validator rejects credential fields', () => {
  assert.throws(() => validateFormRequest({
    requestedSchema: { type: 'object', properties: { apiKey: { type: 'string' } } }
  }), /sensitive-field/);
});

test('URL request uses an opaque correlation id and trusted host', () => {
  const request = createUrlElicitation({
    baseUrl: 'https://connect.example.test',
    elicitationId: 'el_01JZ',
    returnTo: '/jobs/42'
  });
  assert.equal(new URL(request.url).host, 'connect.example.test');
  assert.equal(request.elicitationId, 'el_01JZ');
  assert.equal(request.url.includes('token='), false);
});

test('decline and cancel never include content', () => {
  assert.deepEqual(acceptResult('decline', { leaked: true }), { action: 'decline' });
  assert.deepEqual(acceptResult('cancel', { leaked: true }), { action: 'cancel' });
});

test('unknown and duplicate completion notifications are ignored', () => {
  const registry = new CompletionRegistry();
  registry.begin('el_01JZ');
  assert.deepEqual(registry.complete('unknown'), { ignored: true });
  assert.deepEqual(registry.complete('el_01JZ'), { ignored: false, retryAllowed: true });
  assert.deepEqual(registry.complete('el_01JZ'), { ignored: true });
});
