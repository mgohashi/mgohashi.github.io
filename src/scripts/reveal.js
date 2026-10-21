// Progressive-enhancement scroll reveal. No dependencies.
// Elements tagged `.reveal` fade/slide in once they enter the viewport.
// CSS only applies the hidden state under `.js-enabled`, so content is
// never permanently invisible if this script fails to load or run.
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
