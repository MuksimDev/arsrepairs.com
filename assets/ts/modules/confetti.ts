/**
 * Confetti Animation
 * Creates confetti particles that rain down from the top of the screen
 * Particles fade out within 2 seconds (half-life)
 */

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  originX?: number;
  originY?: number;
}

const DEFAULT_OPTIONS: Required<ConfettiOptions> = {
  particleCount: 100,
  spread: 360,
  originX: 0.5, // 0-1, where 0.5 is center (not used for rain effect)
  originY: 0.5, // 0-1, where 0.5 is center (not used for rain effect)
};

export function createConfetti(options: ConfettiOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Create container if it doesn't exist
  let container = document.querySelector<HTMLElement>('.confetti-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
  }
  
  // Clear any existing particles
  container.innerHTML = '';
  
  // Create particles
  for (let i = 0; i < opts.particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Random X position across the top of the screen
    const startX = Math.random() * viewportWidth;
    
    // Start slightly above the screen for better effect
    const startY = -20 - Math.random() * 20;
    
    // Fall straight down with slight horizontal drift
    const horizontalDrift = (Math.random() - 0.5) * 100; // -50 to 50px drift
    const fallDistance = viewportHeight + 40; // Fall past the bottom
    
    // Random rotation
    const rotation = (Math.random() * 720 - 360); // -360 to 360 degrees
    
    // Random delay (0 to 0.5s) for staggered rain effect
    const delay = Math.random() * 0.5;
    
    // Set initial position at top of screen
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    
    // Set CSS custom properties for animation
    particle.style.setProperty('--confetti-x', `${horizontalDrift}px`);
    particle.style.setProperty('--confetti-y', `${fallDistance}px`);
    particle.style.setProperty('--confetti-rotate', `${rotation}deg`);
    particle.style.setProperty('--confetti-delay', `${delay}s`);
    
    container.appendChild(particle);
  }
  
  // Clean up container after animation completes (2s + max delay)
  setTimeout(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 2500); // 2s animation + 0.5s max delay
}

