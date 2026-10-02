# Deploy the shared edition

## New M.I.D.A.S. features

All pages include the full project name, a direct ScienHub editor button and the supplied Teams General-channel link. The Teams link opens the channel; choose its Files tab for shared PowerPoints.

Every literature detail popup now has copy buttons for a plain author–date reference, BibTeX and a LaTeX cite command. Edit bibliography details in Add literature / Edit record. Missing fields are flagged, not invented. Manual author names should be separated by semicolons (for example Smith, Jane; Jones, Alex). Generated references should be checked against the required submission style.

Import accepts bare DOIs, DOI URLs and web addresses with or without https://. DOI metadata tries Crossref then DataCite. Browser-accessible HTML pages can provide citation/meta tags. Blocked pages, private links, PDFs without an identified DOI and unavailable sources still support custom entries: enter the title and source link yourself. No proxy receives your source URLs, and restricted pages are not bypassed.

Presentation Studio is a fourth page with saved decks, four editable slide layouts, ordering, duplication, notes, per-deck word search, presentation mode, editable JSON import/export and standalone HTML export. Open the HTML and use Print / Save as PDF. It does not import or export PPTX. Use the Teams shortcut for existing PowerPoints. Each deck saves independently with revision checks; no extra SQL migration is required because it uses the existing diagram record type. New decks and edits share only when Save presentation is clicked. Exports may include unsaved edits.

Local QA used an isolated mock database, including a successful real Crossref metadata lookup, custom entry creation, BibTeX copying and presentation creation/saving. No QA records were added to the team database.

Upload every file in this folder, including vendor/, to the existing GitHub Pages publishing folder. Replace the matching files beside the existing index.html. Do not upload only the ZIP or put this folder inside another folder. No build is needed.

The Supabase public endpoint and publishable key are configured. The owner has run the database setup and configured the production sign-in redirect. The library starts empty. The default project outline and subsystem diagrams remain available until first saved. Existing standalone browser data is not imported or erased.

## Verify after deployment

1. Wait for GitHub Pages to finish deploying, then hard refresh the site.
2. Sign in using your approved owner email and open the emailed link.
3. Add a temporary literature item. Wait for “All changes saved”. Check it from another signed-in browser.
4. Edit the outline and verify it in the other browser. Open forms defer incoming updates; use Load latest when finished.
5. Test simultaneous changes to the same record. A stale save should show a conflict. Export that draft, then Load latest.
6. Open History & restore and restore an earlier version.

The sign-in screen and simulated save/conflict flows have been checked locally. Signed-out requests were verified to be denied by the actual database. Authenticated saves, email delivery, Realtime and two-account behaviour still require this deployment test.

## Approve colleagues

Run the following in Supabase SQL Editor, replacing the example address with the colleague's exact email. Use editor for editing or viewer for reading:

```sql
insert into public.of_team (email, role)
values ('colleague@example.com', 'editor')
on conflict (email) do update set role = excluded.role;
```

They then sign in through the website. Keep email confirmation enabled. Supabase's default test email service restricts recipients and volume; if it rejects colleague addresses, configure custom SMTP before team rollout. Do not weaken database policies to fix email delivery.

## Saving and recovery

- Literature items and stage notes save independently.
- The outline, subsystems, bubble graphs and overview connections save as one versioned design record to keep linked changes together. Simultaneous design edits can conflict; there is no automatic graph merge.
- The top cloud status is authoritative. Imports save one record at a time and can partially complete if interrupted; reimport skips duplicates.
- Failed or conflicting saves pause further saves. Export current draft, then Load latest. An earlier cached unsaved draft can be downloaded on reopening. Raw unsaved form text appears under formDraft in exports for manual recovery.
- Deleted records are recoverable flags. History shows the latest 100 revisions across the workspace; older history remains in the database. Restore creates a new revision.
- Realtime updates refresh idle pages. Open forms and active edits defer refresh. A 30-second polling fallback checks idle pages; manual Load latest is also available.
- Viewer accounts cannot save. Attempts display a warning; Load latest discards their local changes.

## Import

Research accepts CSV and exported JSON, including the original literature CSV headings. Export Excel sheets to CSV first; XLSX is not supported directly. Reads are paginated, so more than 200 or 1,000 literature items will not be silently truncated.

Import design JSON on the overview/subsystems page and the same file on the research page to merge literature and notes.

## Dependency

vendor/supabase.js is the official @supabase/supabase-js 2.117.2 UMD bundle from jsDelivr; its MIT licence is included. No authentication CDN is needed at runtime. Never put a service-role key or secret key in this website.
