<!--
  Decorative app-wide background layer.
  Marked aria-hidden because all meaningful page content is rendered above it
  by route views and layout components.
-->
<template>
  <div class="ambient-background" aria-hidden="true">
    <div class="ambient-grid" />
    <div class="ambient-orb ambient-orb-amber" />
    <div class="ambient-orb ambient-orb-gold" />
    <div class="ambient-orb ambient-orb-smoke" />
    <div class="ambient-noise" />
    <div class="ambient-vignette" />
  </div>
</template>

<style scoped>
.ambient-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.025), transparent 30%),
    linear-gradient(180deg, rgba(5, 5, 5, 0.92), rgba(3, 3, 3, 0.98));
}

.ambient-grid,
.ambient-noise,
.ambient-vignette,
.ambient-orb {
  position: absolute;
  inset: 0;
}

.ambient-grid {
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: radial-gradient(circle at center, black, transparent 88%);
}

.ambient-noise {
  opacity: 0.06;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.08) 0, transparent 22%),
    radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.05) 0, transparent 18%),
    radial-gradient(circle at 50% 80%, rgba(255, 255, 255, 0.05) 0, transparent 20%);
  mix-blend-mode: screen;
}

.ambient-vignette {
  background:
    radial-gradient(circle at center, transparent 36%, rgba(0, 0, 0, 0.34) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0.55) 100%);
}

.ambient-orb {
  filter: blur(80px);
  border-radius: 999px;
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
}

.ambient-orb-amber {
  top: -12%;
  left: -8%;
  width: 34rem;
  height: 34rem;
  background: radial-gradient(circle, rgba(245, 180, 79, 0.32) 0%, rgba(245, 180, 79, 0.08) 42%, transparent 72%);
  animation: drift-amber 18s ease-in-out infinite alternate;
}

.ambient-orb-gold {
  top: 20%;
  right: -10%;
  width: 28rem;
  height: 28rem;
  background: radial-gradient(circle, rgba(255, 220, 170, 0.16) 0%, rgba(255, 204, 128, 0.08) 38%, transparent 74%);
  animation: drift-gold 24s ease-in-out infinite alternate;
}

.ambient-orb-smoke {
  bottom: -18%;
  left: 18%;
  width: 40rem;
  height: 40rem;
  background: radial-gradient(circle, rgba(116, 129, 161, 0.18) 0%, rgba(116, 129, 161, 0.04) 40%, transparent 75%);
  animation: drift-smoke 28s ease-in-out infinite alternate;
}

@keyframes drift-amber {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.7;
  }

  100% {
    transform: translate3d(7%, 12%, 0) scale(1.18);
    opacity: 0.96;
  }
}

@keyframes drift-gold {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.4;
  }

  100% {
    transform: translate3d(-8%, -4%, 0) scale(1.22);
    opacity: 0.72;
  }
}

@keyframes drift-smoke {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 0.48;
  }

  100% {
    transform: translate3d(-10%, -8%, 0) scale(1.12);
    opacity: 0.72;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ambient-orb {
    animation: none;
  }
}

@media (max-width: 768px) {
  .ambient-grid {
    background-size: 96px 96px;
    opacity: 0.12;
  }

  .ambient-orb-amber {
    width: 24rem;
    height: 24rem;
  }

  .ambient-orb-gold {
    width: 20rem;
    height: 20rem;
  }

  .ambient-orb-smoke {
    width: 28rem;
    height: 28rem;
    left: -10%;
  }
}
</style>
