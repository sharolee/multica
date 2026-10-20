-- Restore fast lookup by (workspace_id, number).
-- idx_issue_workspace_number was dropped as redundant in 300 (covered by
-- uq_issue_workspace_number), but the unique constraint is no longer retained
-- for the project-prefix numbering scheme, leaving identifier reverse lookup
-- (GetIssueByPrefixAndNumber) as a sequential scan.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issue_workspace_number
    ON issue (workspace_id, number);
