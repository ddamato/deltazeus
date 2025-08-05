import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function clouds() {
  const $container = document.getElementById('clouds');
  if (!$container) {
    console.error('No element with id "clouds" found');
    return;
  }

  const width = $container.clientWidth;
  const height = $container.clientHeight;

  // Camera setup
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
  camera.position.z = 0;

  // Scene and fog
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x4584b4, 1, 4000);
  scene.fog = fog;

  // Cloud texture
  const texture = new THREE.TextureLoader().load('/clouds.png');
  texture.magFilter = THREE.LinearMipMapLinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  // Shader material without additive blending
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
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

        // Fade alpha for depth without darkening colors
        texColor.a *= pow(gl_FragCoord.z, 8.0);

        // Blend with fog
        gl_FragColor = mix(texColor, vec4(fogColor, texColor.a), fogFactor);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  // Create merged geometry from planes
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
  const cloudMesh = new THREE.Mesh(geometry, material);
  cloudMesh.position.z = -depthRange;
  scene.add(cloudMesh);

  // Renderer with proper alpha handling
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
    premultipliedAlpha: true
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0); // fully transparent
  $container.appendChild(renderer.domElement);

  // Handle resize
  window.addEventListener('resize', () => {
    const newWidth = $container.clientWidth;
    const newHeight = $container.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });

  // Animate camera through clouds
  let start_time = Date.now();
  function animate() {
    requestAnimationFrame(animate);

    const elapsed = (Date.now() - start_time) * 0.03;
    const cycleLength = depthRange;

    camera.position.z = -elapsed;

    if (camera.position.z < -cycleLength) {
      start_time = Date.now();
      camera.position.z = 0;
    }

    renderer.render(scene, camera);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', clouds);
