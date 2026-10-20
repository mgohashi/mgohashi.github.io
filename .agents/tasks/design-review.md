# Design Review: Migrate mohashi.io from Jekyll to Astro (revision 3)

Reviewed fresh against the actual repository contents in the worktree
`/Users/mgohashi/Repos/github.com/mgohashi/mgohashi.github.io/.worktrees/astro-migration`,
without relying on the design document's own claims, and without relying on
the prior two review rounds' conclusions (re-verified independently). This is
the third review round. The document under review contains a "Responses to
design review findings" section addressing round 2's `CHANGES_REQUESTED`
verdict (3 MEDIUM, 0 HIGH). Each of those three fixes was re-verified below
against the live source tree, and the rest of the document was re-read end to
end as if for the first time. In addition, this round verified several
external technical claims (npm package versions, the real `withastro/astro`
blog template's file layout and `BaseHead.astro` implementation) against live
sources, since those claims were asserted but not independently checked by
the prior rounds.

## Findings

No HIGH or MEDIUM findings this round.

1. **[NIT] `getImage()` is asserted as *the* mechanism for OG/Twitter image
   resolution, but the real Astro blog template's own `BaseHead.astro` does
   not use it — it reads `image.src` directly off the `ImageMetadata` prop.**
   Location: design.md section 4, "OG/Twitter image resolution for per-post
   `heroImage`" bullet.
   Verified: the live `withastro/astro` repo's
   `examples/blog/src/components/BaseHead.astro` takes an `image?: ImageMetadata`
   prop and does `new URL(image.src, Astro.url)` with no `getImage()` call at
   all. `getImage()` (from `astro:assets`) is real and documented, and is a
   valid way to resolve a schema-produced `image()` field to a URL, but the
   design presents it as the necessary approach for this problem when the
   officially-shipped pattern for the exact same prop type is simpler
   (`heroImage.src` directly, since a content-collection `image()` field
   resolves to the same `ImageMetadata` shape the template's own prop expects).
   This isn't wrong — `getImage()` still works and gives more control (e.g. if
   format conversion for the OG image specifically is ever wanted) — but
   stating it as required overstates the need for the extra API call for what
   the template itself does with a plain property access.
   Fix (optional, non-blocking): soften the wording to something like "resolve
   `heroImage` to an absolute URL — either via direct `heroImage.src` access
   (matching the official blog template's own `BaseHead.astro` pattern for its
   `ImageMetadata` prop) or via `getImage({ src: heroImage })` if format
   control is wanted — and use `new URL(...).href` with `Astro.site` for the
   final `og:image`/`twitter:image` value." Either implementation satisfies
   the same requirement; this is a wording precision issue, not a design flaw.

## Verified Assumptions

Carried over from prior rounds (re-checked again this round, all still hold):
- `CNAME` file content is exactly `mohashi.io`, matching section 4's
  `site: 'https://mohashi.io'` and section 7's CNAME-preservation plan.
- `_posts/` contains exactly 2 posts (`2020-04-18-...`, `2020-05-26-...`);
  their frontmatter (`title`, `excerpt`, `header.image`/`og_image`,
  `header.overlay_image`/`overlay_filter`/`caption`, `toc`, `classes: wide`,
  `categories`, `tags`) matches the design's mapping table and "concrete
  resulting frontmatter" blocks exactly, including the specific
  category/tag lists.
- `_drafts/` contains exactly 8 files; the design's classification (7
  Minimal-Mistakes theme-demo/scaffold fixtures, 1 genuine unfinished draft
  `setup-3scale-in-crc.md`) is correct.
- `_config.yml` confirms `analytics.provider: google-gtag` with
  `tracking_id: "UA-163964078-1"` and `comments.provider: disqus` with
  `shortname: "mohashi"`, exactly as sections 3.2/3.3 state.
- `_config.yml`'s `plugins:` list includes `jekyll-target-blank`, and
  `_includes/comments.html` / `_includes/analytics.html` dispatch on
  `site.comments.provider` / `site.analytics.provider` via Liquid `case`
  statements exactly as the design's framing of these integrations implies.
- `assets/images/favicon.png` exists and `_includes/head.html:16` references
  it as `<link rel="shortcut icon" type="image/png" href="/assets/images/favicon.png">`.
- `assets/images/avatar.png`, `bio-photo.jpg`, `old.png`, and
  `assets/images/setup-a-cloud-native-quarkus-app-in-knative/quickstart-knative-webconsole.gif`
  are all genuinely unreferenced anywhere in the worktree (re-verified via
  grep this round, including inside the per-post image subdirectories this
  time) — all four are now correctly included in section 8 step 1's discard
  list. This was round 2's open MEDIUM finding; it is resolved.
- All Tekton-post images (`tekton.png`, `tekton-architecture.png`,
  `tekton-pipeline.png`, `unsplash-image-2.jpg`, `eventlistener-tkn-log.gif`,
  `pipelinerun-tkn-log.gif`, `webconsole-pipeline-details.png`,
  `webconsole-pipeline-list.png`, `webconsole-pipelinerun-details-error.png`,
  `webconsole-pipelinerun-details.png`, `webconsole-pipelinerun-list.png`,
  `webconsole-pipelinerun-logs.gif`) are referenced in the post body;
  none are orphaned in that directory.
- `target="_blank"` occurrence counts: 10 explicit Kramdown IALs in the
  Knative post, 24 in the Tekton post (34 total), confirmed via grep —
  matches section 2's revised wording, which now also correctly states the
  `jekyll-target-blank` plugin's site-wide effect on links without an explicit
  IAL (round 2's MEDIUM finding #2; resolved).
- Footnotes (`[^1]`, `[^2]`) exist only in the Knative post (verified via
  grep in both posts); the Tekton post has none. The design's wording
  correctly scopes footnotes to "the Knative post" only.
- `_pages/404.md` contains the literal `fixurl.js` third-party script block
  exactly as quoted in section 8; the design's revision-3 wording no longer
  asserts the endpoint is "dead," only that it has no accessibility/SEO value
  and conflicts with the minimal-client-JS goal (round 2's MEDIUM finding #3;
  resolved — no unverified liveness claim remains).
- `_data/navigation.yml` has exactly 4 entries (Posts, Categories, Tags,
  About); the design's decision to port only Posts + About as 2 hardcoded
  nav links, with Categories/Tags explicitly called out of scope, is
  consistent with the rest of the document (no taxonomy pages introduced
  anywhere else).
- `_includes/skip-links.html` exists, supporting the section 6 claim that the
  Jekyll theme had a skip link worth porting.
- `.gitpod.yml` references `bundle exec jekyll serve --incremental`,
  confirming the basis for deleting it in section 8 step 4.
- The local implementation environment's Node version is `v10.24.1`,
  confirmed by running `node --version`, exactly matching the design's
  stated blocking-prerequisite claim in section 1 (Astro 7 requires
  `^18.20.8 || ^20.3.0 || >=22.0.0`).
- `_pages/about.md` and `_pages/404.md` body copy matches what section 8
  describes porting (both verbatim, including the "Your pixels are in
  another canvas" 404 copy).

Newly verified this round (not previously checked):
- Current npm registry versions match the design's "verified at design time"
  table exactly: `astro@7.4.1`, `create-astro@5.3.0`,
  `@astrojs/sitemap@3.7.4`, `@astrojs/rss@4.0.19`. The latest
  `withastro/action` GitHub release tag is `v6.1.3`, also matching exactly.
- The real `withastro/astro` repo's `examples/blog` template (the scaffold
  source referenced throughout the design) has the exact file layout the
  design assumes: `src/content.config.ts` (not `src/content/config.ts`),
  `src/consts.ts`, `src/pages/about.astro`, `src/pages/rss.xml.js`,
  `src/components/BaseHead.astro`. The template's real `content.config.ts`
  schema (`defineCollection({ loader: glob(...) })` with `title`,
  `description`, `pubDate`, `updatedDate`, `heroImage: z.optional(image())`)
  is a direct subset of the schema the design proposes in section 2 (which
  adds `tags`, `categories`, `author`, `draft` on top) — the design's schema
  is a faithful, non-hallucinated extension of the real template, not an
  invented API.
- `getImage()` from `astro:assets` is a real, documented Astro API for
  resolving an image to a built URL outside of the `<Image>`/`<Picture>`
  component context — not hallucinated. See Finding 1 (NIT) for a nuance on
  whether it's strictly necessary versus the template's own simpler pattern.
- No `robots.txt` exists in the current Jekyll site, and the design does not
  claim one does or propose removing one — no conflict there.
- `_pages/category-archive.md`, `tag-archive.md`, and `year-archive.md` exist
  with permalinks `/categories/`, `/tags/`, `/posts/` respectively — confirms
  the "3 Jekyll-generated archive stubs" count in the overview (alongside
  about.md and 404.md, totaling the stated "5 custom pages").

## Unverified / Wrong Assumptions

None remaining. All assumptions carried over from prior rounds that were
previously flagged as unverified (the `target="_blank"` scope, the `fixurl.js`
"dead script" claim, the fourth orphaned image) have been corrected in this
revision and re-verified above as now accurate. The one new observation this
round (Finding 1, `getImage()` necessity) is a precision nuance, not a wrong
or unverified factual claim — `getImage()` does work as described, it's just
not the only or simplest valid approach.

## Verdict

0 HIGH, 0 MEDIUM, 1 NIT. **APPROVED.**

All items from the review brief are explicit, justified by evidence in the
document, and verified against the actual repository / live external sources
in this round:
- Drafts (3.1): explicit discard decision, justified per-file.
- Analytics (3.2): explicit drop decision, justified (UA shutdown is a
  verifiable, cited fact).
- Comments (3.3): explicit drop decision, justified.
- CNAME/`site` (4, 7): `mohashi.io` preserved via `public/CNAME` →
  `dist/CNAME`; `astro.config` `site: 'https://mohashi.io'` matches the
  verified `CNAME` file content.
- Frontmatter mapping (2): complete field-by-field table for both real posts,
  verified against actual frontmatter on disk.
- SEO (4): OG/Twitter/sitemap/canonical/RSS all covered with concrete
  mechanisms; the one NIT is a wording precision nit, not a gap.
- Image optimization (5): concrete plan for hero/in-body images via
  `astro:assets`, with an explicit, justified exception for animated GIFs.
- Accessibility (6): landmarks, skip link, alt text, contrast, keyboard nav,
  and an honest validation caveat (manual/expert review needed, out of scope)
  are all covered.
- Jekyll cleanup (8): extraction-before-deletion ordering is explicit and
  itemized, with all four orphaned assets now accounted for.
