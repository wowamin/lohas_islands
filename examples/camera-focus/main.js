import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';

/** 可獨立掛載／卸載的示範；不讀寫遊戲或存檔。 */
export function createFocusDemo(host) {
  if (!(host instanceof HTMLElement)) throw new Error('請提供有效的場景容器');

  // 1. Scene、PerspectiveCamera、renderer 與 OrbitControls。
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f4f8);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', '可拖曳旋轉、點擊島嶼聚焦的 3D 場景');

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 3;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sunlight = new THREE.DirectionalLight(0xffffff, 2);
  sunlight.position.set(10, 20, 15);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, {
    left: -14, right: 14, top: 14, bottom: -14, near: 0.5, far: 60,
  });
  sunlight.shadow.camera.updateProjectionMatrix();
  scene.add(sunlight);

  // 2. 共用幾何。父容器刻意平移／旋轉，示範世界座標的必要性。
  const clickableObjects = [];
  const geometries = [
    new THREE.CylinderGeometry(1.6, 1.6, 0.6, 6),
    new THREE.BoxGeometry(0.8, 0.8, 0.8),
    new THREE.PlaneGeometry(60, 60),
  ];
  const materials = [];
  const islands = new THREE.Group();
  islands.position.set(1, 0.35, -0.7);
  islands.rotation.y = 0.25;
  scene.add(islands);

  const colors = [0x5b8ff9, 0x5ad8a6, 0x9b8fc9, 0xf6bd63, 0xe89b91];
  const detailMaterial = new THREE.MeshStandardMaterial({ color: 0xfff7e8, roughness: 0.7 });
  materials.push(detailMaterial);
  colors.forEach((color, index) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05 });
    materials.push(material);
    const island = new THREE.Mesh(geometries[0], material);
    const angle = index / colors.length * Math.PI * 2;
    island.position.set(Math.cos(angle) * 6, 0, Math.sin(angle) * 6);
    island.name = `島嶼節點 ${index + 1}`;
    island.castShadow = true;
    island.receiveShadow = true;
    islands.add(island);
    clickableObjects.push(island);

    // 遞迴命中子物件時，仍應聚焦所屬島嶼。
    const detail = new THREE.Mesh(geometries[1], detailMaterial);
    detail.position.y = 0.7;
    detail.castShadow = true;
    island.add(detail);
  });

  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xe5ecf1, roughness: 1 });
  materials.push(groundMaterial);
  const ground = new THREE.Mesh(geometries[2], groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  scene.add(ground);

  const resetButton = host.querySelector('#reset-view');
  const status = host.querySelector('#focus-status');
  const cameraOffset = new THREE.Vector3(0, 4, 6);
  let isAnimating = false;
  let timeline = null;
  let disposed = false;
  let frameId = 0;

  // 3. GSAP 雙軌飛行：兩段 tween 都從時間 0 開始。
  function flyTo(targetWorldPosition, offset, message) {
    if (isAnimating || disposed) return false;
    isAnimating = true;
    if (resetButton) resetButton.disabled = true;
    if (status) status.textContent = message;

    const wasEnabled = controls.enabled;
    const wasDamping = controls.enableDamping;
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    controls.enabled = false;

    // 清除尚未消散的拖曳慣性，再還原鏡頭；避免阻尼與 GSAP 搶寫座標。
    controls.enableDamping = false;
    controls.update();
    camera.position.copy(startPosition);
    controls.target.copy(startTarget);
    controls.update();

    const destination = targetWorldPosition.clone().add(offset);
    const release = () => {
      controls.enableDamping = wasDamping;
      controls.enabled = wasEnabled;
      controls.update();
      isAnimating = false;
      timeline = null;
      if (resetButton) resetButton.disabled = false;
    };
    timeline = gsap.timeline({
      defaults: { duration: 1.2, ease: 'power2.inOut' },
      onUpdate: () => controls.update(),
      onComplete: release,
      onInterrupt: release,
    });
    timeline.to(controls.target, {
      x: targetWorldPosition.x, y: targetWorldPosition.y, z: targetWorldPosition.z,
    }, 0);
    timeline.to(camera.position, {
      x: destination.x, y: destination.y, z: destination.z,
    }, 0);
    return true;
  }

  function focusOnTarget(object) {
    if (!clickableObjects.includes(object) || isAnimating || disposed) return false;
    const worldPosition = object.getWorldPosition(new THREE.Vector3());
    return flyTo(worldPosition, cameraOffset, `正在聚焦：${object.name}`);
  }
  function overviewOffset() {
    return new THREE.Vector3(0, 10, 16).multiplyScalar(Math.max(1, 1 / camera.aspect));
  }
  function resetView() {
    return flyTo(new THREE.Vector3(), overviewOffset(), '城市總覽');
  }
  resetButton?.addEventListener('click', resetView);

  // 4. Canvas 上的精確點擊；取消、多指及拖曳返回原點都不誤判。
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const activePointers = new Set();
  let gesture = null;
  function onPointerDown(event) {
    activePointers.add(event.pointerId);
    if (isAnimating || activePointers.size !== 1 || !event.isPrimary || event.button !== 0) {
      gesture = null;
      return;
    }
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false };
  }
  function onPointerMove(event) {
    if (gesture?.id === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5) {
      gesture.dragged = true;
    }
  }
  function onPointerUp(event) {
    activePointers.delete(event.pointerId);
    const down = gesture;
    gesture = null;
    if (isAnimating || !down || down.id !== event.pointerId || down.dragged || activePointers.size) return;
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
    // 使用 Canvas 邊界，不假設它佔滿整個 window。
    ndc.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(clickableObjects, true)[0];
    if (!hit) return;
    let node = hit.object;
    while (node && !clickableObjects.includes(node)) node = node.parent;
    if (node) focusOnTarget(node);
  }
  function onCancel(event) {
    activePointers.delete(event.pointerId);
    gesture = null;
  }
  function onBlur() { gesture = null; activePointers.clear(); }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('lostpointercapture', onCancel);
  window.addEventListener('blur', onBlur);

  // 5. RWD：同時處理視窗及容器尺寸變化。
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    const w = Math.max(1, width), h = Math.max(1, height);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  camera.position.copy(overviewOffset());
  controls.update();

  function animate() {
    frameId = requestAnimationFrame(animate);
    if (!isAnimating) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function dispose() {
    if (disposed) return;
    disposed = true;
    timeline?.kill();
    cancelAnimationFrame(frameId);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onCancel);
    canvas.removeEventListener('lostpointercapture', onCancel);
    resetButton?.removeEventListener('click', resetView);
    controls.dispose();
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    sunlight.shadow.dispose();
    renderer.dispose();
    canvas.remove();
  }

  return { scene, camera, renderer, controls, clickableObjects, focusOnTarget, resetView, dispose,
    get isAnimating() { return isAnimating; } };
}

const host = document.getElementById('focus-demo');
export const demo = host ? createFocusDemo(host) : null;
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => demo?.dispose());
}
