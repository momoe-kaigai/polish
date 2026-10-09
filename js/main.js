// Mark JS as active so CSS can arm the scroll-reveal animation
// (content stays visible by default if this never runs)
document.documentElement.classList.add('js');

// Header background on scroll
const header = document.getElementById('siteHeader');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile nav toggle (closes after picking a link)
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
const setNavOpen = (open) => {
  mainNav.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
};
navToggle.addEventListener('click', () => setNavOpen(!mainNav.classList.contains('is-open')));
mainNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setNavOpen(false)));

// Scroll reveal animation
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// FAQ accordion
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-q');
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('open', !isOpen);
    btn.setAttribute('aria-expanded', String(!isOpen));
  });
});

// Hide sticky NEXT EVENT bar once the event section itself is on screen
const nextEventBar = document.getElementById('nextEventBar');
const eventSection = document.getElementById('next');
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => nextEventBar.classList.toggle('is-hidden', entry.isIntersecting));
}, { threshold: 0.2 });
barObserver.observe(eventSection);

