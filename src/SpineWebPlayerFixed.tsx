import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

// @ts-expect-error - gif.js doesn't have proper TypeScript definitions
// import GIF from 'gif.js';
import CCapture from 'ccapture.js-npmfixed';
const vsSource = `#version 300 es
  in vec4 aVertexPosition;
  in vec3 aVertexColor;

  out lowp vec3 vColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
`;

// Fragment Shader: Colors each pixel of the triangle.
const fsSource = `#version 300 es
  in lowp vec3 vColor;
  out lowp vec4 fragColor;

  void main(void) {
    fragColor = vec4(vColor, 1.0);
  }
`;
// Type definitions for spine-player
interface SpinePlayerConfig {
  skeleton?: string;
  atlas?: string;
  jsonUrl?: string;
  binaryUrl?: string;
  atlasUrl?: string;
  animation?: string;
  animations?: string[];
  skin?: string;
  skins?: string[];
  scale?: number;
  premultipliedAlpha?: boolean;
  showControls?: boolean;
  interactive?: boolean;
  backgroundColor?: string;
  fullscreenBackgroundColor?: string;
  alpha?: boolean;
  defaultMix?: number;
  rawDataURIs?: Record<string, string>;
  controlBones?: string[];
  debug?: {
    bones?: boolean;
    regions?: boolean;
    meshes?: boolean;
    bounds?: boolean;
  };
  backgroundImage?: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewport?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padLeft?: string | number;
    padRight?: string | number;
    padTop?: string | number;
    padBottom?: string | number;
    clip?: boolean;
    debugRender?: boolean;
    transitionTime?: number;
    animations?: Record<string, {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      padLeft?: string | number;
      padRight?: string | number;
      padTop?: string | number;
      padBottom?: string | number;
    }>;
  };
  success?: (player: SpinePlayerInstance) => void;
  error?: (player: SpinePlayerInstance | null, reason: string) => void;
}

interface SpinePlayerInstance {
  setAnimation?: (name: string, loop: boolean) => void;
  skeleton?: unknown;
  animationState?: unknown;
  canvas?: HTMLCanvasElement;
  dispose?: () => void;
}

export interface SpinePlayerRef {
  getPlayer: () => SpinePlayerInstance | null;
  exportGIF: (animationName: string, duration?: number) => Promise<Blob | null>;
  takeScreenshot: () => string | null;
  setAnimation: (animationName: string, loop?: boolean) => void;
}

interface SpineWebPlayerProps {
  skeleton: string;
  atlas: string;
  animation?: string;
  animations?: string[];
  skin?: string;
  skins?: string[];
  scale?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  fullscreenBackgroundColor?: string;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  showControls?: boolean;
  interactive?: boolean;
  controlBones?: string[];
  defaultMix?: number;

  debug?: {
    bones?: boolean;
    regions?: boolean;
    meshes?: boolean;
    bounds?: boolean;
  };
  backgroundImage?: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewport?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padLeft?: string | number;
    padRight?: string | number;
    padTop?: string | number;
    padBottom?: string | number;
    clip?: boolean;
    debugRender?: boolean;
    transitionTime?: number;
    animations?: Record<string, {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      padLeft?: string | number;
      padRight?: string | number;
      padTop?: string | number;
      padBottom?: string | number;
    }>;
  };
  rawDataURIs?: Record<string, string>;
  onSuccess?: (player: SpinePlayerInstance) => void;
  onError?: (player: SpinePlayerInstance | null, reason: string) => void;
  onLoad?: () => void;
  onReady?: (isReady: boolean) => void; // <<< CHANGE: Added onReady prop
  className?: string;
  style?: React.CSSProperties;
  showErrorDetails?: boolean;
  retryable?: boolean;
}

const SpineWebPlayer = forwardRef<SpinePlayerRef, SpineWebPlayerProps>((props, ref) => {
  const {
    skeleton,
    atlas,
    animation,
    animations,
    skin,
    skins,
    scale = 1,
    width = 800,
    height = 600,
    backgroundColor = '#2a2a2a',
    fullscreenBackgroundColor,
    alpha = true,
    premultipliedAlpha = true,
    showControls = true,
    interactive = true,
    controlBones,
    defaultMix = 0.25,
    debug,
    backgroundImage,
    viewport,
    rawDataURIs,
    onSuccess,
    onError,
    onLoad,
    onReady, // <<< CHANGE: Destructure onReady
    className,
    style,
    showErrorDetails = true,
    retryable = true,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<SpinePlayerInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getPlayer: () => playerRef.current,
    exportGIF: async (animationName: string, duration: number = 3000) => {
      return await exportGIF(animationName, duration);
    },
    takeScreenshot: () => takeScreenshot(),
    setAnimation: (animationName: string, loop?: boolean) => {
      if (playerRef.current && playerRef.current.setAnimation) {
        playerRef.current.setAnimation(animationName, loop ?? false);
      }
    },
    isFullyReady: () => {
      const player = playerRef.current;
      // Must have animationState, skeleton, canvas, and sceneRenderer
      return !!(player && player.animationState && player.skeleton && player.canvas && (player.sceneRenderer));
    }
  }), []);

  // GIF Export functionality using CCapture.js for WebGL capture
  /**
   * Exports a GIF of a specific animation. It will wait up to 5 seconds for the player
   * to be ready before attempting the export, making it more robust against timing issues.
   */
  // const exportGIF = async (animationName: string, duration: number = 3000): Promise<Blob | null> => {
  //   // Wait for the player to be fully initialized before proceeding.
  //   const player = await new Promise<SpinePlayerInstance | null>(resolve => {
  //       if (playerRef.current && playerRef.current.animationState && (playerRef.current as any).sceneRenderer) {
  //           return resolve(playerRef.current);
  //       }
  //       let attempts = 0;
  //       const interval = setInterval(() => {
  //           attempts++;
  //           const p = playerRef.current;
  //           if (p && p.animationState && (p as any).sceneRenderer) {
  //               clearInterval(interval);
  //               resolve(p);
  //           } else if (attempts > 50) { // 5-second timeout
  //               clearInterval(interval);
  //               resolve(null);
  //           } else {
  //               // Log the current state of playerRef for debugging
  //               if (attempts % 5 === 0) {
  //                 console.warn('[GIF] Waiting for playerRef to be ready...', {
  //                   playerRef: p,
  //                   hasAnimationState: !!(p && p.animationState),
  //                   hasSceneRenderer: !!(p && (p as any).sceneRenderer),
  //                 });
  //               }
  //           }
  //       }, 100);
  //   });

  //   if (!player) {
  //     console.error('[GIF] Player not ready for GIF export. Check if it loaded successfully.');
  //     console.error('[GIF] playerRef.current:', playerRef.current);
  //     if (playerRef.current) {
  //       console.error('[GIF] playerRef.current.animationState:', playerRef.current.animationState);
  //       console.error('[GIF] playerRef.current.sceneRenderer:', (playerRef.current as any).sceneRenderer);
  //       console.error('[GIF] playerRef.current.skeleton:', playerRef.current.skeleton);
  //       console.error('[GIF] playerRef.current.canvas:', playerRef.current.canvas);
  //     }
  //     return null;
  //   }

  //   const canvas = player.canvas;
  //   const CCaptureClass = window.CCapture;
  //   if (!CCaptureClass) {
  //     console.error('CCapture.js not loaded. Please include its <script> tag in your index.html.');
  //     return null;
  //   }

  //   // --- State Backup ---
  //   const state = player.animationState;
  //   const previousTrack = state.tracks[0] ? {
  //       animation: state.tracks[0].animation,
  //       loop: state.tracks[0].loop,
  //       timeScale: state.tracks[0].timeScale,
  //   } : null;
  //   const previousTimeScale = state.timeScale;

  //   // --- Setup for Capture ---
  //   state.timeScale = 0;
  //   state.setAnimation(0, animationName, false);

  //   const framerate = 30;
  //   const frameDuration = 1 / framerate;
  //   const totalFrames = Math.floor((duration / 1000) * framerate);

  //   const capturer = new CCaptureClass({
  //       format: 'gif',
  //       workersPath: 'https://cdn.jsdelivr.net/npm/ccapture.js-npmfixed@1.1.0/src/',
  //       framerate,
  //       verbose: false,
  //   });

  //   return new Promise<Blob | null>((resolve, reject) => {
  //       capturer.start();
  //       let frameCount = 0;

  //       const captureFrame = () => {
  //           if (frameCount >= totalFrames) {
  //               capturer.stop();
  //               capturer.save((blob: Blob) => {
  //                   // --- Restore Player State ---
  //                   state.timeScale = previousTimeScale;
  //                   if (previousTrack && previousTrack.animation) {
  //                       state.setAnimation(0, previousTrack.animation.name, previousTrack.loop);
  //                       state.tracks[0].timeScale = previousTrack.timeScale;
  //                   } else {
  //                       state.clearTracks();
  //                   }
  //                   player.render();
  //                   // --- Workaround: Resume player animation loop if needed ---
  //                   if (typeof (player as any).resume === 'function') {
  //                     (player as any).resume();
  //                   } else {
  //                     // Fallback: trigger a render to "kick" the loop
  //                     setTimeout(() => { player.render && player.render(); }, 50);
  //                   }
  //                   resolve(blob);
  //               });
  //               return;
  //           }

  //           try {
  //               // --- Manual Render Loop ---
  //               state.update(frameDuration);
  //               state.apply(player.skeleton);
  //               player.skeleton.updateWorldTransform();
  //               (player as any).sceneRenderer.draw(player.skeleton);
  //               capturer.capture(canvas);

  //               frameCount++;
  //               requestAnimationFrame(captureFrame);
  //           } catch (err) {
  //               console.error("Error during frame capture:", err);
  //               reject(err);
  //           }
  //       };
  //       requestAnimationFrame(captureFrame);

  //   }).catch(err => {
  //       console.error("Error during GIF export process:", err);
  //       // --- Restore Player State on Error ---
  //       state.timeScale = previousTimeScale;
  //       if (previousTrack && previousTrack.animation) {
  //           state.setAnimation(0, previousTrack.animation.name, previousTrack.loop);
  //       }
  //       player.render();
  //       // --- Workaround: Resume player animation loop if needed ---
  //       if (typeof (player as any).resume === 'function') {
  //         (player as any).resume();
  //       } else {
  //         setTimeout(() => { player.render && player.render(); }, 50);
  //       }
  //       return null;
  //   });
  // };

  // /**
  //  * Takes a screenshot. Waits up to 5 seconds for the player to be ready.
  //  */
  // const takeScreenshot = async (): Promise<string | null> => {
  //   const player = await new Promise<SpinePlayerInstance | null>(resolve => {
  //       if (playerRef.current && playerRef.current.canvas) {
  //           return resolve(playerRef.current);
  //       }
  //       let attempts = 0;
  //       const interval = setInterval(() => {
  //           attempts++;
  //           const p = playerRef.current;
  //           if (p && p.canvas) {
  //               clearInterval(interval);
  //               resolve(p);
  //           } else if (attempts > 50) { // 5-second timeout
  //               clearInterval(interval);
  //               resolve(null);
  //           }
  //       }, 100);
  //   });

  //   if (!player) {
  //     console.error('Player not ready for screenshot');
  //     return null;
  //   }

  //   try {
  //     return player.canvas.toDataURL('image/png');
  //   } catch (e) {
  //     console.error('Screenshot failed. This can be caused by CORS issues if assets are loaded from a different domain.', e);
  //     return null;
  //   }
  // };

  // Retry loading
  const retryLoad = () => {
    setError(null);
    setIsLoading(true);
    setLoadAttempts(prev => prev + 1);
  };

  // Initialize player
  useEffect(() => {
    if (!containerRef.current) return;
    if (!skeleton || !atlas) {
      setError('Both skeleton and atlas URLs are required');
      setIsLoading(false);
      return;
    }

    console.log('SpineWebPlayer initializing with:', { skeleton, atlas, animation });
    
    // IMPORTANT: Cleanup previous player first to prevent conflicts
    if (playerRef.current) {
      try {
        console.log('Disposing previous player...');
        playerRef.current.dispose?.();
        playerRef.current = null;
      } catch (err) {
        console.warn('Error disposing previous player:', err);
      }
    }

    // Clear container content to prevent multiple players
    if (containerRef.current) {
      const existingCanvases = containerRef.current.querySelectorAll('canvas');
      existingCanvases.forEach(canvas => canvas.remove());
      
      const existingContainers = containerRef.current.querySelectorAll('.spine-player');
      existingContainers.forEach(container => container.remove());
    }
    
    // Check if spine-player is available
    const spineLib = (window as unknown as { spine?: { SpinePlayer?: unknown } }).spine;
    console.log('window.spine available:', typeof spineLib !== 'undefined');
    console.log('SpinePlayer available:', typeof spineLib?.SpinePlayer !== 'undefined');

    if (typeof spineLib === 'undefined' || !spineLib.SpinePlayer) {
      if (loadAttempts < 10) {
        console.warn('Spine Player library not ready, retrying in 100ms...', loadAttempts);
        const timeout = setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        setError('Spine Player library not loaded after multiple attempts. Make sure to include spine-player.js');
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build configuration object with absolute URLs
      const baseUrl = window.location.origin;
      // Merge context attributes into webglConfig for proper WebGL context creation

      // Create SpinePlayer configuration with proper URL handling
      const config: SpinePlayerConfig = {
        scale,
        showControls,
        interactive,
        backgroundColor,
        fullscreenBackgroundColor,
        alpha,
        premultipliedAlpha,
        defaultMix,
        rawDataURIs,
        controlBones,
        debug,
        backgroundImage,


        success: (player: SpinePlayerInstance) => {
          console.log('SpinePlayer loaded successfully:', player);
          playerRef.current = player;
          setIsLoading(false);
          setError(null);
          if (onSuccess) onSuccess(player);
          if (onLoad) onLoad();
          if (onReady) onReady(true); // <<< CHANGE: Notify parent that player is ready
        },
        error: (player: SpinePlayerInstance | null, reason: string) => {
          console.error('SpinePlayer error:', reason);
          console.error('Failed URLs:', { skeleton, atlas });
          setIsLoading(false);
          setError(reason);
          if (onError) onError(player, reason);
          if (onReady) onReady(false); // <<< CHANGE: Notify parent that player failed to load
        }
      };

      // Set skeleton and atlas URLs using legacy property names for better compatibility
      const fullSkeletonUrl = `${baseUrl}${skeleton}`;
      const fullAtlasUrl = `${baseUrl}${atlas}`;
      
      // Use legacy property names first (for older spine-player versions)
      if (skeleton.endsWith('.json')) {
        config.jsonUrl = fullSkeletonUrl;
      } else if (skeleton.endsWith('.skel')) {
        config.binaryUrl = fullSkeletonUrl;
      }
      config.atlasUrl = fullAtlasUrl;
      
      // Also set the newer property names as fallback
      config.skeleton = fullSkeletonUrl;
      config.atlas = fullAtlasUrl;

      // Add optional configuration
      if (animation) config.animation = animation;
      if (animations) config.animations = animations;
      if (skin) config.skin = skin;
      if (skins) config.skins = skins;

      // Debug log the configuration
      console.log('SpinePlayer Config:', {
        skeleton: config.skeleton,
        atlas: config.atlas,
        jsonUrl: config.jsonUrl,
        binaryUrl: config.binaryUrl,
        atlasUrl: config.atlasUrl,
        animation,
        fullSkeletonUrl,
        fullAtlasUrl
      });

      // Create player using container element directly

      const SpinePlayerConstructor = spineLib.SpinePlayer as new (element: HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;
      new SpinePlayerConstructor(containerRef.current, config);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Failed to create SpinePlayer:', errorMessage);
      setIsLoading(false);
      setError(`Failed to initialize player: ${errorMessage}`);
      if (onError) onError(null, errorMessage);
    }
  }, [
    skeleton,
    atlas,
    animation,
    animations,
    skin,
    skins,
    scale,
    showControls,
    interactive,
    backgroundColor,
    fullscreenBackgroundColor,
    alpha,
    premultipliedAlpha,
    defaultMix,
    rawDataURIs,
    controlBones,
    debug,
    backgroundImage,
    viewport,
    loadAttempts,
    onSuccess,
    onError,
    onLoad,onReady // <<< CHANGE: Added onReady to dependencies
  ]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    position: 'relative',
    border: '1px solid #333',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: backgroundColor || '#2a2a2a',
    ...style
  };

  const loadingOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    zIndex: 10
  };

  const errorOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    zIndex: 10
  };

  return (
    <div className={className} style={containerStyles}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {isLoading && (
        <div style={loadingOverlayStyles}>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>
            🎮 Loading Spine Animation...
          </div>
          <div style={{
            width: '200px',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '50%',
              height: '100%',
              backgroundColor: '#00ff88',
              borderRadius: '2px',
              animation: 'loading 1.5s ease-in-out infinite alternate'
            }} />
          </div>
        </div>
      )}

      {error && (
        <div style={errorOverlayStyles}>
          <div style={{ fontSize: '24px', marginBottom: '15px' }}>
            ❌ Loading Failed
          </div>
          {showErrorDetails && (
            <div style={{ 
              fontSize: '14px', 
              marginBottom: '20px',
              maxWidth: '90%',
              wordBreak: 'break-word',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '10px',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          {retryable && (
            <button
              onClick={retryLoad}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔄 Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
});

SpineWebPlayer.displayName = 'SpineWebPlayer';

export default SpineWebPlayer;
