import React, { useState } from 'react';
import SpineWebPlayer from './SpineWebPlayerClean';

/**
 * Example usage of SpineWebPlayer component
 * This demonstrates various configuration options available
 */
const SpineWebPlayerExample: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('spineboy');
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  // Example model configurations
  const models = {
    spineboy: {
      skeleton: 'https://esotericsoftware.com/files/examples/4.1/spineboy/export/spineboy-pro.json',
      atlas: 'https://esotericsoftware.com/files/examples/4.1/spineboy/export/spineboy-pma.atlas',
      animations: ['idle', 'walk', 'run', 'jump'],
      defaultAnimation: 'idle'
    },
    // Local V1 model example
    localV1: {
      skeleton: '/Files/skeleton/sekai_skeleton.skel',
      atlas: '/Files/out/sd_11akito_unit/sekai_atlas/sekai_atlas.atlas',
      animations: ['pose_default', 'idle', 'walk'],
      defaultAnimation: 'pose_default'
    },
    // Local V2 model example  
    localV2: {
      skeleton: '/Files/skeleton/v2_sd_main.json',
      atlas: '/Files/out/v2_sd_07airi_unit/sekai_atlas/sekai_atlas.atlas.txt',
      animations: ['v2_pose_default', 'v2_w_adult_idle01_f', 'v2_w_adult_walk01_f'],
      defaultAnimation: 'v2_pose_default'
    }
  };

  const currentModel = models[selectedModel as keyof typeof models];

  const handleSuccess = (player: any) => {
    console.log('Player loaded successfully:', player);
    console.log('Available animations:', player.skeleton?.data?.animations?.map((a: any) => a.name) || []);
  };

  const handleError = (player: any, reason: string) => {
    console.error('Player error:', reason);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Spine Web Player Examples</h1>
      
      {/* Model Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Model Selection</h3>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option value="spineboy">Spineboy (Remote)</option>
          <option value="localV1">Local V1 Model</option>
          <option value="localV2">Local V2 Model</option>
        </select>
        
        <select 
          value={selectedAnimation} 
          onChange={(e) => setSelectedAnimation(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        >
          <option value="">Default Animation</option>
          {currentModel.animations.map(anim => (
            <option key={anim} value={anim}>{anim}</option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Player Options</h3>
        <label style={{ marginRight: '20px' }}>
          <input 
            type="checkbox" 
            checked={showControls} 
            onChange={(e) => setShowControls(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Show Controls
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={showDebug} 
            onChange={(e) => setShowDebug(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          Show Debug Visualizations
        </label>
      </div>

      {/* Basic Player */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Basic Player</h3>
        <SpineWebPlayer
          skeleton={currentModel.skeleton}
          atlas={currentModel.atlas}
          animation={selectedAnimation || currentModel.defaultAnimation}
          width={800}
          height={600}
          showControls={showControls}
          backgroundColor="#1a1a1a"
          onSuccess={handleSuccess}
          onError={handleError}
          debug={showDebug ? {
            bones: true,
            regions: true,
            meshes: true,
            bounds: true
          } : undefined}
        />
      </div>

      {/* Advanced Player with Custom Viewport */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Advanced Player with Custom Viewport</h3>
        <SpineWebPlayer
          skeleton={currentModel.skeleton}
          atlas={currentModel.atlas}
          animation={selectedAnimation || currentModel.defaultAnimation}
          width={600}
          height={400}
          showControls={showControls}
          backgroundColor="#2a4a6b"
          scale={0.8}
          viewport={{
            padLeft: "15%",
            padRight: "15%",
            padTop: "10%",
            padBottom: "10%",
            debugRender: showDebug,
            transitionTime: 0.5
          }}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Minimal Player (No Controls) */}
      <div style={{ marginBottom: '40px' }}>
        <h3>Minimal Player (No Controls)</h3>
        <div style={{ display: 'flex', gap: '20px' }}>
          <SpineWebPlayer
            skeleton={currentModel.skeleton}
            atlas={currentModel.atlas}
            animation={selectedAnimation || currentModel.defaultAnimation}
            width={300}
            height={300}
            showControls={false}
            interactive={false}
            backgroundColor="#4a2a6b"
            scale={0.6}
            onSuccess={handleSuccess}
            onError={handleError}
          />
          <SpineWebPlayer
            skeleton={currentModel.skeleton}
            atlas={currentModel.atlas}
            animation={selectedAnimation || currentModel.defaultAnimation}
            width={300}
            height={300}
            showControls={false}
            interactive={false}
            backgroundColor="#2a6b4a"
            scale={0.6}
            premultipliedAlpha={false}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      </div>

      {/* Documentation */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>SpineWebPlayer Component</h3>
        <p>A React component for embedding Spine animations using the official spine-player library.</p>
        
        <h4>Key Features:</h4>
        <ul>
          <li>✅ Full TypeScript support with comprehensive prop types</li>
          <li>✅ All spine-player configuration options supported</li>
          <li>✅ Error handling with retry functionality</li>
          <li>✅ Loading states with progress indication</li>
          <li>✅ Automatic cleanup and memory management</li>
          <li>✅ Support for both JSON and binary skeleton formats</li>
          <li>✅ Advanced viewport and debug configurations</li>
        </ul>

        <h4>Required Setup:</h4>
        <p>Make sure to include the spine-player JavaScript and CSS files in your HTML:</p>
        <pre style={{ backgroundColor: '#e0e0e0', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
{`<script src="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/iife/spine-player.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@esotericsoftware/spine-player@4.1.*/dist/spine-player.css">`}
        </pre>

        <h4>Basic Usage:</h4>
        <pre style={{ backgroundColor: '#e0e0e0', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
{`<SpineWebPlayer
  skeleton="/path/to/skeleton.json"
  atlas="/path/to/atlas.atlas"
  animation="idle"
  width={800}
  height={600}
  showControls={true}
  onSuccess={(player) => console.log('Loaded!', player)}
  onError={(player, reason) => console.error('Error:', reason)}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default SpineWebPlayerExample;
