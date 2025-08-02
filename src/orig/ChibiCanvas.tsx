import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Call, buildInputFile } from "wasm-imagemagick";
import { spine } from "./prsk-chibi/spine-webgl.min.js";
import ChibiCustomize from "./ChibiCustomize.jsx";

function loadData(url, cb, loadType, progress) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  if (loadType) xhr.responseType = loadType;
  if (progress) xhr.onprogress = progress;
  xhr.onload = function () {
    // eslint-disable-next-line eqeqeq
    if (xhr.status == 200) cb(true, xhr.response);
    else cb(false);
  };
  xhr.onerror = function () {
    cb(false);
  };
  xhr.send();
}

const saveBlob = (function () {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  return function saveData(blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
  };
})();

async function getGIFFile(imgFiles, callback) {
  let imgNames = "";
  let outputName;
  for (const [key, value] of Object.entries(imgFiles)) {
    // console.log(value);
    imgNames += " " + value.name;
  }
  outputName = "animated.gif";

  var cmd = "convert -dispose Background -delay 1x30";
  cmd += imgNames;
  //   cmd += " -trim -layers TrimBounds +remap -channel A -ordered-dither 2x2 ";
  cmd += " -layers TrimBounds +remap -channel A -ordered-dither 2x2 ";
  cmd += outputName;

  var text = cmd;
  var files = [];
  var command = text
    .trim()
    .split(/\s+/)
    .filter((seg) => {
      if (seg == "\\") return false;
      if (seg.match(/\.(jpg|png|webp|jpeg|gif)$/)) files.push(seg);
      return true;
    });
  console.log(cmd, outputName);

  let processedFiles = await Call(imgFiles, command);

  console.log("Done!");
  const { blob } = processedFiles[0];
  callback(blob);
}

function calculateBounds(skeleton) {
  skeleton.setToSetupPose();
  skeleton.updateWorldTransform();
  var offset = new spine.Vector2();
  var size = new spine.Vector2();
  skeleton.getBounds(offset, size, []);
  offset.y = 0;
  return { offset: offset, size: size };
}

const webGlConfig = { alpha: true };

function ChibiCanvas() {
  const gl = useRef(null);
  const shader = useRef(null);
  const batcher = useRef(null);
  const mvp = useRef(new spine.webgl.Matrix4());
  const skeletonRenderer = useRef(null);
  const debugRenderer = useRef(null);
  const debugShader = useRef(null);
  const shapes = useRef(null);
  const canvas = useRef(null);
  const skeletonInfo = useRef(null);
  const lastFrameTime = useRef(Date.now() / 1000);
  const currentTexture = useRef(null);
  const showShadow = useRef(true);
  const showDebug = useRef(false);

  const [currentChibi, setCurrentChibi] = useState(null);
  const [currentChibiAnimation, setCurrentChibiAnimation] =
    useState("pose_default");
  const [loading, setLoading] = useState(null);
  const [animationPaused, setAnimationPaused] = useState(false);
  const [showShadowHook, setShowShadowHook] = useState(true);
  const [showDebugHook, setShowDebugHook] = useState(false);

  const resize = () => {
    // var useBig = screen.width * devicePixelRatio > 1280;
    // var w = useBig ? 1920 : 1280;
    // var h = useBig ? 1080 : 720;
    // var w = canvas.clientWidth * devicePixelRatio;
    // var h = canvas.clientHeight * devicePixelRatio;
    var w = 275;
    var h = 275;
    var bounds = skeletonInfo.current.bounds;

    // magic
    var centerX = bounds.offset.x + bounds.size.x / 2;
    var centerY = bounds.offset.y + bounds.size.y / 2;
    var scaleX = bounds.size.x / canvas.current.width;
    var scaleY = bounds.size.y / canvas.current.height;
    var scale = Math.max(scaleX, scaleY) * 1.2;
    if (scale < 1) scale = 1;
    var width = canvas.current.width * scale;
    var height = canvas.current.height * scale;

    mvp.current.ortho2d(
      centerX - width / 2,
      centerY - height / 2,
      width,
      height
    );
    gl.current.viewport(0, 0, canvas.current.width, canvas.current.height);
  };

  const render = (staticRender, staticDelta) => {
    const now = Date.now() / 1000;
    let delta = 0;
    if (staticRender !== true) {
      delta = now - lastFrameTime.current;
      lastFrameTime.current = now;
    }
    if (staticDelta) {
      delta = staticDelta;
    }

    // Update the MVP matrix to adjust for canvas size changes
    resize();

    const bgColor = new spine.Color(0 / 255, 0 / 255, 0 / 255, 0);
    gl.current.clearColor(bgColor.r, bgColor.g, bgColor.b, bgColor.a);
    gl.current.clear(gl.current.COLOR_BUFFER_BIT);

    // Apply the animation state based on the delta time.
    const { state, skeleton, premultipliedAlpha } = skeletonInfo.current;
    state.update(delta);
    state.apply(skeleton);
    skeleton.updateWorldTransform();
    if (showShadow.current) {
      skeleton.setAttachment("shadow", "shadow");
    } else {
      skeleton.setAttachment("shadow", null);
    }
    const animationProgress =
      (state.tracks[0].animationLast - state.tracks[0].animationStart) /
      (state.tracks[0].animationEnd - state.tracks[0].animationStart);
    // console.log(animationProgress);

    // Bind the shader and set the texture and model-view-projection matrix.
    shader.current.bind();
    shader.current.setUniformi(spine.webgl.Shader.SAMPLER, 0);
    shader.current.setUniform4x4f(
      spine.webgl.Shader.MVP_MATRIX,
      mvp.current.values
    );

    // Start the batch and tell the SkeletonRenderer to render the active skeleton.
    batcher.current.begin(shader.current);
    skeletonRenderer.current.premultipliedAlpha = premultipliedAlpha;
    skeletonRenderer.current.draw(batcher.current, skeleton);
    batcher.current.end();

    shader.current.unbind();

    // draw debug information
    if (showDebug.current) {
      debugShader.current.bind();
      debugShader.current.setUniform4x4f(
        spine.webgl.Shader.MVP_MATRIX,
        mvp.current.values
      );
      debugRenderer.current.premultipliedAlpha = premultipliedAlpha;
      shapes.current.begin(debugShader.current);
      debugRenderer.current.draw(shapes.current, skeleton);
      shapes.current.end();
      debugShader.current.unbind();
    }

    if (!animationPaused) requestAnimationFrame(render);
  };

  const captureStatic = () => {
    render(true);
    canvas.current.toBlob((blob) => {
      saveBlob(blob, `screencapture-${Date.now() / 1000}.png`);
    });
  };
  const captureAnimated = () => {
    setAnimationPaused(true);
    setLoading("Processing...");
    const { state } = skeletonInfo.current;
    state.setAnimation(0, currentChibiAnimation, false);

    let animationDone = false;
    let frame = 0;
    let frameNameCounter = 0;
    let blobFrameArray = [];

    state.addListener({
      complete: () => {
        animationDone = true;
      },
    });
    function renderAnimation(callback) {
      render(true, 1 / 30);
      canvas.current.toBlob((blob) => {
        buildInputFile(
          window.URL.createObjectURL(blob),
          `f${frameNameCounter}`
        ).then((result) => {
          blobFrameArray.push(result);
          frameNameCounter += 1;
          frame += 1;
          //   console.log(frame);
          if (!animationDone && frame < 1000) renderAnimation(callback);
          else callback();
        });
      }, "image/png");
    }

    renderAnimation(() => {
      getGIFFile(blobFrameArray, (blob) => {
        saveBlob(blob, "animated.gif");
        setAnimationPaused(false);
        setLoading(false);
        state.setAnimation(0, currentChibiAnimation, true);
      });
    });
  };

  useEffect(() => {
    gl.current =
      canvas.current.getContext("webgl", webGlConfig) ||
      canvas.current.getContext("experimental-webgl", webGlConfig);
    if (!gl) {
      alert("WebGL is unavailable.");
      // return;
    }

    shader.current = spine.webgl.Shader.newTwoColoredTextured(gl.current);
    batcher.current = new spine.webgl.PolygonBatcher(gl.current);
    mvp.current.ortho2d(
      0,
      0,
      canvas.current.width - 1,
      canvas.current.height - 1
    );
    skeletonRenderer.current = new spine.webgl.SkeletonRenderer(gl.current);
    debugRenderer.current = new spine.webgl.SkeletonDebugRenderer(gl.current);
    debugRenderer.current.drawRegionAttachments = true;
    debugRenderer.current.drawBoundingBoxes = true;
    debugRenderer.current.drawMeshHull = true;
    debugRenderer.current.drawMeshTriangles = true;
    debugRenderer.current.drawPaths = true;
    debugShader.current = spine.webgl.Shader.newColored(gl.current);
    shapes.current = new spine.webgl.ShapeRenderer(gl.current);

    setCurrentChibi("sd_11akito_unit");
  }, []);

  useEffect(() => {
    if (currentChibi) {
      console.log(currentChibi);
      setLoading(true);
      loadData(
        "https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/base_model/sekai_skeleton.skel",
        (success, data) => {
          if (!success || data === null) return;
          const baseSkeleton = data;
          loadData(
            `https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${currentChibi}/sekai_atlas.atlas`,
            (success, atlasText) => {
              if (!success) return;
              loadData(
                `https://assets.pjsek.ai/file/pjsekai-assets/startapp/area_sd/${currentChibi}/sekai_atlas.png`,
                (success, blob) => {
                  if (!success) return;
                  const img = new Image();
                  img.onload = function () {
                    const created = skeletonInfo.current?.skeleton;
                    if (created) {
                      skeletonInfo.current.state.clearTracks();
                      skeletonInfo.current.state.clearListeners();
                      gl.current.deleteTexture(currentTexture.current.texture);
                    }

                    const imgTexture = new spine.webgl.GLTexture(
                      gl.current,
                      img
                    );
                    URL.revokeObjectURL(img.src);
                    let atlas = new spine.TextureAtlas(
                      atlasText,
                      () => imgTexture
                    );
                    currentTexture.current = imgTexture;
                    let atlasLoader = new spine.AtlasAttachmentLoader(atlas);

                    //assume always no more than 128 animations
                    const newBuff = new Uint8Array(baseSkeleton.byteLength + 1);
                    newBuff.set(new Uint8Array(baseSkeleton), 0);

                    const skeletonBinary = new spine.SkeletonBinary(
                      atlasLoader
                    );
                    const skeletonData = skeletonBinary.readSkeletonData(
                      newBuff.buffer
                    );
                    const skeletonNew = new spine.Skeleton(skeletonData);
                    skeletonNew.setSkinByName("default");
                    const bounds = calculateBounds(skeletonNew);

                    const animationStateData = new spine.AnimationStateData(
                      skeletonNew.data
                    );
                    const animationState = new spine.AnimationState(
                      animationStateData
                    );
                    console.log(skeletonNew);
                    animationState.setAnimation(0, currentChibiAnimation, true);

                    skeletonInfo.current = {
                      skeleton: skeletonNew,
                      state: animationState,
                      bounds: bounds,
                      premultipliedAlpha: true,
                      animations: skeletonNew.data.animations,
                    };
                    if (!created) {
                      requestAnimationFrame(render);
                    }
                    setLoading(false);
                  };
                  img.src = URL.createObjectURL(blob);
                },
                "blob"
              );
            }
          );
        },
        "arraybuffer"
      );
    }
  }, [currentChibi, showShadow, showDebug]);

  useEffect(() => {
    if (currentChibiAnimation && skeletonInfo?.current?.skeleton) {
      skeletonInfo.current.state.setAnimation(0, currentChibiAnimation, true);
    }
  }, [currentChibiAnimation]);

  useEffect(() => {
    showShadow.current = showShadowHook;
  }, [showShadowHook]);
  useEffect(() => {
    showDebug.current = showDebugHook;
  }, [showDebugHook]);

  return (
    <ChibiCustomize
      {...{
        currentChibi,
        setCurrentChibi,
        currentChibiAnimation,
        setCurrentChibiAnimation,
        showShadowHook,
        setShowShadowHook,
        showDebugHook,
        setShowDebugHook,
        captureStatic,
        captureAnimated,
        canvas,
        loading,
      }}
    />
  );
}

export default ChibiCanvas;
