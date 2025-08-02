import React, { useEffect, useRef, useState, useCallback } from 'react';

// Type definitions for spine-player based on documentation
declare global {
  namespace spine {
    interface SpinePlayerConfig {
      skeleton?: string;
      atlas?: string;
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
      success?: (player: SpinePlayer) => void;
      error?: (player: SpinePlayer, reason: string) => void;
    }

    interface SpinePlayer {
      skeleton: any;
      animationState: any;
      setAnimation(name: string, loop: boolean): void;
      dispose(): void;
    }

    class SpinePlayer {
      constructor(element: string | HTMLElement, config: SpinePlayerConfig);
    }
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
  onSuccess?: (player: spine.SpinePlayer) => void;
  onError?: (player: spine.SpinePlayer, reason: string) => void;
  onLoad?: () => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Error handling
  showErrorDetails?: boolean;
  retryable?: boolean;
}

const SpineWebPlayer: React.FC<SpineWebPlayerProps> = ({
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<spine.SpinePlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);

  // Success callback
  const handleSuccess = useCallback((player: spine.SpinePlayer) => {
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
  const handleError = useCallback((player: spine.SpinePlayer, reason: string) => {
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
      // Build configuration object
      const config: spine.SpinePlayerConfig = {
        skeleton,
        atlas,
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

      // Create player
      const player = new spine.SpinePlayer(containerRef.current, config);
      playerRef.current = player;

    } catch (err) {
      console.error('Error creating Spine Web Player:', err);
      const errorMessage = `Failed to create player: ${err instanceof Error ? err.message : String(err)}`;
      setIsLoading(false);
      setError(errorMessage);
      if (onError) {
        onError(null as any, errorMessage);
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
};

export default SpineWebPlayer;
