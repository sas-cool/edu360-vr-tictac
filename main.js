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

// Grid constants
const cellSize = 0.6;
const gap = 0.05;
const gridSize = 3;
const totalSize = (cellSize * 3) + (gap * 2);
const halfSize = totalSize / 2;

// Create grid group
const gridGroup = new THREE.Group();
scene.add(gridGroup);

// Create options group
const optionsGroup = new THREE.Group();
scene.add(optionsGroup);

// Create grid lines
const gridMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff00,
    linewidth: 2
});

const gridGeometry = new THREE.BufferGeometry();
const points = [];

// Add vertical lines
for (let i = 0; i <= gridSize; i++) {
    const x = (i * cellSize) - halfSize;
    points.push(
        x, -halfSize, -2,
        x, halfSize, -2
    );
}

// Add horizontal lines
for (let i = 0; i <= gridSize; i++) {
    const y = (i * cellSize) - halfSize;
    points.push(
        -halfSize, y, -2,
        halfSize, y, -2
    );
}

gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
gridGroup.add(gridLines);

// Create collision planes for grid cells
const cellPlaneGeometry = new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9);
const invisibleMaterial = new THREE.MeshBasicMaterial({
    visible: false,
    side: THREE.DoubleSide
});

// Add collision planes for each cell
for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
        const x = (col * cellSize) - halfSize + cellSize/2;
        const y = -(row * cellSize) + halfSize - cellSize/2;
        const z = -2;
        
        const plane = new THREE.Mesh(cellPlaneGeometry, invisibleMaterial);
        plane.position.set(x, y, z);
        plane.userData = { type: 'cell', row, col };
        gridGroup.add(plane);
    }
}

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(0, 2, 4);
scene.add(directionalLight);

// Create highlight materials
const gridHighlightMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
});

const optionHighlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // Red for hover highlight
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
});

// Create highlight frames
const gridHighlightFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9),
    gridHighlightMaterial
);
gridHighlightFrame.visible = false;
gridGroup.add(gridHighlightFrame);

// Create selected grid frame with red color
const selectedGridFrame = new THREE.Mesh(
    new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9),
    new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    })
);
selectedGridFrame.visible = false;
gridGroup.add(selectedGridFrame);

// Function to create option frames (will be called after optionsGroup.children[0] exists)
function createOptionFrames() {
    const optionHighlightFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.2),
        optionHighlightMaterial
    );
    optionHighlightFrame.visible = false;
    optionsGroup.children[0].add(optionHighlightFrame);

    const selectedOptionFrame = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.2),
        new THREE.MeshBasicMaterial({
            color: 0x0000ff, // Blue for selected state
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        })
    );
    selectedOptionFrame.visible = false;
    optionsGroup.children[0].add(selectedOptionFrame);

    return { optionHighlightFrame, selectedOptionFrame };
}

let optionHighlightFrame, selectedOptionFrame;

// Create reticle
const reticleGeometry = new THREE.RingGeometry(0.002, 0.003, 32);
const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    opacity: 0.8,
    transparent: true,
    side: THREE.DoubleSide
});
const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
reticle.position.z = -0.5;
camera.add(reticle);
scene.add(camera);

// Setup raycaster
const raycaster = new THREE.Raycaster();
let currentIntersect = null;
let currentHighlight = null;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    logarithmicDepthBuffer: true,
    precision: 'highp'
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setFramebufferScaleFactor(1.0);
renderer.xr.setReferenceSpaceType('local-floor');

// Add renderer and VR button to document
document.body.appendChild(renderer.domElement);
const vrButton = VRButton.createButton(renderer);
document.body.appendChild(vrButton);
vrButton.style.left = '20px';
vrButton.style.right = 'auto';

// Add center grid button
const centerButton = document.createElement('button');
centerButton.textContent = 'Center Grid';
centerButton.style.position = 'fixed';
centerButton.style.bottom = '20px';
centerButton.style.right = '20px';
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

// Center grid function
function centerGrid() {
    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        const viewerPose = renderer.xr.getFrame().getViewerPose(renderer.xr.getReferenceSpace());
        
        if (viewerPose) {
            const view = viewerPose.views[0];
            const viewMatrix = view.transform.matrix;
            
            const position = new THREE.Vector3();
            const quaternion = new THREE.Quaternion();
            const scale = new THREE.Vector3();
            
            new THREE.Matrix4().fromArray(viewMatrix).decompose(position, quaternion, scale);
            
            const forward = new THREE.Vector3(0, 0, -1.5);
            forward.applyQuaternion(quaternion);
            
            gridGroup.position.copy(position).add(forward);
            gridGroup.position.y = 1.6;
            gridGroup.lookAt(position);
        }
    }
}

centerButton.addEventListener('click', centerGrid);
document.body.appendChild(centerButton);

// Function to center grid and options in front of user
function centerToUser() {
    if (!renderer.xr.isPresenting) return;
    
    const camera = renderer.xr.getCamera();
    
    // Get camera's forward direction (negative z-axis)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    
    // Position 2 meters in front and at eye level (1.6 meters)
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(camera.position)                    // Start at camera position
                .add(forward.multiplyScalar(2));           // Move 2 meters forward
    targetPosition.y = camera.position.y;                  // Keep at eye level
    
    // Update grid and options position
    gridGroup.position.copy(targetPosition);
    optionsGroup.position.copy(targetPosition);
    
    // Ensure they face the user
    gridGroup.quaternion.copy(camera.quaternion);
    optionsGroup.quaternion.copy(camera.quaternion);
}

// Handle VR session start/end
renderer.xr.addEventListener('sessionstart', () => {
    console.log('VR Session starting...');
    centerToUser();
    loadOptions();
    gridGroup.visible = true;
    optionsGroup.visible = true;

    // Create option frames after options group is created
    const frames = createOptionFrames();
    optionHighlightFrame = frames.optionHighlightFrame;
    selectedOptionFrame = frames.selectedOptionFrame;

    // Setup VR controller
    const session = renderer.xr.getSession();
    session.addEventListener('select', () => {
        // Handle grid selection when clicking
        if (currentIntersect && currentIntersect.userData && currentIntersect.userData.type === 'cell') {
            selectedGridFrame.position.copy(currentIntersect.position);
            selectedGridFrame.visible = true;
            gridHighlightFrame.visible = false;
        }

        // Handle option selection
        if (currentIntersect && currentIntersect.userData && currentIntersect.userData.type === 'option') {
            // If clicking currently selected option, unselect it
            if (selectedOptionFrame.visible && selectedOptionFrame.position.equals(currentIntersect.position)) {
                selectedOptionFrame.visible = false;
                optionHighlightFrame.visible = true;
            } else {
                // Select new option
                selectedOptionFrame.position.copy(currentIntersect.position);
                selectedOptionFrame.quaternion.copy(currentIntersect.quaternion);
                selectedOptionFrame.visible = true;
                optionHighlightFrame.visible = false;
            }
        }
    });
});

renderer.xr.addEventListener('sessionend', () => {
    console.log('VR Session ended');
    gridGroup.position.set(0, 0, 0);
    optionsGroup.position.set(0, 0, 0);
});

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        if (renderer.xr.isPresenting) {
            const camera = renderer.xr.getCamera();
            
            // Always make grid and options face the user
            if (gridGroup && optionsGroup) {
                gridGroup.quaternion.copy(camera.quaternion);
                optionsGroup.quaternion.copy(camera.quaternion);
            }
        }
        
        // Pulse the reticle
        reticle.scale.setScalar(1 + Math.sin(Date.now() * 0.001 * 2) * 0.1);
        
        // Update raycaster
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        // Check intersections with grid cells and options
        const gridCells = gridGroup.children.filter(child => child.userData && child.userData.type === 'cell');
        const optionPanels = optionsGroup.children[0]?.children.filter(child => child instanceof THREE.Mesh && child.material.map) || [];
        
        const intersectsGrid = raycaster.intersectObjects(gridCells);
        const intersectsOptions = raycaster.intersectObjects(optionPanels);
        
        // Handle highlighting
        if (intersectsGrid.length > 0) {
            const intersect = intersectsGrid[0];
            if (currentIntersect !== intersect.object || currentHighlight !== 'grid') {
                currentIntersect = intersect.object;
                currentHighlight = 'grid';
                
                gridHighlightFrame.position.copy(intersect.object.position);
                gridHighlightFrame.visible = true;
                if (optionHighlightFrame) optionHighlightFrame.visible = false;
            }
        } else if (intersectsOptions.length > 0) {
            const intersect = intersectsOptions[0];
            if (currentIntersect !== intersect.object || currentHighlight !== 'option') {
                currentIntersect = intersect.object;
                currentHighlight = 'option';
                
                if (optionHighlightFrame) {
                    optionHighlightFrame.position.copy(intersect.object.position);
                    optionHighlightFrame.quaternion.copy(intersect.object.quaternion);
                    optionHighlightFrame.visible = true;
                }
                gridHighlightFrame.visible = false;
            }
        } else {
            if (currentIntersect) {
                currentIntersect = null;
                currentHighlight = null;
                gridHighlightFrame.visible = false;
                if (optionHighlightFrame) optionHighlightFrame.visible = false;
            }
        }
        
        updateOptionPanels();
        renderer.render(scene, camera);
    });
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

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
    
    const PANEL_WIDTH = 0.4;  // Make panels smaller
    const PANEL_HEIGHT = 0.2;
    const PANEL_SPACING = 0.05;
    const ROWS = 3;
    const COLS = 3;
    
    // Create options container
    const optionsContainer = new THREE.Group();
    optionsGroup.add(optionsContainer);
    
    options.forEach((text, index) => {
        const geometry = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT);
        const texture = createOptionTexture(text);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        const panel = new THREE.Mesh(geometry, material);
        panel.userData = { type: 'option', index, text, selected: false }; // Store text in userData
        panel.name = `option-${index}`;
        
        // Calculate position in grid layout
        const row = Math.floor(index / COLS);
        const col = index % COLS;
        
        // Center the grid of options
        const x = (col - 1) * (PANEL_WIDTH + PANEL_SPACING);
        const y = -(row * (PANEL_HEIGHT + PANEL_SPACING));
        const z = 0;  // All panels in same plane
        
        panel.position.set(x, y, z);
        
        // Add glow effect
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const glowGeometry = new THREE.PlaneGeometry(PANEL_WIDTH + 0.05, PANEL_HEIGHT + 0.05);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01;
        panel.add(glow);
        
        optionsContainer.add(panel);
    });
    
    // Add a background panel behind options
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
    background.position.z = -0.01;
    optionsContainer.add(background);
    
    // Center the entire container
    optionsContainer.position.set(0, bgHeight/2, 0);
}

// Function to load and display options
function loadOptions() {
    console.log('Loading options...');
    const savedData = localStorage.getItem('vrTicTacOptions');
    if (savedData) {
        try {
            const { options } = JSON.parse(savedData);
            if (options && options.length === 9) {
                createOptions(options);
            }
        } catch (e) {
            console.error('Error loading options:', e);
        }
    }
}

// Load options immediately in case we're already in VR
loadOptions();

// Keep options facing camera
function updateOptionPanels() {
    optionsGroup.children.forEach(panel => {
        panel.lookAt(camera.position);
    });
}

// Handle touch button click
document.getElementById('touch-button').addEventListener('click', () => {
    centerToUser();
});
