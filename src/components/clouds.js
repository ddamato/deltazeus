import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function clouds() {
  const $container = document.getElementById('clouds');
  if (!$container) {
    console.error('No element with id "clouds" found');
    return;
  }

  let width = $container.clientWidth;
  let height = $container.clientHeight;

  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
  camera.position.z = 0;

  // Scene & fog
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x4584b4, 1, 4000);
  scene.fog = fog;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  $container.appendChild(renderer.domElement);

  // Geometry
  const geometries = [];
  const basePlane = new THREE.PlaneGeometry(64, 64);
  const planeCount = 8000;
  const depthRange = 3000;

  for (let i = 0; i < planeCount; i++) {
    const mesh = new THREE.Mesh(basePlane);
    mesh.position.set(
      Math.random() * 1000 - 500,
      -Math.random() * Math.random() * 200 - 15,
      (i / planeCount) * depthRange
    );
    mesh.rotation.z = Math.random() * Math.PI;
    const scale = Math.random() * Math.random() * 1.5 + 0.5;
    mesh.scale.set(scale, scale, scale);
    mesh.updateMatrix();

    const geomClone = basePlane.clone();
    geomClone.applyMatrix4(mesh.matrix);
    geometries.push(geomClone);
  }

  const geometry = BufferGeometryUtils.mergeGeometries(geometries);

  // Shader material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: null }, // placeholder
      fogColor: { value: fog.color },
      fogNear: { value: fog.near },
      fogFar: { value: fog.far },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      varying vec2 vUv;
      void main() {
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = smoothstep(fogNear, fogFar, depth);
        vec4 texColor = texture2D(map, vUv);
        texColor.a *= 0.8;
        gl_FragColor = mix(texColor, vec4(fogColor, texColor.a), fogFactor);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const cloudMesh = new THREE.Mesh(geometry, material);
  cloudMesh.position.z = -depthRange;
  scene.add(cloudMesh);

  // Animation settings
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let startTime = Date.now();

  function renderScene() {
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = (Date.now() - startTime) * 0.03;
    camera.position.z = -elapsed;

    if (camera.position.z < -depthRange) {
      startTime = Date.now();
      camera.position.z = 0;
    }

    renderScene();
  }

  // Handle resize
  window.addEventListener('resize', () => {
    width = $container.clientWidth;
    height = $container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    if (prefersReducedMotion) {
      renderScene();
    }
  });

  // Load texture and start appropriate mode
  new THREE.TextureLoader().load('/clouds.png', (loadedTexture) => {
    loadedTexture.magFilter = THREE.LinearMipMapLinearFilter;
    loadedTexture.minFilter = THREE.LinearMipMapLinearFilter;
    material.uniforms.map.value = loadedTexture;

    if (prefersReducedMotion) {
      renderScene(); // initial render
    } else {
      animate();
    }
  });
}

document.addEventListener('DOMContentLoaded', clouds);
