import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Import setup screen
import { setupScreen } from './setup.js';

// Add setup screen to document
document.body.appendChild(setupScreen);

// Scene setup with better background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001100); // Very dark green background

// Camera adjustment for VR with better depth precision
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2.5);

// Renderer with optimized WebXR settings
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true, // Better depth precision
    precision: 'highp' // High precision
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;

// Handle VR session start
renderer.xr.addEventListener('sessionstart', () => {
    // Initial positioning
    gridGroup.position.set(0, 1.6, -1.5);
});

// Create VR button and center button
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(renderer.domElement);
document.body.appendChild(vrButton);

// Add center grid button
const centerButton = document.createElement('button');
centerButton.textContent = 'Center Grid';
centerButton.style.position = 'fixed';
centerButton.style.bottom = '20px';
centerButton.style.right = '20px'; // Position on right side
centerButton.style.padding = '10px 20px';
centerButton.style.backgroundColor = '#00ff00';
centerButton.style.color = 'black';
centerButton.style.border = 'none';
centerButton.style.borderRadius = '5px';
centerButton.style.cursor = 'pointer';
centerButton.style.zIndex = '999';
centerButton.style.fontFamily = 'Arial, sans-serif';
centerButton.style.fontSize = '13px';
centerButton.style.fontWeight = 'bold';

// Style VR button to ensure it stays on the left
vrButton.style.left = '20px';
vrButton.style.right = 'auto';

// Center grid function
function centerGrid() {
    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        const viewerPose = renderer.xr.getFrame().getViewerPose(renderer.xr.getReferenceSpace());
        
        if (viewerPose) {
            const view = viewerPose.views[0];
            const viewMatrix = view.transform.matrix;
            
            // Extract position and direction from view matrix
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            // Decompose view matrix
            new THREE.Matrix4().fromArray(viewMatrix).decompose(position, quaternion, scale);
            
            // Position grid 1.5 meters in front of user
            const forward = new THREE.Vector3(0, 0, -1.5);
            forward.applyQuaternion(quaternion);
            
            // Set grid position
            gridGroup.position.copy(position).add(forward);
            gridGroup.position.y = 1.6; // Maintain comfortable height
            
            // Make grid face user
            gridGroup.lookAt(position);
        }
    }
}

centerButton.addEventListener('click', centerGrid);
document.body.appendChild(centerButton);

// Optimize WebXR session settings
renderer.xr.setFramebufferScaleFactor(1.0); // Ensure full resolution

// Adjust reference space type for better stability
renderer.xr.setReferenceSpaceType('local-floor');

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Full brightness
directionalLight.position.set(0, 2, 4);
scene.add(directionalLight);

// Grid constants
const gridGroup = new THREE.Group();
const cellSize = 0.6;
const gap = 0.05;
const totalSize = (cellSize * 3) + (gap * 2);

// Create grid lines using LineSegments
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 2
});

// Create highlight material with more obvious color and thickness
const highlightMaterial = new THREE.LineBasicMaterial({
    color: 0xffff00, // Bright yellow
    linewidth: 3,
    opacity: 1.0,
    transparent: true
});

// Create collision planes for detection (invisible)
const collisionPlanes = [];
const planeGeometry = new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9); // Slightly smaller than cell
const invisibleMaterial = new THREE.MeshBasicMaterial({
    visible: false
});

// Create grid cells with collision detection
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        const x = (col - 1) * cellSize;
        const y = (1 - row) * cellSize + 1.6;
        const z = -1.99; // Slightly in front of grid

        // Add invisible collision plane
        const plane = new THREE.Mesh(planeGeometry, invisibleMaterial);
        plane.position.set(x, y, z);
        plane.userData = { row, col };
        collisionPlanes.push(plane);
        gridGroup.add(plane);
    }
}

// Create highlight frame with double line effect
const createHighlightFrame = () => {
    // Inner frame
    const innerGeometry = new THREE.BufferGeometry();
    const innerVertices = new Float32Array([
        -cellSize/2.2, -cellSize/2.2, 0,
        cellSize/2.2, -cellSize/2.2, 0,
        cellSize/2.2, cellSize/2.2, 0,
        -cellSize/2.2, cellSize/2.2, 0,
        -cellSize/2.2, -cellSize/2.2, 0
    ]);
    innerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(innerVertices, 3));
    
    // Outer frame
    const outerGeometry = new THREE.BufferGeometry();
    const outerVertices = new Float32Array([
        -cellSize/1.8, -cellSize/1.8, 0,
        cellSize/1.8, -cellSize/1.8, 0,
        cellSize/1.8, cellSize/1.8, 0,
        -cellSize/1.8, cellSize/1.8, 0,
        -cellSize/1.8, -cellSize/1.8, 0
    ]);
    outerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outerVertices, 3));
    
    const frameGroup = new THREE.Group();
    const innerFrame = new THREE.Line(innerGeometry, highlightMaterial);
    const outerFrame = new THREE.Line(outerGeometry, highlightMaterial);
    
    frameGroup.add(innerFrame);
    frameGroup.add(outerFrame);
    frameGroup.visible = false;
    frameGroup.position.z = -1.98; // Slightly in front of collision planes
    gridGroup.add(frameGroup);
    return frameGroup;
};

const highlightFrame = createHighlightFrame();

// Create vertices for grid lines
const points = [];

// Vertical lines
for (let i = 0; i <= 3; i++) {
    const x = (i - 1.5) * cellSize;
    points.push(
        x, -cellSize * 1.5 + 1.6, -2,  // Start point
        x, cellSize * 1.5 + 1.6, -2    // End point
    );
}

// Horizontal lines
for (let i = 0; i <= 3; i++) {
    const y = (i - 1.5) * cellSize + 1.6;
    points.push(
        -cellSize * 1.5, y, -2,  // Start point
        cellSize * 1.5, y, -2    // End point
    );
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
const gridLines = new THREE.LineSegments(geometry, lineMaterial);
gridGroup.add(gridLines);
scene.add(gridGroup);

// Create reticle
const reticleGroup = new THREE.Group();
const reticleGeometry = new THREE.RingGeometry(0.002, 0.003, 32);
const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    opacity: 0.8,
    transparent: true,
    side: THREE.DoubleSide
});
const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
reticle.position.z = -0.5; // Place it half a meter in front of the camera
reticleGroup.add(reticle);
camera.add(reticleGroup); // Attach to camera so it moves with view
scene.add(camera);

// Setup raycaster
const raycaster = new THREE.Raycaster();
let currentIntersect = null;

// Create option panels group
const optionsGroup = new THREE.Group();
scene.add(optionsGroup);

// Function to create text texture for options
function createOptionTexture(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // Background with transparency
    context.fillStyle = 'rgba(0, 40, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    context.strokeStyle = '#00ff00';
    context.lineWidth = 4;
    context.strokeRect(2, 2, canvas.width-4, canvas.height-4);
    
    // Text
    context.fillStyle = '#00ff00';
    context.font = 'bold 28px Arial'; // Slightly larger font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Word wrap text
    const words = text.split(' ');
    let line = '';
    let lines = [];
    let y = 64;
    
    for(let word of words) {
        const testLine = line + word + ' ';
        const metrics = context.measureText(testLine);
        if (metrics.width > canvas.width - 20) {
            lines.push(line);
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    // Center text vertically
    y = canvas.height/2 - (lines.length - 1) * 15;
    
    // Draw each line
    for(let line of lines) {
        context.fillText(line.trim(), canvas.width/2, y);
        y += 30;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Function to create and position option panels around grid
function createOptions(options) {
    console.log('Creating options:', options);
    
    // Clear existing options
    while(optionsGroup.children.length > 0) {
        optionsGroup.remove(optionsGroup.children[0]);
    }
    
    const PANEL_WIDTH = 0.6;  // Slightly smaller panels
    const PANEL_HEIGHT = 0.3;
    const PANEL_SPACING = 0.1; // Space between panels
    const ROWS = 3;
    const COLS = 3;
    
    options.forEach((text, index) => {
        console.log(`Creating option ${index}:`, text);
        
        const geometry = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT);
        const texture = createOptionTexture(text);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const panel = new THREE.Mesh(geometry, material);
        panel.userData = { type: 'option', index };
        
        // Calculate position in grid layout
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        
        // Position panels in rows below the grid
        const x = (col - 1) * (PANEL_WIDTH + PANEL_SPACING); // Center horizontally
        const y = 0.8 - (row * (PANEL_HEIGHT + PANEL_SPACING)); // Start below grid
        const z = -1.5; // Same depth as grid
        
        panel.position.set(x, y + 1.6, z);
        panel.lookAt(camera.position);
        
        // Add glow effect
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const glowGeometry = new THREE.PlaneGeometry(PANEL_WIDTH + 0.05, PANEL_HEIGHT + 0.05);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01; // Slightly behind panel
        panel.add(glow);
        
        optionsGroup.add(panel);
        console.log(`Option ${index} positioned at:`, x, y + 1.6, z);
    });
    
    // Add a background panel behind options for better visibility
    const bgWidth = (PANEL_WIDTH + PANEL_SPACING) * COLS + PANEL_SPACING;
    const bgHeight = (PANEL_HEIGHT + PANEL_SPACING) * ROWS + PANEL_SPACING;
    const bgGeometry = new THREE.PlaneGeometry(bgWidth, bgHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({
        color: 0x001100,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.position.set(0, 1.6 + 0.8 - (bgHeight/2), -1.51); // Slightly behind options
    optionsGroup.add(background);
}

// Function to load and display options
function loadOptions() {
    console.log('Loading options...');
    const savedData = localStorage.getItem('vrTicTacOptions');
    console.log('Saved data:', savedData);
    
    if (savedData) {
        try {
            const { options } = JSON.parse(savedData);
            console.log('Parsed options:', options);
            if (options && options.length === 9) {
                createOptions(options);
            } else {
                console.error('Invalid options format:', options);
            }
        } catch (e) {
            console.error('Error loading options:', e);
        }
    } else {
        console.error('No saved data found');
    }
}

// Load options when entering VR
renderer.xr.addEventListener('sessionstart', () => {
    gridGroup.position.set(0, 1.6, -1.5);
    loadOptions();
});

// Keep options facing camera
function updateOptionPanels() {
    optionsGroup.children.forEach(panel => {
        panel.lookAt(camera.position);
    });
}

// Animation with highlight detection
function animate() {
    renderer.setAnimationLoop(() => {
        const time = Date.now() * 0.001;
        
        // Only rotate around Y-axis, very gently
        gridGroup.rotation.y = Math.sin(time * 0.3) * 0.1;
        
        // Pulse the reticle slightly
        reticle.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
        
        // Update raycaster
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(collisionPlanes);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (currentIntersect !== intersect.object) {
                currentIntersect = intersect.object;
                // Position highlight frame
                highlightFrame.position.x = intersect.object.position.x;
                highlightFrame.position.y = intersect.object.position.y;
                highlightFrame.visible = true;
                
                // Strong pulsing effect
                highlightMaterial.opacity = 0.7 + Math.sin(time * 6) * 0.3;
                
                console.log('Highlighting cell:', intersect.object.userData.row, intersect.object.userData.col);
            }
        } else {
            if (currentIntersect) {
                currentIntersect = null;
                highlightFrame.visible = false;
            }
        }
        
        updateOptionPanels();
        renderer.render(scene, camera);
    });
}

animate();

// Create debug panel for VR
function createDebugPanel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.strokeStyle = '#ff0000';
    context.lineWidth = 2;
    context.strokeRect(2, 2, canvas.width-4, canvas.height-4);
    
    context.fillStyle = '#ff0000';
    context.font = 'bold 24px Arial';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    
    // Split text into lines
    const lines = text.split('\n');
    let y = 10;
    for(let line of lines) {
        context.fillText(line, 10, y);
        y += 30;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create debug mesh
const debugGeometry = new THREE.PlaneGeometry(2, 1);
const debugMaterial = new THREE.MeshBasicMaterial({ 
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
});
const debugPanel = new THREE.Mesh(debugGeometry, debugMaterial);
debugPanel.position.set(0, 3, -2); // Position above grid
scene.add(debugPanel);

// Update debug panel
function updateDebugPanel(text) {
    debugMaterial.map = createDebugPanel(text);
    debugMaterial.needsUpdate = true;
}

// Load options when entering VR
renderer.xr.addEventListener('sessionstart', () => {
    debugPanel.visible = true;
    updateDebugPanel('VR Session Starting...');
    
    // Initial positioning
    gridGroup.position.set(0, 1.6, -1.5);
    loadOptions();
});

// Hide debug panel when not in VR
renderer.xr.addEventListener('sessionend', () => {
    debugPanel.visible = false;
});

// Also try loading options immediately in case we're already in VR
loadOptions();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
