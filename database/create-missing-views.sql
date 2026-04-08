-- Create missing database views for admin dashboard

-- Admin review queue — pending and flagged documents
CREATE OR REPLACE VIEW v_admin_review_queue AS
  SELECT
    d.id, d.title, d.level, d.doc_type, d.year,
    d.file_name_original, d.file_size_bytes, d.status,
    d.created_at AS uploaded_at,
    s.name AS subject_name,
    u.full_name AS uploader_name,
    u.email AS uploader_email
  FROM documents d
  JOIN subjects s ON d.subject_id = s.id
  JOIN users u    ON d.uploader_id = u.id
  WHERE d.status IN ('pending', 'flagged')
  ORDER BY d.created_at ASC;

-- Revenue summary by day
CREATE OR REPLACE VIEW v_daily_revenue AS
  SELECT
    DATE(completed_at)  AS day,
    payment_type,
    COUNT(*)            AS transactions,
    SUM(amount_mwk)     AS total_mwk
  FROM payments
  WHERE status = 'completed'
  GROUP BY DATE(completed_at), payment_type
  ORDER BY day DESC;
