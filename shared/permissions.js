/**
 * JS Neurominds V1 — shared/permissions.js
 * RBAC definitions shared by the admin UI (client gating) and the GAS Admin CMS
 * (authoritative server-side checks). The server always re-checks; client gating
 * is for UX only.
 */

export const ROLES = ['super_admin', 'admin', 'lab_team', 'content_editor', 'marketing'];

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  lab_team: 'Lab Team',
  content_editor: 'Content Editor',
  marketing: 'Marketing'
};

// Sections each role may open in the admin portal.
export const ROLE_SECTIONS = {
  super_admin: ['dashboard', 'booking', 'callback', 'lab', 'marketing', 'seo', 'content', 'doctors', 'services', 'media', 'testimonials', 'reviews', 'navigation', 'social', 'footer', 'brand', 'flags', 'feedback', 'health', 'backup', 'settings', 'runbook'],
  admin: ['dashboard', 'booking', 'callback', 'lab', 'seo', 'content', 'doctors', 'services', 'media', 'testimonials', 'reviews', 'navigation', 'social', 'footer', 'brand', 'flags', 'feedback', 'health', 'runbook'],
  lab_team: ['dashboard', 'lab', 'runbook'],
  content_editor: ['dashboard', 'content', 'testimonials', 'runbook'],
  marketing: ['dashboard', 'marketing', 'seo', 'testimonials', 'reviews', 'social', 'runbook']
};

// Fine-grained actions (write / destructive) gated beyond section visibility.
export const ROLE_ACTIONS = {
  super_admin: ['publish', 'sync', 'manage_users', 'delete', 'edit_settings', 'close_request', 'edit_content', 'update_lab', 'moderate_feedback', 'run_backup'],
  admin: ['publish', 'sync', 'close_request', 'edit_content', 'update_lab', 'moderate_feedback'],
  lab_team: ['update_lab'],
  content_editor: ['edit_content'],
  marketing: []
};

export function roleCanOpen(roleKey, section) {
  return (ROLE_SECTIONS[roleKey] || []).includes(section);
}

export function roleCanDo(roleKey, action) {
  return (ROLE_ACTIONS[roleKey] || []).includes(action);
}
