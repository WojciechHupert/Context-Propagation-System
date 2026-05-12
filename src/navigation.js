/**
 * Moirai Navigation System
 * Handles mobile menu toggle and automatic active link highlighting.
 */

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.querySelector('.site-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Toggle mobile menu
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('is-active');
      siteNav.classList.toggle('is-active');
      document.body.classList.toggle('menu-open'); // Prevent scrolling when menu is open
    });
  }

  // Close menu when clicking a link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle?.classList.remove('is-active');
      siteNav?.classList.remove('is-active');
      document.body.classList.remove('menu-open');
    });
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
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('is-scrolled');
    } else {
      header?.classList.remove('is-scrolled');
    }
  });
});
