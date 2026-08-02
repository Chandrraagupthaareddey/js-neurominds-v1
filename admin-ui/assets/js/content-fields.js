/**
 * JS Neurominds V1 — admin-ui/assets/js/content-fields.js
 * Editable-field definitions per content type, plus the metadata the editor
 * and the backend need (Sheet tab name, key column, title field). Adding a new
 * editable field is a one-line change here — no other file needs to change.
 *
 * `type` controls the input rendered: 'text' (single line) or 'textarea'.
 * Structural fields (id, slug, is_emergency, status, order) are intentionally
 * NOT editable here — they are system-owned to keep routing/SEO/URLs stable.
 */
export const CONTENT_TYPES = {
  conditions: {
    label: 'Conditions', tab: 'Conditions', keyCol: 'condition_id', titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'one_line_summary', label: 'One-line summary', type: 'textarea' },
      { key: 'symptoms', label: 'Symptoms (separate with ;)', type: 'textarea' },
      { key: 'when_to_consult', label: 'When to consult', type: 'textarea' },
      { key: 'treatment_approach', label: 'Treatment approach', type: 'textarea' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'seo_title', label: 'SEO title', type: 'text' },
      { key: 'seo_description', label: 'SEO description', type: 'textarea' }
    ]
  },
  treatments: {
    label: 'Treatments', tab: 'Treatments', keyCol: 'treatment_id', titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'one_line_summary', label: 'One-line summary', type: 'textarea' },
      { key: 'overview', label: 'Overview', type: 'textarea' },
      { key: 'what_to_expect', label: 'What to expect', type: 'textarea' },
      { key: 'conditions_treated', label: 'Conditions treated (separate with ;)', type: 'textarea' },
      { key: 'seo_title', label: 'SEO title', type: 'text' },
      { key: 'seo_description', label: 'SEO description', type: 'textarea' }
    ]
  },
  services: {
    label: 'Services', tab: 'Services', keyCol: 'service_id', titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea' }
    ]
  },
  lab_packages: {
    label: 'Lab Packages', tab: 'Lab_Packages', keyCol: 'lab_package_id', titleField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'turnaround', label: 'Turnaround', type: 'textarea' }
    ]
  },
  blogs: {
    label: 'Knowledge Articles', tab: 'Blogs', keyCol: 'blog_id', titleField: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
      { key: 'seo_title', label: 'SEO title', type: 'text' },
      { key: 'seo_description', label: 'SEO description', type: 'textarea' }
    ]
  },
  faqs: {
    label: 'FAQs', tab: 'FAQs', keyCol: 'faq_id', titleField: 'question',
    fields: [
      { key: 'question', label: 'Question', type: 'text' },
      { key: 'answer', label: 'Answer', type: 'textarea' },
      { key: 'scope', label: 'Scope', type: 'text' }
    ]
  }
};

export const CONTENT_TYPE_ORDER = ['conditions', 'treatments', 'services', 'lab_packages', 'blogs', 'faqs'];
