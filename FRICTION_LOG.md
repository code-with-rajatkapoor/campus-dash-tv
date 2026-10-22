# Amazon Fire OS Developer Friction Log — CampusDash TV

### Task Attempted: 
Building a 1080p full-screen student productivity dashboard with D-Pad spatial navigation on Fire OS web framework.

### Steps Taken:
1. Configured 1920x1080 CSS Grid viewport with glassmorphic cards.
2. Built a vanilla JS spatial navigation matrix listening for `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, and `Enter`.
3. Integrated simulated Alexa Voice Commands and local JSON REST API persistence via Node.js Express.

### What Worked Well:
- High performance rendering on 1080p Fire OS web viewports.
- Web Audio API synthesized sound FX provided zero-latency audio feedback for remote arrow key presses.

### What Needed Work / Friction Points:
- **Default Browser Scrolling:** Pressing Arrow keys initially caused the browser window to scroll vertically.
  - *Workaround Used:* Added `e.preventDefault()` inside keydown listeners for spatial arrow keys.
- **Form Input Popups:** Native browser `prompt()` dialogs can fail to capture remote focus seamlessly on TV screens.
  - *Workaround Used:* Created custom glassmorphic HTML/CSS overlay modals with automated auto-focus.

### Actionable Suggestion for Amazon Team:
Expose a native Fire OS TV Remote Key-Mapper API for web apps to streamline spatial navigation focus states without needing manual DOM event matrix mapping.