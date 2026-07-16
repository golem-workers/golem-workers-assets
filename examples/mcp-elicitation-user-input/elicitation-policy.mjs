const SECRET_FIELD = /(password|secret|token|api[_-]?key|card|cvv|credential)/i;

export function assertNegotiated(clientCapabilities, mode) {
  const elicitation = clientCapabilities?.elicitation;
  if (!elicitation) throw new Error('elicitation-not-negotiated');
  const supportsForm = Object.keys(elicitation).length === 0 || elicitation.form;
  const supportsUrl = elicitation.url;
  if (mode === 'form' && !supportsForm) throw new Error('form-not-supported');
  if (mode === 'url' && !supportsUrl) throw new Error('url-not-supported');
}

export function validateFormRequest(request) {
  if ((request.mode ?? 'form') !== 'form') throw new Error('wrong-mode');
  const schema = request.requestedSchema;
  if (!schema || schema.type !== 'object' || !schema.properties) {
    throw new Error('flat-object-schema-required');
  }
  for (const [name, property] of Object.entries(schema.properties)) {
    if (SECRET_FIELD.test(name) || SECRET_FIELD.test(property.title ?? '')) {
      throw new Error(`sensitive-field:${name}`);
    }
    if (!['string', 'number', 'integer', 'boolean', 'array'].includes(property.type)) {
      throw new Error(`unsupported-type:${name}`);
    }
    if (property.type === 'array' && !property.items?.enum && !property.items?.anyOf) {
      throw new Error(`array-must-be-enum:${name}`);
    }
  }
  return true;
}

export function createUrlElicitation({ baseUrl, elicitationId, returnTo }) {
  const url = new URL('/connect', baseUrl);
  url.searchParams.set('eid', elicitationId);
  url.searchParams.set('return_to', returnTo);
  return {
    mode: 'url',
    elicitationId,
    url: url.toString(),
    message: `Open ${url.host} to connect the external account.`
  };
}

export function acceptResult(action, content) {
  if (!['accept', 'decline', 'cancel'].includes(action)) throw new Error('invalid-action');
  return action === 'accept' && content ? { action, content } : { action };
}

export class CompletionRegistry {
  #pending = new Set();
  begin(id) { this.#pending.add(id); }
  complete(id) {
    if (!this.#pending.delete(id)) return { ignored: true };
    return { ignored: false, retryAllowed: true };
  }
}
