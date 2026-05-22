import './privacy.css';

const GTAG_ID = 'G-X81LJ6XFMR';
const CONSENT_KEY = 'cps-cookie-consent-v1';

let analyticsLoaded = false;
let lastFocusedElement = null;

function safeStorage(method, key, value) {
  try {
    if (value === undefined) {
      return window.localStorage[method](key);
    }
    return window.localStorage[method](key, value);
  } catch {
    return null;
  }
}

function readConsent() {
  const raw = safeStorage('getItem', CONSENT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics === 'boolean') {
      return parsed.analytics;
    }
  } catch {
    if (raw === 'accepted') return true;
    if (raw === 'rejected') return false;
  }

  return null;
}

function writeConsent(analytics) {
  const payload = JSON.stringify({
    analytics,
    updatedAt: new Date().toISOString()
  });

  safeStorage('setItem', CONSENT_KEY, payload);
}

function updateGtagConsent(analyticsEnabled) {
  window[`ga-disable-${GTAG_ID}`] = !analyticsEnabled;

  if (typeof window.gtag !== 'function') return;

  window.gtag('consent', 'update', {
    analytics_storage: analyticsEnabled ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });
}

function loadAnalytics() {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  const existingScript = document.querySelector(`script[data-analytics-id="${GTAG_ID}"]`);
  if (!existingScript) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
    script.dataset.analyticsId = GTAG_ID;
    document.head.appendChild(script);
  }

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted'
  });

  updateGtagConsent(true);
  window.gtag('js', new Date());
  window.gtag('config', GTAG_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
}

function removeBanner() {
  const banner = document.querySelector('.cookie-banner');
  if (!banner) return;

  banner.remove();

  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function applyConsent(analytics) {
  writeConsent(analytics);
  if (analytics) {
    loadAnalytics();
  } else {
    updateGtagConsent(false);
  }
  removeBanner();
}

function renderBanner(mode = 'consent') {
  removeBanner();

  const decision = readConsent();
  const banner = document.createElement('aside');
  banner.className = 'cookie-banner';
  banner.dataset.cookieMode = mode;
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'true');
  banner.setAttribute('aria-labelledby', 'cookie-banner-title');
  banner.setAttribute('aria-describedby', 'cookie-banner-description');

  const title = mode === 'preferences' ? 'Cookie Preferences' : 'Privacy Choices';
  const status =
    mode === 'preferences' && decision !== null
      ? `<p class="cookie-banner-status">Current analytics setting: <strong>${decision ? 'accepted' : 'declined'}</strong>.</p>`
      : '';
  const dismiss =
    mode === 'preferences' && decision !== null
      ? '<button type="button" class="cookie-banner-dismiss" aria-label="Close cookie preferences">Close</button>'
      : '';

  banner.innerHTML = `
    <div class="cookie-banner-card">
      <div class="cookie-banner-header">
        <div>
          <p class="cookie-banner-kicker mono text-accent">PRIVACY</p>
          <h2 id="cookie-banner-title">${title}</h2>
        </div>
        ${dismiss}
      </div>
      <p class="cookie-banner-copy" id="cookie-banner-description">
        CPS uses essential browser storage for your consent choice and saved Studio diagrams. Optional analytics stay off until you explicitly allow them.
      </p>
      ${status}
      <div class="cookie-banner-categories" aria-label="Cookie categories">
        <div class="cookie-category">
          <div>
            <h3>Necessary storage</h3>
            <p>Required for consent memory and saved diagram state.</p>
          </div>
          <span class="cookie-category-badge">Always active</span>
        </div>
        <div class="cookie-category">
          <div>
            <h3>Analytics</h3>
            <p>Google Analytics 4 for aggregated traffic measurement. Disabled by default.</p>
          </div>
          <span class="cookie-category-badge cookie-category-badge-optional">Optional</span>
        </div>
      </div>
      <p class="cookie-banner-links">
        <a href="privacy-policy.html">Privacy Policy</a>
        <span aria-hidden="true">/</span>
        <a href="cookie-policy.html">Cookie Policy</a>
      </p>
      <div class="cookie-banner-actions">
        <button type="button" class="cookie-button cookie-button-secondary" data-cookie-action="reject">Use necessary only</button>
        <button type="button" class="cookie-button cookie-button-primary" data-cookie-action="accept">Allow analytics</button>
      </div>
    </div>
  `;

  lastFocusedElement = document.activeElement;
  document.body.appendChild(banner);

  banner.querySelector('[data-cookie-action="accept"]')?.addEventListener('click', () => {
    applyConsent(true);
  });

  banner.querySelector('[data-cookie-action="reject"]')?.addEventListener('click', () => {
    applyConsent(false);
  });

  banner.querySelector('.cookie-banner-dismiss')?.addEventListener('click', () => {
    removeBanner();
  });

  banner.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mode === 'preferences') {
      removeBanner();
    }
  });

  banner.querySelector('[data-cookie-action="reject"]')?.focus();
}

function enhanceFooters() {
  document.querySelectorAll('.site-footer .footer-column.right .footer-credits').forEach((credits) => {
    if (credits.querySelector('.footer-policy-links')) return;

    const links = document.createElement('div');
    links.className = 'footer-policy-links';
    links.innerHTML = `
      <a href="privacy-policy.html" class="footer-link">Privacy Policy</a>
      <a href="cookie-policy.html" class="footer-link">Cookie Policy</a>
      <button type="button" class="footer-link footer-link-button" data-cookie-preferences>Cookie Preferences</button>
    `;
    credits.appendChild(links);
  });
}

function bindPreferenceTriggers() {
  document.querySelectorAll('[data-cookie-preferences]').forEach((button) => {
    button.addEventListener('click', () => {
      renderBanner('preferences');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  enhanceFooters();
  bindPreferenceTriggers();

  const consent = readConsent();
  if (consent === true) {
    loadAnalytics();
  } else if (consent === false) {
    updateGtagConsent(false);
  } else if (consent === null) {
    renderBanner();
  }
});
