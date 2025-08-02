import React, { useState, useRef, useEffect, useCallback } from 'react';
// @ts-expect-error - GIF.js doesn't have TypeScript declarations 
import GIF from 'gif.js';

// Import the chibi list
import chibiList from './chibi_list.json';

interface ChibiOption {
  value: string;
  label: string;
}

interface SpineAnimationPlayerProps {
  className?: string;
}

interface LoadedSpineData {
  skeleton: unknown;
  animationState: unknown;
  spineCanvas: unknown;
  availableAnimations: string[];
  currentAnimation: string;
  animationDuration: number;
}

const SpineAnimationPlayer: React.FC<SpineAnimationPlayerProps> = ({ className }) => {
  // DOM refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spineCanvasRef = useRef<unknown>(null);
  const loadedDataRef = useRef<LoadedSpineData | null>(null);
  
  // State management
  const [selectedChibi, setSelectedChibi] = useState<string>('');
  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [isLoadingChibi, setIsLoadingChibi] = useState(false);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [exportFps, setExportFps] = useState<number>(30);
  
  // Filter available chibis (exclude base_model and other non-displayable entries)
  const availableChibis: ChibiOption[] = chibiList.filter(
    chibi => chibi.value !== 'base_model' && 
             chibi.value !== 'base_model_mob' && 
             (chibi.value.startsWith('sd_') || chibi.value.startsWith('v2_sd_'))
  );

  /**
   * Initialize the spine-canvas when component mounts
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize canvas with black background
    const canvas = canvasRef.current;
    canvas.style.backgroundColor = '#000000';
    
    // Load spine-canvas script if not already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && !(window as any).spine) {
      const script = document.createElement('script');
      script.src = '/spine-canvas.js'; // Use local version for compatibility
      script.onload = () => {
        console.log('Spine Canvas library loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Spine Canvas library');
      };
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (spineCanvasRef.current && (spineCanvasRef.current as any).dispose) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (spineCanvasRef.current as any).dispose();
      }
    };
  }, []);

  /**
   * Determine skeleton and atlas paths based on chibi selection
   * FIXED: Use character-specific atlas files but filter out 1x1 placeholder attachments
   */
  const getAssetPaths = useCallback((chibiValue: string) => {
    const isV2 = chibiValue.startsWith('v2_');
    
    if (isV2) {
      return {
        skeletonUrl: '/Files/skeleton/v2_sd_main.json',
        atlasUrl: `/Files/out/${chibiValue}/sekai_atlas/sekai_atlas.atlas.txt`, // Character-specific atlas
        skeletonType: 'json' as const
      };
    } else {
      // V1 models: Use remote URLs since local atlas files are corrupted
      return {
        skeletonUrl: 'https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/base_model/sekai_skeleton.skel',
        atlasUrl: `https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${chibiValue}/sekai_atlas.atlas`,
        skeletonType: 'binary' as const
      };
    }
  }, []);

  /**
   * Load and initialize a chibi model
   */
  const loadChibi = useCallback(async (chibiValue: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!canvasRef.current || !(window as any).spine) {
      console.error('Canvas or Spine library not available');
      return;
    }

    setIsLoadingChibi(true);
    setSelectedAnimation('');
    setAvailableAnimations([]);

    try {
      // Get asset paths
      const { skeletonUrl, atlasUrl, skeletonType } = getAssetPaths(chibiValue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spineLib = (window as any).spine;

      // Create spine app class
      class SpineApp {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skeleton: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        animationState: any = null;
        availableAnimations: string[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadAssets(canvas: any) {
          // Load atlas and skeleton
          canvas.assetManager.loadTextureAtlas(atlasUrl);
          if (skeletonType === 'json') {
            canvas.assetManager.loadText(skeletonUrl);
          } else {
            canvas.assetManager.loadBinary(skeletonUrl);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialize(canvas: any) {
          try {
            const assetManager = canvas.assetManager;
            
            // Create atlas
            const atlas = assetManager.require(atlasUrl);
            const atlasLoader = new spineLib.AtlasAttachmentLoader(atlas);
            
            // Create skeleton data
            let skeletonData;
            if (skeletonType === 'json') {
              const skeletonJson = new spineLib.SkeletonJson(atlasLoader);
              skeletonData = skeletonJson.readSkeletonData(assetManager.require(skeletonUrl));
            } else {
              const skeletonBinary = new spineLib.SkeletonBinary(atlasLoader);
              skeletonData = skeletonBinary.readSkeletonData(assetManager.require(skeletonUrl));
            }
            
            // Create skeleton
            this.skeleton = new spineLib.Skeleton(skeletonData);
            
            // CRITICAL: Set the skin to "default" and FILTER OUT placeholder attachments!
            console.log(`[DEBUG POSE] Setting skeleton skin to "default"...`);
            try {
              this.skeleton.setSkinByName("default");
              console.log(`[DEBUG POSE] Skeleton skin set to "default" successfully`);
              
              // CRITICAL FIX: Remove 1x1 placeholder attachments from slots
              this.skeleton.setSlotsToSetupPose(); 
              
              // Filter out placeholder attachments (1x1 pixel regions)
              let placeholderCount = 0;
              if (this.skeleton.slots) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.skeleton.slots.forEach((slot: any) => {
                  if (slot.attachment && slot.attachment.region) {
                    const region = slot.attachment.region;
                    // Check if this is a 1x1 placeholder region
                    if (region.width === 1 && region.height === 1) {
                      console.log(`[DEBUG POSE] Removing placeholder attachment: ${slot.attachment.name} (1x1)`);
                      slot.attachment = null; // Remove the placeholder attachment
                      placeholderCount++;
                    }
                  }
                });
              }
              console.log(`[DEBUG POSE] Removed ${placeholderCount} placeholder attachments`);
              
            } catch (skinError) {
              console.warn(`[DEBUG POSE] Failed to set skin to "default", trying setSkin:`, skinError);
              try {
                // Fallback: try to get the default skin and set it
                const defaultSkin = skeletonData.findSkin("default");
                if (defaultSkin) {
                  this.skeleton.setSkin(defaultSkin);
                  console.log(`[DEBUG POSE] Skeleton skin set using setSkin() successfully`);
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  console.warn(`[DEBUG POSE] No "default" skin found, available skins:`, skeletonData.skins.map((s: any) => s.name));
                  // Try to set the first available skin
                  if (skeletonData.skins.length > 0) {
                    this.skeleton.setSkin(skeletonData.skins[0]);
                    console.log(`[DEBUG POSE] Set skeleton to first available skin: ${skeletonData.skins[0].name}`);
                  }
                }
              } catch (fallbackError) {
                console.error(`[DEBUG POSE] All skin setting methods failed:`, fallbackError);
              }
            }
            
            // Create animation state
            const stateData = new spineLib.AnimationStateData(skeletonData);
            this.animationState = new spineLib.AnimationState(stateData);
            
            // Get available animations
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.availableAnimations = skeletonData.animations.map((anim: any) => anim.name);
            
            console.log(`[DEBUG POSE] Available animations:`, this.availableAnimations);
            
            // Check if v2_pose_default exists
            const hasV2PoseDefault = this.availableAnimations.includes('v2_pose_default');
            const hasPoseDefault = this.availableAnimations.includes('pose_default');
            console.log(`[DEBUG POSE] Has v2_pose_default: ${hasV2PoseDefault}, Has pose_default: ${hasPoseDefault}`);
            
            // Initialize skeleton to setup pose first
            console.log(`[DEBUG POSE] Setting skeleton to setup pose...`);
            this.skeleton.setToSetupPose();
            this.skeleton.updateWorldTransform(spineLib.Physics?.update);
            console.log(`[DEBUG POSE] Setup pose applied and world transform updated`);
            
            // Check attachment count after setup pose
            let visibleAfterSetup = 0;
            if (this.skeleton.slots) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this.skeleton.slots.forEach((slot: any) => {
                if (slot.attachment) visibleAfterSetup++;
              });
            }
            console.log(`[DEBUG POSE] Visible attachments after setup pose: ${visibleAfterSetup}`);
            
            // Try to establish a proper default idle animation instead of pose_default
            let defaultAnimation = null;
            
            // First, determine character type from the chibi value
            console.log(`[DEBUG POSE] Analyzing character type for: ${chibiValue}`);
            
            // Look for character-specific patterns in available animations
            const hasMaleAnimations = this.availableAnimations.some(anim => anim.startsWith('v2_m_'));
            const hasFemaleAnimations = this.availableAnimations.some(anim => anim.startsWith('v2_w_'));
            console.log(`[DEBUG POSE] Character has male animations: ${hasMaleAnimations}, female animations: ${hasFemaleAnimations}`);
            
            // Try to find the most appropriate idle animation
            if (hasMaleAnimations) {
              // Male character - try different male animation types in order of preference
              const maleIdleOptions = [
                'v2_m_normal_idle01_f',
                'v2_m_cool_idle01_f', 
                'v2_m_happy_idle01_f',
                'v2_m_pure_idle01_f',
                'v2_m_silent_idle01_f',
                'v2_m_staff_idle01_f'
              ];
              
              for (const option of maleIdleOptions) {
                if (this.availableAnimations.includes(option)) {
                  defaultAnimation = option;
                  console.log(`[DEBUG POSE] Selected male idle animation: ${defaultAnimation}`);
                  break;
                }
              }
            }
            
            if (!defaultAnimation && hasFemaleAnimations) {
              // Female character - try female animation types
              const femaleIdleOptions = [
                'v2_w_adult_idle01_f',
                'v2_w_adult_idle02_f'
              ];
              
              for (const option of femaleIdleOptions) {
                if (this.availableAnimations.includes(option)) {
                  defaultAnimation = option;
                  console.log(`[DEBUG POSE] Selected female idle animation: ${defaultAnimation}`);
                  break;
                }
              }
            }
            
            // Fallback to general animations if no character-specific ones found
            if (!defaultAnimation) {
              const generalOptions = [
                'v2_n_general_wait_01_f',
                'v2_pose_default',
                'pose_default'
              ];
              
              for (const option of generalOptions) {
                if (this.availableAnimations.includes(option)) {
                  defaultAnimation = option;
                  console.log(`[DEBUG POSE] Selected fallback animation: ${defaultAnimation}`);
                  break;
                }
              }
            }
            
            if (defaultAnimation) {
              console.log(`[DEBUG POSE] Applying default animation: ${defaultAnimation}...`);
              try {
                // Clear any existing animations first
                this.animationState.clearTracks();
                
                // Set the animation with a very short duration to establish pose quickly
                const trackEntry = this.animationState.setAnimation(0, defaultAnimation, false);
                if (trackEntry) {
                  // Force the animation to its end state immediately for pose setup
                  trackEntry.trackTime = trackEntry.animation.duration;
                  console.log(`[DEBUG POSE] Set track time to end: ${trackEntry.animation.duration}s`);
                }
                
                // Apply the animation state to the skeleton multiple times to ensure it takes effect
                this.animationState.apply(this.skeleton);
                this.skeleton.updateWorldTransform(spineLib.Physics?.update);
                
                // Apply again to ensure all constraints are processed
                this.animationState.apply(this.skeleton);
                this.skeleton.updateWorldTransform(spineLib.Physics?.update);
                
                console.log(`[DEBUG POSE] Default animation ${defaultAnimation} applied successfully`);
                
                // Check final attachment count
                let visibleAfterPose = 0;
                if (this.skeleton.slots) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  this.skeleton.slots.forEach((slot: any) => {
                    if (slot.attachment) visibleAfterPose++;
                  });
                }
                console.log(`[DEBUG POSE] Final visible attachments after ${defaultAnimation}: ${visibleAfterPose}`);
                
                // If still too many attachments, try to set it back to looping for ongoing updates
                if (visibleAfterPose > 20) {
                  console.log(`[DEBUG POSE] Still too many attachments (${visibleAfterPose}), setting animation to loop for continuous updates`);
                  this.animationState.setAnimation(0, defaultAnimation, true);
                }
                
              } catch (poseError) {
                console.warn(`[DEBUG POSE] Failed to apply ${defaultAnimation}:`, poseError);
                // Fallback to setup pose only
                this.skeleton.setToSetupPose();
                this.skeleton.updateWorldTransform(spineLib.Physics?.update);
              }
            } else {
              console.warn(`[DEBUG POSE] No suitable default animation found, using setup pose only`);
            }
            
            console.log(`[DEBUG POSE] Initial pose setup completed`);
            
            console.log(`Loaded chibi: ${chibiValue}, Available animations:`, this.availableAnimations);
          } catch (initError) {
            console.error('Error initializing spine app:', initError);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update(_canvas: any, delta: number) {
          // Apply the animation state based on the delta time.
          if (this.animationState && this.skeleton) {
            this.animationState.update(delta);
            this.animationState.apply(this.skeleton);
            
            // Explicitly manage shadow attachment (like in the original working code)
            try {
              this.skeleton.setAttachment("shadow", "shadow"); // Show shadow
            } catch {
              // Shadow slot might not exist, ignore
            }
            
            // Handle physics properly for different skeleton types
            try {
              const isV2 = this.skeleton.constructor.name === 'Skeleton';
              if (isV2 && spineLib.Physics && spineLib.Physics.update !== undefined) {
                // V2 models use the imported Physics enum
                this.skeleton.updateWorldTransform(spineLib.Physics.update);
              } else if (!isV2 && spineLib.Physics && spineLib.Physics.update !== undefined) {
                // V1 models also try to use the available Physics
                this.skeleton.updateWorldTransform(spineLib.Physics.update);
              } else {
                // Fallback for models without physics support
                this.skeleton.updateWorldTransform();
              }
            } catch (physicsError) {
              console.warn("Physics error, using fallback:", physicsError instanceof Error ? physicsError.message : String(physicsError));
              try {
                this.skeleton.updateWorldTransform();
              } catch (fallbackError) {
                console.error("Fallback updateWorldTransform also failed:", fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
                this.skeleton.setToSetupPose();
              }
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        render(canvas: any) {
          const renderer = canvas.renderer;
          
          // Get canvas dimensions
          const currentCanvasWidth = canvas.htmlCanvas.width;
          const currentCanvasHeight = canvas.htmlCanvas.height;
        //   console.log(`[DEBUG] Render called - Canvas dimensions: ${currentCanvasWidth} x ${currentCanvasHeight}`);
          
          // Add safeguard to prevent infinite shrinking
          if (currentCanvasWidth < 10 || currentCanvasHeight < 10) {
            // console.warn(`[DEBUG] Canvas too small (${currentCanvasWidth} x ${currentCanvasHeight}), skipping render to prevent infinite loop`);
            return;
          }
          
          // REMOVED: renderer.resize call that was causing canvas to shrink
          // The canvas should maintain its original size (800x600) as set in the HTML
        //   console.log(`[DEBUG] Canvas maintaining original dimensions without resize`);
          
          // Clear with black background
          canvas.clear(0, 0, 0, 1);
          
          // Render skeleton with proper positioning
          if (this.skeleton) {
            // Debug skeleton state before rendering
            console.log(`[DEBUG RENDER] Skeleton slots count: ${this.skeleton.slots ? this.skeleton.slots.length : 'unknown'}`);
            console.log(`[DEBUG RENDER] Skeleton bones count: ${this.skeleton.bones ? this.skeleton.bones.length : 'unknown'}`);
            
            // Check if skeleton has any visible attachments
            if (this.skeleton.slots) {
              let visibleAttachments = 0;
              let totalSlots = 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              this.skeleton.slots.forEach((slot: any, index: number) => {
                totalSlots++;
                if (slot.attachment) {
                  visibleAttachments++;
                  if (index < 5) { // Log first 5 visible attachments
                    console.log(`[DEBUG RENDER] Slot ${index} (${slot.data?.name || 'unnamed'}): attachment=${slot.attachment?.name || 'unnamed'}, visible=${slot.attachment ? 'yes' : 'no'}`);
                  }
                }
              });
              console.log(`[DEBUG RENDER] Visible attachments: ${visibleAttachments}/${totalSlots} slots`);
              
              if (visibleAttachments > 10) {
                console.warn(`[DEBUG RENDER] WARNING: Too many visible attachments (${visibleAttachments}), this might be the atlas texture issue!`);
              }
            }
            
            // Calculate bounds for proper positioning
            const isV2 = this.skeleton.constructor.name === 'Skeleton';
            let bounds;
            
            try {
              // Try to calculate bounds
            //   console.log(`[DEBUG] Starting bounds calculation for ${isV2 ? 'V2' : 'V1'} model`);
              this.skeleton.setToSetupPose();
              this.skeleton.updateWorldTransform(spineLib.Physics?.update);
              
              const offset = new spineLib.Vector2();
              const size = new spineLib.Vector2();
              this.skeleton.getBounds(offset, size, []);
              
            //   console.log(`[DEBUG] Raw calculated bounds - Offset: (${offset.x.toFixed(2)}, ${offset.y.toFixed(2)}), Size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)})`);
              
              // Override bounds for V2 models which often have incorrect bounds
              if (isV2 && (size.x < 10 || size.y < 10 || size.x > 500 || size.y > 500)) {
                // console.log(`[DEBUG] V2 bounds out of range (${size.x.toFixed(2)} x ${size.y.toFixed(2)}), applying manual override`);
                offset.set(-150, -300);
                size.set(300, 600);
                // console.log(`[DEBUG] V2 manual bounds applied - Offset: (-150, -300), Size: (300, 600)`);
              } else if (!isV2 && (size.x < 10 || size.y < 10)) {
                // console.log(`[DEBUG] V1 bounds too small (${size.x.toFixed(2)} x ${size.y.toFixed(2)}), applying manual override`);
                offset.set(-100, -300);
                size.set(200, 600);
                // console.log(`[DEBUG] V1 manual bounds applied - Offset: (-100, -300), Size: (200, 600)`);
              } else {
                // console.log(`[DEBUG] Using calculated bounds - Offset: (${offset.x.toFixed(2)}, ${offset.y.toFixed(2)}), Size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)})`);
              }
              
              bounds = { offset, size };
            } catch (boundsError) {
            //   console.warn(`[DEBUG] Bounds calculation failed for ${isV2 ? 'V2' : 'V1'} model:`, boundsError);
              console.warn(`[DEBUG] Bounds calculation failed, using fallback:`, boundsError instanceof Error ? boundsError.message : String(boundsError));
              // Use default bounds
              const defaultOffset = new spineLib.Vector2(isV2 ? -150 : -100, -300);
              const defaultSize = new spineLib.Vector2(isV2 ? 300 : 200, 600);
              bounds = { offset: defaultOffset, size: defaultSize };
            //   console.log(`[DEBUG] Using fallback bounds - Offset: (${defaultOffset.x}, ${defaultOffset.y}), Size: (${defaultSize.x}, ${defaultSize.y})`);
            }
            
            // Get canvas dimensions
            const canvasWidth = canvas.htmlCanvas.width;
            const canvasHeight = canvas.htmlCanvas.height;
            // console.log(`[DEBUG] Canvas dimensions: ${canvasWidth} x ${canvasHeight}`);
            
            // Calculate proper scale and position
            const centerX = bounds.offset.x + bounds.size.x / 2;
            const centerY = bounds.offset.y + bounds.size.y / 2;
            // console.log(`[DEBUG] Calculated center: (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`);
            
            const scaleX = bounds.size.x / canvasWidth;
            const scaleY = bounds.size.y / canvasHeight;
            // console.log(`[DEBUG] Scale ratios - X: ${scaleX.toFixed(4)}, Y: ${scaleY.toFixed(4)}`);
            
            let scale = Math.max(scaleX, scaleY) * 1.2; // Add 20% padding
            if (scale < 1) scale = 1;
            // console.log(`[DEBUG] Final scale (with 20% padding): ${scale.toFixed(4)}`);
            
            // Set camera with proper orthographic projection
            const camera = renderer.camera;
            camera.position.x = centerX;
            camera.position.y = centerY;
            camera.zoom = scale;
            // console.log(`[DEBUG] Camera settings - Position: (${centerX.toFixed(2)}, ${centerY.toFixed(2)}), Zoom: ${scale.toFixed(4)}`);
            camera.update();
            
            renderer.begin();
            renderer.drawSkeleton(this.skeleton, true);
            renderer.end();
          }
        }
      }

      // Create and start spine canvas
      const app = new SpineApp();
      const spineCanvas = new spineLib.SpineCanvas(canvasRef.current, { app });
      
      // Wait for assets to load
      await new Promise<void>((resolve, reject) => {
        const checkLoaded = () => {
          if (app.skeleton && app.availableAnimations.length > 0) {
            resolve();
          } else if (spineCanvas.assetManager.hasErrors()) {
            reject(new Error('Failed to load assets'));
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });

      // Store references
      spineCanvasRef.current = spineCanvas;
      loadedDataRef.current = {
        skeleton: app.skeleton,
        animationState: app.animationState,
        spineCanvas: spineCanvas,
        availableAnimations: app.availableAnimations,
        currentAnimation: '',
        animationDuration: 0
      };

      // Update UI state
      setAvailableAnimations(app.availableAnimations);
      
    } catch (error) {
      console.error('Error loading chibi:', error);
      alert(`Failed to load chibi: ${chibiValue}`);
    } finally {
      setIsLoadingChibi(false);
    }
  }, [getAssetPaths]);

  /**
   * Play a specific animation
   */
  const playAnimation = useCallback(async (animationName: string) => {
    if (!loadedDataRef.current) return;

    console.log(`[DEBUG ANIMATION] Starting to play animation: ${animationName}`);
    setIsLoadingAnimation(true);

    try {
      const { animationState, skeleton } = loadedDataRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const skeletonTyped = skeleton as any;
      
      // Debug skeleton state before animation
      console.log(`[DEBUG ANIMATION] Skeleton state before animation - slots: ${skeletonTyped?.slots?.length || 'unknown'}`);
      if (skeletonTyped?.slots) {
        let visibleBefore = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        skeletonTyped.slots.forEach((slot: any) => {
          if (slot.attachment) visibleBefore++;
        });
        console.log(`[DEBUG ANIMATION] Visible attachments before animation: ${visibleBefore}`);
      }
      
      // Set the animation to loop
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trackEntry = (animationState as any).setAnimation(0, animationName, true);
      
      if (trackEntry && trackEntry.animation) {
        // Store animation duration for GIF export
        loadedDataRef.current.animationDuration = trackEntry.animation.duration;
        loadedDataRef.current.currentAnimation = animationName;
        
        console.log(`[DEBUG ANIMATION] Animation set successfully: ${animationName}, Duration: ${trackEntry.animation.duration}s`);
        
        // Apply the animation immediately to see the first frame
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (animationState as any).apply(skeletonTyped);
        
        // Debug skeleton state after animation
        if (skeletonTyped?.slots) {
          let visibleAfter = 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          skeletonTyped.slots.forEach((slot: any) => {
            if (slot.attachment) visibleAfter++;
          });
          console.log(`[DEBUG ANIMATION] Visible attachments after animation: ${visibleAfter}`);
        }
        
        console.log(`Playing animation: ${animationName}, Duration: ${trackEntry.animation.duration}s`);
      }
      
    } catch (error) {
      console.error('[DEBUG ANIMATION] Error playing animation:', error);
      alert(`Failed to play animation: ${animationName}`);
    } finally {
      setIsLoadingAnimation(false);
    }
  }, []);

  /**
   * Export current frame as PNG with transparent background
   */
  const exportPNG = useCallback(() => {
    console.log(`[DEBUG PNG] Starting PNG export...`);
    
    if (!canvasRef.current || !loadedDataRef.current) {
      console.error(`[DEBUG PNG] Export failed - Canvas ref: ${!!canvasRef.current}, Loaded data: ${!!loadedDataRef.current}`);
      alert('No model loaded to export!');
      return;
    }

    console.log(`[DEBUG PNG] Canvas and data available`);
    console.log(`[DEBUG PNG] Canvas dimensions: ${canvasRef.current.width} x ${canvasRef.current.height}`);
    console.log(`[DEBUG PNG] Canvas style: ${canvasRef.current.style.cssText}`);
    console.log(`[DEBUG PNG] Canvas background: ${canvasRef.current.style.backgroundColor}`);

    // Force a render before capturing by triggering the spine canvas
    try {
      const spineCanvas = loadedDataRef.current.spineCanvas;
      console.log(`[DEBUG PNG] Spine canvas available: ${!!spineCanvas}`);
      
      if (spineCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spineCanvasTyped = spineCanvas as any;
        console.log(`[DEBUG PNG] Spine canvas methods: app=${!!spineCanvasTyped.app}, renderer=${!!spineCanvasTyped.renderer}`);
        
        // Try to force a manual render
        if (spineCanvasTyped.app && typeof spineCanvasTyped.app.render === 'function') {
          console.log(`[DEBUG PNG] Forcing manual render via app.render()`);
          spineCanvasTyped.app.render(spineCanvasTyped);
        }
        
        // Alternative: try to trigger a frame update
        if (typeof spineCanvasTyped.render === 'function') {
          console.log(`[DEBUG PNG] Forcing manual render via spineCanvas.render()`);
          spineCanvasTyped.render();
        }
      }
      
      // Wait a frame to ensure render completes
      requestAnimationFrame(() => {
        performCapture();
      });
      
    } catch (renderError) {
      console.warn(`[DEBUG PNG] Could not force render, proceeding with capture:`, renderError);
      performCapture();
    }

    function performCapture() {
      try {
        // Create a temporary canvas with transparent background
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          console.error(`[DEBUG PNG] Failed to get 2D context from temporary canvas`);
          return;
        }

        console.log(`[DEBUG PNG] Temporary canvas created successfully`);

        // Set canvas size
        tempCanvas.width = canvasRef.current!.width;
        tempCanvas.height = canvasRef.current!.height;
        console.log(`[DEBUG PNG] Temporary canvas size set to: ${tempCanvas.width} x ${tempCanvas.height}`);

        // Check if the source canvas has any content
        const sourceCanvas = canvasRef.current!;
        
        // Check if this is a WebGL canvas
        const gl = sourceCanvas.getContext('webgl') || sourceCanvas.getContext('webgl2') || sourceCanvas.getContext('experimental-webgl');
        const sourceCtx = sourceCanvas.getContext('2d');
        
        console.log(`[DEBUG PNG] Canvas contexts - WebGL: ${!!gl}, 2D: ${!!sourceCtx}`);
        
        if (gl && (gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext)) {
          console.log(`[DEBUG PNG] Source is WebGL canvas - using WebGL capture method`);
          
          // Check if preserveDrawingBuffer is enabled
          const contextAttributes = gl.getContextAttributes();
          console.log(`[DEBUG PNG] WebGL context attributes:`, contextAttributes);
          
          // For WebGL canvases, we need to read pixels directly from the WebGL context
          const width = sourceCanvas.width;
          const height = sourceCanvas.height;
          const pixels = new Uint8Array(width * height * 4);
          
          // Read pixels from WebGL context
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
          
          // Check if we have any visible pixels
          let hasNonTransparentPixels = false;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) { // Alpha channel
              hasNonTransparentPixels = true;
              break;
            }
          }
          
          console.log(`[DEBUG PNG] WebGL canvas has visible content: ${hasNonTransparentPixels}`);
          
          // Log a sample of pixel data (first 10 pixels)
          const samplePixels = [];
          for (let i = 0; i < Math.min(40, pixels.length); i += 4) {
            samplePixels.push(`RGBA(${pixels[i]}, ${pixels[i+1]}, ${pixels[i+2]}, ${pixels[i+3]})`);
          }
          console.log(`[DEBUG PNG] First 10 WebGL pixels:`, samplePixels);
          
          if (!hasNonTransparentPixels) {
            console.warn(`[DEBUG PNG] WebGL canvas appears empty - this might be due to preserveDrawingBuffer=false or timing issues`);
            alert('Warning: Canvas appears empty. The WebGL context might be clearing the buffer too quickly. Try exporting immediately after the animation loads.');
          }
          
          // WebGL renders with Y-axis flipped, so we need to flip it back
          console.log(`[DEBUG PNG] Flipping WebGL image data...`);
          const flippedPixels = new Uint8ClampedArray(width * height * 4);
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const srcIndex = ((height - 1 - y) * width + x) * 4;
              const dstIndex = (y * width + x) * 4;
              flippedPixels[dstIndex] = pixels[srcIndex];     // R
              flippedPixels[dstIndex + 1] = pixels[srcIndex + 1]; // G
              flippedPixels[dstIndex + 2] = pixels[srcIndex + 2]; // B
              flippedPixels[dstIndex + 3] = pixels[srcIndex + 3]; // A
            }
          }
          
          const flippedImageData = new ImageData(flippedPixels, width, height);
          ctx.putImageData(flippedImageData, 0, 0);
          console.log(`[DEBUG PNG] WebGL image data copied to temporary canvas`);
          
        } else if (sourceCtx) {
          console.log(`[DEBUG PNG] Source is 2D canvas - using standard capture method`);
          
          const imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
          const pixels = imageData.data;
          let hasNonTransparentPixels = false;
          
          // Check for any non-transparent pixels
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] > 0) { // Alpha channel
              hasNonTransparentPixels = true;
              break;
            }
          }
          
          console.log(`[DEBUG PNG] 2D canvas has visible content: ${hasNonTransparentPixels}`);
          
          // Log a sample of pixel data (first 10 pixels)
          const samplePixels = [];
          for (let i = 0; i < Math.min(40, pixels.length); i += 4) {
            samplePixels.push(`RGBA(${pixels[i]}, ${pixels[i+1]}, ${pixels[i+2]}, ${pixels[i+3]})`);
          }
          console.log(`[DEBUG PNG] First 10 2D pixels:`, samplePixels);
          
          // Draw the current frame (spine-canvas already has transparent background rendering)
          console.log(`[DEBUG PNG] Drawing 2D canvas to temporary canvas...`);
          ctx.drawImage(canvasRef.current!, 0, 0);
          
        } else {
          console.warn(`[DEBUG PNG] Could not get any context from source canvas for analysis`);
          
          // Fallback: try to draw anyway
          console.log(`[DEBUG PNG] Attempting fallback drawImage...`);
          ctx.drawImage(canvasRef.current!, 0, 0);
        }

        // Check if the temporary canvas has content after copying
        const tempImageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const tempPixels = tempImageData.data;
        let tempHasContent = false;
        for (let i = 3; i < tempPixels.length; i += 4) {
          if (tempPixels[i] > 0) {
            tempHasContent = true;
            break;
          }
        }
        console.log(`[DEBUG PNG] Temporary canvas has visible content after copy: ${tempHasContent}`);

        // Convert to blob and download
        console.log(`[DEBUG PNG] Converting canvas to blob...`);
        tempCanvas.toBlob((blob) => {
          if (!blob) {
            console.error(`[DEBUG PNG] Failed to create blob from canvas`);
            return;
          }
          
          console.log(`[DEBUG PNG] Blob created successfully - Size: ${blob.size} bytes, Type: ${blob.type}`);
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedChibi}_${selectedAnimation}_${Date.now()}.png`;
          
          console.log(`[DEBUG PNG] Download link created - Filename: ${link.download}`);
          console.log(`[DEBUG PNG] Blob URL: ${url}`);
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          console.log(`[DEBUG PNG] PNG export completed successfully`);
        }, 'image/png');

      } catch (error) {
        console.error('[DEBUG PNG] Error exporting PNG:', error);
        console.error('[DEBUG PNG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        alert('Failed to export PNG!');
      }
    }
  }, [selectedChibi, selectedAnimation]);

  /**
   * Export animation as GIF with transparent background
   */
  const exportGIF = useCallback(async () => {
    if (!loadedDataRef.current || !selectedAnimation) {
      alert('No animation loaded to export!');
      return;
    }

    setIsExportingGif(true);

    try {
      const { animationState, skeleton, animationDuration } = loadedDataRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spineLib = (window as any).spine;
      
      // Calculate frame count based on duration and FPS
      const frameCount = Math.ceil(animationDuration * exportFps);
      const frameDelay = 1000 / exportFps; // Delay in milliseconds
      
      console.log(`Exporting GIF: ${frameCount} frames at ${exportFps} FPS`);

      // Initialize GIF encoder with transparent background
      const gif = new GIF({
        workers: 2,
        quality: 10,
        transparent: 0x000000, // Set black as transparent
        workerScript: '/gif.worker.js'
      });

      // Reset animation to start
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (animationState as any).setAnimation(0, selectedAnimation, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (skeleton as any).setToSetupPose();

      // Capture frames
      for (let frame = 0; frame < frameCount; frame++) {
        // Update animation to specific time
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (animationState as any).update(1 / exportFps);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (animationState as any).apply(skeleton);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (skeleton as any).updateWorldTransform(spineLib.Physics?.update);

        // Force a render by triggering the canvas update
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            // Create a temporary canvas to capture the frame
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            if (ctx && canvasRef.current) {
              tempCanvas.width = canvasRef.current.width;
              tempCanvas.height = canvasRef.current.height;

              // Copy current frame
              ctx.drawImage(canvasRef.current, 0, 0);

              // Add frame to GIF
              gif.addFrame(tempCanvas, { delay: frameDelay });
            }
            resolve(undefined);
          });
        });
      }

      // Reset animation to loop
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (animationState as any).setAnimation(0, selectedAnimation, true);

      // Render GIF
      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedChibi}_${selectedAnimation}_${exportFps}fps.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setIsExportingGif(false);
      });

      gif.on('progress', (progress: number) => {
        console.log(`GIF export progress: ${Math.round(progress * 100)}%`);
      });

      gif.render();

    } catch (error) {
      console.error('Error exporting GIF:', error);
      alert('Failed to export GIF!');
      setIsExportingGif(false);
    }
  }, [selectedChibi, selectedAnimation, exportFps]);

  /**
   * Handle chibi selection change
   */
  const handleChibiChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const chibiValue = event.target.value;
    setSelectedChibi(chibiValue);
    
    if (chibiValue) {
      loadChibi(chibiValue);
    } else {  
      // Clear current model
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (spineCanvasRef.current && (spineCanvasRef.current as any).dispose) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (spineCanvasRef.current as any).dispose();
        spineCanvasRef.current = null;
      }
      loadedDataRef.current = null;
      setAvailableAnimations([]);
      setSelectedAnimation('');
    }
  }, [loadChibi]);

  /**
   * Handle animation selection change
   */
  const handleAnimationChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const animationName = event.target.value;
    setSelectedAnimation(animationName);
    
    if (animationName) {
      playAnimation(animationName);
    }
  }, [playAnimation]);

  return (
    <div className={className} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Spine Animation Player</h1>
      
      {/* Control Panel */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
        {/* Chibi Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            Select Chibi {isLoadingChibi && <span style={{ color: '#666' }}>Loading...</span>}
          </label>
          <select 
            value={selectedChibi} 
            onChange={handleChibiChange}
            disabled={isLoadingChibi}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">-- Choose a chibi --</option>
            {availableChibis.map(chibi => (
              <option key={chibi.value} value={chibi.value}>
                {chibi.label}
              </option>
            ))}
          </select>
        </div>

        {/* Animation Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            Select Animation {isLoadingAnimation && <span style={{ color: '#666' }}>Loading...</span>}
          </label>
          <select 
            value={selectedAnimation} 
            onChange={handleAnimationChange}
            disabled={!selectedChibi || availableAnimations.length === 0 || isLoadingAnimation}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">-- Choose an animation --</option>
            {availableAnimations.map(animation => (
              <option key={animation} value={animation}>
                {animation}
              </option>
            ))}
          </select>
        </div>

        {/* Export Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>Export</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={exportPNG}
              disabled={!selectedChibi}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #007bff', 
                backgroundColor: '#007bff', 
                color: 'white',
                cursor: selectedChibi ? 'pointer' : 'not-allowed'
              }}
            >
              Export PNG
            </button>
          </div>
        </div>

        {/* GIF Export Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
          <label style={{ marginBottom: '5px', fontWeight: 'bold' }}>
            FPS (Max 60)
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="number" 
              min="1" 
              max="60" 
              value={exportFps}
              onChange={(e) => setExportFps(Math.min(60, Math.max(1, parseInt(e.target.value) || 30)))}
              style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button 
              onClick={exportGIF}
              disabled={!selectedAnimation || isExportingGif}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: '1px solid #28a745', 
                backgroundColor: isExportingGif ? '#ccc' : '#28a745', 
                color: 'white',
                cursor: selectedAnimation && !isExportingGif ? 'pointer' : 'not-allowed'
              }}
            >
              {isExportingGif ? 'Exporting...' : 'Export GIF'}
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div style={{ 
        border: '2px solid #333', 
        borderRadius: '8px', 
        overflow: 'hidden',
        width: 'fit-content',
        backgroundColor: '#000000'
      }}>
        <canvas 
          ref={canvasRef}
          width={800}
          height={600}
          style={{ 
            display: 'block',
            backgroundColor: '#000000'
          }}
        />
      </div>

      {/* Status Information */}
      {selectedChibi && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 5px 0' }}><strong>Loaded Model:</strong> {selectedChibi}</p>
          {selectedAnimation && loadedDataRef.current && (
            <p style={{ margin: '0' }}>
              <strong>Current Animation:</strong> {selectedAnimation} 
              <span style={{ color: '#666', marginLeft: '10px' }}>
                (Duration: {loadedDataRef.current.animationDuration.toFixed(2)}s)
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SpineAnimationPlayer;
