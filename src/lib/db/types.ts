/**
 * Row types for the tables the website reads and writes.
 * Regenerate the full file with `supabase gen types typescript --linked > src/lib/db/types.gen.ts`
 * once the migrations in supabase/migrations are applied; these hand-written types mirror them.
 */
export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type Release = {
  id: string;
  version_name: string;
  version_code: number;
  channel: "stable" | "beta";
  file_path: string;
  file_size_bytes: number;
  sha256: string;
  signing_cert_sha256: string | null;
  min_sdk: number | null;
  release_notes_md: string;
  poster_key: string | null;
  is_published: boolean;
  is_latest: boolean;
  published_at: string | null;
  download_count: number;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body_md: string;
  severity: "info" | "notice" | "warning" | "critical";
  target: "web" | "app" | "both";
  audience: "all" | "signed_in";
  starts_at: string | null;
  ends_at: string | null;
  cta_label: string | null;
  cta_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type LegalDocument = {
  id: string;
  doc: "privacy" | "terms" | "child-safety" | "cookies" | "data-safety" | "accessibility";
  version: string;
  effective_date: string;
  content_sha256: string;
  summary_of_changes: string;
  url: string;
  published_at: string;
};

export type Feedback = {
  id: string;
  user_id: string | null;
  user_identifier: string;
  user_email: string | null;
  type: "feature_suggestion" | "general_feedback" | "bug_report" | "ui_enhancement";
  title: string;
  description: string;
  impact: "nice_to_have" | "important" | "critical";
  category: string;
  status: "pending" | "reviewed" | "planned" | "resolved";
  admin_notes: string | null;
  admin_reply: string | null;
  replied_at: string | null;
  device_info: string | null;
  source: "app" | "web" | null;
  created_at: string;
  updated_at: string;
};

export type FaqOverride = { id: string; question: string; answer_md: string; section: string | null; sort: number; is_published: boolean };
export type Testimonial = { id: string; quote: string; name: string; handle: string | null; source: string; consent_at: string; is_published: boolean };
export type RoadmapItem = { id: string; title: string; body: string; status: "exploring" | "planned" | "building" | "shipped"; sort: number; is_published: boolean };
export type NodoInsight = { topic: string; question: string; answer: string | null; hits: number; score: number; status: "candidate" | "approved" | "rejected"; reviewed_by_admin: boolean; updated_at: string };
export type AuditRow = { id: number; at: string; actor: string | null; table_name: string; op: string; row_pk: string | null; diff: Json };
