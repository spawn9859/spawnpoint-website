/**
 * Spawnpoint Interactive Playground
 * Mobile-first, progressive enhancement JavaScript
 */

(function() {
  'use strict';

  // Feature detection flags
  const features = {
    vibration: 'vibrate' in navigator,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    deviceMotion: 'DeviceMotionEvent' in window,
    localStorage: (() => {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch(e) {
        return false;
      }
    })(),
    pointerEvents: 'PointerEvent' in window,
    intersectionObserver: 'IntersectionObserver' in window
  };

  // Utility functions
  const utils = {
    // Debounce function for performance
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Clamp number between min and max
    clamp(num, min, max) {
      return Math.min(Math.max(num, min), max);
    },

    // Check if user prefers reduced motion
    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Safe vibration with feature detection
    vibrate(pattern) {
      if (features.vibration && !utils.prefersReducedMotion()) {
        navigator.vibrate(pattern);
      }
    },

    // Get stored theme preference
    getStoredTheme() {
      if (!features.localStorage) return null;
      return localStorage.getItem('theme');
    },

    // Store theme preference
    setStoredTheme(theme) {
      if (features.localStorage) {
        localStorage.setItem('theme', theme);
      }
    }
  };

  // Theme Management
  class ThemeManager {
    constructor() {
      this.toggleBtn = document.getElementById('themeToggle');
      this.currentTheme = this.detectTheme();
      this.init();
    }

    detectTheme() {
      const stored = utils.getStoredTheme();
      if (stored) return stored;
      
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    init() {
      this.applyTheme(this.currentTheme);
      
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', () => this.toggle());
      }

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!utils.getStoredTheme()) {
          this.applyTheme(e.matches ? 'light' : 'dark');
        }
      });
    }

    toggle() {
      const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme(newTheme);
      utils.setStoredTheme(newTheme);
      utils.vibrate(50); // Quick haptic feedback
    }

    applyTheme(theme) {
      this.currentTheme = theme;
      document.documentElement.className = theme === 'light' ? 'light' : '';
      
      if (this.toggleBtn) {
        this.toggleBtn.setAttribute('aria-pressed', theme === 'light');
        this.toggleBtn.textContent = `Switch to ${theme === 'light' ? 'dark' : 'light'} theme`;
      }
    }
  }

  // Counter Component
  class Counter {
    constructor() {
      this.btn = document.getElementById('counterButton');
      this.count = 0;
      this.init();
    }

    init() {
      if (!this.btn) return;
      
      this.btn.addEventListener('click', () => this.increment());
    }

    increment() {
      this.count++;
      this.btn.textContent = `Clicked ${this.count} time${this.count === 1 ? '' : 's'}`;
      utils.vibrate(30); // Light haptic feedback
    }
  }

  // Device Orientation Parallax
  class ParallaxManager {
    constructor() {
      this.hero = document.querySelector('.hero');
      this.parallaxElement = document.querySelector('.parallax-bg');
      this.permissionGranted = false;
      this.isActive = false;
      this.init();
    }

    init() {
      if (!this.hero || utils.prefersReducedMotion()) return;

      // Create parallax background element if it doesn't exist
      if (!this.parallaxElement) {
        this.createParallaxElement();
      }

      // Auto-start if permission already granted or not required
      if (this.canUseWithoutPermission()) {
        this.start();
      } else {
        this.setupPermissionFlow();
      }
    }

    createParallaxElement() {
      this.parallaxElement = document.createElement('div');
      this.parallaxElement.className = 'parallax-bg';
      this.hero.appendChild(this.parallaxElement);
    }

    canUseWithoutPermission() {
      // On non-iOS devices, usually no permission needed
      return !this.isiOS() || this.isPermissionGranted();
    }

    isiOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    isPermissionGranted() {
      // Check if we already have permission
      return features.deviceOrientation && 
             typeof DeviceOrientationEvent.requestPermission !== 'function';
    }

    async requestPermission() {
      if (!features.deviceOrientation) return false;

      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const permission = await DeviceOrientationEvent.requestPermission();
          this.permissionGranted = permission === 'granted';
        } else {
          this.permissionGranted = true;
        }
        return this.permissionGranted;
      } catch (error) {
        console.log('Device orientation permission denied or error:', error);
        return false;
      }
    }

    setupPermissionFlow() {
      // Add a button to request permission on iOS
      const permissionBtn = document.createElement('button');
      permissionBtn.className = 'btn btn-secondary parallax-enable';
      permissionBtn.textContent = 'Enable Device Tilt';
      permissionBtn.setAttribute('aria-label', 'Enable device tilt parallax effect');
      
      permissionBtn.addEventListener('click', async () => {
        const granted = await this.requestPermission();
        if (granted) {
          this.start();
          permissionBtn.remove();
        }
      });

      const actions = this.hero.querySelector('.actions');
      if (actions) {
        actions.appendChild(permissionBtn);
      }
    }

    start() {
      if (this.isActive || !features.deviceOrientation) return;
      
      this.isActive = true;
      const handleOrientation = utils.debounce((event) => {
        this.updateParallax(event);
      }, 16); // ~60fps

      window.addEventListener('deviceorientation', handleOrientation);
    }

    updateParallax(event) {
      if (!this.parallaxElement || utils.prefersReducedMotion()) return;

      const { beta, gamma } = event; // beta: front-back, gamma: left-right
      
      if (beta !== null && gamma !== null) {
        // Clamp and normalize values
        const normalizedBeta = utils.clamp(beta, -45, 45) / 45;
        const normalizedGamma = utils.clamp(gamma, -45, 45) / 45;
        
        // Apply subtle transform
        const translateX = normalizedGamma * 20; // max 20px movement
        const translateY = normalizedBeta * 20;
        
        this.parallaxElement.style.transform = `translate(${translateX}px, ${translateY}px) scale(1.1)`;
      }
    }
  }

  // Canvas Particle Animation
  class ParticleSystem {
    constructor() {
      this.canvas = document.getElementById('particleCanvas');
      this.ctx = null;
      this.particles = [];
      this.animationId = null;
      this.isRunning = false;
      this.init();
    }

    init() {
      if (!this.canvas) {
        this.createCanvas();
      }
      
      if (!this.canvas) return;
      
      this.ctx = this.canvas.getContext('2d');
      this.setupCanvas();
      this.createControls();
      
      // Auto-start if motion is not reduced
      if (!utils.prefersReducedMotion()) {
        this.start();
      }

      // Handle resize
      window.addEventListener('resize', utils.debounce(() => {
        this.setupCanvas();
      }, 250));
    }

    createCanvas() {
      const container = document.querySelector('#experiments .canvas-container');
      if (!container) return;
      
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'particleCanvas';
      this.canvas.setAttribute('aria-label', 'Animated particle background');
      container.appendChild(this.canvas);
    }

    setupCanvas() {
      if (!this.canvas || !this.ctx) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
      
      this.ctx.scale(dpr, dpr);
      this.initParticles();
    }

    createControls() {
      const container = this.canvas.parentElement;
      if (!container) return;
      
      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'particle-controls';
      
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn-secondary';
      toggleBtn.textContent = this.isRunning ? 'Pause Particles' : 'Start Particles';
      toggleBtn.setAttribute('aria-label', 'Toggle particle animation');
      
      toggleBtn.addEventListener('click', () => {
        if (this.isRunning) {
          this.stop();
          toggleBtn.textContent = 'Start Particles';
        } else {
          this.start();
          toggleBtn.textContent = 'Pause Particles';
        }
        utils.vibrate(40);
      });
      
      controlsDiv.appendChild(toggleBtn);
      container.appendChild(controlsDiv);
    }

    initParticles() {
      this.particles = [];
      const count = Math.min(50, Math.floor((this.canvas.width * this.canvas.height) / 10000));
      
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    }

    start() {
      if (this.isRunning || utils.prefersReducedMotion()) return;
      this.isRunning = true;
      this.animate();
    }

    stop() {
      this.isRunning = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    animate() {
      if (!this.isRunning) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Get current theme for particle color
      const isLight = document.documentElement.classList.contains('light');
      const particleColor = isLight ? '17, 19, 24' : '230, 230, 230'; // text color
      
      this.particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x <= 0 || particle.x >= this.canvas.width) particle.vx *= -1;
        if (particle.y <= 0 || particle.y >= this.canvas.height) particle.vy *= -1;
        
        // Draw particle
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
        this.ctx.fill();
      });
      
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  // Swipeable Carousel
  class Carousel {
    constructor() {
      this.container = document.querySelector('.carousel-container');
      this.track = document.querySelector('.carousel-track');
      this.slides = null;
      this.currentIndex = 0;
      this.isPointerDown = false;
      this.startX = 0;
      this.currentX = 0;
      this.translateX = 0;
      this.init();
    }

    init() {
      if (!this.container || !this.track) return;
      
      this.slides = Array.from(this.track.children);
      if (this.slides.length === 0) return;
      
      this.setupCarousel();
      this.bindEvents();
      this.createIndicators();
      this.updateCarousel();
    }

    setupCarousel() {
      // Ensure slides are properly positioned
      this.slides.forEach((slide, index) => {
        slide.style.transform = `translateX(${index * 100}%)`;
      });
    }

    bindEvents() {
      if (features.pointerEvents) {
        // Modern pointer events (handles mouse, touch, pen)
        this.track.addEventListener('pointerdown', (e) => this.handleStart(e));
        this.track.addEventListener('pointermove', (e) => this.handleMove(e));
        this.track.addEventListener('pointerup', (e) => this.handleEnd(e));
        this.track.addEventListener('pointercancel', (e) => this.handleEnd(e));
      } else {
        // Fallback to touch events
        this.track.addEventListener('touchstart', (e) => this.handleStart(e));
        this.track.addEventListener('touchmove', (e) => this.handleMove(e));
        this.track.addEventListener('touchend', (e) => this.handleEnd(e));
      }

      // Keyboard navigation
      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        }
      });
    }

    handleStart(e) {
      this.isPointerDown = true;
      this.startX = this.getEventX(e);
      this.currentX = this.startX;
      this.track.style.transition = 'none';
      
      if (features.pointerEvents) {
        this.track.setPointerCapture(e.pointerId);
      }
    }

    handleMove(e) {
      if (!this.isPointerDown) return;
      
      e.preventDefault();
      this.currentX = this.getEventX(e);
      const deltaX = this.currentX - this.startX;
      const movePercentage = (deltaX / this.container.offsetWidth) * 100;
      
      this.track.style.transform = `translateX(${this.translateX + movePercentage}%)`;
    }

    handleEnd(e) {
      if (!this.isPointerDown) return;
      
      this.isPointerDown = false;
      const deltaX = this.currentX - this.startX;
      const threshold = this.container.offsetWidth * 0.2; // 20% swipe threshold
      
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.prev();
        } else {
          this.next();
        }
      } else {
        this.updateCarousel();
      }
      
      utils.vibrate(30); // Haptic feedback on interaction
    }

    getEventX(e) {
      return e.type.includes('touch') ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX;
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.slides.length;
      this.updateCarousel();
    }

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.updateCarousel();
    }

    updateCarousel() {
      this.translateX = -this.currentIndex * 100;
      this.track.style.transition = 'transform 0.3s ease-out';
      this.track.style.transform = `translateX(${this.translateX}%)`;
      
      this.updateIndicators();
      this.updateAriaLabels();
    }

    createIndicators() {
      const indicatorsContainer = document.createElement('div');
      indicatorsContainer.className = 'carousel-indicators';
      indicatorsContainer.setAttribute('role', 'tablist');
      
      this.slides.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        indicator.setAttribute('role', 'tab');
        indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
        indicator.addEventListener('click', () => {
          this.currentIndex = index;
          this.updateCarousel();
          utils.vibrate(25);
        });
        indicatorsContainer.appendChild(indicator);
      });
      
      this.container.appendChild(indicatorsContainer);
      this.indicators = Array.from(indicatorsContainer.children);
    }

    updateIndicators() {
      if (!this.indicators) return;
      
      this.indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === this.currentIndex);
        indicator.setAttribute('aria-selected', index === this.currentIndex);
      });
    }

    updateAriaLabels() {
      this.slides.forEach((slide, index) => {
        slide.setAttribute('aria-hidden', index !== this.currentIndex);
      });
    }
  }

  // Mobile Navigation
  class MobileNav {
    constructor() {
      this.header = document.querySelector('.site-header');
      this.nav = document.querySelector('.nav');
      this.menuToggle = null;
      this.isOpen = false;
      this.init();
    }

    init() {
      if (!this.header || !this.nav) return;
      
      this.createMenuToggle();
      this.bindEvents();
    }

    createMenuToggle() {
      this.menuToggle = document.createElement('button');
      this.menuToggle.className = 'menu-toggle';
      this.menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
      this.menuToggle.setAttribute('aria-expanded', 'false');
      this.menuToggle.setAttribute('aria-controls', 'navigation');
      
      // Create hamburger icon
      for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = 'menu-toggle-line';
        this.menuToggle.appendChild(span);
      }
      
      this.nav.setAttribute('id', 'navigation');
      this.header.querySelector('.container').insertBefore(this.menuToggle, this.nav);
    }

    bindEvents() {
      this.menuToggle.addEventListener('click', () => this.toggle());
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.header.contains(e.target)) {
          this.close();
        }
      });
      
      // Close menu on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
          this.menuToggle.focus();
        }
      });
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
      utils.vibrate(40);
    }

    open() {
      this.isOpen = true;
      this.nav.classList.add('nav-open');
      this.menuToggle.classList.add('menu-toggle-open');
      this.menuToggle.setAttribute('aria-expanded', 'true');
      this.menuToggle.setAttribute('aria-label', 'Close navigation menu');
    }

    close() {
      this.isOpen = false;
      this.nav.classList.remove('nav-open');
      this.menuToggle.classList.remove('menu-toggle-open');
      this.menuToggle.setAttribute('aria-expanded', 'false');
      this.menuToggle.setAttribute('aria-label', 'Open navigation menu');
    }
  }

  // Initialize everything when DOM is ready
  function init() {
    // Set current year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }

    // Initialize all components
    new ThemeManager();
    new Counter();
    new ParallaxManager();
    new ParticleSystem();
    new Carousel();
    new MobileNav();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();