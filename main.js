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

// Create 3D Tic Tac Toe grid
const gridGroup = new THREE.Group();
const lineColor = 0x00ff00;
const lineWidth = 0.03;

// Create grid lines
for (let i = -1; i <= 1; i++) {
    // Vertical lines
    const verticalGeometry = new THREE.BoxGeometry(lineWidth, 3, lineWidth);
    const verticalLine = new THREE.Mesh(
        verticalGeometry,
        new THREE.MeshStandardMaterial({ color: lineColor })
    );
    verticalLine.position.set(i, 1.5, 0);
    gridGroup.add(verticalLine);

    // Horizontal lines
    const horizontalGeometry = new THREE.BoxGeometry(3, lineWidth, lineWidth);
    const horizontalLine = new THREE.Mesh(
        horizontalGeometry,
        new THREE.MeshStandardMaterial({ color: lineColor })
    );
    horizontalLine.position.set(0, i + 1.5, 0);
    gridGroup.add(horizontalLine);
}

scene.add(gridGroup);

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
        gridGroup.rotation.y += 0.001;
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
