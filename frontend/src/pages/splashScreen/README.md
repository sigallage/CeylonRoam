# Splash Screen

A modern, animated splash screen for CeylonRoam that displays for 10 seconds when the app loads.

## Features

- **Dark theme**: Modern gradient background (slate/navy colors)
- **Animated elements**:
  - Pulsing concentric circles
  - Floating and rotating airplane icon in the center
  - Gradient shimmer effect on the title text
  - Smooth loading bar animation
- **Duration**: 10 seconds
- **Responsive**: Adapts to mobile and desktop screens
- **Built with Tailwind CSS**: Uses only Tailwind utility classes

## Structure

- `SplashScreen.jsx` - Main component with Tailwind classes and animation logic
- Custom animations defined in `tailwind.config.cjs`

## How It Works

1. The splash screen is rendered first when the app loads (controlled in `App.jsx`)
2. A timer automatically transitions to the main app after 10 seconds
3. The component accepts an `onFinish` callback prop to handle the transition

## Customization

### Change Duration
Edit the timeout in `SplashScreen.jsx`:
```javascript
setTimeout(() => {
  onFinish();
}, 10000); // Change this value (in milliseconds)
```

Also update the loading bar animation duration to match:
```jsx
<div className="... animate-[loading_10s_ease-in-out_forwards]">
```

### Change Colors
Modify Tailwind color classes:
- Background: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- Circles: `border-blue-400/30`
- Icon: `text-blue-400`
- Title gradient: `from-blue-400 via-purple-400 to-blue-400`

### Change Animation Speed
Modify animation durations in the class names:
- Icon float: `animate-[float_3s_ease-in-out_infinite]`
- Icon spin: `animate-[spin_10s_linear_infinite]`
- Loading bar: `animate-[loading_10s_ease-in-out_forwards]`

Custom animations are defined in `tailwind.config.cjs`.
