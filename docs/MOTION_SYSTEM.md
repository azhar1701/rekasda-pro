# Motion System - Invisible Influence

## Philosophy
Animasi yang memandu mata pengguna dan memberikan feedback yang jelas, namun terasa sangat alami sehingga pengguna hampir tidak menyadarinya.

## Motion Tokens

### Duration
- `--motion-fast` (150ms): Micro interactions (hover, toggle)
- `--motion-medium` (300ms): Element enter/exit (cards, alerts)
- `--motion-slow` (500ms): Page transitions

### Easing Functions
- `--easing-smooth`: cubic-bezier(0.4, 0.0, 0.2, 1) - General purpose
- `--easing-enter`: cubic-bezier(0.0, 0.0, 0.2, 1) - Elements entering
- `--easing-exit`: cubic-bezier(0.4, 0.0, 1, 1) - Elements exiting
- `--easing-spring`: cubic-bezier(0.34, 1.56, 0.64, 1) - Playful bounce

## Usage Examples

### 1. Staggered List Animation
```tsx
import { useStaggerAnimation } from '@/hooks/useStaggerAnimation';

const MyComponent = () => {
  const listRef = useStaggerAnimation(50); // 50ms delay between items
  
  return (
    <div ref={listRef} className="grid grid-cols-3 gap-4">
      <Card />
      <Card />
      <Card />
    </div>
  );
};
```

### 2. Button with Hover Effect
```tsx
<button className="transition-all duration-fast hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]">
  Click Me
</button>
```

### 3. Input with Focus Transition
```tsx
<input className="transition-all duration-fast focus:border-primary-500 focus:ring-2" />
```

### 4. Page Enter Animation
```tsx
<div className="page-enter">
  {/* Page content */}
</div>
```

### 5. Modal Animation
```tsx
<div className="modal-enter">
  {/* Modal content */}
</div>
<div className="backdrop-enter">
  {/* Backdrop */}
</div>
```

## Performance Guidelines

### ✅ DO Animate
- `opacity`
- `transform` (translate, scale, rotate)

### ❌ DON'T Animate
- `height`, `width`
- `margin`, `padding`
- `top`, `left`, `right`, `bottom`

## Accessibility
Motion respects `prefers-reduced-motion` - all animations are reduced to 0.01ms for users who prefer reduced motion.

## Tailwind Classes

### Duration
- `duration-fast` (150ms)
- `duration-medium` (300ms)
- `duration-slow` (500ms)

### Easing
- `ease-smooth`
- `ease-enter`
- `ease-exit`
- `ease-spring`

### Animations
- `animate-fade-in`
- `animate-slide-up`
- `animate-stagger`
