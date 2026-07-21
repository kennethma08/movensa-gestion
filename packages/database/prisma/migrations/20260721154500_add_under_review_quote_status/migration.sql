-- Allow administrators to keep a quote in an internal review stage without
-- sending it to the client.
ALTER TABLE "quotes"
  DROP CONSTRAINT IF EXISTS "quotes_status_check";

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_status_check"
  CHECK (status IN (
    'draft',
    'under_review',
    'sent',
    'viewed',
    'accepted',
    'declined',
    'expired',
    'converted'
  ));
