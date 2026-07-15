import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from 'node:crypto';

const REQUIRED = ['v', 'gi', 'ek', 'ku', 'lr', 'su', 'sg'];
const RECORD_ORDER = ['v', 'gi', 'fl', 'ka', 'ek', 'ku', 'lr', 'su', 'cu', 'sg'];

const b64u = (value) => Buffer.from(value).toString('base64url');

export function jwkThumbprint(jwk) {
  const canonical = JSON.stringify({crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y});
  return b64u(createHash('sha256').update(canonical, 'ascii').digest());
}

export function generateEs256Pair() {
  const {publicKey, privateKey} = generateKeyPairSync('ec', {namedCurve: 'P-256'});
  const publicJwk = publicKey.export({format: 'jwk'});
  const privateJwk = privateKey.export({format: 'jwk'});
  const kid = jwkThumbprint(publicJwk);
  return {
    publicJwk: {...publicJwk, alg: 'ES256', kid, use: 'sig', key_ops: ['verify']},
    privateJwk: {...privateJwk, alg: 'ES256', kid, use: 'sig', key_ops: ['sign']},
  };
}

export function canonicalRecord(tags) {
  return Object.entries(tags)
    .filter(([name]) => name !== 'sg')
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([name, value]) => `${name}=${value}`)
    .join(';');
}

function signP1363(text, privateJwk) {
  return sign('sha256', Buffer.from(text, 'ascii'), {
    key: createPrivateKey({key: privateJwk, format: 'jwk'}),
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url');
}

function verifyP1363(text, signature, publicJwk) {
  return verify('sha256', Buffer.from(text, 'ascii'), {
    key: createPublicKey({key: publicJwk, format: 'jwk'}),
    dsaEncoding: 'ieee-p1363',
  }, Buffer.from(signature, 'base64url'));
}

export function serializeRecord(tags) {
  return RECORD_ORDER.filter((name) => tags[name]).map((name) => `${name}=${tags[name]}`).join(';');
}

export function parseRecord(record) {
  if (typeof record !== 'string' || !/^[\x20-\x7E]+$/.test(record)) {
    throw new Error('record must be printable ASCII');
  }
  const pairs = record.split(';');
  if (pairs.at(-1) === '') pairs.pop();
  if (pairs.some((part) => part === '')) throw new Error('empty tag');
  for (let index = 1; index < pairs.length; index += 1) {
    if (pairs[index].startsWith(' ')) pairs[index] = pairs[index].slice(1);
    if (pairs[index].startsWith(' ') || pairs[index].endsWith(' ')) {
      throw new Error('invalid tag whitespace');
    }
  }
  if (pairs[0] !== 'v=DNSid1') throw new Error('v=DNSid1 must be the first tag');
  const tags = {};
  for (const pair of pairs) {
    const separator = pair.indexOf('=');
    if (separator <= 0) throw new Error('invalid tag');
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (Object.hasOwn(tags, name)) throw new Error(`duplicate tag: ${name}`);
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name) || !/^[\x21-\x3A\x3C-\x7E]*$/.test(value)) {
      throw new Error(`invalid tag: ${name}`);
    }
    tags[name] = value;
  }
  for (const name of REQUIRED) if (!tags[name]) throw new Error(`missing required tag: ${name}`);
  return tags;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function createLabBundle({agentFqdn = 'billing-agent.example', now = new Date()} = {}) {
  const entity = generateEs256Pair();
  const operational = generateEs256Pair();
  const gi = agentFqdn;
  const base = `https://${agentFqdn}/dnsid`;
  const issuancePayload = {
    type: 'ISSUANCE',
    agentFqdn,
    gi,
    timestamp: now.toISOString(),
    entityJwk: entity.publicJwk,
    operationalJwk: operational.publicJwk,
  };
  const issuanceCanonical = stableJson(issuancePayload);
  const issuance = {
    profile: 'lab-json-v1',
    payload: issuancePayload,
    entitySignature: signP1363(issuanceCanonical, entity.privateJwk),
    operationalCountersignature: signP1363(issuanceCanonical, operational.privateJwk),
    inclusionProof: {verified: true, note: 'lab fixture only'},
  };
  const tags = {
    v: 'DNSid1', gi, fl: 'logchk', ka: '24h',
    ek: `${base}/entity-keys.json`,
    ku: `${base}/op-keys.json`,
    lr: `${issuance.profile}:${base}/issuance.json`,
    su: `${base}/status.json`,
    cu: `${base}/agent-card.json`,
  };
  tags.sg = signP1363(canonicalRecord(tags), entity.privateJwk);
  return {
    agentFqdn,
    record: serializeRecord(tags),
    entityJwks: {keys: [entity.publicJwk]},
    operationalJwks: {keys: [operational.publicJwk]},
    status: {
      state: 'ACTIVE',
      transitionedAt: now.toISOString(),
      retrievedAt: now.toISOString(),
    },
    issuance,
  };
}

export function verifyLabBundle(bundle, {now = new Date(), statusMaxAgeMs = 300_000} = {}) {
  const tags = parseRecord(bundle.record);
  const entityKeys = bundle.entityJwks?.keys ?? [];
  const operationalKeys = bundle.operationalJwks?.keys ?? [];
  if (entityKeys.length !== 1 || entityKeys[0].alg !== 'ES256') throw new Error('EK must expose one ES256 key');
  if (operationalKeys.length !== 1 || operationalKeys[0].alg !== 'ES256') throw new Error('KU must expose one ES256 key');
  if (!verifyP1363(canonicalRecord(tags), tags.sg, entityKeys[0])) throw new Error('record signature failed');
  if (new URL(tags.ek).protocol !== 'https:' || new URL(tags.ku).protocol !== 'https:' || new URL(tags.su).protocol !== 'https:') {
    throw new Error('identity endpoints must use HTTPS');
  }
  if (new URL(tags.ek).hostname !== tags.gi || new URL(tags.ku).hostname !== bundle.agentFqdn) {
    throw new Error('key endpoint host binding failed');
  }
  if (bundle.issuance?.profile !== 'lab-json-v1' || !bundle.issuance.inclusionProof?.verified) {
    throw new Error('unsupported or missing lab log proof');
  }
  const issuanceText = stableJson(bundle.issuance.payload);
  if (!verifyP1363(issuanceText, bundle.issuance.entitySignature, bundle.issuance.payload.entityJwk)) {
    throw new Error('ISSUANCE entity signature failed');
  }
  if (!verifyP1363(issuanceText, bundle.issuance.operationalCountersignature, bundle.issuance.payload.operationalJwk)) {
    throw new Error('ISSUANCE operational countersignature failed');
  }
  if (bundle.issuance.payload.agentFqdn !== bundle.agentFqdn || bundle.issuance.payload.gi !== tags.gi) {
    throw new Error('ISSUANCE identity binding failed');
  }
  if (jwkThumbprint(bundle.issuance.payload.entityJwk) !== jwkThumbprint(entityKeys[0]) ||
      jwkThumbprint(bundle.issuance.payload.operationalJwk) !== jwkThumbprint(operationalKeys[0])) {
    throw new Error('current keys do not match ISSUANCE');
  }
  if (tags.ka) {
    const keyAgeLimits = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000, '90d': 90 * 24 * 60 * 60 * 1000 };
    const keyAgeLimit = keyAgeLimits[tags.ka];
    const keyAge = now.getTime() - Date.parse(bundle.issuance.payload.timestamp ?? '');
    if (!keyAgeLimit || !Number.isFinite(keyAge) || keyAge < 0 || keyAge > keyAgeLimit) {
      throw new Error('operational key exceeds ka limit');
    }
  }
  const statusAge = now.getTime() - Date.parse(bundle.status?.retrievedAt ?? '');
  if (bundle.status?.state !== 'ACTIVE' || !Number.isFinite(statusAge) || statusAge < 0 || statusAge > statusMaxAgeMs) {
    throw new Error('status is not fresh ACTIVE');
  }
  return {ok: true, assurance: 'lab-profile-only', agentFqdn: bundle.agentFqdn};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bundle = createLabBundle();
  console.log(JSON.stringify({record: bundle.record, result: verifyLabBundle(bundle)}, null, 2));
}
