import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

let camera, scene, renderer, controls;
let nodes = [];
let edges = [];
let zoomTarget = null;
let zoomProgress = 0;
let lastClickedNode = null;

const zoomDistance = 50;
const minNodeDistance = 20; // Minimum distance to prevent overlap

document.addEventListener("DOMContentLoaded", () => {
    init();
    animate();
});

function init() {
    const container = document.getElementById('container');
    
    // Create Scene
    scene = new THREE.Scene();
    
    // Create Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 150);
    
    // Create CSS3D Renderer
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    // Create Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Generate Graph
    generateGraph();
    
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('wheel', onScroll);
}

function generateGraph() {
    const numNodes = 10;
    const radius = 130;
    
    for (let i = 0; i < numNodes; i++) {
        let positionValid = false;
        let x, y, z;
        
        while (!positionValid) {
            let theta = Math.acos(2 * Math.random() - 1);
            let phi = Math.random() * Math.PI * 2;
            x = radius * Math.sin(theta) * Math.cos(phi);
            y = radius * Math.sin(theta) * Math.sin(phi);
            z = radius * Math.cos(theta);
            
            positionValid = nodes.every(node => 
                node.position.distanceTo(new THREE.Vector3(x, y, z)) > minNodeDistance
            );
        }
        
        let div = document.createElement('div');
        div.className = 'node';
        div.innerHTML = `Node ${i+1}`;
        div.style.padding = '10px';
        div.style.backgroundColor = 'rgba(255,255,255,0.8)';
        div.style.border = '1px solid black';
        div.style.textAlign = 'center';
        div.addEventListener('click', () => zoomToNode(obj));
        
        let obj = new CSS3DObject(div);
        obj.position.set(x, y, z);
        scene.add(obj);
        nodes.push(obj);
    }
    
    generateEdges();
}

function generateEdges() {
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    
    for (let i = 0; i < nodes.length; i++) {
        let j = (i + 1) % nodes.length;
        let points = [nodes[i].position, nodes[j].position];
        let edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        let edge = new THREE.Line(edgeGeometry, material);
        scene.add(edge);
        edges.push(edge);
    }
}

function zoomToNode(node) {
    if (lastClickedNode) {
        let connectingEdge = edges.find(edge => 
            (edge.geometry.attributes.position.array[0] === lastClickedNode.position.x &&
             edge.geometry.attributes.position.array[1] === lastClickedNode.position.y &&
             edge.geometry.attributes.position.array[2] === lastClickedNode.position.z &&
             edge.geometry.attributes.position.array[3] === node.position.x &&
             edge.geometry.attributes.position.array[4] === node.position.y &&
             edge.geometry.attributes.position.array[5] === node.position.z)
        );

        if (connectingEdge) {
            let midPoint = new THREE.Vector3().lerpVectors(lastClickedNode.position, node.position, 0.5);
            zoomTarget = midPoint;
        } else {
            zoomTarget = node.position.clone().addScaledVector(camera.position.clone().sub(node.position).normalize(), -zoomDistance);
        }
    } else {
        zoomTarget = node.position.clone().addScaledVector(camera.position.clone().sub(node.position).normalize(), -zoomDistance);
    }
    
    lastClickedNode = node;
    zoomProgress = 0;
}

function onScroll(event) {
    let delta = event.deltaY * 0.01;
    let closestNode = nodes.reduce((prev, curr) => {
        return camera.position.distanceTo(curr.position) < camera.position.distanceTo(prev.position) ? curr : prev;
    });
    
    let direction = new THREE.Vector3().subVectors(closestNode.position, camera.position).normalize();
    camera.position.addScaledVector(direction, delta);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    nodes.forEach(node => {
        node.lookAt(camera.position);
    });
    
    if (zoomTarget) {
        zoomProgress += 0.05;
        camera.position.lerp(zoomTarget, zoomProgress);
        camera.lookAt(zoomTarget);
        if (zoomProgress >= 1) {
            zoomTarget = null;
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}
