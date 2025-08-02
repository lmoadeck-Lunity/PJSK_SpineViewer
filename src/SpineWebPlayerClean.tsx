import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

// Import spine-player CSS - this is required for the player controls to display correctly
import '@esotericsoftware/spine-player/dist/spine-player.css';

// Type definitions for spine-player based on official documentation
interface SpinePlayerConfig {
  skeleton?: string;  // URL to .json or .skel file
  atlas?: string;     // URL to .atlas file
  // Legacy property names for compatibility
  jsonUrl?: string;   // URL to .json file (legacy)
  binaryUrl?: string; // URL to .skel file (legacy)
  atlasUrl?: string;  // URL to .atlas file (legacy)
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
    paths?: boolean;
    clipping?: boolean;
    points?: boolean;
    hulls?: boolean;
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
      clip?: boolean;
    }>;
  };
  success?: (player: SpinePlayerInstance) => void;
  error?: (player: SpinePlayerInstance | null, reason: string) => void;
}

interface SpinePlayerInstance {
  skeleton: unknown;
  animationState: unknown;
  setAnimation(name: string, loop: boolean): void;
  dispose(): void;
}

// Ref interface for exposing methods to parent components
export interface SpinePlayerRef {
  getPlayer: () => SpinePlayerInstance | null;
  exportGIF: (animationName: string, duration?: number) => Promise<Blob | null>;
  takeScreenshot: () => string | null;
  setAnimation: (animationName: string, loop?: boolean) => void;
}

// Declare the global spine namespace for the spine-player
declare global {
  interface Window {
    spine: {
      SpinePlayer: new (element: string | HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;
    };
  }
}

export interface SpineWebPlayerProps {
  // Basic configuration
  skeleton?: string;
  atlas?: string;
  animation?: string;
  animations?: string[];
  skin?: string;
  skins?: string[];
  scale?: number;
  
  // Visual configuration
  width?: number;
  height?: number;
  backgroundColor?: string;
  fullscreenBackgroundColor?: string;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  
  // Control configuration
  showControls?: boolean;
  interactive?: boolean;
  controlBones?: string[];
  defaultMix?: number;
  
  // Debug configuration
  debug?: {
    bones?: boolean;
    regions?: boolean;
    meshes?: boolean;
    bounds?: boolean;
    paths?: boolean;
    clipping?: boolean;
    points?: boolean;
    hulls?: boolean;
  };
  
  // Background image
  backgroundImage?: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // Viewport configuration
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
      clip?: boolean;
    }>;
  };
  
  // Data embedding
  rawDataURIs?: Record<string, string>;
  
  // Event callbacks
  onSuccess?: (player: SpinePlayerInstance) => void;
  onError?: (player: SpinePlayerInstance | null, reason: string) => void;
  onLoad?: () => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Error handling
  showErrorDetails?: boolean;
  retryable?: boolean;
}

const SpineWebPlayer = forwardRef<SpinePlayerRef, SpineWebPlayerProps>((props, ref) => {
  const {
    // Basic configuration
    skeleton,
    atlas,
    animation,
    animations,
    skin,
    skins,
    scale = 1,
    
    // Visual configuration
    width = 800,
    height = 600,
    backgroundColor = '#2a2a2a',
    fullscreenBackgroundColor,
    alpha = true,
    premultipliedAlpha = true,
    
    // Control configuration
    showControls = true,
    interactive = true,
    controlBones,
    defaultMix = 0.25,
    
    // Debug configuration
    debug,
    
    // Background image
    backgroundImage,
    
    // Viewport configuration
    viewport,
    
    // Data embedding
    rawDataURIs,
    
    // Event callbacks
    onSuccess,
    onError,
    onLoad,
    
    // Styling
    className,
    style,
    
    // Error handling
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
    setAnimation: (animationName: string, loop: boolean = true) => {
      if (playerRef.current && playerRef.current.setAnimation) {
        playerRef.current.setAnimation(animationName, loop);
      }
    }
  }), []);

  // GIF Export functionality
  const exportGIF = async (animationName: string, _duration: number): Promise<Blob | null> => {
    if (!playerRef.current || !containerRef.current) {
      console.error('Player not ready for GIF export');
      return null;
    }

    try {
      // Set the animation
      if (playerRef.current.setAnimation) {
        playerRef.current.setAnimation(animationName, true);
      }

      // Wait a moment for animation to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find the canvas element
      const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        console.error('Canvas not found for GIF export');
        return null;
      }

      // Simple fallback: convert to single frame for now
      // TODO: Implement proper GIF creation with gif.js or similar
      // Note: _duration parameter will be used when implementing proper GIF recording (duration: ${_duration}ms)
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    } catch (error) {
      console.error('GIF export failed:', error);
      return null;
    }
  };

  // Screenshot functionality
  const takeScreenshot = (): string | null => {
    if (!containerRef.current) {
      console.error('Player not ready for screenshot');
      return null;
    }

    const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found for screenshot');
      return null;
    }

    return canvas.toDataURL('image/png');
  };

  // Success callback
  const handleSuccess = useCallback((player: SpinePlayerInstance) => {
    console.log('Spine Web Player loaded successfully');
    setIsLoading(false);
    setError(null);
    setLoadAttempts(0);
    
    try {
      // Set initial animation if specified and not already set
      if (animation && player.setAnimation) {
        player.setAnimation(animation, true);
      }
      
      // Call user success callback
      if (onSuccess) {
        onSuccess(player);
      }
      
      // Call load callback
      if (onLoad) {
        onLoad();
      }
    } catch (err) {
      console.error('Error in success callback:', err);
      const errorMessage = `Post-load configuration failed: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      if (onError) {
        onError(player, errorMessage);
      }
    }
  }, [animation, onSuccess, onError, onLoad]);

  // Error callback
  const handleError = useCallback((player: SpinePlayerInstance | null, reason: string) => {
    console.error('Spine Web Player error:', reason);
    setIsLoading(false);
    setError(`Player error: ${reason}`);
    
    if (onError) {
      onError(player, reason);
    }
  }, [onError]);

  // Retry function
  const retryLoad = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setLoadAttempts(prev => prev + 1);
  }, []);

  // Initialize player
  useEffect(() => {
    if (!containerRef.current) return;
    if (!skeleton || !atlas) {
      setError('Both skeleton and atlas URLs are required');
      setIsLoading(false);
      return;
    }

    // Check if spine-player is available
    if (typeof window.spine === 'undefined' || !window.spine.SpinePlayer) {
      setError('Spine Player library not loaded. Make sure to include spine-player.js');
      setIsLoading(false);
      return;
    }

    // Cleanup previous player
    if (playerRef.current) {
      try {
        playerRef.current.dispose();
      } catch (err) {
        console.warn('Error disposing previous player:', err);
      }
      playerRef.current = null;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Build configuration object with absolute URLs
      const baseUrl = window.location.origin;
      
      // Try different property name combinations based on file type
      const config: SpinePlayerConfig = {
        scale,
        premultipliedAlpha,
        showControls,
        interactive,
        backgroundColor,
        alpha,
        defaultMix,
        success: handleSuccess,
        error: handleError,
      };

      // Set skeleton and atlas URLs using legacy property names
      const fullSkeletonUrl = `${baseUrl}${skeleton}`;
      const fullAtlasUrl = `${baseUrl}${atlas}`;
      
      // Use legacy property names for better compatibility
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
      if (fullscreenBackgroundColor) config.fullscreenBackgroundColor = fullscreenBackgroundColor;
      if (controlBones) config.controlBones = controlBones;
      if (debug) config.debug = debug;
      if (backgroundImage) config.backgroundImage = backgroundImage;
      if (viewport) config.viewport = viewport;
      if (rawDataURIs) config.rawDataURIs = rawDataURIs;

      // Debug log the configuration
      console.log('SpinePlayer Config:', {
        skeleton: config.skeleton,
        atlas: config.atlas,
        jsonUrl: config.jsonUrl,
        binaryUrl: config.binaryUrl,
        atlasUrl: config.atlasUrl,
        animation,
        hasSpineLibrary: !!window.spine,
        hasSpinePlayer: !!(window.spine?.SpinePlayer),
        containerElement: containerRef.current
      });

      // Create player using container ID (spine-player expects string ID)
      const containerId = `spine-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      if (containerRef.current) {
        containerRef.current.id = containerId;
      }
      
      const player = new window.spine.SpinePlayer(containerId, config);
      playerRef.current = player;

    } catch (err) {
      console.error('Error creating Spine Web Player:', err);
      const errorMessage = `Failed to create player: ${err instanceof Error ? err.message : String(err)}`;
      setIsLoading(false);
      setError(errorMessage);
      if (onError) {
        onError(null, errorMessage);
      }
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (err) {
          console.warn('Error disposing player in cleanup:', err);
        }
      }
    };
  }, [
    skeleton,
    atlas,
    animation,
    animations,
    skin,
    skins,
    scale,
    backgroundColor,
    fullscreenBackgroundColor,
    alpha,
    premultipliedAlpha,
    showControls,
    interactive,
    controlBones,
    defaultMix,
    debug,
    backgroundImage,
    viewport,
    rawDataURIs,
    handleSuccess,
    handleError,
    loadAttempts, // Include loadAttempts to trigger retry
    onError, // Add onError to dependencies
  ]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: error ? '#ffe0e0' : 'transparent',
    ...style,
  };

  // Loading overlay styles
  const loadingOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    color: 'white',
    fontSize: '16px',
    zIndex: 1000,
    textAlign: 'center',
    padding: '20px',
  };

  // Error overlay styles
  const errorOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe0e0',
    color: '#d63031',
    fontSize: '14px',
    zIndex: 1001,
    textAlign: 'center',
    padding: '20px',
    gap: '10px',
  };

  // Render error state
  if (error) {
    return (
      <div className={className} style={containerStyles}>
        <div style={errorOverlayStyles}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            ⚠️ Spine Player Error
          </div>
          {showErrorDetails && (
            <div style={{ wordBreak: 'break-word', maxHeight: '60%', overflow: 'auto' }}>
              {error}
            </div>
          )}
          {retryable && (
            <button
              onClick={retryLoad}
              style={{
                padding: '8px 16px',
                backgroundColor: '#d63031',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: '10px',
              }}
            >
              Retry ({loadAttempts > 0 ? `Attempt ${loadAttempts + 1}` : 'Try Again'})
            </button>
          )}
          {loadAttempts > 0 && (
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Failed attempts: {loadAttempts}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyles}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {isLoading && (
        <div style={loadingOverlayStyles}>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>
            🎮 Loading Spine Animation...
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>
            Skeleton: {skeleton}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Atlas: {atlas}
          </div>
          {loadAttempts > 0 && (
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px' }}>
              Retry attempt: {loadAttempts}
            </div>
          )}
          <div style={{ 
            marginTop: '15px', 
            width: '200px', 
            height: '4px', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
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
    </div>
  );
});

SpineWebPlayer.displayName = 'SpineWebPlayer';

export default SpineWebPlayer;
