ALTER TABLE thread_attachments
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_thread_attachments_approved_by ON thread_attachments(approved_by);
