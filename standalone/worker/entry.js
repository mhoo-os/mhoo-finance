// Worker entry. It may export only handlers; the app itself lives in app.js.
import { handleAppRequest } from './app.js';

export default { fetch: (request, env) => handleAppRequest(request, env) };
