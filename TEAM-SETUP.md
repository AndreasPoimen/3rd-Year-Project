# M.I.D.A.S. shared workspace

Website: https://andreaspoimen.github.io/3rd-Year-Project/
Owner page: https://andreaspoimen.github.io/3rd-Year-Project/team.html

## Accounts and one-time approval

1. A teammate opens the website, chooses Create account / request access, and enters a name, email and password.
2. They see Waiting for owner approval. They cannot read project records or other applications.
3. The owner opens Team management, finds the pending request, chooses Editor or Viewer, then confirms approval.
4. Approved members sign in normally thereafter. Approval does not expire on logout. The owner can change their role or revoke it later.

Owners cannot remove or demote an owner from this page. Owner decisions are recorded in the database audit table. Membership is tied to the approved account ID, so typing an approved email into a different account does not grant access. Passwords are handled by Supabase and are not available to the owner.

### Required one-time Supabase setup

Run the separately supplied 02-team-approval.sql after the original database setup. It must show Team approval ready with at least one owner. The current owner must have signed in at least once before migration. It preserves project data and binds existing approved users to account IDs.

For free registration without an SMTP provider, enable new sign-ups and disable Confirm email in Supabase Authentication / Sign In / Providers. Do this only after installing the approval migration. Email addresses are then self-declared: approve only people whose identity you recognise independently. The project remains inaccessible until approval. Do not add unconfirmed people directly to of_team by email; use the Team management page.

Email-link sign-in remains available subject to Supabase email restrictions. Password reset emails need SMTP; without it, contact the owner for account recovery. No paid service has been enabled.

## Shared editing

The cloud status is authoritative. Literature and notes save independently. Project outline, subsystem trees and block diagram form one versioned design record. Each presentation has its own version. Conflicting saves pause rather than overwrite another member. Export a draft, then Load latest to recover. Live refresh is deferred while editing. Server permissions change immediately on revocation; open pages recheck membership every 30 seconds.

The History panel shows the latest 100 revisions, including recoverable removed records. Earlier versions remain in the database. A restored version becomes a new revision. Imports are saved record by record and may partially complete if interrupted.

## Literature and citations

CSV and exported JSON are supported; export Excel sheets as CSV first. Reads are paginated. DOI lookup tries Crossref and DataCite. Page metadata works where browser access is permitted. Manual title/link entry always remains available for blocked pages or sources without metadata.

Each literature record offers author-date reference, BibTeX and LaTeX cite-command copy buttons. Edit journal, DOI, publisher and pages in the bibliography section. Separate manual authors with semicolons. Check generated citations against the required submission style.

## Presentations and team links

Presentation Studio supports saved decks, four layouts, ordering, duplication, speaker notes, search, presentation view, JSON editing and standalone HTML export. Open the HTML and use Print / Save as PDF. PPTX import/export is not implemented. The Teams shortcut opens the supplied General channel; use its Files tab for shared PowerPoints. ScienHub opens the team's LaTeX editor directly.

## Deployment

Publish all website files including vendor/ from the repository root. No build step is required. cloud-config.js contains a public publishable key; never replace it with a secret/service-role key. The Supabase library is vendored with its MIT licence. Free Supabase projects can pause after a week of low activity.
