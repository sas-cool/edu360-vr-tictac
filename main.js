import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Scene setup with better background
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001100); // Very dark green background

// Camera adjustment for VR with better depth precision
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 5);
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

// Optimize WebXR session settings
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

renderer.xr.setFramebufferScaleFactor(1.0); // Ensure full resolution

// Adjust reference space type for better stability
renderer.xr.setReferenceSpaceType('local-floor');

// Enhanced lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Full brightness
directionalLight.position.set(0, 2, 4);
scene.add(directionalLight);

// Add point lights for better depth perception
const pointLight1 = new THREE.PointLight(0x00ff00, 0.5);
pointLight1.position.set(-2, 2, 2);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x00ff00, 0.5);
pointLight2.position.set(2, -2, 2);
scene.add(pointLight2);

// Grid constants adjusted for better visibility
const gridGroup = new THREE.Group();
gridGroup.position.z = -2; // Move grid to comfortable viewing distance
const cellSize = 0.6; // Larger cells
const gap = 0.05;
const totalSize = (cellSize * 3) + (gap * 2);
const lineWidth = 0.05; // Thicker lines
const lineDepth = 0.02;

// Improved materials for better visibility
const lineMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.2,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5,
    transparent: false // Force opaque
});

const cellMaterial = new THREE.MeshStandardMaterial({
    color: 0x004400, // Darker green
    metalness: 0.3,
    roughness: 0.7,
    transparent: false, // Force opaque
    depthWrite: true // Ensure proper depth handling
});

const hoverMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x00ff00,
    emissiveIntensity: 0.3,
    transparent: false // Force opaque
});

// Create grid cells
const cells = [];
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        // Create main cell face
        const cellGeometry = new THREE.BoxGeometry(cellSize, cellSize, lineDepth);
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        
        // Position
        const x = (col - 1) * (cellSize + gap);
        const y = (1 - row) * (cellSize + gap) + 1.6;
        cell.position.set(x, y, 0);
        
        cell.userData = { row, col, isHovered: false };
        cells.push(cell);
        gridGroup.add(cell);

        // Add border frame for each cell
        const borderGeometry = new THREE.BoxGeometry(cellSize + lineWidth, cellSize + lineWidth, lineDepth);
        const border = new THREE.Mesh(borderGeometry, lineMaterial);
        border.position.copy(cell.position);
        gridGroup.add(border);
    }
}

// Create grid lines
const createLine = (x, y, width, height, isVertical) => {
    const geometry = new THREE.BoxGeometry(
        isVertical ? lineWidth : width,
        isVertical ? height : lineWidth,
        lineDepth
    );
    const line = new THREE.Mesh(geometry, lineMaterial);
    line.position.set(x, y + 1.6, 0);
    return line;
};

// Add vertical lines
const verticalLines = [
    createLine(-cellSize - gap/2, 0, null, totalSize, true),
    createLine(cellSize + gap/2, 0, null, totalSize, true)
];

// Add horizontal lines
const horizontalLines = [
    createLine(0, -cellSize - gap/2, totalSize, null, false),
    createLine(0, cellSize + gap/2, totalSize, null, false)
];

// Add lines to grid
[...verticalLines, ...horizontalLines].forEach(line => gridGroup.add(line));

scene.add(gridGroup);

// Raycaster for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle mouse/touch movement
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(cells);
    
    // Reset all cells
    cells.forEach(cell => {
        if (cell.userData.isHovered) {
            cell.material = cellMaterial;
            cell.userData.isHovered = false;
        }
    });
    
    // Highlight intersected cell
    if (intersects.length > 0) {
        const cell = intersects[0].object;
        cell.material = hoverMaterial;
        cell.userData.isHovered = true;
    }
}

// Add mouse move listener
window.addEventListener('mousemove', onMouseMove, false);

// Add floating text
const loader = new THREE.TextureLoader();
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 256;
canvas.height = 128;
context.fillStyle = '#ffffff';
context.font = '32px Arial';
context.fillText('Edu360 VR Tic Tac Toe', 10, 64);

const textTexture = new THREE.CanvasTexture(canvas);
const textMaterial = new THREE.MeshBasicMaterial({ 
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide
});
const textGeometry = new THREE.PlaneGeometry(2, 1);
const textMesh = new THREE.Mesh(textGeometry, textMaterial);
textMesh.position.set(0, 3, -2);
scene.add(textMesh);

// Animation loop with optimized frame timing
function animate() {
    renderer.setAnimationLoop(() => {
        const time = Date.now() * 0.001;
        gridGroup.position.y = 1.6 + Math.sin(time * 0.5) * 0.01; // Gentle float
        renderer.render(scene, camera);
    });
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
