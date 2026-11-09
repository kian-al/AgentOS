// All animation variants for AgentOS
// Purposeful, fast, developer-tool aesthetic

export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const

export const EASING = {
  default: [0.25, 0.1, 0.25, 1], // cubic-bezier ease
  enter: [0, 0, 0.2, 1], // ease-out (elements entering)
  exit: [0.4, 0, 1, 1], // ease-in (elements leaving)
  spring: { type: "spring" as const, stiffness: 400, damping: 30 },
} as const

// Reusable variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.normal } },
}

export const slideUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.enter,
    },
  },
}

export const slideInRight = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.enter,
    },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASING.enter,
    },
  },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const staggerItem = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.fast },
  },
}

// Number counter animation (for KPI cards)
export const numberSpring = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
}

