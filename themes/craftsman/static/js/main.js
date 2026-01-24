/**
 * Severn Damp Proofing - Main JavaScript
 * Handles navigation, mobile menu, floating contact, and animations
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  const header = document.getElementById('site-header');
  let lastScroll = 0;
  
  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
  
  // ============================================
  // MOBILE MENU
  // ============================================
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  
  function openMobileMenu() {
    mobileMenu.classList.add('active');
    mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
  }
  
  function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
  }
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', openMobileMenu);
  }
  
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }
  
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', function(e) {
      if (!document.getElementById('floating-form-panel').classList.contains('active')) {
        closeMobileMenu();
      }
    });
  }
  
  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeFloatingForm();
    }
  });
  
  // ============================================
  // FLOATING CONTACT FORM
  // ============================================
  const floatingFormToggle = document.getElementById('floating-form-toggle');
  const floatingFormPanel = document.getElementById('floating-form-panel');
  const floatingFormClose = document.getElementById('floating-form-close');
  const floatingFormOverlay = document.getElementById('floating-form-overlay');
  
  function openFloatingForm() {
    floatingFormPanel.classList.add('active');
    floatingFormOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeFloatingForm() {
    floatingFormPanel.classList.remove('active');
    floatingFormOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  if (floatingFormToggle) {
    floatingFormToggle.addEventListener('click', openFloatingForm);
  }
  
  if (floatingFormClose) {
    floatingFormClose.addEventListener('click', closeFloatingForm);
  }
  
  if (floatingFormOverlay) {
    floatingFormOverlay.addEventListener('click', closeFloatingForm);
  }
  
  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Close mobile menu if open
        closeMobileMenu();
      }
    });
  });
  
  // ============================================
  // FORM VALIDATION & SUBMISSION
  // ============================================
  const forms = document.querySelectorAll('.contact-form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      // Show loading state
      submitBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <style>.spinner{animation:rotate 1s linear infinite}@keyframes rotate{100%{transform:rotate(360deg)}}</style>
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="10"/>
        </svg>
        Sending...
      `;
      submitBtn.disabled = true;
      
      // Re-enable after submission (formspree handles the actual submit)
      setTimeout(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }, 3000);
    });
  });
  
  // ============================================
  // INTERSECTION OBSERVER FOR ANIMATIONS
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
  
  // ============================================
  // PROJECT GALLERY LIGHTBOX (if needed)
  // ============================================
  const galleryImages = document.querySelectorAll('.project-gallery img');
  
  galleryImages.forEach(img => {
    img.addEventListener('click', function() {
      // Simple lightbox - could be enhanced
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
        padding: 2rem;
      `;
      
      const largeImg = document.createElement('img');
      largeImg.src = this.src;
      largeImg.style.cssText = `
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 8px;
      `;
      
      overlay.appendChild(largeImg);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      
      overlay.addEventListener('click', function() {
        document.body.removeChild(overlay);
        document.body.style.overflow = '';
      });
    });
  });
  
  // ============================================
  // FAQ ACCORDION
  // ============================================
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.parentElement;
      const answer = faqItem.querySelector('.faq-answer');
      const isActive = faqItem.classList.contains('active');
      
      // Close all other FAQ items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        const itemAnswer = item.querySelector('.faq-answer');
        if (itemAnswer) {
          itemAnswer.style.maxHeight = '0';
          itemAnswer.style.paddingTop = '0';
          itemAnswer.style.paddingBottom = '0';
        }
      });
      
      // Toggle current item
      if (!isActive) {
        faqItem.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        answer.style.paddingTop = '';
        answer.style.paddingBottom = '';
      }
    });
  });
  
  // Initialize FAQ answers as collapsed
  document.querySelectorAll('.faq-answer').forEach(answer => {
    answer.style.maxHeight = '0';
    answer.style.overflow = 'hidden';
    answer.style.transition = 'max-height 0.3s ease, padding 0.3s ease';
  });
  
});
