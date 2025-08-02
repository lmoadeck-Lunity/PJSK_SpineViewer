# Spine Web Player Component

A React TypeScript component for embedding Spine animations using the official `@esotericsoftware/spine-player` library.

## Features

- ✅ **Full TypeScript Support**: Comprehensive prop types based on official spine-player documentation
- ✅ **Complete Configuration**: All spine-player options supported (viewport, debug, controls, etc.)
- ✅ **Error Handling**: Built-in error handling with retry functionality
- ✅ **Loading States**: Loading indicators with progress feedback
- ✅ **Memory Management**: Automatic cleanup and proper disposal
- ✅ **Format Support**: Both JSON (.json) and binary (.skel) skeleton formats
- ✅ **Advanced Features**: Viewport configuration, debug visualizations, custom controls

## Setup

### 1. Install Dependencies

```bash
npm install @esotericsoftware/spine-player@4.1.24
```

### 2. Include Spine Player Assets

Add the spine-player JavaScript and CSS files to your HTML file:

```html
<script src="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/iife/spine-player.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/spine-player.css">
```

Or for minified versions:

```html
<script src="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/iife/spine-player.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/spine-player.min.css">
```

### 3. Use the Component

```tsx
import SpineWebPlayer from './SpineWebPlayerClean';

function App() {
  return (
    <SpineWebPlayer
      skeleton="/path/to/skeleton.json"
      atlas="/path/to/atlas.atlas"
      animation="idle"
      width={800}
      height={600}
      showControls={true}
      onSuccess={(player) => console.log('Animation loaded!', player)}
      onError={(player, reason) => console.error('Error:', reason)}
    />
  );
}
```

## Props

### Basic Configuration
- `skeleton?: string` - URL to skeleton JSON (.json) or binary (.skel) file
- `atlas?: string` - URL to atlas (.atlas) file
- `animation?: string` - Default animation to play
- `animations?: string[]` - Limit available animations
- `skin?: string` - Default skin to use
- `skins?: string[]` - Limit available skins
- `scale?: number` - Scale factor (default: 1)

### Visual Configuration
- `width?: number` - Player width in pixels (default: 800)
- `height?: number` - Player height in pixels (default: 600)
- `backgroundColor?: string` - Background color as hex (#rrggbbaa) (default: '#2a2a2a')
- `fullscreenBackgroundColor?: string` - Background color in fullscreen mode
- `alpha?: boolean` - Enable transparency (default: true)
- `premultipliedAlpha?: boolean` - Use premultiplied alpha (default: true)

### Control Configuration
- `showControls?: boolean` - Show player controls (default: true)
- `interactive?: boolean` - Enable interactions (default: true)
- `controlBones?: string[]` - Bones that can be dragged
- `defaultMix?: number` - Animation mix time in seconds (default: 0.25)

### Debug Configuration
- `debug?: object` - Debug visualization options:
  ```tsx
  debug={{
    bones: true,
    regions: true,
    meshes: true,
    bounds: true,
    paths: true,
    clipping: true,
    points: true,
    hulls: true
  }}
  ```

### Advanced Configuration
- `viewport?: object` - Custom viewport configuration
- `backgroundImage?: object` - Background image settings
- `rawDataURIs?: Record<string, string>` - Embed data as data URIs

### Event Callbacks
- `onSuccess?: (player) => void` - Called when player loads successfully
- `onError?: (player, reason) => void` - Called when an error occurs
- `onLoad?: () => void` - Called when loading completes

### Styling
- `className?: string` - CSS class name
- `style?: React.CSSProperties` - Inline styles
- `showErrorDetails?: boolean` - Show detailed error messages (default: true)
- `retryable?: boolean` - Show retry button on errors (default: true)

## Examples

### Basic Player
```tsx
<SpineWebPlayer
  skeleton="/Files/skeleton/sekai_skeleton.skel"
  atlas="/Files/out/sd_11akito_unit/sekai_atlas/sekai_atlas.atlas"
  animation="pose_default"
  width={800}
  height={600}
/>
```

### Player with Custom Viewport
```tsx
<SpineWebPlayer
  skeleton="/path/to/skeleton.json"
  atlas="/path/to/atlas.atlas"
  width={600}
  height={400}
  viewport={{
    padLeft: "15%",
    padRight: "15%",
    padTop: "10%",
    padBottom: "10%",
    debugRender: true,
    transitionTime: 0.5
  }}
/>
```

### Minimal Player (No Controls)
```tsx
<SpineWebPlayer
  skeleton="/path/to/skeleton.json"
  atlas="/path/to/atlas.atlas"
  width={300}
  height={300}
  showControls={false}
  interactive={false}
  backgroundColor="#1a1a1a"
/>
```

### Player with Debug Visualizations
```tsx
<SpineWebPlayer
  skeleton="/path/to/skeleton.json"
  atlas="/path/to/atlas.atlas"
  debug={{
    bones: true,
    regions: true,
    meshes: true,
    bounds: true
  }}
/>
```

### Player with Error Handling
```tsx
<SpineWebPlayer
  skeleton="/path/to/skeleton.json"
  atlas="/path/to/atlas.atlas"
  onSuccess={(player) => {
    console.log('Player ready:', player);
    // Access skeleton and animation state
    console.log('Bones:', player.skeleton.bones.length);
    console.log('Animations:', player.skeleton.data.animations.map(a => a.name));
  }}
  onError={(player, reason) => {
    console.error('Failed to load animation:', reason);
    // Handle error (e.g., show fallback content)
  }}
  retryable={true}
  showErrorDetails={true}
/>
```

## Advanced Usage

### Programmatic Control
```tsx
const [playerInstance, setPlayerInstance] = useState(null);

<SpineWebPlayer
  skeleton="/path/to/skeleton.json"
  atlas="/path/to/atlas.atlas"
  showControls={false}
  onSuccess={(player) => {
    setPlayerInstance(player);
    
    // Set specific animation
    player.setAnimation('walk', true);
    
    // Access skeleton directly
    player.skeleton.setAttachment('weapon', 'sword');
    
    // Use animation state for advanced control
    player.animationState.setAnimation(0, 'jump');
    player.animationState.addAnimation(0, 'walk', true, 0);
  }}
/>
```

### Multiple Players
```tsx
const models = [
  { skeleton: '/model1.json', atlas: '/model1.atlas' },
  { skeleton: '/model2.json', atlas: '/model2.atlas' },
];

return (
  <div style={{ display: 'flex', gap: '20px' }}>
    {models.map((model, index) => (
      <SpineWebPlayer
        key={index}
        skeleton={model.skeleton}
        atlas={model.atlas}
        width={300}
        height={300}
        showControls={false}
      />
    ))}
  </div>
);
```

## Browser Compatibility

The Spine Web Player uses WebGL for rendering and is supported by:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ Internet Explorer (not supported)

## Troubleshooting

### Common Issues

1. **"Spine Player library not loaded"**
   - Make sure spine-player.js is included before your React app loads
   - Check browser console for script loading errors

2. **CORS Errors**
   - Ensure your server has CORS enabled for spine assets
   - Use relative URLs when possible
   - Consider using `rawDataURIs` for embedded data

3. **Animation Not Found**
   - Check that the animation name matches exactly (case-sensitive)
   - Use the `onSuccess` callback to log available animations

4. **Player Not Visible**
   - Ensure container has explicit width/height
   - Check CSS z-index conflicts
   - Verify the skeleton and atlas URLs are correct

### Debug Tips

- Enable debug visualizations to see bones, regions, and bounds
- Use browser developer tools to check network requests
- Check the browser console for spine-player specific errors
- Use the `onError` callback to handle and log errors

## Files

- `SpineWebPlayerClean.tsx` - Main component implementation
- `SpineWebPlayerExample.tsx` - Usage examples and demos
- `README.md` - This documentation

## License

Based on the Spine Runtimes License Agreement. See the Spine Editor License for more details.
