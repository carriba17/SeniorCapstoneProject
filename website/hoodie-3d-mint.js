// Carter Arribas
// 3D Interactive Hoodie Viewer for Mint Page using Three.js

let sceneMint, cameraMint, rendererMint, hoodieMint, controlsMint;
let isDraggingMint = false;
let previousMousePositionMint = { x: 0, y: 0 };

function init3DHoodieMint() {
  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.error('Three.js library not loaded');
    return;
  }

  const container = document.getElementById('hoodie-3d-container-mint');
  const canvas = document.getElementById('hoodie-3d-canvas-mint');
  
  if (!container || !canvas) {
    console.warn('3D hoodie container not found on mint page');
    return;
  }

  // Clear existing scene if it exists
  if (sceneMint) {
    while(sceneMint.children.length > 0) {
      sceneMint.remove(sceneMint.children[0]);
    }
  }

  // Scene setup
  sceneMint = new THREE.Scene();
  sceneMint.background = null; // Transparent background

  // Camera setup
  const width = container.clientWidth;
  const height = container.clientHeight;
  cameraMint = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  cameraMint.position.set(0, 0, 5);

  // Renderer setup
  rendererMint = new THREE.WebGLRenderer({ 
    canvas: canvas,
    antialias: true,
    alpha: true 
  });
  rendererMint.setSize(width, height);
  rendererMint.setPixelRatio(window.devicePixelRatio);
  rendererMint.shadowMap.enabled = true;
  rendererMint.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  sceneMint.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(5, 10, 5);
  directionalLight1.castShadow = true;
  sceneMint.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-5, 5, -5);
  sceneMint.add(directionalLight2);

  // Create hoodie geometry
  createHoodieMint();

  // Mouse controls for rotation
  setupControlsMint();

  // Handle window resize
  window.addEventListener('resize', onWindowResizeMint);

  // Start animation loop
  animateMint();
  
  console.log('3D scene initialized for mint page. Container size:', width, 'x', height);
}

function createHoodieMint() {
  console.log('Loading 3D hoodie model from GLB file for mint page...');
  
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
    setTimeout(() => createHoodieMint(), 200);
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
    
    if (meshes.length === 0) {
      console.warn('No meshes found in model!');
      return;
    }
    
    // If we only have 1-2 meshes, apply textures directly
    if (meshes.length <= 2) {
      console.log('Few meshes detected, applying textures directly...');
      if (meshes[0] && frontTexture) {
        console.log(`Applying front texture to first mesh: ${meshes[0].name}`);
        applyTextureToMesh(meshes[0], frontTexture);
      }
      if (meshes[1] && backTexture) {
        console.log(`Applying back texture to second mesh: ${meshes[1].name}`);
        applyTextureToMesh(meshes[1], backTexture);
      } else if (meshes[0] && backTexture && !frontTexture) {
        applyTextureToMesh(meshes[0], backTexture);
      }
    } else {
      // Multiple meshes - try to identify front and back
      const sortedMeshes = [...meshes].sort((a, b) => {
        const boxA = new THREE.Box3().setFromObject(a);
        const boxB = new THREE.Box3().setFromObject(b);
        const sizeA = boxA.getSize(new THREE.Vector3());
        const sizeB = boxB.getSize(new THREE.Vector3());
        return (sizeB.x * sizeB.y * sizeB.z) - (sizeA.x * sizeA.y * sizeA.z);
      });
      
      meshes.forEach((mesh, index) => {
        const meshName = mesh.name.toLowerCase();
        
        // Get bounding box to determine orientation
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        
        // Get world position
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);
        
        let applied = false;
        
        // Check by name first
        if (meshName.includes('front') || meshName.includes('chest') || meshName.includes('frontpanel') || meshName.includes('body_front') || meshName.includes('front_')) {
          if (frontTexture) {
            console.log(`Applying front texture to mesh ${index}: ${mesh.name}`);
            applyTextureToMesh(mesh, frontTexture);
            applied = true;
          }
        } else if (meshName.includes('back') || meshName.includes('backpanel') || meshName.includes('body_back') || meshName.includes('back_')) {
          if (backTexture) {
            console.log(`Applying back texture to mesh ${index}: ${mesh.name}`);
            applyTextureToMesh(mesh, backTexture);
            applied = true;
          }
        }
        
        // If not identified by name, try by position (front = positive Z, back = negative Z)
        if (!applied) {
          const checkZ = Math.abs(center.z) > 0.01 ? center.z : worldPos.z;
          
          if (checkZ > 0.01 && frontTexture) {
            console.log(`Applying front texture to mesh ${index} (by position): ${mesh.name}, z=${checkZ.toFixed(2)}`);
            applyTextureToMesh(mesh, frontTexture);
            applied = true;
          } else if (checkZ < -0.01 && backTexture) {
            console.log(`Applying back texture to mesh ${index} (by position): ${mesh.name}, z=${checkZ.toFixed(2)}`);
            applyTextureToMesh(mesh, backTexture);
            applied = true;
          }
        }
        
        // If still not applied, use size-based approach
        if (!applied) {
          if (mesh === sortedMeshes[0] && frontTexture) {
            console.log(`Applying front texture to largest mesh: ${mesh.name}`);
            applyTextureToMesh(mesh, frontTexture);
          } else if (mesh === sortedMeshes[1] && backTexture) {
            console.log(`Applying back texture to second largest mesh: ${mesh.name}`);
            applyTextureToMesh(mesh, backTexture);
          } else if (mesh === sortedMeshes[0] && backTexture && !frontTexture) {
            applyTextureToMesh(mesh, backTexture);
          }
        }
      });
    }
  }
  
  function applyTextureToMesh(mesh, texture) {
    if (!mesh.material) {
      console.warn(`Mesh ${mesh.name} has no material, creating new material...`);
      mesh.material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1
      });
      return;
    }
    
    // Handle both single material and material arrays
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    let materialUpdated = false;
    
    materials.forEach((mat, matIndex) => {
      if (!mat) return;
      
      // Clone material if needed to avoid affecting other meshes
      let materialToUpdate = mat;
      if (!mat.userData.isCustom) {
        materialToUpdate = mat.clone();
        materialToUpdate.userData.isCustom = true;
        if (Array.isArray(mesh.material)) {
          mesh.material[matIndex] = materialToUpdate;
        } else {
          mesh.material = materialToUpdate;
        }
      }
      
      // Apply texture - try multiple material types
      if (materialToUpdate.isMeshStandardMaterial || 
          materialToUpdate.isMeshPhysicalMaterial || 
          materialToUpdate.isMeshLambertMaterial ||
          materialToUpdate.isMeshPhongMaterial ||
          materialToUpdate.isMeshBasicMaterial) {
        materialToUpdate.map = texture;
        materialToUpdate.needsUpdate = true;
        materialUpdated = true;
        console.log(`✓ Texture applied to material ${matIndex} (${materialToUpdate.type}) of mesh ${mesh.name}`);
      } else {
        // If material type doesn't support map, replace it
        console.log(`Material type ${materialToUpdate.type} doesn't support map, replacing with MeshStandardMaterial...`);
        const newMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.8,
          metalness: 0.1
        });
        if (Array.isArray(mesh.material)) {
          mesh.material[matIndex] = newMaterial;
        } else {
          mesh.material = newMaterial;
        }
        materialUpdated = true;
        console.log(`✓ Material replaced and texture applied to mesh ${mesh.name}`);
      }
    });
    
    if (!materialUpdated) {
      console.warn(`Failed to apply texture to mesh ${mesh.name}`);
    }
  }
  
  // Load front texture
  textureLoader.load(
    './assets/hoodie-front.png',
    (texture) => {
      console.log('Front texture loaded successfully');
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      frontTexture = texture;
      texturesLoaded++;
      console.log(`Front texture dimensions: ${texture.image.width}x${texture.image.height}`);
      if (hoodieMint) {
        console.log('Hoodie already loaded, applying front texture...');
        applyTexturesToModel(hoodieMint);
      }
      if (frontTexture && backTexture) {
        document.dispatchEvent(new CustomEvent('hoodieTexturesLoadedMint'));
      }
    },
    undefined,
    (error) => {
      console.error('Error loading front texture:', error);
      texturesLoaded++;
      if (texturesLoaded >= 2) {
        document.dispatchEvent(new CustomEvent('hoodieTexturesErrorMint'));
      }
    }
  );
  
  // Load back texture
  textureLoader.load(
    './assets/hoodie-back.png',
    (texture) => {
      console.log('Back texture loaded successfully');
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      backTexture = texture;
      texturesLoaded++;
      console.log(`Back texture dimensions: ${texture.image.width}x${texture.image.height}`);
      if (hoodieMint) {
        console.log('Hoodie already loaded, applying back texture...');
        applyTexturesToModel(hoodieMint);
      }
      if (frontTexture && backTexture) {
        document.dispatchEvent(new CustomEvent('hoodieTexturesLoadedMint'));
      }
    },
    undefined,
    (error) => {
      console.error('Error loading back texture:', error);
      texturesLoaded++;
      if (texturesLoaded >= 2) {
        document.dispatchEvent(new CustomEvent('hoodieTexturesErrorMint'));
      }
    }
  );
  
  // Load the GLB model
  loader.load(
    './assets/hoodie.glb',
    (gltf) => {
      console.log('GLB model loaded successfully');
      
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
      
      // Scale to fit if needed
      const maxDimension = Math.max(size.x, size.y, size.z);
      if (maxDimension > 3) {
        const scale = 2 / maxDimension;
        model.scale.set(scale, scale, scale);
      }
      
      // Add to scene
      sceneMint.add(model);
      hoodieMint = model;
      
      // Apply textures if they're already loaded
      applyTexturesToModel(model);
      
      // Add subtle rotation animation
      hoodieMint.rotation.y = 0.3;
      
      // Adjust camera to view the model
      const cameraDistance = maxDimension * 2;
      cameraMint.position.set(0, 0, cameraDistance);
      cameraMint.lookAt(0, 0, 0);
      
      console.log('Hoodie model added to scene. Size:', size, 'Center:', center);
      
      document.dispatchEvent(new CustomEvent('hoodieModelLoadedMint'));
    },
    (progress) => {
      const percent = (progress.loaded / progress.total * 100);
      console.log(`Loading model: ${percent.toFixed(2)}%`);
    },
    (error) => {
      console.error('Error loading GLB model:', error);
      console.log('Make sure hoodie.glb is in the assets folder and the server is running');
      
      // Fallback: create a simple placeholder
      const placeholderGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.4);
      const placeholderMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.8,
        metalness: 0.05
      });
      const placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
      placeholder.position.y = -0.2;
      sceneMint.add(placeholder);
      hoodieMint = placeholder;
      hoodieMint.rotation.y = 0.3;
      console.log('Placeholder created');
      
      document.dispatchEvent(new CustomEvent('hoodieModelLoadedMint'));
    }
  );
}

function setupControlsMint() {
  const canvas = document.getElementById('hoodie-3d-canvas-mint');
  if (!canvas) return;

  // Mouse drag controls
  canvas.addEventListener('mousedown', onMouseDownMint);
  canvas.addEventListener('mousemove', onMouseMoveMint);
  canvas.addEventListener('mouseup', onMouseUpMint);
  canvas.addEventListener('mouseleave', onMouseUpMint);

  // Touch controls for mobile
  canvas.addEventListener('touchstart', onTouchStartMint);
  canvas.addEventListener('touchmove', onTouchMoveMint);
  canvas.addEventListener('touchend', onTouchEndMint);
}

function onMouseDownMint(event) {
  isDraggingMint = true;
  previousMousePositionMint = {
    x: event.clientX,
    y: event.clientY
  };
}

function onMouseMoveMint(event) {
  if (!isDraggingMint || !hoodieMint) return;

  const deltaX = event.clientX - previousMousePositionMint.x;
  
  // Only allow horizontal rotation (left/right swipe)
  hoodieMint.rotation.y += deltaX * 0.01;

  previousMousePositionMint = {
    x: event.clientX,
    y: event.clientY
  };
}

function onMouseUpMint() {
  isDraggingMint = false;
}

function onTouchStartMint(event) {
  if (event.touches.length === 1) {
    isDraggingMint = true;
    previousMousePositionMint = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
}

function onTouchMoveMint(event) {
  if (!isDraggingMint || !hoodieMint || event.touches.length !== 1) return;
  event.preventDefault();

  const deltaX = event.touches[0].clientX - previousMousePositionMint.x;
  
  // Only allow horizontal rotation (left/right swipe)
  hoodieMint.rotation.y += deltaX * 0.01;

  previousMousePositionMint = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
}

function onTouchEndMint() {
  isDraggingMint = false;
}

function onWindowResizeMint() {
  const container = document.getElementById('hoodie-3d-container-mint');
  if (!container || !cameraMint || !rendererMint) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  cameraMint.aspect = width / height;
  cameraMint.updateProjectionMatrix();
  rendererMint.setSize(width, height);
}

function animateMint() {
  requestAnimationFrame(animateMint);

  if (hoodieMint && !isDraggingMint) {
    // Subtle idle rotation
    hoodieMint.rotation.y += 0.002;
  }

  if (rendererMint && sceneMint && cameraMint) {
    rendererMint.render(sceneMint, cameraMint);
  }
}

// Initialize when DOM, Three.js, and GLTFLoader are ready
function tryInitMint() {
  if (typeof THREE !== 'undefined' && (window.GLTFLoader || window.GLTFLoaderReady)) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init3DHoodieMint);
    } else {
      init3DHoodieMint();
    }
  } else {
    // Wait a bit and try again if dependencies haven't loaded yet
    setTimeout(tryInitMint, 100);
  }
}

tryInitMint();

