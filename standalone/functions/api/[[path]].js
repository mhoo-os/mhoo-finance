import { handleFinanceRequest } from '../../worker/index.js';

export async function onRequest(context) {
  return handleFinanceRequest(context.request, context.env);
}
