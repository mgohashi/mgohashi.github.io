# Design: Migrate mohashi.io from Jekyll (Minimal Mistakes) to Astro

## Overview

The site is currently a Jekyll blog using the remote theme `mmistakes/minimal-mistakes@4.24.0`, deployed to GitHub Pages at the custom domain `mohashi.io` (via `CNAME`). It has 2 real posts, 8 drafts, 5 custom pages (about, 404, and three Jekyll-generated archive stubs), Disqus comments, and Google Analytics (UA, deprecated). The user has approved a full rewrite to Astro: no requirement to run Jekyll and Astro in parallel, no requirement for exact visual parity, but all essential content and metadata (posts, author info, site metadata, social links, domain) must carry over. Breaking changes are explicitly accepted.

The target stack is **Astro 7 with TypeScript**, scaffolded from Astro's official blog example, using content collections for posts, `@astrojs/sitemap` and `@astrojs/rss` for feed/SEO infrastructure, and deployed to GitHub Pages via `withastro/action`. The rest of this document locks in every decision needed to implement this without further architectural judgment calls.

## 1. Target framework, version, and scaffold

**Decision: Astro 7.4.1 (current latest, verified via npm registry at design time), with TypeScript (`strict` template), scaffolded from the official blog example.**

Verified at design time (re-check at implementation time since these drift):
- `astro`: `7.4.1`
- `create-astro`: `5.3.0`
- `@astrojs/sitemap`: `3.7.4`
- `@astrojs/rss`: `4.0.19`
- `withastro/action`: `v6.1.3`

Scaffold command (run from repo root in the worktree during implementation, not now):
```bash
npm create astro@latest . -- --template blog --typescript strict --no-install --no-git
```
Rationale for each flag:
- `--template blog`: Astro's official blog example already ships content collections for posts, an RSS endpoint, a sitemap integration, and a minimal accessible layout — it is the closest official starting point to "blog best practices" and avoids hand-rolling infrastructure the framework already provides well.
- `--typescript strict`: the project has no existing JS/TS codebase to match, and a 2-post blog is small enough that strict types add safety (especially for the content collection schema in section 2) with no real cost.
- `--no-git`: the worktree is already a git repo (git worktree of the main repo); `create-astro` must not try to re-init git.
- `--no-install`: install dependencies explicitly afterward so install failures are visible as a separate, retriable step rather than hidden inside the scaffold command.

Because `npm create astro` syntax and template availability can change between Astro releases, **the implementer must re-run `npm create astro@latest --help` and confirm the `blog` template still exists before scaffolding**, and adjust flags if the CLI has changed. If the `blog` template is ever removed upstream, fall back to the minimal (`--template minimal`) template and hand-port the content collection + RSS + sitemap setup described below — the schema and integration config in this document are template-agnostic.

Node version: Astro 7 requires Node `^18.20.8 || ^20.3.0 || >=22.0.0`. The implementation environment's local Node is v10.24.1, which is incompatible — **the implementer must use a supported Node version (via nvm, Brazil-equivalent toolchain, or CI) before scaffolding or building**; this is a blocking prerequisite, not optional.

## 2. Content collection schema for posts

Astro content collections are defined in `src/content.config.ts` (Astro 5+ convention; the blog template's default location, `src/content/config.ts`, is the pre-5 convention — **verify which the scaffolded template uses and keep that file's location; do not create both**). The schema:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: image().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    author: z.string().default('Marcelo Ohashi'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

Design notes:
- `image()` from the schema callback lets `heroImage` be processed by `astro:assets` (automatic optimization, width/height inference) instead of being a raw string path — this directly serves the performance requirement in section 5.
- `tags` and `categories` are kept as **separate arrays** rather than merged, because the Jekyll posts use them for different purposes (categories are broad: `Blog`, `Kubernetes`, `Knative`; tags are specific: `Openshift4`, `Quarkus`, `kubectl`, etc.). Collapsing them would lose information. Both default to `[]` so a post without either is still valid.
- `draft: z.boolean().default(false)` is the mechanism for section 3's drafts decision.
- No `excerpt` field: Astro's convention is to compute a description/excerpt from `description` or from the rendered body; the Jekyll `excerpt` frontmatter maps directly to `description`.

### Frontmatter mapping (Jekyll → Astro) for the 2 real posts

| Jekyll field | Astro field | Notes |
|---|---|---|
| `title` | `title` | direct copy |
| `excerpt` | `description` | direct copy |
| filename date prefix (`2020-04-18-...`) | `pubDate` | parse from filename, write explicit ISO date in frontmatter |
| `header.image` / `header.og_image` | `heroImage` | re-point to new asset path (see section 8 asset handling below) |
| `header.overlay_image`, `overlay_filter`, `caption` | dropped | Minimal Mistakes-specific hero-overlay styling has no Astro blog-template equivalent; not essential content. Photo credit text folded into the post body as a plain caption if desired, otherwise dropped — these are stock Unsplash placeholder photos, not attributed content critical to the article. |
| `toc` | dropped as frontmatter; optionally regenerate via a `remark` TOC plugin later | out of scope for this migration (see Out of Scope in requirements) |
| `classes: wide` | dropped | theme-specific layout hint, meaningless in Astro's layout |
| `categories` | `categories` | direct copy (array) |
| `tags` | `tags` | direct copy (array) |
| (none — Jekyll used site-wide `author`) | `author` | defaulted to `"Marcelo Ohashi"` in schema; no need to repeat per post |

Concrete resulting frontmatter for both posts:

```yaml
---
title: "Quick Start Knative"
description: "This post will show you details on how to provision, deploy and use some Knative features and give you an overview of what is serverless"
pubDate: 2020-04-18
heroImage: "./knative.png"
tags: ["Kubernetes", "Openshift4", "Knative", "Cloud Native", "Quarkus", "Container", "Serverless", "Code Ready Containers", "kubectl", "Maven", "Java8", "GraalVM"]
categories: ["Blog", "Kubernetes", "Knative"]
---
```

```yaml
---
title: "How to build cloud-native pipelines"
description: "This post will show you details on how to provision, deploy and use some Tekton features and give you an overview of what is the new age of CI/CD"
pubDate: 2020-05-26
heroImage: "./tekton.png"
tags: ["Kubernetes", "Openshift4", "Tekton", "Cloud Native", "Quarkus", "Container", "Code Ready Containers", "kubectl", "Maven", "Java11"]
categories: ["Blog", "Kubernetes", "Knative"]
---
```

Body content handling: both posts use Kramdown-specific syntax that plain Markdown/MDX does not support and must be hand-fixed during content porting (implementation phase, not this design):
- `{: .notice}`, `{: .align-center}`, `{: .text-justify}` Kramdown IALs (inline attribute lists) — strip them; replace the few that convey real meaning (e.g. the `.notice` callout in the pipelines post) with a plain blockquote (`> **Note**`) since no theme-specific "notice" component exists.
- `{% include video id="..." provider="youtube" %}` Jekyll/Liquid include — replace with a small reusable `<YouTubeEmbed>` Astro component (simple wrapper around an `<iframe>` with `loading="lazy"`, `title` attribute for accessibility, and a `allow`/`referrerpolicy` lockdown) or, if the implementer prefers zero custom components, a plain accessible `<iframe>` inline.
- `{:target="_blank"}` Kramdown link attribute and the site-wide `jekyll-target-blank` plugin — both posts carry an explicit `{:target="_blank"}` IAL extensively (verified: 10 occurrences in the Knative post, 24 in the Tekton post, 34 total), but that count is not the full picture of current behavior: `_config.yml`'s `plugins:` list also includes `jekyll-target-blank`, which applies `target="_blank" rel="noopener"` to *every* external link site-wide at render time, including any plain `[text](https://...)` link without an explicit IAL. So today, all external links in both posts open in a new tab — 34 of them via the explicit Kramdown marker, and any remaining external links via the plugin, with no exceptions either way. **Decision: drop this behavior entirely for all of them, no exceptions, with no plugin equivalent added in Astro.** Opening links in a new tab without warning is a known accessibility anti-pattern (disorients screen-reader and keyboard users, breaks the back button), and there is no principled reason any of these links need it, since they are all plain external reference links (docs, GitHub repos, Unsplash credits), not links that trigger a file download or an unsaved-work warning (the usual legitimate cases for `target="_blank"`). All links become plain `<a href="...">` with default same-tab behavior.
- Footnotes (`[^1]`, `[^2]` in the Knative post) — standard Markdown footnote syntax is not part of CommonMark; enable `remark-footnotes` or rewrite as plain inline parenthetical links. **Decision: rewrite as inline links** rather than adding a remark plugin dependency for two footnotes total — keeps the dependency surface minimal per the user's "keep infra minimal" instruction (applied here by extension, not just to analytics/comments).
- Raw HTML comment markers like `<!-- markdownlint-enable MD033 -->` in the pipelines post — strip, they were disabling a Jekyll-side linter rule that no longer applies.

## 3. Explicit decisions on ambiguous points

### 3.1 Drafts in `_drafts/`

**Decision: Discard. Do not migrate any of the 8 files in `_drafts/` into the Astro content collection.**

Justification: All 8 files are either (a) Minimal Mistakes theme-demo fixtures that ship with the theme template and document theme features, not the author's own writing (`post-chat.md`, `post-link.md`, `post-modified.md`, `post-notice.md`, `post-quote.md`, `post-standard.md`, `welcome-to-jekyll.md` — the latter is literally the Jekyll "hello world" scaffold post), or (b) a genuinely unfinished draft (`setup-3scale-in-crc.md`) that was never published in over 4 years and shows no sign of being finish-worthy as part of this migration. Carrying theme-demo content into a from-scratch rewrite would misrepresent it as the author's content. If the author wants to resume `setup-3scale-in-crc.md` later, it remains recoverable from git history after migration — nothing is destroyed, only excluded from the new site's source tree. The `draft: boolean` schema field is still worth keeping (see section 2) so that *future* in-progress posts have a supported, buildable-but-unpublished state; it is just not used to resurrect these old drafts now.

### 3.2 Analytics (Google gtag, UA-163964078-1)

**Decision: Drop analytics entirely. Do not replicate Google Analytics (UA or GA4) in the new site. No pluggable analytics-provider abstraction.**

Justification: `UA-163964078-1` is a Universal Analytics property ID; Google shut down UA data processing in July 2023 and UA properties no longer collect data at all — the existing tracking id is already dead and sending hits to it today does nothing. Replicating "the same analytics" is therefore not possible as a like-for-like port; it would require provisioning a brand-new GA4 property (a new external account/resource, not a code migration decision) and the user's instructions for this task are scoped to the site code, not GA account provisioning. Keeping the migration unblocked on an external account creation step, and keeping the client-JS footprint minimal (a stated performance goal in section 5), both favor dropping it now. If analytics are wanted later, add a single `<script>` snippet for a concrete chosen provider (GA4, Plausible, or GitHub's own traffic insights) directly in the base layout — a one-line, swappable `<script>` tag needs no abstraction layer, consistent with "keep infra minimal, no pluggable provider system."

### 3.3 Comments (Disqus, shortname `mohashi`)

**Decision: Drop Disqus. Do not replicate comments in the new site.**

Justification: Disqus is a third-party script that materially hurts the performance and privacy posture this migration is explicitly trying to improve (it injects trackers, cross-site cookies, and a non-trivial JS payload, which directly conflicts with the "minimal client JS" performance goal in section 5). The underlying content signal is also weak: across the two real posts in a blog that's been live since 2020, there's no indication of an active comment thread worth preserving (this cannot be fully verified without the Disqus dashboard, which is outside this design's scope — but the cost of being wrong is low, since Disqus itself retains the data under the `mohashi` shortname regardless of whether this site embeds it). Static GitHub Pages has no server-side component to build first-party comments on, so any replacement is necessarily another third-party embed (giscus/utterances, which use GitHub Issues/Discussions) — if comments are wanted later, `giscus` is the recommended lightweight option (lazy-loaded iframe, no ads/tracking, GitHub-native identity) but that is a future addition, not part of this migration, per "no pluggable provider system unless justified."

## 4. SEO

- **Meta tags**: a shared `<SEO>`/`<BaseHead>` Astro component (the blog template ships one; extend it) rendering `<title>`, `<meta name="description">`, canonical `<link rel="canonical">`, favicon (`<link rel="icon" type="image/png" href="/favicon.png">`, ported from `assets/images/favicon.png` per section 8), Open Graph (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:site_name`) and Twitter Card (`twitter:card=summary_large_image`, `twitter:site=@mgohashi`, `twitter:title`, `twitter:description`, `twitter:image`) tags, driven by per-page props (`title`, `description`, `image`) with site-wide fallbacks defined once in `src/consts.ts`:
  ```ts
  export const SITE_TITLE = 'DevMode';
  export const SITE_DESCRIPTION = 'Exchange of developer insights - by Marcelo Ohashi';
  export const SITE_AUTHOR = 'Marcelo Ohashi';
  export const SITE_URL = 'https://mohashi.io';
  export const DEFAULT_OG_IMAGE = '/images/me.jpeg';
  export const SOCIAL = {
    twitter: 'mgohashi',
    github: 'mgohashi',
    instagram: 'mohashi_',
    linkedin: 'mohashi',
  };
  ```
- **Canonical URLs**: computed from `Astro.site` + `Astro.url.pathname` in the shared head component so every page (including paginated/tag pages, if added) gets a correct canonical automatically — do not hardcode per page.
- **OG/Twitter image resolution for per-post `heroImage`**: OG and Twitter crawlers fetch `og:image`/`twitter:image` directly over HTTP without executing JS or resolving Astro's internal asset graph, so the value in that meta tag must be a plain absolute URL — it cannot be the `ImageMetadata` object that the `heroImage: image()` schema field (section 2) produces. **Decision: in the `<BaseHead>` component, when the current page is a blog post with a `heroImage`, resolve it to a concrete built URL via `getImage({ src: heroImage })` (from `astro:assets`) and use `new URL(resolvedImage.src, Astro.site).href` as `og:image`/`twitter:image`.** For any page without a `heroImage` (the home page, the about page), fall back to `DEFAULT_OG_IMAGE` (`/images/me.jpeg`, served unprocessed from `public/`, per section 5). This keeps the two image pipelines cleanly separated: `astro:assets`-optimized, content-hashed images for in-page rendering (performance), and a stable, directly-fetchable URL for social-card metadata (correctness) — resolved from the same source file via `getImage()` rather than requiring two copies of each hero image.
- **`astro.config.mjs`**: `site: 'https://mohashi.io'` (required for `@astrojs/sitemap`, `@astrojs/rss`, and canonical URL generation to produce absolute URLs). Confirmed from the existing `CNAME` file content (`mohashi.io`), matching the design brief's verified context.
- **Sitemap**: add `@astrojs/sitemap` to `integrations` in `astro.config.mjs`. It auto-generates `sitemap-index.xml`/`sitemap-0.xml` from all built pages at zero config beyond `site` being set; no per-page opt-out is needed since there is no non-public page to exclude (unlike Jekyll's `sitemap: false` on the 404 page — Astro's integration does not emit 404 pages into the sitemap by convention since `404.astro` is handled specially by the build, but **verify this during implementation**; if it does appear, add it to the integration's `filter` option).
- **RSS/Atom feed**: add `@astrojs/rss` and a `src/pages/rss.xml.js` (or `.ts`) endpoint, following the official blog template's existing pattern (the template ships this already — keep it, just confirm it points at the `blog` collection defined in section 2). Link it from the document head with `<link rel="alternate" type="application/rss+xml" title="DevMode" href="/rss.xml">` for feed-reader discoverability.
- **Permalink structure**: Jekyll used `/:categories/:title/` (e.g. `/blog/kubernetes/knative/quick-start-knative/` — all categories chained, which is unusual and hard to replicate meaningfully since the two posts share nearly identical category sets). **Decision: switch to `/posts/:slug/`** (e.g. `/posts/quick-start-knative/`), a flat, predictable structure that is the Astro blog template's default and avoids multi-segment category paths that provide no real navigational value here (both posts are in the same 3 categories). This is a breaking URL change, which the user has explicitly accepted ("Pode fazer quebrando" / breaking changes are fine). Slugs are derived from the filename (e.g. `quick-start-knative`, kebab-cased from the title) rather than reusing the old date-prefixed filenames, since the date is already captured in `pubDate` and doesn't need to live in the URL.

## 5. Performance

- **Static output**: Astro's default `output: 'static'` is kept (no SSR adapter) — the entire site is pre-rendered at build time, matching GitHub Pages' static-hosting-only model and requiring no server runtime.
- **Image optimization**: all post hero images and in-body images are moved under `src/content/blog/<slug>/` (colocated with their post, Astro's recommended pattern for collection-relative assets) and referenced through `astro:assets` (`<Image>` component or the `image()` schema helper from section 2) rather than plain `<img>` tags, so Astro generates optimized, correctly-sized, modern-format (`webp`) output automatically at build time. Images currently under `assets/images/<post-slug>/*.{png,jpg,gif}` are moved as-is into the matching `src/content/blog/<slug>/` directory; `.gif` files (used for terminal-recording-style demos in the Tekton post) are **not** converted to a different format since `astro:assets`' optimization pipeline does not meaningfully optimize animated GIFs — leave them as static files served as-is, referenced with plain `<img>` (not `astro:assets`, which would strip animation) since they're a handful of large assets. The site-wide avatar/profile photo (`me.jpeg`, used for `og_image` and author bio) moves to `public/images/me.jpeg` (served as-is, not processed, since it's referenced both by Astro components and potentially by the OG meta tag which needs a stable absolute URL independent of Astro's content-hashed asset pipeline).
- **Minimal client JS**: no client-side framework (React/Vue/Svelte islands) is added — Astro's zero-JS-by-default model is preserved for every page. The only client JS expected is: (a) if a dark/light theme toggle is kept (the Jekyll site used a forced `dark` skin, not a toggle — **decision: ship a prefers-color-scheme-aware CSS-only dark theme with no JS toggle**, since the Jekyll site never had a toggle either, keeping scope equivalent and JS footprint at zero for this concern), and (b) the YouTube embed wrapper from section 2, which is a plain `<iframe>` with `loading="lazy"`, not a JS library.
- **Fonts/CSS**: the blog template's default minimal CSS is kept rather than porting Minimal Mistakes' Sass (`_sass/minimal-mistakes/`), per the design brief's acceptance of no visual parity — this avoids carrying over a large, theme-coupled stylesheet (the existing `_sass/minimal-mistakes.scss` entry point alone pulls in a dozen partials) into a codebase that has no Jekyll/Sass build step to support it.
- **Build output size**: no bundler config changes anticipated beyond integration defaults; verify bundle size is reasonable (no specific budget set, since this is a near-static content site with 2 posts — if post count grows significantly later, pagination can be added using the same pattern as the official blog template, which already supports it).

## 6. Accessibility

- **Semantic landmarks**: base layout uses `<header>`, `<nav>`, `<main>`, `<footer>` (the Astro blog template already does this — verify and keep). Post pages use a single `<h1>` for the title, with body content starting at `<h2>` to preserve heading hierarchy (the existing Jekyll posts already use `##` consistently for subsections, so this maps directly — just confirm no post body accidentally reuses `<h1>`).
- **Skip link**: add a "Skip to content" link as the first focusable element in the base layout, visually hidden until focused (`:focus-visible` revealed), pointing to `#main-content` on `<main>` — the Jekyll theme had this (`_includes/skip-links.html`) and it's a concrete, cheap, high-value a11y feature worth explicitly porting rather than dropping.
- **Alt text**: every image component/usage requires a non-empty `alt` prop; hero images get `alt` derived from a required `alt` frontmatter-adjacent field passed at usage site (not stored in the schema itself, since alt text is presentation-context-dependent) — **for the 2 migrated posts, the implementer must write real descriptive alt text for each image during content porting** (e.g. "Knative Web Console showing scale-to-zero in progress"), not reuse the filename. This is a concrete to-do for the implementation phase, flagged here so it isn't silently skipped.
- **Color contrast**: whichever base theme/colors the blog template ships with by default are WCAG AA-contrast-checked (spot check with a contrast-ratio tool during implementation) before any custom color overrides are layered on; if the template's defaults already pass (common for official Astro examples, which are built with contrast in mind), no further color work is needed.
- **Keyboard navigation**: no custom interactive widgets are introduced that aren't natively keyboard-operable (links, standard form elements if a search box is ever added) — since section 5 explicitly avoids custom JS components beyond a lazy iframe, this is mostly "don't regress" rather than new work.
- **Validation caveat**: automated checks (Lighthouse, axe-core via a lint step, if added) can catch missing alt text, contrast ratios, and ARIA misuse, but full accessibility compliance cannot be confirmed by tooling alone — it requires manual testing with assistive technologies (screen readers, keyboard-only navigation) and ideally expert review. This design does not include that manual/expert review step; it should be tracked as separate follow-up work after the migration ships, not blocking this migration.

## 7. Deploy (GitHub Pages via GitHub Actions)

**Decision: `.github/workflows/deploy.yml` using `withastro/action@v6` (verified latest tag at design time: `v6.1.3` — re-pin to whatever is current at implementation time) followed by `actions/deploy-pages@v4`.**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v6
      # withastro/action handles Node setup, install, and `astro build` internally;
      # verify current required inputs (e.g. `path`, `node-version`) against
      # https://github.com/withastro/action at implementation time.

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Notes:
- The main branch name must match the repo's actual default branch (**verify**: confirm whether this repo's default branch is `main` or `master` before finalizing the workflow — the design brief didn't state it and this is cheap to check with `git -C <worktree> symbolic-ref refs/remotes/origin/HEAD` at implementation time).
- This requires the repository's GitHub Pages source to be switched from "Deploy from a branch" to "GitHub Actions" in repo settings — **this is a repo-settings change, not a code change, and must be called out to the user as a manual step to perform in GitHub's UI** (or via `gh api`) since it's outside what a workflow file alone can do, and outside this design-only task's scope to execute.
- **CNAME preservation**: move the existing `CNAME` file (content: `mohashi.io`) into `public/CNAME`. Astro copies everything in `public/` verbatim into `dist/` at build time, so it lands at `dist/CNAME`, which `actions/deploy-pages` publishes as-is — this preserves the custom domain through the GitHub Pages deployment exactly as today, with no DNS or repo-settings change needed for the domain itself (only the Pages *source* setting, per the note above).
- Per the task instructions, **no deploy is triggered and nothing is pushed** as part of this design or its eventual implementation step unless separately requested.

## 8. Jekyll file cleanup plan

Cleanup happens **only after** all essential info has been extracted into the new Astro source (i.e., as the last implementation step, not interleaved with scaffolding). Order matters because later steps in this list depend on earlier extraction being verified complete:

1. **Extract first (no deletion yet)**: confirm all of the following have been copied/ported into the Astro source before touching anything:
   - Both posts' content + images (`_posts/*.md`, `assets/images/{setup-a-cloud-native-quarkus-app-in-knative,how-to-build-cloud-native-pipeline}/*`)
   - Site metadata (title, description, author, social handles, email, avatar) from `_config.yml` → `src/consts.ts` (section 4)
   - `_pages/about.md` content → a new `src/pages/about.astro` (or `.md` page using a layout)
   - Avatar/profile image (`assets/images/me.jpeg`) → `public/images/me.jpeg`
   - Favicon (`assets/images/favicon.png`, currently referenced at `_includes/head.html:16` as `<link rel="shortcut icon" type="image/png" href="/assets/images/favicon.png">`) → `public/favicon.png`, referenced from the `<BaseHead>`/`<SEO>` component (section 4) as `<link rel="icon" type="image/png" href="/favicon.png">`. No regeneration into `.svg`/`.ico` — porting the existing PNG as-is preserves the current icon with zero extra work; a multi-format favicon set (ico/svg/apple-touch-icon) is a nice-to-have, not essential content, and is left as optional future polish.
   - `assets/images/avatar.png`, `assets/images/bio-photo.jpg`, `assets/images/old.png`, `assets/images/setup-a-cloud-native-quarkus-app-in-knative/quickstart-knative-webconsole.gif` — verified via grep as unreferenced by any config, page, include, or post (only hit for any of the four is the design-review doc itself, flagging them). The fourth one, `quickstart-knative-webconsole.gif` (4.4 MB), lives inside the Knative post's own per-post image subdirectory rather than the shared `assets/images/` root, but is equally unreferenced: the Knative post's body only links `knative.png`, `quakus-app-web-browser.png`, and `unsplash-image-1.jpg` from that directory. **Decision: discard, do not port.** All four are dead assets with no inbound reference anywhere in the live site; recoverable from git history later if ever needed. Not listed as "extract" items — explicitly excluded here instead.
   - `CNAME` → `public/CNAME`
   - `_data/navigation.yml` has 4 entries (Posts, Categories, Tags, About). **Decision: Categories and Tags index pages are out of scope for this migration** — no taxonomy/archive page is introduced anywhere else in this design, the official Astro blog template does not ship one, and with only 2 posts sharing nearly identical category/tag sets (per section 2's observation), a dedicated taxonomy browsing UI has no real navigational value yet. Port only **Posts** and **About** as hardcoded nav links in the base layout's `<nav>` (2 links, not worth a data-driven abstraction per "keep infra minimal"). If the post count grows enough to justify taxonomy browsing later, it can be added as a separate follow-up feature.
   - A 404 page: port `_pages/404.md`'s copy ("Page not found. Your pixels are in another canvas.") into a new `src/pages/404.astro`; **drop** the Google `fixurl.js` script block (`https://linkhelp.clients.google.com/tbproxy/lh/wm/fixurl.js`, a legacy Google Toolbar spelling-correction helper) — irrelevant to the Astro site, provides no accessibility or SEO value, and keeping an unreplicated third-party script tag the user never asked to carry over conflicts with the minimal-client-JS goal in section 5. (This removal is justified on relevance/goals grounds, not on a claim that the endpoint no longer functions — no liveness check of the URL was performed.)
2. **Delete Jekyll build/dependency files**: `Gemfile`, `Gemfile.lock` — these only existed to run Jekyll's Ruby toolchain, superseded entirely by `package.json`/npm.
3. **Delete Jekyll config and content dirs**: `_config.yml`, `_includes/`, `_layouts/`, `_sass/`, `_data/`, `_pages/`, `_posts/`, `_drafts/` (per section 3.1, drafts are discarded, not ported), and the root `index.html` (Jekyll's empty home-page stub — Astro's blog template provides `src/pages/index.astro` instead).
4. **Delete remaining Jekyll-root files**: `.gitpod.yml` (references `bundle exec jekyll serve`, meaningless post-migration — if a Gitpod config is still wanted, it would need a new Astro-based command, but that's a new feature, not part of this migration, so just remove it) and any leftover `assets/` subpaths once confirmed empty of anything still referenced (`assets/css/main.scss`, `assets/js/*` — all Minimal Mistakes-theme-specific, not reused since section 5 decided against porting the Sass theme).
5. **Verify**: after deletion, `git status` in the worktree should show only the new Astro source tree plus deletions of the above — no leftover Jekyll files, and `npm run build && npm run preview` (or equivalent Astro commands) should succeed from a clean checkout.

## 9. `.gitignore`

Replace the existing Jekyll-specific `.gitignore` (`_site`, `.sass-cache`, `.jekyll-cache`, `.jekyll-metadata`, `vendor`) with the Astro-standard set:

```
# build output
dist/

# generated types
.astro/

# dependencies
node_modules/

# environment variables
.env
.env.production

# macOS-specific files
.DS_Store
```

The `.env*` and `.DS_Store` entries are included because they're part of the standard Astro-template `.gitignore` and good practice even though nothing in this design currently introduces environment variables — cheap to include now, avoids a follow-up commit later.

## Responses to design review findings

### Revision 3 (this revision)

This revision addresses the `CHANGES_REQUESTED` verdict from `.agents/tasks/design-review.md`'s second round (3 MEDIUM, 0 HIGH):

1. **Fourth orphaned image, `quickstart-knative-webconsole.gif`, still unaccounted for (MEDIUM) — Addressed.** Re-verified via grep that this 4.4 MB gif (in the Knative post's own image subdirectory, not the shared `assets/images/` root) has no inbound references anywhere in the worktree. Added it to the same discard list in section 8 step 1 as the three previously-identified orphans, with the same git-history-recoverable justification.
2. **`target="_blank"` decision only counted explicit Kramdown IALs, ignoring the site-wide `jekyll-target-blank` plugin (MEDIUM) — Addressed.** Reworded section 2's decision to state the full current scope: all external links in both posts open in a new tab today, 34 via explicit `{:target="_blank"}` IALs and any remaining external links via the `jekyll-target-blank` plugin declared in `_config.yml`. The final decision (drop entirely, no exceptions, no plugin equivalent added) is unchanged — only the stated scope of what's being dropped is now accurate.
3. **`fixurl.js` removal justified by an unverified "dead script" claim (MEDIUM) — Addressed.** Removed the unverified "dead/irrelevant" framing from section 8 step 1. The removal is now justified purely on relevance and goals grounds (no accessibility/SEO value, conflicts with the minimal-client-JS goal in section 5) without asserting the endpoint no longer functions, since no liveness check was performed.

### Revision 2

Addressed the `CHANGES_REQUESTED` verdict from the first review round (4 MEDIUM, 1 NIT):

1. **Favicon silently dropped (MEDIUM) — Addressed.** Verified `assets/images/favicon.png` exists and is referenced at `_includes/head.html:16`. Added it to section 8's extraction list (`→ public/favicon.png`) and to section 4's `<BaseHead>` meta tag list with the concrete `<link rel="icon">` markup.
2. **Three orphaned images unaccounted for (MEDIUM) — Addressed.** Re-verified via grep that `avatar.png`, `bio-photo.jpg`, and `old.png` have no inbound references anywhere in the source tree. Added an explicit discard decision for them in section 8 step 1, with the same git-history-recoverable justification already used for drafts in section 3.1.
3. **`target="_blank"` escape hatch left undefined (MEDIUM) — Addressed.** Counted actual occurrences (10 in the Knative post, 24 in the Tekton post — all plain external reference links, none downloads or unsaved-work warnings). Removed the "unless a specific link needs it" escape hatch; the rule is now unconditional: drop `target="_blank"` from all 34 occurrences, no exceptions.
4. **OG/Twitter image resolution path for `heroImage` unspecified (MEDIUM) — Addressed.** Added an explicit rule to section 4: resolve `heroImage` to an absolute built URL via `getImage()` in `<BaseHead>` for posts, falling back to `DEFAULT_OG_IMAGE` for pages without one — keeping the `astro:assets`-optimized in-page pipeline and the stable-URL social-metadata requirement reconciled without duplicating source files.
5. **Nav "4 links" claim inconsistent with taxonomy scope (NIT) — Addressed.** Made Categories/Tags-out-of-scope an explicit decision in section 8 rather than an implied one, and corrected the nav to 2 links (Posts, About), matching what the design actually builds.

## Open items for the implementation step (not decided here, by design)

These are intentionally left for the implementation phase because they depend on tool output at that time, not on architectural judgment:
- Exact current `npm create astro` CLI flags/output (re-verify; CLI prompts/flags have changed across Astro majors).
- Exact current `withastro/action` required inputs (re-check the action's README/`action.yml` at implementation time).
- Confirming the repo's default branch name for the workflow trigger.
- Whether `src/content/config.ts` vs `src/content.config.ts` is the scaffolded template's actual convention (depends on which Astro minor the `blog` template currently targets).
