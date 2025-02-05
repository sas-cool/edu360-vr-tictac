import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 3);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// VR Button
document.body.appendChild(VRButton.createButton(renderer));

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 5, 5);
scene.add(directionalLight);

// Create 3D Tic Tac Toe grid with cells
const gridGroup = new THREE.Group();
const cellSize = 0.8;
const gap = 0.1;
const totalSize = (cellSize * 3) + (gap * 2);
const lineWidth = 0.05;
const lineDepth = 0.1;

// Materials
const lineMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.5,
    emissive: 0x002200
});

const cellMaterial = new THREE.MeshStandardMaterial({
    color: 0x004400,
    metalness: 0.3,
    roughness: 0.7,
    transparent: true,
    opacity: 0.5
});

const hoverMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x00ff00,
    transparent: true,
    opacity: 0.7
});

// Create grid cells
const cells = [];
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
        const cellGeometry = new THREE.BoxGeometry(cellSize, cellSize, lineDepth);
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);
        
        // Position cell
        const x = (col - 1) * (cellSize + gap);
        const y = (1 - row) * (cellSize + gap) + 1.5; // Center at eye level
        cell.position.set(x, y, 0);
        
        // Store cell info
        cell.userData = { row, col, isHovered: false };
        cells.push(cell);
        gridGroup.add(cell);
    }
}

// Create grid lines with depth
const createLine = (x, y, width, height, isVertical) => {
    const geometry = new THREE.BoxGeometry(
        isVertical ? lineWidth : width,
        isVertical ? height : lineWidth,
        lineDepth
    );
    const line = new THREE.Mesh(geometry, lineMaterial);
    line.position.set(x, y + 1.5, 0); // Center at eye level
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

// Add grid to scene
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

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        // Subtle grid movement
        gridGroup.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
        
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
