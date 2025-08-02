import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Matrix4,
  Shader,
  PolygonBatcher,
  SkeletonRenderer,
  ManagedWebGLRenderingContext,
  AssetManager,
  GLTexture,
  TextureAtlas,
  AtlasAttachmentLoader,
  SkeletonBinary,
  SkeletonJson,
  Skeleton,
  AnimationStateData,
  AnimationState,
  Physics,
  Vector2
} from '@esotericsoftware/spine-webgl';

// Import asset lists
import chibiList from './chibi_list.json';
import v1Animations from './v1_animations.json';
import v2Animations from './v2_animations.json';

interface ChibiOption {
  value: string;
  label: string;
}

interface SpineAnimatorProps {
  className?: string;
}

// Helper to load data with proper typing
const loadData = (url: string, callback: (success: boolean, data?: unknown) => void, responseType: 'text' | 'arraybuffer' | 'blob' = 'text') => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = responseType;
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback(true, xhr.response);
    } else {
      callback(false);
    }
  };
  xhr.onerror = () => callback(false);
  xhr.send();
};

const SpineAnimator: React.FC<SpineAnimatorProps> = ({ className }) => {
  // WebGL context and renderers
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<ManagedWebGLRenderingContext | null>(null);
  const shaderRef = useRef<Shader | null>(null);
  const batcherRef = useRef<PolygonBatcher | null>(null);
  const rendererRef = useRef<SkeletonRenderer | null>(null);
  const mvpRef = useRef<Matrix4>(new Matrix4());
  const assetManagerRef = useRef<AssetManager | null>(null);
  
  const currentSkeletonRef = useRef<{
    skeleton: Skeleton;
    animationState: AnimationState;
    animationDuration: number;
    bounds: { offset: Vector2; size: Vector2 };
    texture: GLTexture;
  } | null>(null);
  
  const animationFrameRef = useRef<number | null>(null);

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Matrix4,
  Shader,
  PolygonBatcher,
  SkeletonRenderer,
  ManagedWebGLRenderingContext,
  GLTexture,
  TextureAtlas,
  AtlasAttachmentLoader,
  SkeletonBinary,
  SkeletonJson,
  Skeleton,
  AnimationStateData,
  AnimationState,
  Physics,
  Vector2
} from '@esotericsoftware/spine-webgl';

// Import asset lists
import chibiList from './chibi_list.json';
import v1Animations from './v1_animations.json';
import v2Animations from './v2_animations.json';

interface ChibiOption {
  value: string;
  label: string;
}

interface SpineAnimatorProps {
  className?: string;
}

// Helper to load data with proper typing
const loadData = (url: string, callback: (success: boolean, data?: unknown) => void, responseType: 'text' | 'arraybuffer' | 'blob' = 'text') => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = responseType;
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback(true, xhr.response);
    } else {
      callback(false);
    }
  };
  xhr.onerror = () => callback(false);
  xhr.send();
};

const SpineAnimator: React.FC<SpineAnimatorProps> = ({ className }) => {
  // WebGL context and renderers
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<ManagedWebGLRenderingContext | null>(null);
  const shaderRef = useRef<Shader | null>(null);
  const batcherRef = useRef<PolygonBatcher | null>(null);
  const rendererRef = useRef<SkeletonRenderer | null>(null);
  const mvpRef = useRef<Matrix4>(new Matrix4());
  
  const currentSkeletonRef = useRef<{
    skeleton: Skeleton;
    animationState: AnimationState;
    animationDuration: number;
    bounds: { offset: Vector2; size: Vector2 };
    texture: GLTexture;
  } | null>(null);
  
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(Date.now() / 1000);

  // State management
  const [selectedChibi, setSelectedChibi] = useState<string>('');
  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [isLoadingChibi, setIsLoadingChibi] = useState(false);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [exportFps, setExportFps] = useState<number>(30);

  // Filter available chibis (exclude base_model and invalid entries)
  const availableChibis: ChibiOption[] = chibiList.filter(
    chibi => chibi.value !== 'base_model' && chibi.value.includes('sd_')
  );

  // Initialize WebGL context and rendering components
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      // Create WebGL context
      const webglContext = canvasRef.current.getContext('webgl') || canvasRef.current.getContext('experimental-webgl');
      if (!webglContext) {
        console.error('WebGL not supported');
        return;
      }

      // Create managed WebGL context
      const gl = new ManagedWebGLRenderingContext(webglContext);
      glRef.current = gl;

      // Create shader and rendering components
      const shader = Shader.newTwoColoredTextured(gl);
      const batcher = new PolygonBatcher(gl);
      const renderer = new SkeletonRenderer(gl);
      
      shaderRef.current = shader;
      batcherRef.current = batcher;
      rendererRef.current = renderer;

      // Set up MVP matrix
      mvpRef.current.ortho2d(0, 0, canvasRef.current.width - 1, canvasRef.current.height - 1);

      // Start render loop
      startRenderLoop();

      console.log('Spine WebGL context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spine WebGL context:', error);
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Render loop
  const render = useCallback(() => {
    if (!glRef.current || !shaderRef.current || !batcherRef.current || !rendererRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    const gl = glRef.current;
    const canvas = canvasRef.current;

    // Calculate delta time
    const now = Date.now() / 1000;
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Resize canvas if needed
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      mvpRef.current.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
    }

    // Clear canvas with black background
    gl.gl.clearColor(0, 0, 0, 1);
    gl.gl.clear(gl.gl.COLOR_BUFFER_BIT);

    // Render skeleton if available
    if (currentSkeletonRef.current) {
      const { skeleton, animationState, texture } = currentSkeletonRef.current;

      try {
        // Update animation
        animationState.update(delta);
        animationState.apply(skeleton);
        skeleton.updateWorldTransform(Physics.update);

        // Position skeleton in center of canvas
        skeleton.x = canvas.width / 2;
        skeleton.y = canvas.height - canvas.height * 0.1;
        
        // Scale skeleton to fit canvas
        const bounds = currentSkeletonRef.current.bounds;
        const scale = canvas.height / bounds.size.y * 0.8;
        skeleton.scaleX = scale;
        skeleton.scaleY = -scale;

        // Bind shader and set uniforms
        shaderRef.current!.bind();
        shaderRef.current!.setUniformi('SAMPLER', 0);
        shaderRef.current!.setUniform4x4f('MVP_MATRIX', mvpRef.current.values);

        // Bind texture
        gl.gl.activeTexture(gl.gl.TEXTURE0);
        gl.gl.bindTexture(gl.gl.TEXTURE_2D, texture.texture);

        // Enable blending
        gl.gl.enable(gl.gl.BLEND);
        gl.gl.blendFunc(gl.gl.SRC_ALPHA, gl.gl.ONE_MINUS_SRC_ALPHA);

        // Render skeleton
        batcherRef.current!.begin(shaderRef.current!);
        rendererRef.current!.premultipliedAlpha = false;
        rendererRef.current!.draw(batcherRef.current!, skeleton);
        batcherRef.current!.end();

        shaderRef.current!.unbind();
      } catch (error) {
        console.error('Render error:', error);
      }
    }

    // Continue render loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, []);

  const startRenderLoop = useCallback(() => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
  }, [render]);

  // Load chibi model
  const loadChibi = useCallback(async (chibiValue: string) => {
    if (!glRef.current || !chibiValue) return;

    setIsLoadingChibi(true);
    setSelectedAnimation('');
    setAvailableAnimations([]);

    try {
      // Clear previous skeleton
      if (currentSkeletonRef.current) {
        currentSkeletonRef.current = null;
      }

      // Determine if this is a V2 model
      const isV2Model = chibiValue.startsWith('v2_');
      
      if (isV2Model) {
        await loadV2Model(chibiValue);
      } else {
        await loadV1Model(chibiValue);
      }

      console.log(`Successfully loaded ${isV2Model ? 'V2' : 'V1'} chibi: ${chibiValue}`);

    } catch (error) {
      console.error('Failed to load chibi:', error);
      setAvailableAnimations([]);
    } finally {
      setIsLoadingChibi(false);
    }
  }, []);

  // Load V2 model (JSON format)
  const loadV2Model = useCallback(async (chibiValue: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Load skeleton JSON
      loadData('/Files/skeleton/v2_sd_main.json', (success, skeletonData) => {
        if (!success) {
          reject(new Error('Failed to load V2 skeleton'));
          return;
        }

        // Load atlas
        loadData(`/Files/out/${chibiValue}/sekai_atlas/sekai_atlas.atlas.txt`, (success, atlasText) => {
          if (!success) {
            reject(new Error('Failed to load V2 atlas'));
            return;
          }

          // Load texture
          loadData(`/Files/out/${chibiValue}/sekai_atlas/sekai_atlas.png`, (success, blob) => {
            if (!success) {
              reject(new Error('Failed to load V2 texture'));
              return;
            }

            const img = new Image();
            img.onload = () => {
              try {
                // Create texture
                const texture = new GLTexture(glRef.current!, img);

                // Create atlas
                const atlas = new TextureAtlas(atlasText as string, () => texture);

                // Create skeleton loader
                const atlasLoader = new AtlasAttachmentLoader(atlas);
                const skeletonJson = new SkeletonJson(atlasLoader);

                // Parse skeleton data
                const parsedSkeletonData = skeletonJson.readSkeletonData(
                  typeof skeletonData === 'string' ? JSON.parse(skeletonData) : skeletonData
                );

                // Create skeleton and animation state
                const skeleton = new Skeleton(parsedSkeletonData);
                skeleton.setToSetupPose();

                const animationStateData = new AnimationStateData(parsedSkeletonData);
                const animationState = new AnimationState(animationStateData);

                // Calculate bounds
                const offset = new Vector2();
                const size = new Vector2();
                skeleton.setToSetupPose();
                skeleton.updateWorldTransform(Physics.update);
                skeleton.getBounds(offset, size);

                // Get available animations
                const modelAnimations = v2Animations;
                const skeletonAnimations = parsedSkeletonData.animations.map((anim: {name: string}) => anim.name);
                const filteredAnimations = modelAnimations.filter(anim => 
                  skeletonAnimations.includes(anim)
                );

                setAvailableAnimations(filteredAnimations);

                // Set default animation
                const defaultAnimation = 'v2_pose_default';
                const availableDefault = filteredAnimations.find(anim => anim === defaultAnimation) || 
                                        filteredAnimations[0];

                if (availableDefault) {
                  const track = animationState.setAnimation(0, availableDefault, true);
                  setSelectedAnimation(availableDefault);

                  // Store skeleton reference
                  currentSkeletonRef.current = {
                    skeleton,
                    animationState,
                    animationDuration: track.animation?.duration || 1,
                    bounds: { offset, size },
                    texture
                  };
                }

                resolve();
              } catch (error) {
                reject(error);
              }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(blob as Blob);
          }, 'blob');
        });
      });
    });
  }, []);

  // Load V1 model (Binary format)
  const loadV1Model = useCallback(async (chibiValue: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Load skeleton binary
      loadData('https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/base_model/sekai_skeleton.skel', (success, skeletonData) => {
        if (!success) {
          reject(new Error('Failed to load V1 skeleton'));
          return;
        }

        // Load atlas
        loadData(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${chibiValue}/sekai_atlas.atlas`, (success, atlasText) => {
          if (!success) {
            reject(new Error('Failed to load V1 atlas'));
            return;
          }

          // Load texture
          loadData(`https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${chibiValue}/sekai_atlas.png`, (success, blob) => {
            if (!success) {
              reject(new Error('Failed to load V1 texture'));
              return;
            }

            const img = new Image();
            img.onload = () => {
              try {
                // Create texture
                const texture = new GLTexture(glRef.current!, img);

                // Create atlas
                const atlas = new TextureAtlas(atlasText as string, () => texture);

                // Create skeleton loader
                const atlasLoader = new AtlasAttachmentLoader(atlas);
                const skeletonBinary = new SkeletonBinary(atlasLoader);

                // Parse skeleton data
                const newBuff = new Uint8Array((skeletonData as ArrayBuffer).byteLength + 1);
                newBuff.set(new Uint8Array(skeletonData as ArrayBuffer), 0);
                const parsedSkeletonData = skeletonBinary.readSkeletonData(newBuff.buffer);

                // Create skeleton and animation state
                const skeleton = new Skeleton(parsedSkeletonData);
                skeleton.setToSetupPose();

                const animationStateData = new AnimationStateData(parsedSkeletonData);
                const animationState = new AnimationState(animationStateData);

                // Calculate bounds
                const offset = new Vector2();
                const size = new Vector2();
                skeleton.setToSetupPose();
                skeleton.updateWorldTransform(Physics.update);
                skeleton.getBounds(offset, size);

                // Get available animations
                const modelAnimations = v1Animations;
                const skeletonAnimations = parsedSkeletonData.animations.map((anim: {name: string}) => anim.name);
                const filteredAnimations = modelAnimations.filter(anim => 
                  skeletonAnimations.includes(anim)
                );

                setAvailableAnimations(filteredAnimations);

                // Set default animation
                const defaultAnimation = 'pose_default';
                const availableDefault = filteredAnimations.find(anim => anim === defaultAnimation) || 
                                        filteredAnimations[0];

                if (availableDefault) {
                  const track = animationState.setAnimation(0, availableDefault, true);
                  setSelectedAnimation(availableDefault);

                  // Store skeleton reference
                  currentSkeletonRef.current = {
                    skeleton,
                    animationState,
                    animationDuration: track.animation?.duration || 1,
                    bounds: { offset, size },
                    texture
                  };
                }

                resolve();
              } catch (error) {
                reject(error);
              }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(blob as Blob);
          }, 'blob');
        });
      }, 'arraybuffer');
    });
  }, []);

  // Change animation
  const changeAnimation = useCallback(async (animationName: string) => {
    if (!currentSkeletonRef.current || !animationName) return;

    setIsLoadingAnimation(true);

    try {
      const { animationState } = currentSkeletonRef.current;
      
      // Set the new animation
      const track = animationState.setAnimation(0, animationName, true);
      
      // Update the animation duration
      currentSkeletonRef.current.animationDuration = track.animation?.duration || 1;

      setSelectedAnimation(animationName);
      console.log(`Animation changed to: ${animationName}`);
      
    } catch (error) {
      console.error('Failed to change animation:', error);
    } finally {
      setIsLoadingAnimation(false);
    }
  }, []);

  // Export PNG screenshot
  const exportPNG = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      // Create a temporary canvas for transparent background export
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d')!;
      
      tempCanvas.width = canvasRef.current.width;
      tempCanvas.height = canvasRef.current.height;

      // Clear with transparent background
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the spine canvas content
      tempCtx.drawImage(canvasRef.current, 0, 0);

      // Convert to blob and download
      tempCanvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedChibi}_${selectedAnimation}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('PNG exported successfully');
      }, 'image/png');

    } catch (error) {
      console.error('Failed to export PNG:', error);
    }
  }, [selectedChibi, selectedAnimation]);

  // Export GIF animation (simplified - just show a message)
  const exportGIF = useCallback(async () => {
    if (!canvasRef.current || !currentSkeletonRef.current) return;

    setIsExportingGif(true);

    try {
      // For now, just show an alert - GIF export would need additional setup
      alert(`GIF export functionality is not yet implemented. Would export ${selectedChibi} animation "${selectedAnimation}" at ${exportFps} FPS.`);
      
    } catch (error) {
      console.error('Failed to export GIF:', error);
    } finally {
      setIsExportingGif(false);
    }
  }, [selectedChibi, selectedAnimation, exportFps]);

  return (
    <div className={`spine-animator ${className || ''}`} style={{ padding: '20px' }}>
      {/* Canvas */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            border: '2px solid #333',
            backgroundColor: '#000000', // Solid black background
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        
        {/* Chibi Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select Chibi {isLoadingChibi && <span style={{ color: '#666' }}>Loading...</span>}
          </label>
          <select
            value={selectedChibi}
            onChange={(e) => {
              setSelectedChibi(e.target.value);
              if (e.target.value) {
                loadChibi(e.target.value);
              }
            }}
            disabled={isLoadingChibi}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">Choose a chibi model...</option>
            {availableChibis.map((chibi) => (
              <option key={chibi.value} value={chibi.value}>
                {chibi.label}
              </option>
            ))}
          </select>
        </div>

        {/* Animation Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select Animation {isLoadingAnimation && <span style={{ color: '#666' }}>Loading...</span>}
          </label>
          <select
            value={selectedAnimation}
            onChange={(e) => changeAnimation(e.target.value)}
            disabled={!selectedChibi || isLoadingChibi || isLoadingAnimation || availableAnimations.length === 0}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">Choose animation...</option>
            {availableAnimations.map((animation) => (
              <option key={animation} value={animation}>
                {animation}
              </option>
            ))}
          </select>
          {selectedChibi && availableAnimations.length === 0 && !isLoadingChibi && (
            <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
              No animations available for this model
            </small>
          )}
        </div>

        {/* Export Controls */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Export Options
          </label>
          
          {/* PNG Export */}
          <button
            onClick={exportPNG}
            disabled={!selectedChibi || !selectedAnimation}
            style={{
              width: '100%',
              padding: '8px 12px',
              marginBottom: '8px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedChibi && selectedAnimation ? 'pointer' : 'not-allowed',
              opacity: selectedChibi && selectedAnimation ? 1 : 0.6
            }}
          >
            Export PNG
          </button>

          {/* GIF Export */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}>
              FPS (max 60):
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={exportFps}
              onChange={(e) => setExportFps(Math.min(60, Math.max(1, parseInt(e.target.value) || 30)))}
              style={{
                width: '100%',
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '4px'
              }}
            />
          </div>
          
          <button
            onClick={exportGIF}
            disabled={!selectedChibi || !selectedAnimation || isExportingGif}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedChibi && selectedAnimation && !isExportingGif ? 'pointer' : 'not-allowed',
              opacity: selectedChibi && selectedAnimation && !isExportingGif ? 1 : 0.6
            }}
          >
            {isExportingGif ? 'Exporting GIF...' : 'Export GIF'}
          </button>
        </div>

      </div>

      {/* Status Information */}
      {selectedChibi && (
        <div style={{ 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Current Model:</strong> {selectedChibi} <br />
          <strong>Current Animation:</strong> {selectedAnimation || 'None'} <br />
          <strong>Available Animations:</strong> {availableAnimations.length}
          {currentSkeletonRef.current && (
            <>
              <br />
              <strong>Animation Duration:</strong> {currentSkeletonRef.current.animationDuration.toFixed(2)}s
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SpineAnimator;
