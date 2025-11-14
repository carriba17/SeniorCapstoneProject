// Carter Arribas
// 3D Interactive Hoodie Viewer using Three.js

let scene, camera, renderer, hoodie, controls;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

function init3DHoodie() {
  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.error('Three.js library not loaded');
    return;
  }

  const container = document.getElementById('hoodie-3d-container');
  const canvas = document.getElementById('hoodie-3d-canvas');
  
  if (!container || !canvas) {
    console.warn('3D hoodie container not found');
    return;
  }

  // Clear existing scene if it exists
  if (scene) {
    while(scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }

  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x4a4a4a); // Dark gray background

  // Camera setup
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  console.log('Camera initialized at:', camera.position);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true 
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(5, 10, 5);
  directionalLight1.castShadow = true;
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);

  // Create hoodie geometry
  createHoodie();

  // Mouse controls for rotation
  setupControls();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
  
  console.log('3D scene initialized. Container size:', width, 'x', height);
}

function createHoodie() {
  console.log('Loading 3D hoodie model from GLB file...');
  
  // Check if GLTFLoader is available
  if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded');
    return;
  }
  
  // Try to use GLTFLoader from window or THREE namespace
  const GLTFLoaderClass = window.GLTFLoader || THREE.GLTFLoader;
  
  if (!GLTFLoaderClass) {
    console.error('GLTFLoader not available. Waiting for it to load...');
    // Wait a bit and try again
    setTimeout(() => createHoodie(), 200);
    return;
  }
  
  console.log('GLTFLoader found, creating loader...');
  const loader = new GLTFLoaderClass();
  const textureLoader = new THREE.TextureLoader();
  
  // Load front and back textures
  let frontTexture = null;
  let backTexture = null;
  let texturesLoaded = 0;
  
  function applyTexturesToModel(model) {
    if (!frontTexture && !backTexture) {
      console.log('No custom textures to apply, using model textures');
      return;
    }
    
    // Collect all meshes
    const meshes = [];
    model.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });
    
    console.log(`Found ${meshes.length} meshes in model`);
    
    // Find meshes and apply textures
    // Try to identify front and back by name, position, or material
    meshes.forEach((mesh, index) => {
      const meshName = mesh.name.toLowerCase();
      const worldPosition = new THREE.Vector3();
      mesh.getWorldPosition(worldPosition);
      
      // Get bounding box to determine orientation
      const box = new THREE.Box3().setFromObject(mesh);
      const center = box.getCenter(new THREE.Vector3());
      
      let applied = false;
      
      // Check by name first
      if (meshName.includes('front') || meshName.includes('chest') || meshName.includes('frontpanel')) {
        if (frontTexture) {
          console.log(`Applying front texture to mesh ${index}: ${mesh.name}`);
          applyTextureToMesh(mesh, frontTexture);
          applied = true;
        }
      } else if (meshName.includes('back') || meshName.includes('backpanel')) {
        if (backTexture) {
          console.log(`Applying back texture to mesh ${index}: ${mesh.name}`);
          applyTextureToMesh(mesh, backTexture);
          applied = true;
        }
      }
      
      // If not identified by name, try by position (front = positive Z, back = negative Z)
      if (!applied) {
        if (center.z > 0.05 && frontTexture) {
          console.log(`Applying front texture to mesh ${index} (by position): ${mesh.name}, z=${center.z.toFixed(2)}`);
          applyTextureToMesh(mesh, frontTexture);
        } else if (center.z < -0.05 && backTexture) {
          console.log(`Applying back texture to mesh ${index} (by position): ${mesh.name}, z=${center.z.toFixed(2)}`);
          applyTextureToMesh(mesh, backTexture);
        }
      }
    });
  }
  
  function applyTextureToMesh(mesh, texture) {
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => {
          if (mat && mat.isMeshStandardMaterial) {
            mat.map = texture;
            mat.needsUpdate = true;
          }
        });
      } else if (mesh.material.isMeshStandardMaterial) {
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
      }
    }
  }
  
  // Load front texture
  textureLoader.load(
    './assets/hoodie-front.png',
    (texture) => {
      console.log('Front texture loaded');
      texture.flipY = false;
      texture.needsUpdate = true;
      frontTexture = texture;
      texturesLoaded++;
      if (hoodie) {
        applyTexturesToModel(hoodie);
      }
    },
    undefined,
    (error) => {
      console.log('Front texture not found, using model texture');
      texturesLoaded++;
    }
  );
  
  // Load back texture
  textureLoader.load(
    './assets/hoodie-back.png',
    (texture) => {
      console.log('Back texture loaded');
      texture.flipY = false;
      texture.needsUpdate = true;
      backTexture = texture;
      texturesLoaded++;
      if (hoodie) {
        applyTexturesToModel(hoodie);
      }
    },
    undefined,
    (error) => {
      console.log('Back texture not found, using model texture');
      texturesLoaded++;
    }
  );
  
  // Load the GLB model
  loader.load(
    './assets/hoodie.glb', // Place your GLB file here
    (gltf) => {
      console.log('GLB model loaded successfully');
      
      // Get the loaded model
      const model = gltf.scene;
      
      // Enable shadows on all meshes
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Calculate bounding box to center and scale the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the model
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;
      
      // Scale to fit if needed (adjust based on your model size)
      const maxDimension = Math.max(size.x, size.y, size.z);
      if (maxDimension > 3) {
        const scale = 2 / maxDimension;
        model.scale.set(scale, scale, scale);
      }
      
      // Add to scene
      scene.add(model);
      hoodie = model;
      
      // Apply textures if they're already loaded
      applyTexturesToModel(model);
      
      // Add subtle rotation animation
      hoodie.rotation.y = 0.3;
      
      // Adjust camera to view the model
      const cameraDistance = maxDimension * 2;
      camera.position.set(0, 0, cameraDistance);
      camera.lookAt(0, 0, 0);
      
      console.log('Hoodie model added to scene. Size:', size, 'Center:', center);
    },
    (progress) => {
      // Loading progress
      const percent = (progress.loaded / progress.total * 100);
      console.log(`Loading model: ${percent.toFixed(2)}%`);
    },
    (error) => {
      console.error('Error loading GLB model:', error);
      console.error('Full error details:', error);
      console.log('Make sure hoodie.glb is in the assets folder and the server is running');
      
      // Fallback: create a simple placeholder so we can see something
      const placeholderGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.4);
      const placeholderMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.05
      });
      const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
      placeholder.position.y = -0.2;
      scene.add(placeholder);
      hoodie = placeholder;
      hoodie.rotation.y = 0.3;
      console.log('Placeholder created');
    }
  );
}

function setupControls() {
  const canvas = document.getElementById('hoodie-3d-canvas');
  if (!canvas) return;

  // Mouse drag controls
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);

  // Touch controls for mobile
  canvas.addEventListener('touchstart', onTouchStart);
  canvas.addEventListener('touchmove', onTouchMove);
  canvas.addEventListener('touchend', onTouchEnd);

  // Zoom with scroll
  canvas.addEventListener('wheel', onWheel);
}

function onMouseDown(event) {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  };
}

function onMouseMove(event) {
  if (!isDragging || !hoodie) return;

  const deltaX = event.clientX - previousMousePosition.x;
  const deltaY = event.clientY - previousMousePosition.y;

  hoodie.rotation.y += deltaX * 0.01;
  hoodie.rotation.x += deltaY * 0.01;

  // Limit vertical rotation
  hoodie.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, hoodie.rotation.x));

  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  };
}

function onMouseUp() {
  isDragging = false;
}

function onTouchStart(event) {
  if (event.touches.length === 1) {
    isDragging = true;
    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
}

function onTouchMove(event) {
  if (!isDragging || !hoodie || event.touches.length !== 1) return;
  event.preventDefault();

  const deltaX = event.touches[0].clientX - previousMousePosition.x;
  const deltaY = event.touches[0].clientY - previousMousePosition.y;

  hoodie.rotation.y += deltaX * 0.01;
  hoodie.rotation.x += deltaY * 0.01;

  hoodie.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, hoodie.rotation.x));

  previousMousePosition = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
}

function onTouchEnd() {
  isDragging = false;
}

function onWheel(event) {
  event.preventDefault();
  const delta = event.deltaY * 0.001;
  camera.position.z = Math.max(3, Math.min(8, camera.position.z + delta));
}

function onWindowResize() {
  const container = document.getElementById('hoodie-3d-container');
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);

  if (hoodie && !isDragging) {
    // Subtle idle rotation
    hoodie.rotation.y += 0.002;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Initialize when DOM, Three.js, and GLTFLoader are ready
function tryInit() {
  if (typeof THREE !== 'undefined' && (window.GLTFLoader || window.GLTFLoaderReady)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init3DHoodie);
    } else {
      init3DHoodie();
    }
  } else {
    // Wait a bit and try again if dependencies haven't loaded yet
    setTimeout(tryInit, 100);
  }
}

tryInit();

