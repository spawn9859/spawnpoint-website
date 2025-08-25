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
    intersectionObserver: 'IntersectionObserver' in window,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      } catch(e) {
        return false;
      }
    })(),
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webWorkers: 'Worker' in window
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

  // WebGL 3D Graphics
  class WebGL3D {
    constructor() {
      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.animationId = null;
      this.isRunning = false;
      this.rotation = 0;
      this.rotationSpeed = 1;
      this.wireframe = false;
      this.mouseX = 0;
      this.mouseY = 0;
      this.init();
    }

    init() {
      if (!features.webGL) {
        this.showFallback();
        return;
      }

      this.createCanvas();
      this.setupEventListeners();
    }

    createCanvas() {
      const container = document.querySelector('.webgl-container');
      if (!container) return;

      this.canvas = document.createElement('canvas');
      this.canvas.width = 600;
      this.canvas.height = 400;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height = 'auto';
      
      container.appendChild(this.canvas);

      this.gl = this.canvas.getContext('webgl');
      if (!this.gl) {
        this.showFallback();
        return;
      }

      this.setupWebGL();
    }

    setupWebGL() {
      const vertexShaderSource = `
        attribute vec4 a_position;
        attribute vec3 a_normal;
        uniform mat4 u_matrix;
        uniform mat4 u_normalMatrix;
        varying vec3 v_normal;
        varying vec3 v_position;
        
        void main() {
          gl_Position = u_matrix * a_position;
          v_normal = mat3(u_normalMatrix) * a_normal;
          v_position = a_position.xyz;
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying vec3 v_normal;
        varying vec3 v_position;
        uniform vec3 u_lightDirection;
        uniform vec3 u_color;
        uniform bool u_wireframe;
        
        void main() {
          if (u_wireframe) {
            gl_FragColor = vec4(u_color, 1.0);
          } else {
            vec3 normal = normalize(v_normal);
            float light = dot(normal, u_lightDirection) * 0.5 + 0.5;
            gl_FragColor = vec4(u_color * light, 1.0);
          }
        }
      `;

      const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      this.program = this.createProgram(vertexShader, fragmentShader);
      
      this.setupGeometry();
      this.setupUniforms();
    }

    createShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }

    createProgram(vertexShader, fragmentShader) {
      const program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error('Program linking error:', this.gl.getProgramInfoLog(program));
        this.gl.deleteProgram(program);
        return null;
      }
      
      return program;
    }

    setupGeometry() {
      // Create a cube
      const positions = [
        // Front face
        -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
        // Back face
        -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
        // Top face
        -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
        // Bottom face
        -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
        // Right face
         1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
        // Left face
        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
      ];

      const normals = [
        // Front face
         0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1,
        // Back face
         0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1,
        // Top face
         0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0,
        // Bottom face
         0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
        // Right face
         1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0,
        // Left face
        -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0
      ];

      const indices = [
         0,  1,  2,    0,  2,  3,    // front
         4,  5,  6,    4,  6,  7,    // back
         8,  9, 10,    8, 10, 11,    // top
        12, 13, 14,   12, 14, 15,    // bottom
        16, 17, 18,   16, 18, 19,    // right
        20, 21, 22,   20, 22, 23     // left
      ];

      // Position buffer
      this.positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

      // Normal buffer
      this.normalBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

      // Index buffer
      this.indexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

      this.indexCount = indices.length;
    }

    setupUniforms() {
      this.gl.useProgram(this.program);
      
      this.locations = {
        position: this.gl.getAttribLocation(this.program, 'a_position'),
        normal: this.gl.getAttribLocation(this.program, 'a_normal'),
        matrix: this.gl.getUniformLocation(this.program, 'u_matrix'),
        normalMatrix: this.gl.getUniformLocation(this.program, 'u_normalMatrix'),
        lightDirection: this.gl.getUniformLocation(this.program, 'u_lightDirection'),
        color: this.gl.getUniformLocation(this.program, 'u_color'),
        wireframe: this.gl.getUniformLocation(this.program, 'u_wireframe')
      };
    }

    setupEventListeners() {
      const toggleBtn = document.getElementById('webglToggle');
      const speedSlider = document.getElementById('rotationSpeed');
      const wireframeToggle = document.getElementById('wireframeToggle');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }

      if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
          this.rotationSpeed = parseFloat(e.target.value);
        });
      }

      if (wireframeToggle) {
        wireframeToggle.addEventListener('change', (e) => {
          this.wireframe = e.target.checked;
        });
      }

      if (this.canvas) {
        this.canvas.addEventListener('mousemove', (e) => {
          const rect = this.canvas.getBoundingClientRect();
          this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          this.mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });
      }
    }

    toggle() {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
      utils.vibrate(30);
    }

    start() {
      if (this.isRunning || !this.gl) return;
      
      this.isRunning = true;
      const toggleBtn = document.getElementById('webglToggle');
      if (toggleBtn) toggleBtn.textContent = 'Stop 3D Scene';
      
      this.render();
    }

    stop() {
      this.isRunning = false;
      const toggleBtn = document.getElementById('webglToggle');
      if (toggleBtn) toggleBtn.textContent = 'Start 3D Scene';
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    render() {
      if (!this.isRunning || !this.gl) return;

      this.rotation += 0.01 * this.rotationSpeed;

      // Clear canvas
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      this.gl.enable(this.gl.DEPTH_TEST);

      // Use shader program
      this.gl.useProgram(this.program);

      // Bind position buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.enableVertexAttribArray(this.locations.position);
      this.gl.vertexAttribPointer(this.locations.position, 3, this.gl.FLOAT, false, 0, 0);

      // Bind normal buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
      this.gl.enableVertexAttribArray(this.locations.normal);
      this.gl.vertexAttribPointer(this.locations.normal, 3, this.gl.FLOAT, false, 0, 0);

      // Bind index buffer
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      // Create transformation matrix
      const matrix = this.createMatrix();
      this.gl.uniformMatrix4fv(this.locations.matrix, false, matrix);

      // Create normal matrix
      const normalMatrix = this.createNormalMatrix(matrix);
      this.gl.uniformMatrix4fv(this.locations.normalMatrix, false, normalMatrix);

      // Set uniforms
      this.gl.uniform3fv(this.locations.lightDirection, [0.5, 0.7, 1]);
      this.gl.uniform3fv(this.locations.color, [0.2, 0.7, 1.0]);
      this.gl.uniform1i(this.locations.wireframe, this.wireframe);

      // Draw
      if (this.wireframe) {
        for (let i = 0; i < this.indexCount; i += 3) {
          this.gl.drawElements(this.gl.LINE_LOOP, 3, this.gl.UNSIGNED_SHORT, i * 2);
        }
      } else {
        this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
      }

      this.animationId = requestAnimationFrame(() => this.render());
    }

    createMatrix() {
      const aspect = this.canvas.width / this.canvas.height;
      const matrix = new Float32Array(16);
      
      // Create perspective matrix
      const perspective = this.createPerspectiveMatrix(Math.PI / 4, aspect, 0.1, 100);
      
      // Create view matrix
      const view = this.createLookAtMatrix([0, 0, 5], [0, 0, 0], [0, 1, 0]);
      
      // Create model matrix with rotation and mouse interaction
      const model = this.createRotationMatrix(this.rotation + this.mouseX, this.rotation * 0.7 + this.mouseY, this.rotation * 0.3);
      
      // Combine matrices: perspective * view * model
      this.multiplyMatrices(perspective, view, matrix);
      this.multiplyMatrices(matrix, model, matrix);
      
      return matrix;
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
      const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
      const rangeInv = 1.0 / (near - far);

      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
      ]);
    }

    createLookAtMatrix(eye, target, up) {
      const zAxis = this.normalize([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
      const xAxis = this.normalize(this.cross(up, zAxis));
      const yAxis = this.cross(zAxis, xAxis);

      return new Float32Array([
        xAxis[0], xAxis[1], xAxis[2], 0,
        yAxis[0], yAxis[1], yAxis[2], 0,
        zAxis[0], zAxis[1], zAxis[2], 0,
        eye[0], eye[1], eye[2], 1
      ]);
    }

    createRotationMatrix(rx, ry, rz) {
      const cx = Math.cos(rx), sx = Math.sin(rx);
      const cy = Math.cos(ry), sy = Math.sin(ry);
      const cz = Math.cos(rz), sz = Math.sin(rz);

      return new Float32Array([
        cy * cz, -cy * sz, sy, 0,
        sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy, 0,
        -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy, 0,
        0, 0, 0, 1
      ]);
    }

    createNormalMatrix(matrix) {
      // Extract 3x3 rotation part and invert/transpose
      const m = matrix;
      return new Float32Array([
        m[0], m[4], m[8], 0,
        m[1], m[5], m[9], 0,
        m[2], m[6], m[10], 0,
        0, 0, 0, 1
      ]);
    }

    multiplyMatrices(a, b, result) {
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

      const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
      const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
      const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
      const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

      result[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
      result[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
      result[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
      result[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
      result[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
      result[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
      result[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
      result[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
      result[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
      result[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
      result[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
      result[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
      result[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
      result[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
      result[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
      result[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
    }

    normalize(v) {
      const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      return length > 0 ? [v[0] / length, v[1] / length, v[2] / length] : [0, 0, 0];
    }

    cross(a, b) {
      return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
      ];
    }

    showFallback() {
      const container = document.querySelector('.webgl-container');
      if (container) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">WebGL is not supported in this browser. Please try a modern browser with WebGL enabled.</p>';
      }
    }
  }

  // Audio Visualization
  class AudioVisualizer {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.audioContext = null;
      this.analyser = null;
      this.dataArray = null;
      this.source = null;
      this.animationId = null;
      this.isRunning = false;
      this.sensitivity = 1;
      this.micStream = null;
      this.init();
    }

    init() {
      if (!features.webAudio) {
        this.showFallback();
        return;
      }

      this.createCanvas();
      this.setupEventListeners();
    }

    createCanvas() {
      const container = document.querySelector('.audio-container');
      if (!container) return;

      this.canvas = document.createElement('canvas');
      this.canvas.width = 600;
      this.canvas.height = 300;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height = 'auto';
      
      container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
      const toggleBtn = document.getElementById('audioToggle');
      const micBtn = document.getElementById('micToggle');
      const fileInput = document.getElementById('audioFile');
      const sensitivitySlider = document.getElementById('audioSensitivity');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }

      if (micBtn) {
        micBtn.addEventListener('click', () => this.toggleMicrophone());
      }

      if (fileInput) {
        fileInput.addEventListener('change', (e) => this.loadAudioFile(e.target.files[0]));
      }

      if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', (e) => {
          this.sensitivity = parseFloat(e.target.value);
        });
      }

      // Check microphone availability
      this.checkMicrophoneSupport();
    }

    async checkMicrophoneSupport() {
      if (features.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop()); // Stop immediately
          
          const micBtn = document.getElementById('micToggle');
          if (micBtn) micBtn.disabled = false;
        } catch (err) {
          console.log('Microphone not available:', err);
        }
      }
    }

    async setupAudioContext() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        return true;
      } catch (err) {
        console.error('Failed to setup audio context:', err);
        return false;
      }
    }

    async toggle() {
      if (this.isRunning) {
        this.stop();
      } else {
        await this.start();
      }
      utils.vibrate(30);
    }

    async start() {
      if (this.isRunning) return;

      const success = await this.setupAudioContext();
      if (!success) return;

      // Create a simple oscillator for demonstration
      this.createOscillatorSource();
      
      this.isRunning = true;
      const toggleBtn = document.getElementById('audioToggle');
      if (toggleBtn) toggleBtn.textContent = 'Stop Audio Visualization';
      
      this.render();
    }

    createOscillatorSource() {
      // Create a complex audio source for visualization
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const oscillator3 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(220, this.audioContext.currentTime);
      
      oscillator2.type = 'sawtooth';
      oscillator2.frequency.setValueAtTime(110, this.audioContext.currentTime);
      
      oscillator3.type = 'square';
      oscillator3.frequency.setValueAtTime(440, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      
      // Connect oscillators to analyser
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      oscillator3.connect(gainNode);
      gainNode.connect(this.analyser);
      gainNode.connect(this.audioContext.destination);
      
      // Add some frequency modulation for interesting visuals
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
      lfoGain.gain.setValueAtTime(50, this.audioContext.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator1.frequency);
      
      oscillator1.start();
      oscillator2.start();
      oscillator3.start();
      lfo.start();
      
      // Store reference for cleanup
      this.oscillators = [oscillator1, oscillator2, oscillator3, lfo];
    }

    async toggleMicrophone() {
      if (this.micStream) {
        this.stopMicrophone();
      } else {
        await this.startMicrophone();
      }
    }

    async startMicrophone() {
      try {
        if (!this.audioContext) {
          const success = await this.setupAudioContext();
          if (!success) return;
        }

        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.source = this.audioContext.createMediaStreamSource(this.micStream);
        this.source.connect(this.analyser);
        
        const micBtn = document.getElementById('micToggle');
        if (micBtn) micBtn.textContent = 'Stop Microphone';
        
        if (!this.isRunning) {
          this.isRunning = true;
          const toggleBtn = document.getElementById('audioToggle');
          if (toggleBtn) toggleBtn.textContent = 'Stop Audio Visualization';
          this.render();
        }
        
        utils.vibrate(40);
      } catch (err) {
        console.error('Failed to access microphone:', err);
        alert('Failed to access microphone. Please check permissions.');
      }
    }

    stopMicrophone() {
      if (this.micStream) {
        this.micStream.getTracks().forEach(track => track.stop());
        this.micStream = null;
      }
      
      if (this.source) {
        this.source.disconnect();
        this.source = null;
      }
      
      const micBtn = document.getElementById('micToggle');
      if (micBtn) micBtn.textContent = 'Use Microphone';
    }

    loadAudioFile(file) {
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!this.audioContext) {
            const success = await this.setupAudioContext();
            if (!success) return;
          }

          const arrayBuffer = e.target.result;
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          
          // Stop any existing sources
          this.stopAllSources();
          
          // Create buffer source
          this.source = this.audioContext.createBufferSource();
          this.source.buffer = audioBuffer;
          this.source.loop = true;
          this.source.connect(this.analyser);
          this.source.connect(this.audioContext.destination);
          this.source.start();
          
          if (!this.isRunning) {
            this.isRunning = true;
            const toggleBtn = document.getElementById('audioToggle');
            if (toggleBtn) toggleBtn.textContent = 'Stop Audio Visualization';
            this.render();
          }
          
        } catch (err) {
          console.error('Failed to load audio file:', err);
          alert('Failed to load audio file. Please try a different file.');
        }
      };
      
      reader.readAsArrayBuffer(file);
    }

    stop() {
      this.isRunning = false;
      
      const toggleBtn = document.getElementById('audioToggle');
      if (toggleBtn) toggleBtn.textContent = 'Start Audio Visualization';
      
      this.stopAllSources();
      this.stopMicrophone();
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      // Clear canvas
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    stopAllSources() {
      if (this.oscillators) {
        this.oscillators.forEach(osc => {
          try { osc.stop(); } catch (e) {}
        });
        this.oscillators = null;
      }
      
      if (this.source && this.source.stop) {
        try { this.source.stop(); } catch (e) {}
        this.source = null;
      }
    }

    render() {
      if (!this.isRunning || !this.analyser || !this.ctx) return;

      this.analyser.getByteFrequencyData(this.dataArray);
      
      const width = this.canvas.width;
      const height = this.canvas.height;
      const barWidth = width / this.dataArray.length;
      
      // Clear canvas with fade effect
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      this.ctx.fillRect(0, 0, width, height);
      
      // Draw frequency bars
      for (let i = 0; i < this.dataArray.length; i++) {
        const barHeight = (this.dataArray[i] / 255) * height * this.sensitivity;
        const hue = (i / this.dataArray.length) * 360;
        
        this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        this.ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        
        // Add reflection effect
        this.ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
        this.ctx.fillRect(i * barWidth, 0, barWidth - 1, barHeight * 0.3);
      }
      
      // Draw waveform
      this.analyser.getByteTimeDomainData(this.dataArray);
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      
      for (let i = 0; i < this.dataArray.length; i++) {
        const x = (i / this.dataArray.length) * width;
        const y = ((this.dataArray[i] - 128) / 128) * (height / 4) + height / 2;
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      
      this.ctx.stroke();
      
      this.animationId = requestAnimationFrame(() => this.render());
    }

    showFallback() {
      const container = document.querySelector('.audio-container');
      if (container) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">Web Audio API is not supported in this browser.</p>';
      }
    }
  }

  // Physics Simulation
  class PhysicsSimulation {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.objects = [];
      this.animationId = null;
      this.isRunning = false;
      this.gravity = { x: 0, y: 0.5 };
      this.gravityEnabled = true;
      this.objectCount = 0;
      this.lastTime = 0;
      this.init();
    }

    init() {
      this.createCanvas();
      this.setupEventListeners();
    }

    createCanvas() {
      const container = document.querySelector('.physics-container');
      if (!container) return;

      this.canvas = document.createElement('canvas');
      this.canvas.width = 600;
      this.canvas.height = 400;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height = 'auto';
      this.canvas.style.cursor = 'crosshair';
      
      container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
      const toggleBtn = document.getElementById('physicsToggle');
      const gravityBtn = document.getElementById('gravityToggle');
      const clearBtn = document.getElementById('clearPhysics');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }

      if (gravityBtn) {
        gravityBtn.addEventListener('click', () => this.toggleGravity());
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearObjects());
      }

      if (this.canvas) {
        this.canvas.addEventListener('click', (e) => this.addObject(e));
        this.canvas.addEventListener('touchstart', (e) => {
          e.preventDefault();
          const touch = e.touches[0];
          const rect = this.canvas.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          this.addObjectAt(x, y);
        });
      }
    }

    addObject(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.addObjectAt(x, y);
    }

    addObjectAt(x, y) {
      if (this.objects.length >= 50) return; // Limit objects for performance

      const radius = Math.random() * 15 + 10;
      const mass = radius / 5;
      const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
      
      const object = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        radius: radius,
        mass: mass,
        color: color,
        restitution: 0.8,
        friction: 0.99
      };

      this.objects.push(object);
      this.updateObjectCount();
      utils.vibrate(20);
    }

    toggle() {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
      utils.vibrate(30);
    }

    start() {
      if (this.isRunning) return;
      
      this.isRunning = true;
      const toggleBtn = document.getElementById('physicsToggle');
      if (toggleBtn) toggleBtn.textContent = 'Stop Physics';
      
      this.lastTime = performance.now();
      this.render();
    }

    stop() {
      this.isRunning = false;
      const toggleBtn = document.getElementById('physicsToggle');
      if (toggleBtn) toggleBtn.textContent = 'Start Physics';
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    toggleGravity() {
      this.gravityEnabled = !this.gravityEnabled;
      const gravityBtn = document.getElementById('gravityToggle');
      if (gravityBtn) {
        gravityBtn.textContent = this.gravityEnabled ? 'Disable Gravity' : 'Enable Gravity';
      }
      utils.vibrate(25);
    }

    clearObjects() {
      this.objects = [];
      this.updateObjectCount();
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      utils.vibrate(40);
    }

    updateObjectCount() {
      this.objectCount = this.objects.length;
      const countElement = document.getElementById('objectCount');
      if (countElement) {
        countElement.textContent = this.objectCount;
      }
    }

    update(deltaTime) {
      const dt = Math.min(deltaTime / 16.67, 2); // Cap at 2x normal speed

      for (let i = 0; i < this.objects.length; i++) {
        const obj = this.objects[i];
        
        // Apply gravity
        if (this.gravityEnabled) {
          obj.vx += this.gravity.x * dt;
          obj.vy += this.gravity.y * dt;
        }
        
        // Apply friction
        obj.vx *= obj.friction;
        obj.vy *= obj.friction;
        
        // Update position
        obj.x += obj.vx * dt;
        obj.y += obj.vy * dt;
        
        // Boundary collisions
        if (obj.x - obj.radius < 0) {
          obj.x = obj.radius;
          obj.vx = -obj.vx * obj.restitution;
        }
        if (obj.x + obj.radius > this.canvas.width) {
          obj.x = this.canvas.width - obj.radius;
          obj.vx = -obj.vx * obj.restitution;
        }
        if (obj.y - obj.radius < 0) {
          obj.y = obj.radius;
          obj.vy = -obj.vy * obj.restitution;
        }
        if (obj.y + obj.radius > this.canvas.height) {
          obj.y = this.canvas.height - obj.radius;
          obj.vy = -obj.vy * obj.restitution;
        }
      }
      
      // Object-to-object collisions
      for (let i = 0; i < this.objects.length; i++) {
        for (let j = i + 1; j < this.objects.length; j++) {
          this.checkCollision(this.objects[i], this.objects[j]);
        }
      }
    }

    checkCollision(obj1, obj2) {
      const dx = obj2.x - obj1.x;
      const dy = obj2.y - obj1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = obj1.radius + obj2.radius;
      
      if (distance < minDistance) {
        // Collision detected - resolve it
        const overlap = minDistance - distance;
        const normalX = dx / distance;
        const normalY = dy / distance;
        
        // Separate objects
        const totalMass = obj1.mass + obj2.mass;
        const move1 = overlap * (obj2.mass / totalMass);
        const move2 = overlap * (obj1.mass / totalMass);
        
        obj1.x -= normalX * move1;
        obj1.y -= normalY * move1;
        obj2.x += normalX * move2;
        obj2.y += normalY * move2;
        
        // Calculate relative velocity
        const relativeVx = obj2.vx - obj1.vx;
        const relativeVy = obj2.vy - obj1.vy;
        const relativeSpeed = relativeVx * normalX + relativeVy * normalY;
        
        // Don't resolve if objects are separating
        if (relativeSpeed > 0) return;
        
        // Calculate restitution
        const restitution = Math.min(obj1.restitution, obj2.restitution);
        
        // Calculate impulse scalar
        const impulse = (1 + restitution) * relativeSpeed / totalMass;
        
        // Apply impulse
        obj1.vx += impulse * obj2.mass * normalX;
        obj1.vy += impulse * obj2.mass * normalY;
        obj2.vx -= impulse * obj1.mass * normalX;
        obj2.vy -= impulse * obj1.mass * normalY;
      }
    }

    render() {
      if (!this.isRunning || !this.ctx) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;

      // Update physics
      this.update(deltaTime);
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Draw background grid
      this.drawGrid();
      
      // Draw objects
      for (const obj of this.objects) {
        this.ctx.beginPath();
        this.ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = obj.color;
        this.ctx.fill();
        
        // Add gradient shading
        const gradient = this.ctx.createRadialGradient(
          obj.x - obj.radius * 0.3, obj.y - obj.radius * 0.3, 0,
          obj.x, obj.y, obj.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // Draw velocity vector for debugging
        if (Math.abs(obj.vx) > 0.1 || Math.abs(obj.vy) > 0.1) {
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(obj.x, obj.y);
          this.ctx.lineTo(obj.x + obj.vx * 3, obj.y + obj.vy * 3);
          this.ctx.stroke();
        }
      }
      
      // Draw gravity indicator
      if (this.gravityEnabled) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('Gravity: ON', 10, 25);
      }
      
      this.animationId = requestAnimationFrame(() => this.render());
    }

    drawGrid() {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      
      const gridSize = 50;
      
      // Vertical lines
      for (let x = 0; x <= this.canvas.width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= this.canvas.height; y += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
      }
    }
  }

  // Computer Vision & Camera
  class CameraVision {
    constructor() {
      this.video = null;
      this.canvas = null;
      this.ctx = null;
      this.stream = null;
      this.animationId = null;
      this.isRunning = false;
      this.currentFilter = 'none';
      this.faceDetectionEnabled = false;
      this.init();
    }

    init() {
      if (!features.getUserMedia) {
        this.showFallback();
        return;
      }

      this.setupElements();
      this.setupEventListeners();
    }

    setupElements() {
      this.video = document.getElementById('cameraVideo');
      this.canvas = document.getElementById('cameraCanvas');
      
      if (this.canvas) {
        this.canvas.width = 640;
        this.canvas.height = 480;
        this.ctx = this.canvas.getContext('2d');
      }
    }

    setupEventListeners() {
      const toggleBtn = document.getElementById('cameraToggle');
      const faceBtn = document.getElementById('faceDetectionToggle');
      const filterSelect = document.getElementById('cameraFilter');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }

      if (faceBtn) {
        faceBtn.addEventListener('click', () => this.toggleFaceDetection());
      }

      if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
          this.currentFilter = e.target.value;
        });
      }
    }

    async toggle() {
      if (this.isRunning) {
        this.stop();
      } else {
        await this.start();
      }
      utils.vibrate(30);
    }

    async start() {
      if (this.isRunning) return;

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 },
          audio: false 
        });
        
        if (this.video) {
          this.video.srcObject = this.stream;
          await this.video.play();
        }
        
        this.isRunning = true;
        
        const toggleBtn = document.getElementById('cameraToggle');
        const faceBtn = document.getElementById('faceDetectionToggle');
        const filterSelect = document.getElementById('cameraFilter');
        
        if (toggleBtn) toggleBtn.textContent = 'Stop Camera';
        if (faceBtn) faceBtn.disabled = false;
        if (filterSelect) filterSelect.disabled = false;
        
        this.render();
        
      } catch (err) {
        console.error('Failed to access camera:', err);
        alert('Failed to access camera. Please check permissions.');
      }
    }

    stop() {
      this.isRunning = false;
      
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      const toggleBtn = document.getElementById('cameraToggle');
      const faceBtn = document.getElementById('faceDetectionToggle');
      const filterSelect = document.getElementById('cameraFilter');
      
      if (toggleBtn) toggleBtn.textContent = 'Start Camera';
      if (faceBtn) faceBtn.disabled = true;
      if (filterSelect) filterSelect.disabled = true;
      
      // Clear canvas
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    toggleFaceDetection() {
      this.faceDetectionEnabled = !this.faceDetectionEnabled;
      const faceBtn = document.getElementById('faceDetectionToggle');
      if (faceBtn) {
        faceBtn.textContent = this.faceDetectionEnabled ? 'Disable Face Detection' : 'Enable Face Detection';
      }
      utils.vibrate(25);
    }

    render() {
      if (!this.isRunning || !this.video || !this.ctx) return;

      // Draw video frame to canvas
      this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      
      // Apply filters
      this.applyFilter();
      
      // Simple face detection (placeholder - would use real CV library in production)
      if (this.faceDetectionEnabled) {
        this.detectFaces();
      }
      
      this.animationId = requestAnimationFrame(() => this.render());
    }

    applyFilter() {
      if (this.currentFilter === 'none') return;

      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;

      switch (this.currentFilter) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
          }
          break;
          
        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          }
          break;
          
        case 'blur':
          this.applyBlur(imageData);
          break;
          
        case 'edge':
          this.applyEdgeDetection(imageData);
          break;
      }

      this.ctx.putImageData(imageData, 0, 0);
    }

    applyBlur(imageData) {
      // Simple box blur
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      const blurRadius = 2;
      
      for (let y = blurRadius; y < height - blurRadius; y++) {
        for (let x = blurRadius; x < width - blurRadius; x++) {
          let r = 0, g = 0, b = 0, count = 0;
          
          for (let dy = -blurRadius; dy <= blurRadius; dy++) {
            for (let dx = -blurRadius; dx <= blurRadius; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
          
          const idx = (y * width + x) * 4;
          data[idx] = r / count;
          data[idx + 1] = g / count;
          data[idx + 2] = b / count;
        }
      }
    }

    applyEdgeDetection(imageData) {
      // Sobel edge detection
      const data = imageData.data;
      const width = imageData.width;
      const height = imageData.height;
      const newData = new Uint8ClampedArray(data);
      
      const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
      const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let gx = 0, gy = 0;
          
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
              gx += gray * sobelX[dy + 1][dx + 1];
              gy += gray * sobelY[dy + 1][dx + 1];
            }
          }
          
          const magnitude = Math.sqrt(gx * gx + gy * gy);
          const idx = (y * width + x) * 4;
          newData[idx] = newData[idx + 1] = newData[idx + 2] = Math.min(255, magnitude);
        }
      }
      
      imageData.data.set(newData);
    }

    detectFaces() {
      // Simplified face detection visualization (placeholder)
      // In a real implementation, you'd use libraries like MediaPipe or face-api.js
      
      // Draw mock face detection rectangles at random positions for demo
      const numFaces = Math.random() < 0.7 ? 1 : 0; // 70% chance of detecting a "face"
      
      for (let i = 0; i < numFaces; i++) {
        const x = Math.random() * (this.canvas.width - 200) + 100;
        const y = Math.random() * (this.canvas.height - 200) + 100;
        const w = 120 + Math.random() * 80;
        const h = 150 + Math.random() * 100;
        
        // Draw face rectangle
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, w, h);
        
        // Draw face label
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Face Detected', x, y - 10);
        
        // Draw eye positions
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(x + w * 0.3, y + h * 0.3, 5, 0, Math.PI * 2);
        this.ctx.arc(x + w * 0.7, y + h * 0.3, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    showFallback() {
      const container = document.querySelector('.camera-container');
      if (container) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">Camera access is not supported in this browser.</p>';
      }
    }
  }

  // Machine Learning & AI Demo
  class MachineLearningDemo {
    constructor() {
      this.isRunning = false;
      this.currentDemo = 'pose';
      this.confidence = 0;
      this.container = null;
      this.visualization = null;
      this.animationId = null;
      this.init();
    }

    init() {
      this.setupElements();
      this.setupEventListeners();
      this.createVisualization();
    }

    setupElements() {
      this.container = document.querySelector('.ml-container');
      this.visualization = document.querySelector('.ml-visualization');
    }

    setupEventListeners() {
      const toggleBtn = document.getElementById('mlToggle');
      const poseBtn = document.getElementById('poseDetectionDemo');
      const objectBtn = document.getElementById('objectRecognitionDemo');
      const imageBtn = document.getElementById('imageClassificationDemo');

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }

      if (poseBtn) {
        poseBtn.addEventListener('click', () => this.switchDemo('pose'));
      }

      if (objectBtn) {
        objectBtn.addEventListener('click', () => this.switchDemo('object'));
      }

      if (imageBtn) {
        imageBtn.addEventListener('click', () => this.switchDemo('image'));
      }
    }

    switchDemo(type) {
      this.currentDemo = type;
      this.updateStatus('Ready');
      
      // Update button states
      document.querySelectorAll('.ml-demo-selector .btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      });

      const activeBtn = document.getElementById(`${type}DetectionDemo`) || 
                       document.getElementById(`${type}RecognitionDemo`) ||
                       document.getElementById(`${type}ClassificationDemo`);
      if (activeBtn) {
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
      }

      if (this.isRunning) {
        this.createVisualization();
      }

      utils.vibrate(25);
    }

    toggle() {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
      utils.vibrate(30);
    }

    start() {
      if (this.isRunning) return;
      
      this.isRunning = true;
      const toggleBtn = document.getElementById('mlToggle');
      if (toggleBtn) toggleBtn.textContent = 'Stop ML Demo';
      
      this.updateStatus('Loading', 'loading');
      
      // Simulate model loading time
      setTimeout(() => {
        this.updateStatus('Active', 'active');
        this.createVisualization();
        this.startAnimation();
      }, 2000);
    }

    stop() {
      this.isRunning = false;
      const toggleBtn = document.getElementById('mlToggle');
      if (toggleBtn) toggleBtn.textContent = 'Start ML Demo';
      
      this.updateStatus('Ready');
      
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      
      if (this.visualization) {
        this.visualization.innerHTML = '';
      }
    }

    updateStatus(text, className = '') {
      const statusElement = document.getElementById('mlStatus');
      if (statusElement) {
        statusElement.textContent = text;
        statusElement.className = `status-indicator ${className}`;
      }
    }

    createVisualization() {
      if (!this.visualization) return;

      this.visualization.innerHTML = '';

      switch (this.currentDemo) {
        case 'pose':
          this.createPoseVisualization();
          break;
        case 'object':
          this.createObjectVisualization();
          break;
        case 'image':
          this.createImageVisualization();
          break;
      }
    }

    createPoseVisualization() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 250;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      this.visualization.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      this.poseCanvas = canvas;
      this.poseCtx = ctx;

      // Draw initial pose skeleton
      this.drawPoseSkeleton(ctx, canvas.width / 2, canvas.height / 2);
    }

    createObjectVisualization() {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 250;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      this.visualization.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      this.objectCanvas = canvas;
      this.objectCtx = ctx;

      // Draw object detection boxes
      this.drawObjectDetection(ctx, canvas.width, canvas.height);
    }

    createImageVisualization() {
      const container = document.createElement('div');
      container.style.textAlign = 'center';
      container.style.padding = '2rem';
      
      const title = document.createElement('h5');
      title.textContent = 'Image Classification Results';
      title.style.marginBottom = '1rem';
      title.style.color = 'white';
      
      const results = document.createElement('div');
      results.style.display = 'flex';
      results.style.flexDirection = 'column';
      results.style.gap = '0.5rem';
      
      const predictions = [
        { class: 'Cat', confidence: 0.89 },
        { class: 'Dog', confidence: 0.76 },
        { class: 'Bird', confidence: 0.23 }
      ];
      
      predictions.forEach(pred => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.padding = '0.5rem';
        item.style.background = 'rgba(255, 255, 255, 0.1)';
        item.style.borderRadius = '4px';
        item.style.color = 'white';
        
        item.innerHTML = `
          <span>${pred.class}</span>
          <span>${(pred.confidence * 100).toFixed(1)}%</span>
        `;
        
        results.appendChild(item);
      });
      
      container.appendChild(title);
      container.appendChild(results);
      this.visualization.appendChild(container);
    }

    drawPoseSkeleton(ctx, centerX, centerY) {
      ctx.clearRect(0, 0, this.poseCanvas.width, this.poseCanvas.height);
      
      // Pose keypoints (simplified)
      const keypoints = [
        { x: centerX, y: centerY - 80, name: 'head' },
        { x: centerX, y: centerY - 40, name: 'neck' },
        { x: centerX - 30, y: centerY - 20, name: 'leftShoulder' },
        { x: centerX + 30, y: centerY - 20, name: 'rightShoulder' },
        { x: centerX - 40, y: centerY + 20, name: 'leftElbow' },
        { x: centerX + 40, y: centerY + 20, name: 'rightElbow' },
        { x: centerX, y: centerY + 40, name: 'hip' },
        { x: centerX - 20, y: centerY + 80, name: 'leftKnee' },
        { x: centerX + 20, y: centerY + 80, name: 'rightKnee' },
        { x: centerX - 25, y: centerY + 120, name: 'leftAnkle' },
        { x: centerX + 25, y: centerY + 120, name: 'rightAnkle' }
      ];

      // Draw skeleton connections
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      const connections = [
        [0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [1, 6], [6, 7], [6, 8], [7, 9], [8, 10]
      ];

      connections.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(keypoints[a].x, keypoints[a].y);
        ctx.lineTo(keypoints[b].x, keypoints[b].y);
        ctx.stroke();
      });

      // Draw keypoints
      ctx.fillStyle = '#ff0066';
      keypoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Add confidence label
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('Pose Detected: 94.2%', 10, 25);
    }

    drawObjectDetection(ctx, width, height) {
      ctx.clearRect(0, 0, width, height);
      
      // Draw sample detected objects
      const objects = [
        { x: 50, y: 40, w: 120, h: 80, label: 'Person', conf: 0.92 },
        { x: 200, y: 60, w: 80, h: 60, label: 'Car', conf: 0.86 },
        { x: 300, y: 100, w: 60, h: 40, label: 'Dog', conf: 0.78 }
      ];

      objects.forEach(obj => {
        // Draw bounding box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        
        // Draw label background
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.fillRect(obj.x, obj.y - 25, obj.w, 25);
        
        // Draw label text
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial';
        ctx.fillText(`${obj.label} ${(obj.conf * 100).toFixed(1)}%`, obj.x + 5, obj.y - 8);
      });

      // Add title
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('Object Detection Results', 10, 25);
    }

    startAnimation() {
      if (!this.isRunning) return;

      // Animate confidence values
      this.confidence = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
      const confidenceElement = document.getElementById('confidenceValue');
      if (confidenceElement) {
        confidenceElement.textContent = `${(this.confidence * 100).toFixed(1)}%`;
      }

      // Animate pose if active
      if (this.currentDemo === 'pose' && this.poseCtx) {
        const time = Date.now() * 0.002;
        const centerX = this.poseCanvas.width / 2 + Math.sin(time) * 10;
        const centerY = this.poseCanvas.height / 2 + Math.cos(time * 0.7) * 5;
        this.drawPoseSkeleton(this.poseCtx, centerX, centerY);
      }

      this.animationId = requestAnimationFrame(() => this.startAnimation());
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
    new WebGL3D();
    new AudioVisualizer();
    new PhysicsSimulation();
    new CameraVision();
    new MachineLearningDemo();
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