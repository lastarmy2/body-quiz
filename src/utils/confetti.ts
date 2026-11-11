// Lightweight pure Canvas Confetti animation for celebrations

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  const particles: Particle[] = [];
  const particleCount = 120;

  for (let i = 0; i < particleCount; i++) {
    // Launch from both bottom corners towards center
    const fromLeft = Math.random() < 0.5;
    const startX = fromLeft ? width * 0.15 : width * 0.85;
    const startY = height * 0.85;

    const angle = fromLeft
      ? -Math.PI / 3 + (Math.random() - 0.5) * 0.6
      : -Math.PI * (2 / 3) + (Math.random() - 0.5) * 0.6;
    const speed = 14 + Math.random() * 12;

    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 8 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1
    });
  }

  let animationFrameId: number;
  const gravity = 0.35;
  const drag = 0.985;
  const startTime = Date.now();
  const maxDuration = 3500; // ms

  function render() {
    if (!ctx) return;
    const elapsed = Date.now() - startTime;
    if (elapsed > maxDuration) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;
    particles.forEach((p) => {
      p.vx *= drag;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // fade out in the last 1 second
      if (elapsed > maxDuration - 1000) {
        p.opacity = Math.max(0, (maxDuration - elapsed) / 1000);
      }

      if (p.opacity > 0 && p.y < height + 50) {
        activeCount++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    canvas.remove();
  };
}
