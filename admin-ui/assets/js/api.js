/**
 * JS Neurominds V1 — admin-ui/assets/js/api.js
 * Admin API surface. Routes to the local mock (RBAC simulator + mock CMS data)
 * or the deployed GAS Admin CMS. In live mode every call carries the action so
 * the GAS AdminRouter can dispatch and re-check the caller's role server-side.
 */
import { CONFIG } from './config.js';
import { adminApi as mock } from './mock-api.js';

async function realPost(action, payload = {}) {
  const res = await fetch(CONFIG.ADMIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}

const live = {
  config: () => realPost('config'),
  dashboard: () => realPost('dashboard'),
  callbacks: () => realPost('callbacks'),
  callbackChecklist: () => realPost('callbackChecklist'),
  callbackQuestions: () => realPost('callbackQuestions'),
  updateCallbackStatus: (id, status, note) => realPost('updateCallbackStatus', { id, status, note }),
  callbackHistory: (id) => realPost('callbackHistory', { id }),
  labRequests: () => realPost('labRequests'),
  updateLabStatus: (id, status) => realPost('updateLabStatus', { id, status }),
  content: () => realPost('content'),
  doctors: () => realPost('doctors'),
  feedback: () => realPost('feedback'),
  updateFeedbackStatus: (id, status) => realPost('updateFeedbackStatus', { id, status }),
  health: () => realPost('health'),
  publishHistory: () => realPost('publishHistory'),
  users: () => realPost('users'),
  syncContent: () => realPost('syncContent')
};

export const api = CONFIG.USE_MOCK ? mock : live;
