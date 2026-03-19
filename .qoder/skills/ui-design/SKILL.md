---
name: ui-design
description: Create professional and delightful UI designs for mobile apps with modern aesthetics, color theory, typography, micro-interactions, and gamification elements. Use when designing app interfaces, choosing color palettes, creating layouts, or when the user mentions UI/UX, design systems, or visual design.
---

# UI Design for Professional & Fun Mobile Apps

## Design Philosophy

Balance **professional credibility** with **playful engagement**:
- Clean, trustworthy layouts that convey competence
- Delightful micro-interactions that surprise and engage
- Consistent visual language throughout
- Accessible and inclusive design choices

## Color Systems

### Professional + Playful Palettes

| Palette | Primary | Secondary | Accent | Use Case |
|---------|---------|-----------|--------|----------|
| **Ocean Breeze** | #2563EB (Blue) | #60A5FA (Light Blue) | #F59E0B (Amber) | Finance, Tech |
| **Sunset Vibes** | #7C3AED (Purple) | #EC4899 (Pink) | #FBBF24 (Yellow) | Creative, Social |
| **Forest Fresh** | #059669 (Green) | #34D399 (Mint) | #F97316 (Orange) | Health, Wellness |
| **Coral Energy** | #DC2626 (Red) | #FB7185 (Coral) | #22D3EE (Cyan) | Food, Entertainment |
| **Midnight Lux** | #1E293B (Slate) | #64748B (Gray) | #A855F7 (Purple) | Luxury, Premium |

### Color Psychology Quick Guide

- **Blue**: Trust, professionalism, calmness
- **Green**: Growth, health, success
- **Orange/Yellow**: Energy, enthusiasm, creativity
- **Purple**: Luxury, creativity, wisdom
- **Pink**: Playfulness, warmth, approachability
- **Red**: Urgency, excitement, passion

### Color Usage Rules

```css
/* Primary: 60% - Main backgrounds, key actions */
/* Secondary: 30% - Supporting elements, cards */
/* Accent: 10% - CTAs, highlights, fun elements */

/* Example: Ocean Breeze */
--color-primary: #2563EB;
--color-secondary: #60A5FA;
--color-accent: #F59E0B;
--color-background: #F8FAFC;
--color-text: #1E293B;
--color-text-muted: #64748B;
```

## Typography

### Font Hierarchy (WeChat Mini-App)

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 22px | Bold | Page titles |
| H2 | 18px | Semibold | Section headers |
| H3 | 16px | Medium | Card titles |
| Body | 14px | Regular | Main content |
| Caption | 12px | Regular | Secondary info |
| Small | 10px | Regular | Timestamps, hints |

### Typography Best Practices

- Use system fonts for native feel (PingFang SC on iOS, Roboto on Android)
- Maintain 1.5 line height for body text
- Ensure 4.5:1 contrast ratio for accessibility
- Limit to 2-3 font weights per screen

## Spacing System

### 8-Point Grid System

```
4px   - Tight spacing (icons inline)
8px   - Default small (element padding)
16px  - Default medium (card padding)
24px  - Default large (section gaps)
32px  - Extra large (screen padding)
48px  - Major sections
```

### Layout Principles

- **Touch targets**: Minimum 44x44px (7-9mm)
- **Card padding**: 16px internal, 12px between cards
- **Screen margins**: 16px-24px horizontal
- **Section gaps**: 24px-32px vertical

## Components with Personality

### Buttons

```css
/* Primary Button - Professional with fun hover */
.btn-primary {
  background: linear-gradient(135deg, #2563EB, #3B82F6);
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary:active {
  transform: scale(0.98);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
}

/* Fun Button - With playful elements */
.btn-fun {
  background: linear-gradient(135deg, #7C3AED, #EC4899);
  border-radius: 24px; /* Pill shape */
  position: relative;
  overflow: hidden;
}
.btn-fun::after {
  content: '✨';
  position: absolute;
  right: 12px;
  animation: sparkle 2s infinite;
}
```

### Cards

```css
/* Glassmorphism Card */
.card-glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Playful Card with gradient border */
.card-playful {
  background: white;
  border-radius: 20px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.card-playful::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 22px;
  background: linear-gradient(135deg, #7C3AED, #EC4899, #FBBF24);
  z-index: -1;
}
```

### Input Fields

```css
/* Modern Input */
.input-modern {
  background: #F1F5F9;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 14px 16px;
  transition: all 0.3s;
}
.input-modern:focus {
  background: white;
  border-color: #2563EB;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}
```

## Micro-interactions & Delight

### Animation Principles

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| Button press | 150ms | ease-out | Touch feedback |
| Page transition | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Navigation |
| Loading spinner | 800ms | linear | Loading states |
| Success check | 400ms | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Completion |
| Card hover | 200ms | ease | Hover states |

### Fun Micro-interactions

```css
/* Success Animation */
@keyframes successPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.success-icon {
  animation: successPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Floating Elements */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.floating {
  animation: float 3s ease-in-out infinite;
}

/* Pulse for attention */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}
.pulse-attention {
  animation: pulse 2s ease-in-out infinite;
}
```

### Gamification Elements

- **Progress bars**: Gradient fills with celebratory animations at milestones
- **Badges**: Circular with subtle rotation on unlock
- **Streak counters**: Flame animations for consecutive days
- **Level indicators**: Star or gem icons with sparkle effects
- **Confetti**: Trigger on achievement completion

## Layout Patterns

### Home Screen

```
┌─────────────────────────────┐
│  [Header with gradient]     │
│  Welcome back! 👋           │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   Hero Card/Stats     │  │
│  │   [Gradient bg]       │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  Quick Actions              │
│  [🔍] [➕] [⭐] [⚙️]       │
├─────────────────────────────┤
│  Recent Activity            │
│  ┌────┐ ┌────┐ ┌────┐      │
│  │Card│ │Card│ │Card│      │
│  └────┘ └────┘ └────┘      │
└─────────────────────────────┘
```

### List View

```
┌─────────────────────────────┐
│  ← Title                    │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ 🎯 │ Item Title    >  │  │
│  │    │ Description      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ 🎨 │ Item Title    >  │  │
│  │    │ Description      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

## WeChat Mini-App Specific

### Design Guidelines

- Follow WeChat's native component styles for familiarity
- Use `rpx` units for responsive design (750rpx = full width)
- Keep navigation simple and shallow (max 3 levels)
- Use local loading indicators over modal dialogs
- Ensure click areas are 88rpx minimum (7-9mm)

### Recommended Color for WeChat

```css
/* WeChat Brand Colors */
--wechat-green: #07C160;
--wechat-orange: #FA9D3B;
--wechat-red: #FA5151;
--wechat-blue: #10AEFF;
--wechat-purple: #6467EF;
```

## Accessibility

- Maintain WCAG 2.1 AA standards
- Minimum contrast ratio: 4.5:1 for text
- Don't rely solely on color to convey information
- Provide alternative text for images
- Support screen readers with proper ARIA labels
- Test with larger font sizes (up to 200%)

## Design Checklist

Before finalizing design:
- [ ] Color palette has professional base + playful accent
- [ ] Typography hierarchy is clear
- [ ] Touch targets are minimum 44px
- [ ] Micro-interactions add delight without distraction
- [ ] Loading states are considered
- [ ] Empty states are helpful and on-brand
- [ ] Error states are clear and actionable
- [ ] Design works in both light and dark modes
