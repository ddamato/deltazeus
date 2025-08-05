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
  // looking straight down at the origin
  const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
  camera.position.set(0, 200, 0); // above sphere by 100 units
  camera.lookAt(0, 0, 200);

  // Fog matching background color
  const fogColor = 0x4584b4;
  const fogNear = 1;
  const fogFar = 5000;
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  // Load cloud texture
  const texture = new THREE.TextureLoader().load('/clouds.png');
  texture.magFilter = THREE.LinearMipMapLinearFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  // Shader material with DoubleSide so planes show both sides
  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      fogColor: { value: new THREE.Color(fogColor) },
      fogNear: { value: fogNear },
      fogFar: { value: fogFar },
      fadeNear: { value: 150 },
      fadeFar: { value: 600 },
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
      varying vec2 vUv;
      varying float vDepth;
      void main() {
        vec4 texColor = texture2D(map, vUv);

        float fadeIn = smoothstep(0.0, fadeNear, vDepth);
        float fadeOut = smoothstep(fadeFar, fadeFar + 300.0, vDepth);
        float alpha = texColor.a * fadeIn * (1.0 - fadeOut);

        float fogFactor = smoothstep(fogNear, fogFar, gl_FragCoord.z / gl_FragCoord.w);

        gl_FragColor = mix(vec4(texColor.rgb, alpha), vec4(fogColor, alpha), fogFactor);

        if (gl_FragColor.a < 0.01) discard;
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });

  // Base plane geometry for one cloud
  const basePlane = new THREE.PlaneGeometry(100, 100);

  const planes = [];
  const planeCount = 1000;

  for (let i = 0; i < planeCount; i++) {
    const mesh = new THREE.Mesh(basePlane, material);

    // Uniform spherical distribution
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = 2 * Math.PI * Math.random();

    const x = sphereRadius * Math.sin(theta) * Math.cos(phi);
    const y = sphereRadius * Math.cos(theta);
    const z = sphereRadius * Math.sin(theta) * Math.sin(phi);

    mesh.position.set(x, y, z);

    // Store original position vector for sphere rotation
    mesh.userData.originalPosition = new THREE.Vector3(x, y, z);

    // Random scale for variety
    const scale = Math.random() * Math.random() * 1.5 + 0.5;
    mesh.scale.set(scale, scale, scale);

    scene.add(mesh);
    planes.push(mesh);
  }

  // Axes helper for scale reference
  const axesHelper = new THREE.AxesHelper(sphereRadius * 2);
  scene.add(axesHelper);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ alpha: true, premultipliedAlpha: true, antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Resize handling
  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Reduced motion check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate() {
    requestAnimationFrame(animate);

    if (!prefersReducedMotion) {
      const xAxis = new THREE.Vector3(1, 0, 0);
      planes.forEach((plane) => {
        // Rotate the position vector around X axis slightly (rotate sphere)
        plane.userData.originalPosition.applyAxisAngle(xAxis, 0.0007);
        plane.position.copy(plane.userData.originalPosition);

        // Billboard: Make the plane face the camera
        // Set plane quaternion to camera quaternion but aligned properly for planes

        // This method sets plane rotation equal to camera rotation
        plane.quaternion.copy(camera.quaternion);
      });
    }

    renderer.render(scene, camera);
  }

  animate();
}

document.addEventListener('DOMContentLoaded', renderCloudSphere);
