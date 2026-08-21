document.documentElement.classList.add('has-js');

const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
const mobileBreakpoint = window.matchMedia('(max-width: 1120px)');

const updateHeader = () => {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
};

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

if (menuToggle && primaryNav) {
  const menuIsOpen = () => menuToggle.getAttribute('aria-expanded') === 'true';

  const setMenu = (open, { returnFocus = false } = {}) => {
    const shouldOpen = open && mobileBreakpoint.matches;
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));
    menuToggle.setAttribute('aria-label', shouldOpen ? 'Close navigation' : 'Open navigation');
    primaryNav.classList.toggle('is-open', shouldOpen);
    document.body.classList.toggle('menu-open', shouldOpen);

    if (mobileBreakpoint.matches) {
      primaryNav.setAttribute('aria-hidden', String(!shouldOpen));
    } else {
      primaryNav.removeAttribute('aria-hidden');
    }

    if (shouldOpen) {
      primaryNav.querySelector('a')?.focus();
    } else if (returnFocus) {
      menuToggle.focus();
    }
  };

  const syncMenu = () => setMenu(menuIsOpen());
  syncMenu();
  mobileBreakpoint.addEventListener?.('change', syncMenu);

  menuToggle.addEventListener('click', () => {
    setMenu(!menuIsOpen());
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenu(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (!menuIsOpen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false, { returnFocus: true });
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...primaryNav.querySelectorAll('a[href], button:not([disabled])')];
    const first = focusable[0];
    const last = focusable.at(-1);

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -28px' },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const connectionDiagram = document.querySelector('.connection-diagram');

if (connectionDiagram) {
  const centerNode = connectionDiagram.querySelector('.node-brand');
  const connectionPairs = [
    ['.line-a', '.node-growers', [1, .78], [0, .16]],
    ['.line-b', '.node-supply', [0, .78], [1, .16]],
    ['.line-c', '.node-business', [1, .23], [0, .84]],
    ['.line-d', '.node-market', [0, .23], [1, .84]],
  ];

  const pointInsideDiagram = (rect, diagramRect, [x, y]) => ({
    x: rect.left - diagramRect.left + rect.width * x,
    y: rect.top - diagramRect.top + rect.height * y,
  });

  const positionConnectionLines = () => {
    if (!centerNode) return;

    const diagramRect = connectionDiagram.getBoundingClientRect();
    const centerRect = centerNode.getBoundingClientRect();
    if (!diagramRect.width || !centerRect.width) return;

    connectionPairs.forEach(([lineSelector, nodeSelector, fromAnchor, toAnchor]) => {
      const line = connectionDiagram.querySelector(lineSelector);
      const node = connectionDiagram.querySelector(nodeSelector);
      if (!line || !node) return;

      const start = pointInsideDiagram(node.getBoundingClientRect(), diagramRect, fromAnchor);
      const end = pointInsideDiagram(centerRect, diagramRect, toAnchor);
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      line.style.left = `${start.x}px`;
      line.style.top = `${start.y}px`;
      line.style.width = `${Math.hypot(dx, dy)}px`;
      line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    });
  };

  positionConnectionLines();
  window.addEventListener('resize', positionConnectionLines, { passive: true });
  if ('ResizeObserver' in window) {
    const connectionObserver = new ResizeObserver(positionConnectionLines);
    connectionObserver.observe(connectionDiagram);
    connectionDiagram.querySelectorAll('.connection-node').forEach((node) => connectionObserver.observe(node));
  }
  document.fonts?.ready?.then(positionConnectionLines);
}

const form = document.querySelector('#inquiry-form');
const formStatus = form?.querySelector('.form-status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  form.classList.add('was-submitted');

  if (!form.checkValidity()) {
    form.reportValidity();
    if (formStatus) formStatus.textContent = 'Please complete the required fields.';
    return;
  }

  const values = Object.fromEntries(new FormData(form).entries());
  const detailRows = [
    ['Name', values.name],
    ['Business / Company', values.business],
    ['Email', values.email],
    ['Phone', values.phone],
    ['Interested In', values.interest],
    ['Product / Requirement', values.requirement],
    ['Estimated Quantity', values.quantity],
    ['Message', values.message],
  ].filter(([, value]) => value?.trim());

  const subject = `Granadillas inquiry — ${values.interest}`;
  const body = `Hello Granadillas,\n\n${detailRows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\nThank you.`;
  const emailUrl = `mailto:ilovegranadillas@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  if (formStatus) formStatus.textContent = 'Opening your email app with your inquiry…';
  window.location.href = emailUrl;
});
