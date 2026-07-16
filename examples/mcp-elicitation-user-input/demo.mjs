import { createUrlElicitation, validateFormRequest } from './elicitation-policy.mjs';

const form = {
  mode: 'form',
  message: 'Choose a deployment target.',
  requestedSchema: {
    type: 'object',
    properties: {
      environment: { type: 'string', enum: ['staging', 'production'] },
      dryRun: { type: 'boolean', default: true }
    },
    required: ['environment']
  }
};
validateFormRequest(form);
console.log(JSON.stringify({ form, url: createUrlElicitation({
  baseUrl: 'https://connect.example.test',
  elicitationId: 'el_demo_01',
  returnTo: '/jobs/demo'
}) }, null, 2));
