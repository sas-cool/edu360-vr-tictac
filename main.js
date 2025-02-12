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

// Create a fixed world container that won't move with camera
const worldContainer = new THREE.Group();
scene.add(worldContainer);

// Create grid and options groups
const gridGroup = new THREE.Group();
const optionsGroup = new THREE.Group();

// Add grid and options to world container
worldContainer.add(gridGroup);
worldContainer.add(optionsGroup);

// Set their positions relative to world container
gridGroup.position.set(0, 1.6, -1.5);
optionsGroup.position.set(0, 0.8, -0.8);

// Prevent world container from updating with camera
worldContainer.matrixAutoUpdate = false;
worldContainer.updateMatrix();

// Create grid cells with text sprites
const gridCells = [];
const cellSize = 0.2;
const padding = 0.02;

function createTextSprite(text, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Clear canvas
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = 'Bold 100px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(text, canvas.width/2, canvas.height/2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create sprite material and mesh
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(cellSize * 0.8, cellSize * 0.8, 1);
    
    return {
        sprite,
        context,
        texture,
        updateText: (newText) => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'rgba(0, 0, 0, 0)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = color;
            context.fillText(newText, canvas.width/2, canvas.height/2);
            texture.needsUpdate = true;
        }
    };
}

// Create grid lines
const gridMaterial = new THREE.LineBasicMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
});

const gridGeometry = new THREE.BufferGeometry();
const gridPositions = [];

// Horizontal lines
for (let i = 0; i <= 3; i++) {
    const y = (i - 1) * (cellSize + padding);
    gridPositions.push(-1.5 * (cellSize + padding), y, 0);
    gridPositions.push(1.5 * (cellSize + padding), y, 0);
}

// Vertical lines
for (let i = 0; i <= 3; i++) {
    const x = (i - 1) * (cellSize + padding);
    gridPositions.push(x, -1.5 * (cellSize + padding), 0);
    gridPositions.push(x, 1.5 * (cellSize + padding), 0);
}

gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
gridGroup.add(gridLines);

// Create grid cells with text sprites
for (let row = 0; row < 3; row++) {
    gridCells[row] = [];
    for (let col = 0; col < 3; col++) {
        const x = (col - 1) * (cellSize + padding);
        const y = -(row - 1) * (cellSize + padding);
        
        const textSprite = createTextSprite('', '#00ff00');
        textSprite.sprite.position.set(x, y, 0.01); // Slightly in front of grid
        gridGroup.add(textSprite.sprite);
        gridCells[row][col] = textSprite;
    }
}

// Function to update grid cell text
function updateGridCell(row, col, text) {
    if (gridCells[row] && gridCells[row][col]) {
        gridCells[row][col].updateText(text);
    }
}

// Create collision planes for grid cells
const cellPlaneGeometry = new THREE.PlaneGeometry(cellSize * 0.9, cellSize * 0.9);
const invisibleMaterial = new THREE.MeshBasicMaterial({
    visible: false,
    side: THREE.DoubleSide
});

// Add collision planes for each cell
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        const x = (col - 1) * (cellSize + padding);
        const y = -(row - 1) * (cellSize + padding);
        const z = 0;
        
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

// Create options text
const options = [
    "What is 2+2?",
    "4",
    "3",
    "5"
];

// Create option cards with text sprites
options.forEach((text, index) => {
    const cardGeometry = new THREE.PlaneGeometry(0.4, 0.15);
    const cardMaterial = new THREE.MeshBasicMaterial({
        color: 0x444444,
        side: THREE.DoubleSide
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    
    // Position cards vertically
    card.position.set(0, 0.2 - (index * 0.2), 0);
    card.userData = { type: 'option', text };
    
    // Add text sprite to card
    const textSprite = createTextSprite(text, '#00ff00');
    textSprite.sprite.position.z = 0.01; // Slightly in front of card
    card.add(textSprite.sprite);
    
    optionsGroup.add(card);
});

// Handle option selection
function handleOptionSelect(option) {
    const selectedCell = findEmptyCell();
    if (selectedCell) {
        const { row, col } = selectedCell;
        updateGridCell(row, col, option.text);
    }
}

// Find first empty cell
function findEmptyCell() {
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            // Check if cell is empty by getting the canvas content
            const canvas = gridCells[row][col].context.canvas;
            const context = gridCells[row][col].context;
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Check if all pixels are transparent
            let isEmpty = true;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] !== 0) {
                    isEmpty = false;
                    break;
                }
            }
            
            if (isEmpty) {
                return { row, col };
            }
        }
    }
    return null;
}

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

// Handle VR session start/end
renderer.xr.addEventListener('sessionstart', () => {
    console.log('VR Session starting...');
    gridGroup.position.set(0, 1.6, -1.5);
    optionsGroup.position.set(0, 0.8, -0.8);
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
        const time = Date.now() * 0.001;
        
        // Update raycaster
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        
        // Check intersections
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Reset current intersect
        if (currentIntersect) {
            if (currentIntersect.userData.type === 'option') {
                currentIntersect.material.color.setHex(0x444444);
            }
            currentIntersect = null;
        }
        
        // Handle new intersect
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            if (object.userData.type === 'option') {
                currentIntersect = object;
                object.material.color.setHex(0x666666);
                
                // Check for controller trigger or touch
                if (controller.userData.isSelecting) {
                    handleOptionSelect(object.userData);
                    controller.userData.isSelecting = false;
                }
            }
        }
        
        // Pulse the reticle
        reticle.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
        
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
