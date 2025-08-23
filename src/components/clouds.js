import * as THREE from 'three';

function renderCloudSphere() {
  const container = document.getElementById('clouds');
  if (!container) {
    console.error('No container #clouds');
    return;
  }

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // Scene and camera
  const scene = new THREE.Scene();

  // Sphere radius
  const sphereRadius = 100;

  // Camera positioned above the sphere on Y axis
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
  camera.position.set(0, 200, 0);
  camera.lookAt(0, 0, 200);

  // Fog
  const fogColor = 0x4584b4;
  const fogNear = 1;
  const fogFar = 5000;
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  // Load cloud texture
  const texture = new THREE.TextureLoader().load('/clouds.png');
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  // Base plane geometry
  const basePlane = new THREE.PlaneGeometry(100, 100);

  const planes = [];
  const planeCount = 1000;

  for (let i = 0; i < planeCount; i++) {
    const geometry = basePlane.clone();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        fogColor: { value: new THREE.Color(fogColor) },
        fogNear: { value: fogNear },
        fogFar: { value: fogFar },
        fadeNear: { value: 150 },
        fadeFar: { value: 600 },
        flashIntensity: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        uniform float fadeNear;
        uniform float fadeFar;
        uniform float flashIntensity;
        varying vec2 vUv;
        varying float vDepth;
        void main() {
          vec4 texColor = texture2D(map, vUv);

          float fadeIn = smoothstep(0.0, fadeNear, vDepth);
          float fadeOut = smoothstep(fadeFar, fadeFar + 300.0, vDepth);
          float alpha = texColor.a * fadeIn * (1.0 - fadeOut);

          vec3 color = texColor.rgb;
          #ifdef DARK_FLASH
          color = texColor.rgb * 0.2 + vec3(flashIntensity);
          #endif

          float fogFactor = smoothstep(fogNear, fogFar, gl_FragCoord.z / gl_FragCoord.w);
          gl_FragColor = mix(vec4(color, alpha), vec4(fogColor, alpha), fogFactor);

          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const theta = Math.acos(2 * Math.random() - 1);
    const phi = 2 * Math.PI * Math.random();

    const x = sphereRadius * Math.sin(theta) * Math.cos(phi);
    const y = sphereRadius * Math.cos(theta);
    const z = sphereRadius * Math.sin(theta) * Math.sin(phi);

    mesh.position.set(x, y, z);
    mesh.userData.originalPosition = new THREE.Vector3(x, y, z);

    const scale = Math.random() * Math.random() * 1.5 + 0.5;
    mesh.scale.set(scale, scale, scale);

    mesh.userData.flashCurrent = 0;
    mesh.userData.flashTarget = 0;
    mesh.userData.flashTime = 0;
    mesh.userData.flashSpeed = Math.random() * 0.15 + 0.1;
    mesh.userData.flashPeak = Math.random() * 2.0 + 0.5;

    scene.add(mesh);
    planes.push(mesh);
  }

  const axesHelper = new THREE.AxesHelper(sphereRadius * 2);
  scene.add(axesHelper);

  const renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate() {
    requestAnimationFrame(animate);

    const stormActive = document.body.hasAttribute('data-storm');

    if (!prefersReducedMotion) {
      const xAxis = new THREE.Vector3(1, 0, 0);

      planes.forEach((plane) => {
        plane.userData.originalPosition.applyAxisAngle(xAxis, 0.0007);
        plane.position.copy(plane.userData.originalPosition);

        plane.quaternion.copy(camera.quaternion);

        if (stormActive) {
          // Reduce flash frequency by lowering the probability
          if (plane.userData.flashTime <= 0 && Math.random() < 0.0001) {
            plane.userData.flashTarget = plane.userData.flashPeak;
            plane.userData.flashTime = Math.floor(Math.random() * 5 + 5);
          }

          if (plane.userData.flashTime > 0) {
            plane.userData.flashTime--;
          } else {
            plane.userData.flashTarget = 0;
          }

          plane.userData.flashCurrent += (plane.userData.flashTarget - plane.userData.flashCurrent) * plane.userData.flashSpeed;

          plane.material.uniforms.flashIntensity.value = plane.userData.flashCurrent;

          plane.material.defines.DARK_FLASH = true;
          plane.material.needsUpdate = true;
        } else {
          plane.userData.flashCurrent = 0;
          plane.material.uniforms.flashIntensity.value = 0;
          if (plane.material.defines.DARK_FLASH) {
            delete plane.material.defines.DARK_FLASH;
            plane.material.needsUpdate = true;
          }
        }
      });
    }

    renderer.render(scene, camera);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', renderCloudSphere);
