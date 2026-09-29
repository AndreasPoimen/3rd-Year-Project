# Orbital Foundry

A static research workspace for an in-space recycling design project. Open `index.html`, or serve this folder with any static server. No build step is required. Keep all five website files together.

## Included

- Animated technology canvas with pan, zoom, motion toggle, keyboard-accessible stage details, research questions, risks, verification directions and saved notes.
- Searchable literature library, stage filters, editable records, reading status and CSV export.
- Keyword explorer connecting research terms to records and system stages.
- Graph lab: horizontal bars, columns, donut, line, cumulative publication timeline, stage/status heatmap and stage–paper network. Citation/year scatter and weighted score comparisons. Six grouping options; SVG and CSV downloads.
- Link import with Crossref lookup for DOI URLs, direct metadata lookup for CORS-enabled websites, editable metadata and local keyword/stage suggestions.
- CSV import, JSON workspace import/export, duplicate detection and browser persistence.
- Responsive layouts and reduced-motion support.

## Data provenance

The eight technology stages come from the supplied HTML. The main literature collection now comes from Ranked Space Debris Literature.xlsx: 120 rows in six topic sheets, preserved as 120 entries. One title repeats with different links and years, so both entries are retained. All 120 records have source links; four have unavailable citation counts. Original workbook metadata is preserved, including dated citation sources, ranking components, topic ranks, summaries and Scholar search links. Some source text contains replacement characters already present in the workbook.

Ranking weights: 45% citation impact, 25% recency and 30% project scope fit. These are workbook screening judgements, not independent quality assessments. Keywords and stage links are local vocabulary/topic suggestions. Citation counts were not refreshed online. Downstream recycling stages remain evidence gaps in this supplied collection.

The source workbook is unchanged. Future CSV imports support title, authors, year, url, summary, keywords, stages, topic and status. JSON workspace exports preserve full ranking metadata.

## Hosting on GitHub Pages

1. Create a GitHub repository and upload `index.html`, `style.css`, `app.js`, `seed.js` and `literature.js` to its root.
2. In repository Settings → Pages, select deployment from a branch, then the main branch and root folder.
3. Visit the Pages address GitHub provides. Relative asset paths support project repositories.

No account secrets or API keys belong in these files. The site has no build dependencies. Google Fonts is optional: system-font fallbacks work without it.

## Team use and persistence

GitHub Pages hosts the shared interface and initial collection. Additions and notes are stored locally in each browser; they do not update GitHub, SharePoint or teammates automatically. Use **Export workspace** and **Import workspace / CSV** to transfer changes. Importing workspace notes overwrites matching stage notes. Export a backup before importing another person's notes.

For a new shared baseline, place an exported workspace in the repository as `workspace.json` and adapt the initial loading logic, or connect a properly authenticated database. Live team synchronisation is not included. There is no deployed hosting or external storage configured in this package.

## Link-import limitations

Crossref DOI lookup needs an internet connection and a DOI registered with Crossref. Ordinary page lookup only works where the destination permits cross-origin browser requests. Paywalled, private, JavaScript-only or blocked pages require manually pasted details. No third-party scraping proxy is used. Keyword suggestions are local word-frequency and stage-vocabulary matches; they are not an AI review of the paper. Review suggestions before saving.

## Chart interpretation

Charts count actual library entries. Multiple stage/keyword assignments can make totals exceed the number of unique papers. Unknown years are displayed separately and excluded from cumulative timelines. Category charts show up to 20 categories and network views up to 30 papers for readability. CSV contains the aggregation; engineering performance plots require numeric experimental data not present in the supplied source.

## Files

`index.html`: shell and navigation. `style.css`: visual system. `app.js`: interaction and storage. `seed.js`: stage definitions. `literature.js`: ranked workbook data. No package installation is needed.

