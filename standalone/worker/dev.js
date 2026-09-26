// DEV ONLY: `npm run standalone:dev` serves this with a fake signed-in owner against local D1.
// Never deploy it (for example `wrangler deploy standalone/worker/dev.js`): it bypasses Access.
// The deployed main is worker/entry.js, which has no bypass.
import { handleAppRequest } from './app.js';

const DEV_EMAIL = 'dev@localhost';

export default {
  fetch: (request, env) => handleAppRequest(request, { ...env, ALLOWED_EMAILS: DEV_EMAIL }, { verify: async () => ({ subject: 'dev', email: DEV_EMAIL }) }),
};
