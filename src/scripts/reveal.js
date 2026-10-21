// Progressive-enhancement scroll reveal. No dependencies.
// Elements tagged `.reveal` fade/slide in once they enter the viewport.
// CSS only applies the hidden state under `.js-enabled`, so content is
// never permanently invisible if this script fails to load or run.

// Post pages mark their article body with `data-reveal-root` instead of
// `.reveal` directly, because the body is slotted Markdown and can't be
// hand-annotated per section in the .astro file. Here we split its
// top-level blocks into reveal targets so the article cascades in
// section-by-section, just like the home page. This only touches posts;
// the home page's hand-placed `.reveal` elements are untouched.
for (const root of document.querySelectorAll('[data-reveal-root]')) {
	let index = 0;
	for (const child of root.children) {
		if (child.classList.contains('reveal')) {
			// Already tagged (e.g. the title block) - leave it alone.
			continue;
		}
		// Headings start a new visual cluster; reset the stagger count so
		// each section's own blocks cascade from the top again.
		if (/^H[1-6]$/.test(child.tagName)) {
			index = 0;
		}
		child.classList.add('reveal');
		child.setAttribute('data-index', String((index % 3) + 1));
		index += 1;
	}
}

const elements = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
	const observer = new IntersectionObserver(
		(entries, obs) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add('reveal-visible');
					obs.unobserve(entry.target);
				}
			}
		},
		{ threshold: 0.15 },
	);

	for (const el of elements) {
		observer.observe(el);
	}
} else {
	// No IntersectionObserver support: reveal everything immediately.
	for (const el of elements) {
		el.classList.add('reveal-visible');
	}
}
