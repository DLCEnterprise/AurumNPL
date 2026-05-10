import type { Variants } from 'framer-motion'

// Backdrop: fade in/out
export const backdropVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

// Modal panel: spring scale-up from slightly below center
export const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 },
  },
  exit: {
    opacity: 0, scale: 0.97, y: 10,
    transition: { duration: 0.14, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
  },
}

// List container: staggers children
export const staggerContainerVariants: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
}

// Individual staggered item
export const staggerItemVariants: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 360, damping: 28 },
  },
}

// Success pop: used for confirmed-bid card etc.
export const successPopVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 26 },
  },
}

// Toast: slide in from right, slide out to right
export const toastVariants: Variants = {
  hidden:  { opacity: 0, y: 16, scale: 0.94, x: 16 },
  visible: {
    opacity: 1, y: 0, scale: 1, x: 0,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0, x: 40, scale: 0.96,
    transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] as [number, number, number, number] },
  },
}

// Page transition
export const pageVariants: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
  exit: { opacity: 0, transition: { duration: 0.1 } },
}
