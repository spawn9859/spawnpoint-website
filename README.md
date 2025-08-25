# Spawnpoint Website

A mobile-first interactive playground with device parallax, canvas animations, and touch-friendly components. Built to deploy seamlessly on Cloudflare Pages with strong security headers and accessibility features.

## Features

### 🎯 Mobile-First Design
- Responsive layout that works on any screen size
- Collapsible hamburger navigation for mobile devices
- Large tap targets (44px minimum) for touch interfaces
- Optimized typography and spacing for mobile reading

### 🎮 Interactive Experiments
- **Device Tilt Parallax**: Hero section responds to device orientation (with permission handling for iOS 13+)
- **Canvas Particle Animation**: Smooth particle system that respects `prefers-reduced-motion` and adapts to theme
- **Touch Carousel**: Swipeable image/content carousel with keyboard navigation support
- **Haptic Feedback**: Vibration API integration for supported devices
- **Theme Toggle**: Dark/light mode with localStorage persistence

### ♿ Accessibility
- Proper ARIA labels and roles for interactive elements
- Visible focus states with high contrast support
- Keyboard navigation for all interactive components
- Reduced motion support with graceful fallbacks
- Screen reader friendly with semantic HTML structure

### ⚡ Performance & Security
- Zero build tools required - pure HTML/CSS/JS
- Strict Content Security Policy headers
- Permissions Policy for device sensors
- HSTS and security headers via Cloudflare Pages
- Optimized asset caching strategies

## Local Development

No build step required! You can open `public/index.html` directly in a browser, or run a local server:

**Python 3:**
```bash
cd public && python -m http.server 8080
```

**Node.js:**
```bash
npx serve public
```

Then open http://localhost:8080

### Testing Features

For the best experience, test on mobile devices or simulators:
- **Device Parallax**: Enable on iOS Safari or Android Chrome
- **Touch Carousel**: Swipe gestures work on touch devices
- **Haptic Feedback**: Supported on mobile devices
- **Theme Persistence**: Toggle between light/dark themes

## Deploying to Cloudflare Pages

1. Create a GitHub repository
2. Push this project to your repo
3. In Cloudflare Dashboard:
   - Pages → Create a project → Connect to Git
   - Select your repository
   - Framework preset: **None**
   - Build command: **(leave blank)**
   - Output directory: **`public`**
4. Deploy! Every push triggers automatic deployment.

### Security Headers

The site includes comprehensive security headers via `public/_headers`:
- Content Security Policy (CSP) with strict self-only policies
- Permissions Policy allowing device sensors for same-origin only
- HSTS with preload directive
- X-Frame-Options, X-Content-Type-Options, and more

## Browser Support

- **Modern browsers**: Full feature support including device orientation
- **Older browsers**: Graceful degradation with core functionality
- **iOS 13+**: Device orientation requires user permission
- **Touch devices**: Optimized swipe and haptic feedback

## Project Structure

```
.
├─ public/                 # Cloudflare Pages output directory
│  ├─ index.html          # Main page with mobile-first layout
│  ├─ 404.html            # Error page
│  ├─ styles.css          # Responsive CSS with theme support
│  ├─ script.js           # Interactive features and accessibility
│  ├─ _headers            # Security + performance headers
│  └─ _redirects          # URL redirect rules
├─ .editorconfig          # Code formatting rules
├─ .gitattributes         # Git file handling
├─ .gitignore             # Git ignore patterns
└─ README.md              # This file
```

## Local development

No build step is required. You can open `public/index.html` directly in a browser, or run a simple local server to test routing/404:

- Python 3: `cd public && python -m http.server 8080`
- Node (if you have it): `npx serve public`

Then open http://localhost:8080

## Deploying to Cloudflare Pages

1) Create a GitHub repo named `spawnpoint-website` (or your preferred name).
2) Push this project to the repo.
3) In Cloudflare Dashboard:
   - Pages > Create a project > Connect to Git
   - Select your `spawnpoint-website` repo
   - Framework preset: None
   - Build command: (leave blank)
   - Output directory: `public`
4) Click Deploy. Every push to your default branch will trigger a new deployment.

## Custom Domain (Optional)

In your Pages project settings:
- **Custom domains** → Set up a custom domain
- If your DNS is on Cloudflare, Pages configures records automatically

## Development Tips

- **Edit files** in `public/` and push to see live changes
- **Add assets** under `public/assets/` and reference in HTML/CSS
- **Modify headers** in `_headers` for caching or security policies
- **Add redirects** in `_redirects` as your URL structure evolves
- **Test mobile features** on actual devices or browser simulators
- **Check accessibility** with screen readers and keyboard navigation

## Troubleshooting

**Device orientation not working?**
- Ensure you're testing on a mobile device or simulator
- On iOS, the user must grant permission when prompted
- Check browser console for permission errors

**Particles not animating?**
- Check if `prefers-reduced-motion` is enabled in system settings
- Animation auto-disables for accessibility compliance

**Carousel not swiping?**
- Ensure you're testing on a touch-enabled device
- Keyboard navigation (arrow keys) works on all devices

**Theme not persisting?**
- Check if localStorage is enabled in browser settings
- Falls back to system preference if storage unavailable