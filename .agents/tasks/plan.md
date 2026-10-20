# Implementation Plan

Migrate mohashi.io from Jekyll (Minimal Mistakes) to Astro, per the approved
design at `.agents/tasks/design.md` (APPROVED, revision 3, 0 HIGH/0 MEDIUM/1 NIT).
All work happens in the worktree
`/Users/mgohashi/Repos/github.com/mgohashi/mgohashi.github.io/.worktrees/astro-migration`.
Do not touch the main checkout except for the final merge (a separate, later
step outside this plan).

This plan is also expressed as two FEAT artifacts under `.agents/tasks/` for
the workflow's build loop:
- FEAT-001: scaffold Astro, content collection + both posts, SEO/perf/a11y infra
- FEAT-002: deploy workflow, Jekyll cleanup, final verification

- [ ] 1. Confirm current `npm create astro` CLI syntax and the `blog` template, then scaffold.
      Run `npm create astro@latest --help` to verify current flags (the design was written
      against `create-astro@5.3.0`; flags may have drifted). Scaffold into the worktree root with
      `npm create astro@latest . -- --template blog --typescript strict --no-install --no-git`
      (adjust flags if the CLI output differs). Then run `npm install`.
      Files: repo root (new `src/`, `public/`, `astro.config.mjs`, `package.json`, `tsconfig.json`, etc.)
      Verify: `npm install` completes with no errors; `ls src/pages src/content` shows the
      template's scaffolded files.

- [ ] 2. Configure `astro.config.mjs`: set `site: 'https://mohashi.io'`, add `@astrojs/sitemap`
      and confirm `@astrojs/rss` usage (the blog template ships an RSS endpoint already —
      keep it and point it at the `blog` collection).
      Run `npx astro add sitemap` (or add manually + `npm install @astrojs/sitemap`) to wire the
      integration.
      Files: astro.config.mjs, package.json
      Verify: `npm run build` succeeds and `dist/sitemap-index.xml` (or `sitemap-0.xml`) exists.

- [ ] 3. Determine whether the scaffolded template uses `src/content.config.ts` or
      `src/content/config.ts` and update the content collection schema in that file to match
      design.md section 2 exactly (title, description, pubDate, updatedDate, heroImage via
      `image()`, tags, categories, author default "Marcelo Ohashi", draft default false).
      Do not create both files — keep only the one the scaffold actually produced.
      Files: `src/content.config.ts` or `src/content/config.ts`
      Verify: `npm run build` succeeds (schema errors fail the build loudly).

- [ ] 4. Migrate the Knative post: create `src/content/blog/quick-start-knative/index.md`
      (or `.mdx` if JSX is needed for the YouTube embed) with frontmatter per design.md's
      "concrete resulting frontmatter" block (title, description, pubDate: 2020-04-18,
      heroImage: "./knative.png", tags, categories — copied verbatim from
      `_posts/2020-04-18-setup-a-cloud-native-quarkus-app-in-knative.md`). Port the body:
      strip all `{: .notice}`, `{: .notice--info}`, `{: .notice--warning}` Kramdown IALs,
      converting the ones that convey real meaning to plain `> **Note**` blockquotes;
      replace `{% include video id="KyCbkXF3Qpw" provider="youtube" %}` (line ~486) with a
      `<YouTubeEmbed>` component or an inline accessible `<iframe loading="lazy" title="...">`;
      strip all `{:target="_blank"}` occurrences (10 in this post) so links become plain
      `<a href="...">`; rewrite the two footnotes (`[^1]`, `[^2]`, lines 496-497) as inline
      parenthetical links instead of footnote syntax. Copy
      `assets/images/setup-a-cloud-native-quarkus-app-in-knative/knative.png`,
      `quakus-app-web-browser.png`, and `unsplash-image-1.jpg` into
      `src/content/blog/quick-start-knative/` (do not copy `quickstart-knative-webconsole.gif`,
      it is unreferenced/orphaned per design.md section 8).
      Files: `src/content/blog/quick-start-knative/index.md` + 3 copied images
      Verify: `npm run build` succeeds and `dist/posts/quick-start-knative/index.html` exists
      (permalink structure is `/posts/:slug/` per design.md section 4).

- [ ] 5. Migrate the Tekton/pipelines post: create
      `src/content/blog/how-to-build-cloud-native-pipelines/index.md` with frontmatter per
      design.md (title "How to build cloud-native pipelines", pubDate: 2020-05-26,
      heroImage: "./tekton.png", tags/categories copied from
      `_posts/2020-05-26-how-to-build-cloud-native-pipeline.md`). Port the body: strip all
      `{: .notice}` IALs (11 occurrences), converting meaningful ones to `> **Note**`
      blockquotes; strip all `{:target="_blank"}` occurrences (24 in this post); strip the two
      `{: .align-center}` IALs on the `.gif` images (lines ~710, ~758) — leave those two GIFs as
      plain `<img>` tags (not `astro:assets`) since animated GIFs are not optimized by Astro's
      image pipeline per design.md section 5; remove the `<!-- markdownlint-enable MD033 -->`
      HTML comment marker. Copy `tekton.png`, `tekton-architecture.png`, `tekton-pipeline.png`,
      `unsplash-image-2.jpg`, `eventlistener-tkn-log.gif`, `pipelinerun-tkn-log.gif`,
      `webconsole-pipeline-details.png`, `webconsole-pipeline-list.png`,
      `webconsole-pipelinerun-details-error.png`, `webconsole-pipelinerun-details.png`,
      `webconsole-pipelinerun-list.png`, `webconsole-pipelinerun-logs.gif` from
      `assets/images/how-to-build-cloud-native-pipeline/` into
      `src/content/blog/how-to-build-cloud-native-pipelines/`.
      Files: `src/content/blog/how-to-build-cloud-native-pipelines/index.md` + 12 copied images
      Verify: `npm run build` succeeds and
      `dist/posts/how-to-build-cloud-native-pipelines/index.html` exists.

- [ ] 6. Set up site-wide constants and copy the avatar/favicon assets.
      Create/update `src/consts.ts` with `SITE_TITLE = 'DevMode'`,
      `SITE_DESCRIPTION = 'Exchange of developer insights - by Marcelo Ohashi'`,
      `SITE_AUTHOR = 'Marcelo Ohashi'`, `SITE_URL = 'https://mohashi.io'`,
      `DEFAULT_OG_IMAGE = '/images/me.jpeg'`, and a `SOCIAL` object
      (`twitter: 'mgohashi'`, `github: 'mgohashi'`, `instagram: 'mohashi_'`, `linkedin: 'mohashi'`).
      Copy `assets/images/me.jpeg` → `public/images/me.jpeg` and
      `assets/images/favicon.png` → `public/favicon.png`. Copy `CNAME` (content `mohashi.io`) →
      `public/CNAME`.
      Files: src/consts.ts, public/images/me.jpeg, public/favicon.png, public/CNAME
      Verify: `npm run build` succeeds; `dist/CNAME` exists with content `mohashi.io`;
      `dist/favicon.png` and `dist/images/me.jpeg` exist.

- [ ] 7. Extend `BaseHead.astro` (or the template's equivalent shared head component) with full
      SEO metadata: canonical link computed from `Astro.site` + `Astro.url.pathname`; favicon
      link to `/favicon.png`; Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`,
      `og:image`, `og:site_name`); Twitter Card tags (`twitter:card=summary_large_image`,
      `twitter:site=@mgohashi`, `twitter:title`, `twitter:description`, `twitter:image`); resolve
      `heroImage` to an absolute URL via `heroImage.src` (matching the official template's own
      `BaseHead.astro` pattern, per the design review's NIT) with `new URL(...).href` against
      `Astro.site`, falling back to `DEFAULT_OG_IMAGE` for pages without a `heroImage`. Add
      `<link rel="alternate" type="application/rss+xml" title="DevMode" href="/rss.xml">`.
      Files: `src/components/BaseHead.astro` (or template equivalent), `src/consts.ts`
      Verify: `npm run build` succeeds; `grep -o '<meta property="og:[a-z:]*"' dist/posts/quick-start-knative/index.html`
      shows `og:title`, `og:description`, `og:image` at minimum; same check on the pipelines post;
      `grep 'rel="canonical"' dist/posts/quick-start-knative/index.html` finds exactly one canonical link.

- [ ] 8. Confirm the RSS endpoint (`src/pages/rss.xml.js` or `.ts`, shipped by the blog template)
      points at the `blog` collection and update the site title/description inside it if hardcoded.
      Files: `src/pages/rss.xml.js` (or `.ts`)
      Verify: `npm run build` succeeds and `dist/rss.xml` exists and contains both post titles
      (`grep -c '<item>' dist/rss.xml` returns 2).

- [ ] 9. Verify the sitemap excludes/handles the 404 page correctly (design.md section 4 flags
      this as needing verification at implementation time — Astro's convention may already
      exclude `404.astro` from the sitemap; if it appears anyway, add a `filter` option to the
      `@astrojs/sitemap` integration config in `astro.config.mjs` excluding it).
      Files: astro.config.mjs (only if a fix is needed)
      Verify: after `npm run build`, `grep -c '404' dist/sitemap-0.xml` (or `sitemap-index.xml`)
      returns 0.

- [ ] 10. Port the About page and 404 page.
      Create `src/pages/about.astro` using the shared base layout with the body copy from
      `_pages/about.md` ("Marcelo Ohashi is a software architect..."). Create/update
      `src/pages/404.astro` with the copy from `_pages/404.md` ("Page not found. Your pixels
      are in another canvas.") and do NOT port the `fixurl.js` third-party script block.
      Files: src/pages/about.astro, src/pages/404.astro
      Verify: `npm run build` succeeds; `dist/about/index.html` and `dist/404.html` exist and
      contain the expected copy (`grep -q "software architect" dist/about/index.html`,
      `grep -q "another canvas" dist/404.html`).

- [ ] 11. Add site navigation (Posts, About only — Categories/Tags are explicitly out of scope
      per design.md section 8) to the base layout's `<nav>` as two hardcoded links, and add a
      "Skip to content" link as the first focusable element in the base layout, visually hidden
      until focused, pointing at `#main-content` on the `<main>` landmark (porting the Jekyll
      `_includes/skip-links.html` behavior). Confirm the layout uses semantic `<header>`,
      `<nav>`, `<main id="main-content">`, `<footer>` landmarks, and that post pages use a single
      `<h1>` with body headings starting at `<h2>`.
      Files: base layout component (e.g. `src/layouts/BlogPost.astro`, `src/components/Header.astro`)
      Verify: `npm run build` succeeds; `grep -c '<h1' dist/posts/quick-start-knative/index.html`
      returns 1; `grep -q 'id="main-content"' dist/posts/quick-start-knative/index.html` matches;
      skip-link anchor present in the same file.

- [ ] 12. Spot-check color contrast of the template's default theme (base layout CSS) with a
      contrast-ratio tool; add real descriptive `alt` text (not filenames) for every image
      reference across both migrated posts (hero images and in-body images).
      Files: the two migrated post `index.md` files, base layout/CSS if contrast adjustment is needed
      Verify: manual check — document the contrast spot-check result in a short note in the
      FEAT findings; `grep -c 'alt=""' dist/posts/*/index.html` returns 0 on both post pages
      (no empty alt attributes on content images).

- [ ] 13. Create `.github/workflows/deploy.yml` using `withastro/action` (re-verify the current
      tag and required inputs against https://github.com/withastro/action before pinning —
      design.md recorded `v6.1.3` as of design time) followed by `actions/deploy-pages@v4`,
      triggered on push to `main` (the confirmed default branch) and `workflow_dispatch`, with
      `permissions: contents: read, pages: write, id-token: write` and the concurrency group
      from design.md section 7. Do NOT push or trigger this workflow.
      Files: .github/workflows/deploy.yml
      Verify: `yamllint .github/workflows/deploy.yml` (or a YAML parse check, e.g.
      `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"`)
      parses without error. Note in findings that the repo's GitHub Pages source setting must
      be switched from "Deploy from a branch" to "GitHub Actions" manually — this is a
      repo-settings change outside this task's scope.

- [ ] 14. Replace `.gitignore` with the Astro-standard set from design.md section 9
      (`dist/`, `.astro/`, `node_modules/`, `.env`, `.env.production`, `.DS_Store`).
      Files: .gitignore
      Verify: `git status` after a build shows `dist/`, `.astro/`, and `node_modules/` are not
      listed as untracked.

- [ ] 15. Extraction completeness check (gate before any deletion): confirm every item in
      design.md section 8 step 1 has been ported — both posts + their referenced images, site
      metadata in `src/consts.ts`, about page, avatar, favicon, CNAME, nav (Posts + About only),
      404 page copy. Do not delete anything yet.
      Files: none (verification only)
      Verify: re-read `src/consts.ts`, `src/pages/about.astro`, `src/pages/404.astro`,
      `public/CNAME`, `public/favicon.png`, `public/images/me.jpeg`, and both
      `src/content/blog/*/index.md` files and confirm each matches its design.md source;
      `npm run build` still succeeds.

- [ ] 16. Delete the Jekyll files, now that extraction is verified complete: `Gemfile`,
      `Gemfile.lock`, `_config.yml`, `_includes/`, `_layouts/`, `_sass/`, `_data/`, `_pages/`,
      `_posts/`, `_drafts/`, the root `index.html`, `.gitpod.yml`, and the Minimal
      Mistakes-specific `assets/` subpaths (`assets/css/main.scss`, `assets/js/`) plus the now
      fully-extracted `assets/images/` directory (its contents were copied into
      `src/content/blog/*/`, `public/images/`, and `public/favicon.png` in earlier steps, and
      the four orphaned images listed in design.md section 8 step 1 are intentionally discarded,
      not copied anywhere).
      Files: delete Gemfile, Gemfile.lock, _config.yml, _includes/, _layouts/, _sass/, _data/,
      _pages/, _posts/, _drafts/, index.html, .gitpod.yml, assets/
      Verify: `git status` shows only deletions of the listed Jekyll paths plus the new Astro
      source tree as additions; `npm run build` still succeeds after deletion (confirms nothing
      still referenced the deleted files).

- [ ] 17. Final full verification pass from a clean state.
      Run `rm -rf dist .astro node_modules && npm install && npm run build` and confirm: the
      build succeeds; `dist/posts/quick-start-knative/index.html` and
      `dist/posts/how-to-build-cloud-native-pipelines/index.html` exist (the 2 post pages);
      a posts listing page exists (e.g. `dist/posts/index.html` or `dist/index.html` per the
      template's layout); `dist/sitemap-index.xml` (or `dist/sitemap-0.xml`) exists;
      `dist/rss.xml` exists; OG meta tags are present in both post pages' HTML; `dist/CNAME`
      exists with content `mohashi.io`.
      Files: none (verification only)
      Verify: all the `dist/` checks above pass; `npm run build` exit code is 0.
