/**
 * Moirai Navigation System
 * Handles mobile menu toggle and automatic active link highlighting.
 */

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.querySelector('.site-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const header = document.querySelector('.site-header');

  const setMenuState = (open) => {
    menuToggle?.classList.toggle('is-active', open);
    siteNav?.classList.toggle('is-active', open);
    document.body.classList.toggle('menu-open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    siteNav?.setAttribute('aria-hidden', String(!open));
  };

  navLinks.forEach((link, index) => {
    link.style.setProperty('--nav-index', index);
  });

  // Toggle mobile menu
  if (menuToggle && siteNav) {
    siteNav.id ||= 'siteNav';
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-controls', siteNav.id);
    siteNav.setAttribute('aria-hidden', 'true');

    menuToggle.addEventListener('click', () => {
      const nextOpen = !siteNav.classList.contains('is-active');
      setMenuState(nextOpen);
    });
  }

  // Close menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuState(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!siteNav?.classList.contains('is-active')) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (header && !header.contains(target)) {
      setMenuState(false);
    }
  });

  // Handle active state based on current URL
  const currentPath = window.location.pathname;
  const page = currentPath.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    // Check if href matches current page or if it's the root/index
    if (href === page || (page === 'index.html' && (href === './' || href === 'index.html'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Add scroll class to header for styling changes on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('is-scrolled');
    } else {
      header?.classList.remove('is-scrolled');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setMenuState(false);
    }
  });
});
