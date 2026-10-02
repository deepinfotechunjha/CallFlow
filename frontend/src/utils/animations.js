import { gsap } from 'gsap';

/**
 * Animate page entrance / header dropping from top to bottom
 * @param {HTMLElement|string} target
 * @param {object} options
 */
export const animatePageHeader = (target, options = {}) => {
  if (!target) return;
  try {
    return gsap.fromTo(
      target,
      { y: -30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power3.out',
        ...options,
      }
    );
  } catch (err) {
    console.warn('animatePageHeader error:', err);
  }
};

/**
 * Animate container with staggered children
 * @param {HTMLElement|string} container
 * @param {string} childSelector
 * @param {object} options
 */
export const animateStaggerCascade = (container, childSelector = '> *', options = {}) => {
  if (!container) return;
  try {
    const elements = typeof container === 'string' ? container : container.querySelectorAll ? container.querySelectorAll(childSelector) : null;
    if (!elements || elements.length === 0) return;

    return gsap.fromTo(
      elements,
      { y: 20, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
        ...options,
      }
    );
  } catch (err) {
    console.warn('animateStaggerCascade error:', err);
  }
};

/**
 * Animate table rows sequentially
 * @param {HTMLElement|string} tbody
 * @param {object} options
 */
export const animateTableRows = (tbody, options = {}) => {
  if (!tbody) return;
  try {
    const rows = typeof tbody === 'string' ? tbody : tbody.querySelectorAll ? tbody.querySelectorAll('tr') : null;
    if (!rows || rows.length === 0) return;

    return gsap.fromTo(
      rows,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.03,
        ease: 'power2.out',
        ...options,
      }
    );
  } catch (err) {
    console.warn('animateTableRows error:', err);
  }
};

/**
 * Animate modal opening with elastic spring pop-in
 * @param {HTMLElement} modalElement
 * @param {object} options
 */
export const animateModalSpring = (modalElement, options = {}) => {
  if (!modalElement) return;
  try {
    return gsap.fromTo(
      modalElement,
      { scale: 0.88, opacity: 0, y: 15 },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'back.out(1.5)',
        ...options,
      }
    );
  } catch (err) {
    console.warn('animateModalSpring error:', err);
  }
};

/**
 * Notification Bell Jiggle / Ring Animation
 * @param {HTMLElement} bellElement
 */
export const animateBellRing = (bellElement) => {
  if (!bellElement) return;
  try {
    const tl = gsap.timeline();
    tl.to(bellElement, { rotation: 18, duration: 0.08, ease: 'power1.inOut' })
      .to(bellElement, { rotation: -18, duration: 0.08, ease: 'power1.inOut' })
      .to(bellElement, { rotation: 12, duration: 0.08, ease: 'power1.inOut' })
      .to(bellElement, { rotation: -12, duration: 0.08, ease: 'power1.inOut' })
      .to(bellElement, { rotation: 6, duration: 0.08, ease: 'power1.inOut' })
      .to(bellElement, { rotation: 0, duration: 0.08, ease: 'power1.inOut' });
    return tl;
  } catch (err) {
    console.warn('animateBellRing error:', err);
  }
};
