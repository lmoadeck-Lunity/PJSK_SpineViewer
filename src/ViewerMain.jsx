import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as Spine from '@esotericsoftware/spine-webgl'; // Use for v2 chibis
import GIF from 'gif.js';
// import list123 from './chibi_list.json';
import chibi_ls from './chibi_v2.json'; // Updated to use v2 chibi list
import v2AnimationsList from './v2_animations.json';
// import WebView from './WebView.tsx';
import WebView from './temp_webview';
    // let lastFrameTime = Date.now() / 1000;
	// // let canvas, context;
	// // let assetManager;
	// let skeleton, animationState, bounds;
    // let ctx;
    // let mvp = new Spine.Matrix4();
    // let canvas;
    // let ctxx;
    // let shader;
    // let batcher;
    // // let mvp = new spine.Matrix4();
    // let skeletonRenderer;
    // let assetManager;

    // let debugRenderer;
    // let debugShader;
    // let shapes;

    // let skeletons = {};
    // // let format = "JSON";
    // // let activeSkeleton = "mizuki";
    // const v2_skel = "Files/skeleton/v2_sd_main.json";
    // /** 
    //       loadData(
    //     "https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/base_model/sekai_skeleton.skel",
    //     (success, data) => {
    //       if (!success || data === null) return;
    //       const baseSkeleton = data;
    //       loadData(
    //         `https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${currentChibi}/sekai_atlas.atlas`,
    //         (success, atlasText) => {
    //           if (!success) return;
    //           loadData(
    //             `https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${currentChibi}/sekai_atlas.png`,
    //             */
    // // const v1_skel = 
    // let isRecording = false;
	// // let skeletonRenderer;

    // function v1_chibi_atlas(name) {
    //     return `Files/out/${name}/sekai_atlas/sekai_atlas.atlas.txt`;
        
    // }
function ViewerMain(props, ref) {
    // Utility function to get the correct base URL for file loading
    const getBaseUrl = useCallback(() => {
        // Check if we're in development
        // const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // if (isDev) {
        //     return '/';
        // }
        
        // // For production, try to detect the correct base from the current URL
        // const pathname = window.location.pathname;
        
        // // Common GitHub Pages patterns
        // if (pathname.includes('/PJSK_SpineViewer/')) {
        //     return '/PJSK_SpineViewer/';
        // } else if (pathname.includes('/potential-adventure/')) {
        //     return '/potential-adventure/';
        // }
        
        // Fallback to the configured base URL
        return import.meta.env.BASE_URL || '/';
    }, []);

    const [chibiData, setChibiData] = useState({
        chibis: [],
        animations: [],
        isLoading: false,
        error: null
    });

    const [spineSystem, setSpineSystem] = useState({
        isInitialized: false,
        currentSkeleton: null,
        currentAnimation: null
    });

    const canvasRef = useRef(null);
    
    // Spine system refs to persist across renders
    const spineRefs = useRef({
        ctx: null,
        mvp: null,
        skeletonRenderer: null,
        assetManager: null,
        debugRenderer: null,
        debugShader: null,
        shapes: null,
        shader: null,
        batcher: null,
        lastFrameTime: null,
        skeletons: {},
        isRecording: false,
        renderLoopId: null // Track the current render loop
    });

    // Filter v2 chibis from the chibi list
    const v2ChibiList = chibi_ls;

    useImperativeHandle(ref, () => ({
        canvas: canvasRef.current,
        loadChibi,
        playAnimation,
        exportGIF,
        getSkeletonData: () => spineSystem.currentSkeleton,
        getAnimationData: () => spineSystem.currentAnimation
    }));

    function fileExists(url) {
        // Always use the base URL since Vite is configured with base: '/potential-adventure/'
        const baseUrl = getBaseUrl();
        
        let fetchUrl;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            fetchUrl = url;
        } else if (url.startsWith('/')) {
            fetchUrl = baseUrl + url.substring(1); // Remove leading slash and add to base
        } else {
            fetchUrl = baseUrl + url;
        }
        
        console.log('Checking file exists:', url, '-> fetch URL:', fetchUrl);
        
        return fetch(fetchUrl, { method: 'HEAD' })
            .then(response => {
                console.log('File check response:', response.status, response.ok, response.url);
                return response.ok;
            })
            .catch((error) => {
                console.error('File check error:', error);
                return false;
            });
    }

    function buildChibiPath(name) {
        const path = `Files/out/${name}/sekai_atlas/sekai_atlas.atlas.txt`;
        console.log('Building chibi path for:', name, '-> path:', path);
        return path;
    }

    const initializeSpineSystem = useCallback(() => {
        if (!canvasRef.current) return false;

        try {
            canvasRef.current.width = 512;
            canvasRef.current.height = 512;

            const config = { alpha: true, preserveDrawingBuffer: true };
            spineRefs.current.ctx = new Spine.ManagedWebGLRenderingContext(canvasRef.current, config);
            
            spineRefs.current.shader = Spine.Shader.newTwoColoredTextured(spineRefs.current.ctx);
            spineRefs.current.batcher = new Spine.PolygonBatcher(spineRefs.current.ctx);
            spineRefs.current.mvp = new Spine.Matrix4();
            spineRefs.current.mvp.ortho2d(0, 0, canvasRef.current.width, canvasRef.current.height);
            spineRefs.current.skeletonRenderer = new Spine.SkeletonRenderer(spineRefs.current.ctx);
            
            // Always use the base URL since Vite is configured with base: '/potential-adventure/'
            spineRefs.current.assetManager = new Spine.AssetManager(spineRefs.current.ctx, getBaseUrl());

            spineRefs.current.debugRenderer = new Spine.SkeletonDebugRenderer(spineRefs.current.ctx);
            spineRefs.current.debugRenderer.drawRegionAttachments = true;
            spineRefs.current.debugRenderer.drawBoundingBoxes = true;
            spineRefs.current.debugRenderer.drawMeshHull = true;
            spineRefs.current.debugRenderer.drawMeshTriangles = true;
            spineRefs.current.debugRenderer.drawPaths = true;
            spineRefs.current.debugShader = Spine.Shader.newColored(spineRefs.current.ctx);
            spineRefs.current.shapes = new Spine.ShapeRenderer(spineRefs.current.ctx);

            setSpineSystem(prev => ({ ...prev, isInitialized: true }));
            return true;
        } catch (error) {
            console.error('Failed to initialize Spine system:', error);
            setChibiData(prev => ({ ...prev, error: 'Failed to initialize WebGL/Spine system' }));
            return false;
        }
    }, [getBaseUrl]);

    function calculateSetupPoseBounds(skeleton) {
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform();
        const offset = new Spine.Vector2();
        const size = new Spine.Vector2();
        skeleton.getBounds(offset, size, []);
        return { offset: offset, size: size };
    }

    async function loadSkeleton(skeletonPath, atlasPath, initialAnimation = "v2_m_happy_laugh01_f", premultipliedAlpha = true, skin = "default") {
        try {
            const atlas = spineRefs.current.assetManager.get(atlasPath);
            if (!atlas) {
                console.error("Atlas not found in asset manager:", atlasPath);
                return null;
            }

            const atlasLoader = new Spine.AtlasAttachmentLoader(atlas);
            const skeletonLoader = skeletonPath.endsWith(".skel") 
                ? new Spine.SkeletonBinary(atlasLoader) 
                : new Spine.SkeletonJson(atlasLoader);
            skeletonLoader.scale = 1;

            const skeletonData = skeletonLoader.readSkeletonData(spineRefs.current.assetManager.get(skeletonPath));
            const skeleton = new Spine.Skeleton(skeletonData);
            skeleton.setSkinByName(skin);
            
            const bounds = calculateSetupPoseBounds(skeleton);

            const animationStateData = new Spine.AnimationStateData(skeleton.data);
            const animationState = new Spine.AnimationState(animationStateData);
            
            // Only set animation if it exists
            const availableAnimations = skeletonData.animations.map(anim => anim.name);
            if (availableAnimations.includes(initialAnimation)) {
                animationState.setAnimation(0, initialAnimation, true);
            } else if (availableAnimations.length > 0) {
                animationState.setAnimation(0, availableAnimations[0], true);
            }

            return { 
                skeleton, 
                state: animationState, 
                bounds, 
                premultipliedAlpha, 
                stateData: animationStateData,
                availableAnimations
            };
        } catch (error) {
            console.error("Error loading skeleton:", skeletonPath, error);
            return null;
        }
    }

    async function loadChibi(chibiName) {
        if (!spineSystem.isInitialized) {
            if (!initializeSpineSystem()) {
                return false;
            }
        }

        // Stop current render loop to prevent multiple loops
        stopRenderLoop();

        setChibiData(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const skeletonPath = "Files/skeleton/v2_sd_main.json";
            const atlasPath = buildChibiPath(chibiName);
            
            console.log('Loading chibi:', chibiName);
            console.log('Atlas path:', atlasPath);

            // Check if files exist
            const atlasExists = await fileExists(atlasPath);
            const skeletonExists = await fileExists(skeletonPath);
            
            if (!atlasExists || !skeletonExists) {
                throw new Error(`Files not found - Atlas: ${atlasExists ? 'OK' : 'MISSING'}, Skeleton: ${skeletonExists ? 'OK' : 'MISSING'}`);
            }

            // Clear previous skeleton data to prevent memory issues
            if (spineRefs.current.skeletons[chibiName]) {
                delete spineRefs.current.skeletons[chibiName];
            }

            // Dispose of asset manager resources if they exist
            if (spineRefs.current.assetManager) {
                // Remove existing assets for this path to prevent conflicts
                if (spineRefs.current.assetManager.get(atlasPath)) {
                    spineRefs.current.assetManager.remove(atlasPath);
                }
                if (spineRefs.current.assetManager.get(skeletonPath)) {
                    spineRefs.current.assetManager.remove(skeletonPath);
                }
            }

            // Load assets
            spineRefs.current.assetManager.loadText(skeletonPath);
            spineRefs.current.assetManager.loadTextureAtlas(atlasPath);

            // Wait for assets to load
            return new Promise((resolve) => {
                function checkLoading() {
                    if (spineRefs.current.assetManager.isLoadingComplete()) {
                        loadSkeletonData(chibiName, skeletonPath, atlasPath)
                            .then(resolve)
                            .catch(() => resolve(false));
                    } else {
                        requestAnimationFrame(checkLoading);
                    }
                }
                checkLoading();
            });
        } catch (error) {
            console.error('Error loading chibi:', error);
            setChibiData(prev => ({ 
                ...prev, 
                isLoading: false, 
                error: error.message 
            }));
            return false;
        }
    }

    async function loadSkeletonData(chibiName, skeletonPath, atlasPath) {
        try {
            const skeletonData = await loadSkeleton(skeletonPath, atlasPath);
            if (!skeletonData) {
                throw new Error('Failed to load skeleton data');
            }

            spineRefs.current.skeletons[chibiName] = skeletonData;
            
            setChibiData(prev => ({
                ...prev,
                isLoading: false,
                chibis: [...prev.chibis.filter(c => c.name !== chibiName), {
                    name: chibiName,
                    skeletonData,
                    loaded: true
                }],
                animations: skeletonData.availableAnimations
            }));

            setSpineSystem(prev => ({
                ...prev,
                currentSkeleton: skeletonData,
                currentAnimation: skeletonData.availableAnimations[0] || null
            }));

            // Reset frame time and restart render loop
            spineRefs.current.lastFrameTime = Date.now() / 1000;
            startRenderLoop();

            return true;
        } catch (error) {
            console.error('Error in loadSkeletonData:', error);
            setChibiData(prev => ({ 
                ...prev, 
                isLoading: false, 
                error: error.message 
            }));
            return false;
        }
    }

    function playAnimation(animationName) {
        if (!spineSystem.currentSkeleton || !spineSystem.currentSkeleton.state) {
            console.warn('No skeleton loaded');
            return false;
        }

        try {
            spineSystem.currentSkeleton.state.setAnimation(0, animationName, true);
            setSpineSystem(prev => ({ ...prev, currentAnimation: animationName }));
            return true;
        } catch (error) {
            console.error('Error playing animation:', error);
            return false;
        }
    }

    const renderSkeleton = useCallback((skeleton, state, delta) => {
        if (!skeleton || !state || !spineRefs.current.ctx) return;

        state.update(delta);
        state.apply(skeleton);
        skeleton.updateWorldTransform();

        const gl = spineRefs.current.ctx.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        spineRefs.current.shader.bind();
        spineRefs.current.shader.setUniformi(Spine.Shader.SAMPLER, 0);
        spineRefs.current.shader.setUniform4x4f(Spine.Shader.MVP_MATRIX, spineRefs.current.mvp.values);

        spineRefs.current.batcher.begin(spineRefs.current.shader);
        spineRefs.current.skeletonRenderer.premultipliedAlpha = spineSystem.currentSkeleton?.premultipliedAlpha || true;
        spineRefs.current.skeletonRenderer.draw(spineRefs.current.batcher, skeleton);
        spineRefs.current.batcher.end();
        spineRefs.current.shader.unbind();
    }, [spineSystem.currentSkeleton]);

    const resize = useCallback(() => {
        if (!spineSystem.currentSkeleton?.bounds || !canvasRef.current) return;

        const bounds = spineSystem.currentSkeleton.bounds;
        const centerX = bounds.offset.x + bounds.size.x / 2;
        const centerY = bounds.offset.y + bounds.size.y / 2;
        
        let scale = Math.max(bounds.size.x / canvasRef.current.width, bounds.size.y / canvasRef.current.height) * 1.2;
        if (scale < 1) scale = 1;

        const width = canvasRef.current.width * scale;
        const height = canvasRef.current.height * scale;

        spineRefs.current.mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
        spineRefs.current.ctx.gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
    }, [spineSystem.currentSkeleton]);

    const startRenderLoop = useCallback(() => {
        if (!spineSystem.isInitialized || spineRefs.current.isRecording) return;

        // Cancel any existing render loop to prevent multiple loops
        if (spineRefs.current.renderLoopId) {
            cancelAnimationFrame(spineRefs.current.renderLoopId);
        }

        function renderFrame() {
            const now = Date.now() / 1000;
            const delta = now - (spineRefs.current.lastFrameTime || now);
            spineRefs.current.lastFrameTime = now;

            if (spineSystem.currentSkeleton?.skeleton && spineSystem.currentSkeleton?.state) {
                resize();
                renderSkeleton(
                    spineSystem.currentSkeleton.skeleton, 
                    spineSystem.currentSkeleton.state, 
                    delta
                );
            }

            spineRefs.current.renderLoopId = requestAnimationFrame(renderFrame);
        }

        spineRefs.current.renderLoopId = requestAnimationFrame(renderFrame);
    }, [spineSystem.isInitialized, spineSystem.currentSkeleton, resize, renderSkeleton]);

    const stopRenderLoop = useCallback(() => {
        if (spineRefs.current.renderLoopId) {
            cancelAnimationFrame(spineRefs.current.renderLoopId);
            spineRefs.current.renderLoopId = null;
        }
    }, []);

    async function exportGIF(animationName, fps = 30) {
        if (!spineSystem.currentSkeleton || !canvasRef.current) {
            console.error('No skeleton loaded or canvas not available');
            return false;
        }

        // Stop the render loop during recording
        stopRenderLoop();
        spineRefs.current.isRecording = true;
        setChibiData(prev => ({ ...prev, isLoading: true }));

        try {
            // Fetch GIF.js worker script
            let workerScriptURL;
            try {
                const workerScriptContent = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(res => res.text());
                const blob = new Blob([workerScriptContent], { type: 'application/javascript' });
                workerScriptURL = URL.createObjectURL(blob);
            } catch (e) {
                console.error("Failed to fetch worker script:", e);
                throw new Error("Could not load GIF worker");
            }

            const skeleton = spineSystem.currentSkeleton.skeleton;
            const state = spineSystem.currentSkeleton.state;
            const stateData = spineSystem.currentSkeleton.stateData;
            
            // Find the animation and get its duration
            const animation = stateData.skeletonData.findAnimation(animationName);
            if (!animation) {
                throw new Error(`Animation '${animationName}' not found`);
            }
            const duration = animation.duration;
            
            // Set animation to non-looping for recording
            state.setAnimation(0, animationName, false);

            // Initialize GIF encoder like in index.html
            const gif = new GIF({
                workers: 2,
                quality: 10,
                workerScript: workerScriptURL,
                width: canvasRef.current.width,
                height: canvasRef.current.height,
                transparent: 0x00000000 
            });

            return new Promise((resolve, reject) => {
                gif.on('finished', function(blob) {
                    URL.revokeObjectURL(workerScriptURL);

                    // Download the GIF
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${spineSystem.currentSkeleton?.name || 'chibi'}-${animationName}.gif`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    // Reset state and restart render loop
                    spineRefs.current.isRecording = false;
                    setChibiData(prev => ({ ...prev, isLoading: false }));
                    state.setAnimation(0, animationName, true); // Resume looping
                    spineRefs.current.lastFrameTime = Date.now() / 1000; // Reset frame time
                    startRenderLoop(); // Restart the render loop
                    resolve(true);
                });
                
                gif.on('progress', function(p) {
                    console.log(`GIF rendering progress: ${Math.round(p * 100)}%`);
                    setChibiData(prev => ({ ...prev, isLoading: true }));
                });

                gif.on('abort', function() {
                    URL.revokeObjectURL(workerScriptURL);
                    spineRefs.current.isRecording = false;
                    setChibiData(prev => ({ ...prev, isLoading: false }));
                    startRenderLoop(); // Restart render loop even on abort
                    reject(new Error('GIF export was aborted'));
                });

                // Capture frames
                let time = 0;
                const frameTime = 1 / fps;
                
                function captureFrame() {
                    if (time >= duration) {
                        gif.render();
                        return;
                    }
                    
                    // Render frame - use renderSkeleton function for consistency
                    renderSkeleton(skeleton, state, time === 0 ? 0 : frameTime);
                    
                    // Add frame to GIF
                    gif.addFrame(canvasRef.current, { copy: true, delay: frameTime * 1000 });
                    time += frameTime;
                    
                    requestAnimationFrame(captureFrame);
                }
                
                captureFrame();
            });

        } catch (error) {
            console.error('Error exporting GIF:', error);
            spineRefs.current.isRecording = false;
            setChibiData(prev => ({ ...prev, isLoading: false, error: error.message }));
            startRenderLoop(); // Restart render loop on error
            return false;
        }
    }

    useEffect(() => {
        if (canvasRef.current && !spineSystem.isInitialized) {
            initializeSpineSystem();
        }
    }, [initializeSpineSystem, spineSystem.isInitialized]);

    useEffect(() => {
        // Only start render loop if we have a skeleton and no loop is currently running
        if (spineSystem.isInitialized && spineSystem.currentSkeleton && !spineRefs.current.renderLoopId) {
            startRenderLoop();
        }
        
        // Cleanup function to stop render loop when component unmounts
        return () => {
            stopRenderLoop();
        };
    }, [spineSystem.isInitialized, spineSystem.currentSkeleton, startRenderLoop, stopRenderLoop]);

    // Prepare data for WebView
    const webViewData = {
        canvas: canvasRef,
        chibis: v2ChibiList,
        animations: v2AnimationsList,
        isLoading: chibiData.isLoading,
        error: chibiData.error,
        currentChibi: spineSystem.currentSkeleton ? 
            v2ChibiList.find(c => chibiData.chibis.some(loaded => loaded.name === c.value)) : null,
        currentAnimation: spineSystem.currentAnimation,
        onChibiSelect: loadChibi,
        onAnimationSelect: playAnimation,
        onExportGIF: exportGIF
    };

    return (
        <main style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
            <WebView {...webViewData} />
        </main>
    );
}

export default forwardRef(ViewerMain);


/**
 * 
 * <div style={{width: '100%', height: '100%', paddingTop: 8, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
    <div data-leading-icon="False" data-show-supporting-text="false" data-state="Focused" data-style="Outlined" data-text-configurations="Input text" data-trailing-icon="True" style={{alignSelf: 'stretch', height: 56, borderTopLeftRadius: 4, borderTopRightRadius: 4, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex'}}>
        <div style={{alignSelf: 'stretch', flex: '1 1 0', borderRadius: 4, outline: '3px var(--Schemes-Primary, #FFB2BD) solid', outlineOffset: '-3px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'flex'}}>
            <div style={{alignSelf: 'stretch', flex: '1 1 0', paddingTop: 4, paddingBottom: 4, paddingLeft: 16, borderTopLeftRadius: 4, borderTopRightRadius: 4, justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, display: 'inline-flex'}}>
                <div style={{flex: '1 1 0', height: 48, paddingTop: 4, paddingBottom: 4, position: 'relative', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', display: 'inline-flex'}}>
                    <div style={{alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex'}}>
                        <div style={{justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Schemes-On-Surface, #F0DEDF)', fontSize: 16, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 24, letterSpacing: 0.50, wordWrap: 'break-word'}}>Input</div>
                    </div>
                    <div style={{paddingLeft: 4, paddingRight: 4, left: -4, top: -12, position: 'absolute', background: 'var(--Schemes-Surface, #191112)', justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex'}}>
                        <div style={{color: 'var(--Schemes-Primary, #FFB2BD)', fontSize: 12, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 16, letterSpacing: 0.40, wordWrap: 'break-word'}}>Label</div>
                    </div>
                </div>
                <div data-size="Small" data-style="Standard" data-type="Round" data-width="Default" style={{width: 48, height: 48, justifyContent: 'center', alignItems: 'center', display: 'flex'}}>
                    <div data-state="Enabled" style={{width: 40, overflow: 'hidden', borderRadius: 100, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', display: 'inline-flex'}}>
                        <div style={{alignSelf: 'stretch', height: 40, justifyContent: 'center', alignItems: 'center', display: 'inline-flex'}}>
                            <div style={{width: 24, height: 24, position: 'relative'}}>
                                <div style={{width: 20, height: 20, left: 2, top: 2, position: 'absolute', background: 'var(--Schemes-On-Surface-Variant, #D7C2C3)'}} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div data-density="0" data-show-scrollbar="false" style={{width: 200, maxWidth: 280, minWidth: 112, paddingTop: 8, paddingBottom: 8, background: 'var(--Schemes-Surface-Container, #261D1E)', boxShadow: '0px 2px 6px 2px rgba(0, 0, 0, 0.15)', borderRadius: 4, justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
        <div style={{flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
            <div data-show-divider="false" data-show-leading-element="false" data-show-supporting-text="false" data-show-trailing-element="false" data-state="Enabled" style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex'}}>
                <div style={{alignSelf: 'stretch', height: 56, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex'}}>
                    <div style={{flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
                        <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Schemes-On-Surface, #F0DEDF)', fontSize: 16, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 24, letterSpacing: 0.50, wordWrap: 'break-word'}}>Menu item</div>
                    </div>
                </div>
            </div>
            <div data-show-divider="false" data-show-leading-element="false" data-show-supporting-text="false" data-show-trailing-element="false" data-state="Enabled" style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex'}}>
                <div style={{alignSelf: 'stretch', height: 56, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex'}}>
                    <div style={{flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
                        <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Schemes-On-Surface, #F0DEDF)', fontSize: 16, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 24, letterSpacing: 0.50, wordWrap: 'break-word'}}>Menu item</div>
                    </div>
                </div>
            </div>
            <div data-show-divider="false" data-show-leading-element="false" data-show-supporting-text="false" data-show-trailing-element="false" data-state="Enabled" style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex'}}>
                <div style={{alignSelf: 'stretch', height: 56, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex'}}>
                    <div style={{flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
                        <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Schemes-On-Surface, #F0DEDF)', fontSize: 16, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 24, letterSpacing: 0.50, wordWrap: 'break-word'}}>Menu item</div>
                    </div>
                </div>
            </div>
            <div data-show-divider="false" data-show-leading-element="false" data-show-supporting-text="false" data-show-trailing-element="false" data-state="Enabled" style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'flex'}}>
                <div style={{alignSelf: 'stretch', height: 56, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex'}}>
                    <div style={{flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex'}}>
                        <div style={{alignSelf: 'stretch', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'var(--Schemes-On-Surface, #F0DEDF)', fontSize: 16, fontFamily: 'Roboto', fontWeight: '400', lineHeight: 24, letterSpacing: 0.50, wordWrap: 'break-word'}}>Menu item</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
 * 
 */