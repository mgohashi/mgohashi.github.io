# Implementation Plan — Dark Mono restyle + example posts

Scope: restyle the existing Astro blog (already migrated from Jekyll) with a
"Dark Mono" terminal-editor aesthetic, and add 3 fictional example posts to
exercise navigation/reading layout. This plan implements the TASK DESIGN SPEC
given in the step prompt exactly — no architecture decisions are left open
except the ones recorded below, which were resolved by reading the real
files in the worktree
`/Users/mgohashi/Repos/github.com/mgohashi/mgohashi.github.io/.worktrees/astro-migration`.

## Decisions (grounded in the code actually read)

1. **Theme location: extend `src/styles/global.css`'s existing `:root` block**,
   do not add a separate theme file. The file already centralizes tokens as
   CSS custom properties (`--accent`, `--black`, `--gray-light`, etc., some as
   raw RGB triplets consumed via `rgb(var(--x))`). The new Dark Mono tokens
   will be added as plain hex custom properties (`--color-bg: #0a0e14;` etc.,
   per the spec's own example) alongside the existing ones, and the existing
   `--accent`/`--gray-*` tokens will be **repointed** to Dark Mono values so
   every component already consuming them (Header's `.skip-link` background,
   `nav a.active` border, Footer text color, `blockquote` border, `hr`,
   `code`/`pre` backgrounds) picks up the new palette with no per-component
   hex edits needed. New tokens are added for things the spec introduces that
   have no existing equivalent (card backgrounds, tag pill colors, gradient
   stops, dot colors).
2. **Sans-serif font: use the project's actual existing font, `Atkinson`**
   (self-hosted via Astro's `fonts` config in `astro.config.mjs`, exposed as
   the `--font-atkinson` CSS variable, already applied to `body` in
   `global.css`), not Inter. The spec says "likely Inter" but hedges with
   "likely" and the hard constraint is "do NOT load an external font" —
   Atkinson is already self-hosted locally, so reusing it satisfies that
   constraint directly and requires zero new font loading. Atkinson only
   ships `400` and `700` weights (`astro.config.mjs`); the spec's
   "weight 800/extrabold" for the hero headline will use `font-weight: 700`
   (the heaviest available weight) rather than a fabricated 800, since
   requesting 800 on a 2-weight self-hosted font family falls back to
   synthetic bolding in some browsers, which is worse than using the real 700.
3. **Monospace stack: system stack only**, exactly as the spec lists
   (`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`), added as a
   new `--font-mono` custom property. No font file, no Astro `fonts` entry.
4. **Posts listing page is `src/pages/posts/index.astro`** (confirmed by
   reading it — it already renders a `getCollection('blog')` grid with
   `Image`/`FormattedDate`, using inline `<style>`). It will be restyled in
   place, reusing its existing query/sort logic.
5. **Home page post grid**: `src/pages/index.astro` currently renders a
   plain `<ul>` of links with no cards at all. The new card grid markup is
   added directly in `index.astro` (it is the "home hero + latest posts"
   page per the spec, distinct from the full `/posts` listing), reusing
   `FormattedDate` and `getCollection('blog')` exactly as the file already
   imports them. Cards show the **first** `categories[0]` (falling back to
   `tags[0]`) as the single footer tag pill, since the schema has both arrays
   and the spec says "main category/tag".
6. **Decorative dot alternating color** is computed with `post, index) =>
   index % 2 === 0 ? 'var(--color-accent-blue)' : 'var(--color-accent-cyan)'`
   inline per card in the `.map()`, no JS at runtime (it's resolved at build
   time by Astro, emitting plain static HTML/CSS).
7. **Reuse components, do not recreate**: `Header.astro`, `Footer.astro`,
   `FormattedDate.astro`, `BaseHead.astro` keep their existing markup/props
   and semantic structure (skip-link, `<header><nav>`, `<footer>`,
   `sr-only` social links); only their `<style>` blocks and a few text
   strings (Footer copy, nav link labels already match spec: Posts/About —
   **RSS link is new**, added as a third `HeaderLink` pointing at
   `/rss.xml`, since the spec explicitly asks for 3 nav links
   (Posts/About/RSS) and `rss.xml.js` already exists at
   `src/pages/rss.xml.js`... must confirm exact filename; see step 1) are
   touched.
8. **BlogPost.astro reading width**: the spec asks for ~65-75ch measure. The
   current `.prose { width: 720px; }` is a fixed pixel width tuned for the
   old light theme/font; it will be changed to `max-width: 72ch` (mono-free,
   using the body's sans font metrics) to satisfy the character-count
   requirement directly rather than guessing a px value.
9. **Example posts location**: `src/content/blog/<slug>/index.md`, matching
   the exact pattern of the removed real posts (confirmed via
   `git show de3c63c~1:src/content/blog/quick-start-knative/index.mdx` —
   frontmatter block + Markdown/MDX body, one subfolder per slug). Plain
   `.md` is used (not `.mdx`) since none of the 3 example posts need JSX
   components, matching the simpler of the two patterns already supported by
   `content.config.ts`'s `glob({ pattern: '**/*.{md,mdx}' })`.

## Items

- [ ] 1. Confirm the exact RSS endpoint filename and add a third nav link.
      Run a quick directory check to verify whether it's `rss.xml.js` or
      `rss.xml.ts` (already seen as `src/pages/rss.xml.js` during planning,
      but re-confirm before wiring the link since this is the first code
      change). In `src/components/Header.astro`, add a third
      `<HeaderLink href="/rss.xml">RSS</HeaderLink>` inside `.internal-links`,
      after `About`, keeping the existing `HeaderLink` component and the
      `.skip-link`/`sr-only` social icons untouched.
      Files: src/components/Header.astro
      Verify: `cd /Users/mgohashi/Repos/github.com/mgohashi/mgohashi.github.io/.worktrees/astro-migration && PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; `grep -o 'href="/rss.xml"' dist/index.html` matches once.

- [ ] 2. Add the Dark Mono design tokens to `src/styles/global.css` and
      repoint existing tokens to the new palette.
      In the `:root` block, add new custom properties for every color/role
      the spec lists that has no existing equivalent: `--color-bg: #0a0e14`,
      `--color-card-body: #0f1620`, `--color-card-top: #111a27`,
      `--color-footer-bg: #070a0f`, `--color-border: #1e293b`,
      `--color-text-primary: #e2e8f0`, `--color-text-secondary: #94a3b8`,
      `--color-text-tertiary: #64748b`, `--color-text-dim: #475569`,
      `--color-accent-blue: #38bdf8`, `--color-accent-cyan: #22d3ee`,
      `--color-tag-text: #38bdf8`, `--color-tag-bg: #132436`,
      `--accent-gradient: linear-gradient(90deg, #38bdf8 0%, #22d3ee 100%)`,
      `--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
      Update `body` to set `background: var(--color-bg)` (replacing the old
      light `linear-gradient(var(--gray-gradient))`) and
      `color: var(--color-text-primary)`. Update `code`/`pre` backgrounds to
      `var(--color-card-top)` and borders to `var(--color-border)`. Update
      `blockquote`/`hr` to use `var(--color-border)`/`var(--color-accent-blue)`
      instead of the old `--accent`/`--gray-light`. Leave the `.sr-only` rule
      untouched (no visual impact).
      Files: src/styles/global.css
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds (no CSS syntax errors break the build); open `dist/index.html`'s linked CSS and `grep -c '#0a0e14' dist/_astro/*.css` returns at least 1.

- [ ] 3. Restyle `Header.astro`: site name in mono, 3 dimmer mono nav links,
      dark header background.
      In the `<style>` block: set `header { background: var(--color-bg);
      border-bottom: 1px solid var(--color-border); box-shadow: none; }`
      (dropping the old white `box-shadow`). Set `h2 a` (site name) to
      `font-family: var(--font-atkinson); color: var(--color-text-primary);
      font-weight: 700;`. Set `nav a` to `font-family: var(--font-mono);
      color: var(--color-text-secondary); font-size: 0.85em;` and
      `nav a.active { color: var(--color-accent-blue); border-bottom-color:
      var(--color-accent-blue); }`. Update `.skip-link` background to
      `var(--color-accent-blue)` (was `var(--accent)`, now effectively the
      same hex family but explicit). Keep the skip-link, `<nav>`,
      `.social-links` markup and `sr-only` spans unchanged — style only.
      Files: src/components/Header.astro
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; visually confirm later in step 10's dev-server check.

- [ ] 4. Restyle `Footer.astro`: dark footer bg, mono copy text, decorative
      gradient rectangle.
      Replace the footer copy text with the spec's mono line (keep the
      `&copy; {year} {SITE_AUTHOR}` structure but add the required
      "built with Astro · sem JS no cliente · feed RSS disponível" line as a
      `<p class="meta">` under it), wrap the existing content and a new
      `<span class="accent-bar" aria-hidden="true">` in a flex row so the
      decorative rectangle sits to the right on wide viewports and stacks
      below on narrow ones. In `<style>`: `footer { background:
      var(--color-footer-bg); color: var(--color-text-tertiary); }`,
      `.meta { font-family: var(--font-mono); font-size: 0.8em; }`,
      `.accent-bar { width: 48px; height: 6px; border-radius: 3px;
      background: var(--accent-gradient); }`. Keep the existing social SVG
      links and their `sr-only` labels unchanged.
      Files: src/components/Footer.astro
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; `grep -q 'sem JS no cliente' dist/index.html`.

- [ ] 5. Build the home page hero + dynamic post card grid in
      `src/pages/index.astro`.
      Replace the current `<h1>{SITE_TITLE}</h1><p>...</p><ul>...</ul>` body
      with: a `<p class="prompt">$ cat about.txt</p>` mono line; an `<h1>`
      split into 3 `<span>` lines where the middle `<span class="gradient">`
      gets `background: var(--accent-gradient); background-clip: text;
      -webkit-background-clip: text; color: transparent;` in a `<style>`
      block (pure CSS, no JS); a mono dimmed `<p class="subtitle">` using
      `SITE_DESCRIPTION`; a `<p class="cta">` with a `<span class="bar"
      aria-hidden="true">` (thin vertical `var(--accent-gradient)` bar) next
      to `<a href="/posts">-&gt; ver todos os posts</a>`; an `<hr>`; a
      `<p class="label">// últimos posts</p>` in mono. Below that, replace
      the `<ul>` with a `<div class="grid">` that `.map()`s over the already-
      fetched, already-sorted `posts` array (do not hardcode a count) into
      `<article class="card">` elements: a `.card-top` div with an
      `aria-hidden="true"` dot (`index % 2 === 0 ? 'blue' : 'cyan'` class) and
      a mono `<FormattedDate>`; a `.card-body` with `<h3>` (post title,
      linked to `/posts/${post.id}/`) and `<p>` (description); a
      `.card-footer` with a `<span class="tag">` showing
      `post.data.categories[0] ?? post.data.tags[0]`, only rendered if either
      exists. Add the grid CSS: `grid-template-columns: repeat(3, 1fr)` with
      a `@media (max-width: 720px) { grid-template-columns: 1fr; }` (reusing
      the project's existing 720px breakpoint, matching `global.css`/
      `Header.astro`'s own media query value), card backgrounds
      `var(--color-card-body)`/`var(--color-card-top)` for the top bar,
      `var(--color-border)` borders, tag pill using `--color-tag-bg`/
      `--color-tag-text` with `border-radius: 3px` (small, not a capsule),
      `text-transform: uppercase`, `font-family: var(--font-mono)`,
      `font-size: 10px`. Keep `<Header />`/`<Footer />`/`BaseHead` usage and
      the `#main-content` id on `<main>` exactly as-is.
      Files: src/pages/index.astro
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; after step 9 adds content, `grep -c 'class="card"' dist/index.html` equals the number of published example posts (3).

- [ ] 6. Restyle `src/pages/posts/index.astro` with the same Dark Mono
      palette, reusing its existing grid/query logic.
      Keep the existing `getCollection('blog')` + sort, `Image`,
      `FormattedDate` usage and the `ul > li` structure (do not rewrite the
      markup shape, since it already has a working responsive 2-column
      layout with a featured-first-post treatment). In the `<style>` block,
      swap: `.title` color to `var(--color-text-primary)`, `.date` to
      `var(--font-mono); color: var(--color-text-tertiary)`, hover states
      from `rgb(var(--accent))` to `var(--color-accent-blue)`, and `main`'s
      implicit light background (inherited from `body`) is already covered
      by step 2's `body` change. Add `background: var(--color-bg)` is not
      needed separately since `body` covers it; only add page-specific
      borders (`border: 1px solid var(--color-border)` around each `li`'s
      image/text block) to match the card-like feel used on the home grid.
      Files: src/pages/posts/index.astro
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; `dist/posts/index.html` exists and contains 3 post links after step 9.

- [ ] 7. Restyle `src/layouts/BlogPost.astro` for dark-theme reading
      typography.
      In the existing `<style>` block: change `.prose { width: 720px; }` to
      `max-width: 72ch; color: var(--color-text-primary); }` (keeps the
      `margin: auto; padding: 1em;` as-is). Change `.date` to
      `font-family: var(--font-mono); color: var(--color-text-tertiary);`
      and `.last-updated-on` stays `font-style: italic` but inherits the new
      dark `.date` color. Add paragraph spacing for the reading body: since
      `global.css`'s `.prose p { margin-bottom: 2em; }` already exists and
      applies here (this component's own `.prose` class matches that
      selector), no duplicate rule is needed — just confirm it still applies
      after step 2's edits (it does, selector unchanged). Add a rule for code
      blocks inside the post body: `.prose pre { border: 1px solid
      var(--color-border); background: var(--color-card-top); }` so
      fenced code blocks stand out from the page background per the spec's
      "clear visual highlight" requirement (the global `pre`/`code` rule from
      step 2 already sets the background; this adds the border specifically
      inside `.prose`). Keep `.hero-image` and the `<Image>` usage untouched.
      Files: src/layouts/BlogPost.astro
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; after step 9, `grep -q 'class="prose"' dist/posts/observabilidade-com-opentelemetry/index.html`.

- [ ] 8. Add the pure-CSS blinking cursor utility class to `global.css` for
      future/placeholder use.
      Add `@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0;
      } }` and a `.cursor::after { content: '_'; animation: blink 1s step-end
      infinite; }` utility class to `src/styles/global.css`. This satisfies
      the spec's "any blinking cursor must be pure CSS" constraint by making
      the utility available; it is applied to the hero `$ cat about.txt`
      prompt line in `index.astro` (step 5) by adding `class="cursor"` to
      that line's trailing span — wire that attachment now as part of this
      step since it is a one-line addition back in `index.astro`.
      Files: src/styles/global.css, src/pages/index.astro
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; `grep -q '@keyframes blink' dist/_astro/*.css`.

- [ ] 9. Add the 3 example posts under `src/content/blog/`, matching the
      existing content pattern.
      Create 3 subfolders, each with an `index.md` (plain Markdown, no JSX
      needed), frontmatter per `content.config.ts`'s schema:
      - `src/content/blog/observabilidade-com-opentelemetry/index.md` —
        title "Observabilidade com OpenTelemetry", pubDate 2024-01-10,
        tags: ["opentelemetry", "observability"], categories: ["Blog",
        "Observability"].
      - `src/content/blog/estrategias-de-deploy-progressivo/index.md` —
        title "Estratégias de deploy progressivo (canary e blue-green)",
        pubDate 2024-03-22, tags: ["deploy", "kubernetes"], categories:
        ["Blog", "Kubernetes"].
      - `src/content/blog/gerenciando-secrets-em-kubernetes/index.md` —
        title "Gerenciando secrets em Kubernetes com External Secrets
        Operator", pubDate 2024-06-05, tags: ["kubernetes", "security"],
        categories: ["Blog", "Kubernetes"].
      Each post's `description` is a 1-sentence summary for the card/SEO
      meta. Each body opens with an explicit callout italic line "*Este é um
      post de exemplo criado para testar o layout.*", then at least 2
      paragraphs, one `## ` (h2) subordinate heading, one bullet or numbered
      list, and one fenced code block (` ```yaml ` or ` ```bash ` matching
      the post's topic) — matching the pattern already used in the removed
      `quick-start-knative` post (plain prose + `##` headings + fenced
      ```shell blocks). No `heroImage` (optional per schema, omit entirely
      rather than setting a broken path). Do not set `draft`; leave it to
      default `false` so all 3 are published and visible in the grid/listing.
      Files: src/content/blog/observabilidade-com-opentelemetry/index.md,
      src/content/blog/estrategias-de-deploy-progressivo/index.md,
      src/content/blog/gerenciando-secrets-em-kubernetes/index.md
      Verify: `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` succeeds; `ls dist/posts/` shows all 3 slugs as directories with `index.html`; `grep -c 'class="card"' dist/index.html` equals 3 (confirms step 5's dynamic grid picked them up with no hardcoding).

- [ ] 10. Full visual verification pass.
      Run `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run build` from a clean state
      (`rm -rf dist .astro`) and confirm it succeeds with 0 errors. Then run
      `PATH="/Users/mgohashi/.nvm/versions/node/v22.23.3/bin:$PATH" npm run preview` (or `npm run dev`) and manually
      check in a browser: home hero gradient headline renders (middle line
      only), 3 post cards render in a 3-column grid on desktop and collapse
      to 1 column under 720px width, nav shows Posts/About/RSS in mono,
      footer shows the new copy and gradient bar, `/posts` listing shows all
      3 posts styled dark, each post detail page renders its code block with
      a visible border/background distinct from the page, and the skip-link
      still appears on Tab-focus. Confirm no console errors in the browser
      devtools and that no new client-side JS was introduced (`grep -r
      "<script" src/pages src/layouts src/components` should show no new
      matches beyond what already existed, i.e. none).
      Files: none (verification only)
      Verify: build exit code 0; manual browser check against the 6 bullets
      above; `grep -rc '<script' src/pages src/layouts src/components` sums
      to the same count as before this plan's changes (0, confirmed absent
      in all files read during planning).

## Verification results (executed)

1. `rm -rf dist .astro && npm run build` (Node v22.23.3 on PATH) — **clean
   build, 0 errors**, 7 pages generated (404, about, posts/index, the 3
   example post pages, rss.xml) plus sitemap-index.xml/sitemap-0.xml.
2. Inspected `dist/`: `dist/posts/index.html` links exactly the 3 example
   posts (`estrategias-de-deploy-progressivo`,
   `gerenciando-secrets-em-kubernetes`, `observabilidade-com-opentelemetry`);
   no old real posts reappeared. Each has its own
   `dist/posts/<slug>/index.html`. `dist/rss.xml` lists all 3 titles;
   `dist/sitemap-0.xml` lists all 3 post URLs.
   Pre-existing, unrelated finding: `dist/posts/how-to-build-cloud-native-pipelines/*.gif`
   is still emitted because 3 GIFs were relocated to
   `public/posts/how-to-build-cloud-native-pipelines/` by commit `c055adb`
   and were never deleted when the post itself was removed in `de3c63c`
   (that commit only deleted co-located images under
   `src/content/blog/...`, not the `public/` copies). These are orphaned
   static assets outside this task's scope (theme + 3 example posts) and
   were left untouched; flagging for a separate cleanup.
3. `npm run dev` — booted cleanly on `v7.4.1` (fell back to port 4322 since
   4321 was already in use), `curl` against `/` returned HTTP 200 with 3
   `class="card"` elements present (dots alternate blue/cyan/blue). Dev
   server process was killed after the check; confirmed no process left
   listening on 4321/4322.
4. `grep -rl '0a0e14\|38bdf8\|22d3ee\|132436\|0f1620' dist/` — all five
   Dark Mono hex tokens resolve into the bundled `dist/_astro/Header.*.css`
   (global.css's `:root` custom properties ship in the same stylesheet as
   Header's scoped styles, since Header renders on every page).
5. `grep -rn '<script' src/pages src/layouts src/components` — no matches.
   The blinking-cursor effect (`.cursor::after` + `@keyframes blink` in
   `global.css`) is pure CSS; no client JS was added anywhere in this
   change.
