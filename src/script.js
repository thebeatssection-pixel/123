import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSG } from 'three-csg-ts';
import GUI from 'lil-gui';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(100, 100, 100));
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// Parameters
const params = {
  w: 3,
  h: 30,
  b: 100,
  s: 25,
  e: 25,
  r: 1,
  g: 5
};

// Mesh & label
let finalMesh           = null;
let paramLabel          = null;
let paramLabel1          = null;
let paramLabel2          = null;
let labelRenderer       = null;
let line                = null;
let line1               = null;
let line2               = null;
let line3               = null;

// Rebuild
function rebuild() {
    if (finalMesh)          scene.remove(finalMesh);
    if (paramLabel)         scene.remove(paramLabel);
    if (paramLabel1)         scene.remove(paramLabel1);
    if (paramLabel2)         scene.remove(paramLabel2);
    if (line){              scene.remove(line);
    line.geometry.dispose();
    line.material.dispose();
    }

    if (line1){             scene.remove(line1);
    line.geometry.dispose();
    line.material.dispose();
    }
    if (line2){             scene.remove(line2);
    line.geometry.dispose();
    line.material.dispose();
    }
    if (line3){             scene.remove(line3);
    line.geometry.dispose();
    line.material.dispose();
    }

    const { w, h, b, s, e, r, g } = params;
    const r1 = w + r;

    // Shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0, s - r1);
    shape.quadraticCurveTo(0, s, r1, s);
    shape.lineTo(h - r, s);
    shape.quadraticCurveTo(h, s, h, s + r);
    shape.lineTo(h, b + s - r);
    shape.quadraticCurveTo(h, b + s, h - r, b + s);
    shape.lineTo(r1, b + s);
    shape.quadraticCurveTo(0, b + s, 0, b + s + r1);
    shape.lineTo(0, b + s + s);
    shape.lineTo(w, b + s + s);
    shape.lineTo(w, b + w + s + r);
    shape.quadraticCurveTo(w, b + w + s, w + r, b + w + s);
    shape.lineTo(h + w - r1, b + w + s);
    shape.quadraticCurveTo(h + w, b + w + s, h + w, b + w + s - r1);
    shape.lineTo(h + w, s + r1 - w);
    shape.quadraticCurveTo(h + w, s - w, h + w - r1, s - w);
    shape.lineTo(w + r, s - w);
    shape.quadraticCurveTo(w, s - w, w, s - r - w);
    shape.lineTo(w, 0);
    shape.closePath();

    const extrude = new THREE.ExtrudeGeometry(shape, { depth: e, bevelEnabled: false });
    const material = new THREE.MeshNormalMaterial({
    color: 0x2194ce,       // primaire kleur
    roughness: 0.3,        // hoe glad het oppervlak is (0 = spiegel, 1 = mat)
    metalness: 0.6,        // metallisch effect
    flatShading: true      // behoud van vlakke facetten voor stijl
});


    // dimensions h
    const points = [
    new THREE.Vector3(0, s + (b/2), e/2),
    new THREE.Vector3(h,s + (b/2),  e/2)
    ];

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

    line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);


    // dimensions b
    const points1 = [
    new THREE.Vector3(h/2,s,e/2),
    new THREE.Vector3(h/2,s+b,e/2)
    ];
    const lineGeometry1 = new THREE.BufferGeometry().setFromPoints(points1);
    const lineMaterial1 = new THREE.LineBasicMaterial({ color: 0xff0000 });

    line1 = new THREE.Line(lineGeometry1, lineMaterial1);
    scene.add(line1);

    // dimensions w
    const points2 = [
    new THREE.Vector3(0,w,e/2),
    new THREE.Vector3(0,-5,e/2),
    new THREE.Vector3(w,-5,e/2),
    new THREE.Vector3(w,w,e/2),

    ];
    const lineGeometry2 = new THREE.BufferGeometry().setFromPoints(points2);
    const lineMaterial2 = new THREE.LineBasicMaterial({ color: 0xff0000 });

    line2 = new THREE.Line(lineGeometry2, lineMaterial2);
    scene.add(line2);
    
    
    // dimensions g
    const points3 = [
    new THREE.Vector3(w,((s + w) / 2 + b + s)-.5*g,e/2),
    new THREE.Vector3(w,((s + w) / 2 + b + s)+.5*g,e/2),


    ];
    const lineGeometry3 = new THREE.BufferGeometry().setFromPoints(points3);
    const lineMaterial3 = new THREE.LineBasicMaterial({ color: 0xff0000 });

    line3 = new THREE.Line(lineGeometry3, lineMaterial3);
    scene.add(line3);

    // Holes
    const holeGeo = new THREE.CylinderGeometry(g / 2, g / 2, 128, 20);
    const hole1 = new THREE.Mesh(holeGeo);
    hole1.position.set(0, (s - w) / 2, e / 2);
    hole1.rotation.z = Math.PI / 2;
    hole1.updateMatrix(true);

    const hole2 = new THREE.Mesh(holeGeo);
    hole2.position.set(0, (s + w) / 2 + b + s, e / 2);
    hole2.rotation.z = Math.PI / 2;
    hole2.updateMatrix(true);

    const baseMesh = new THREE.Mesh(extrude, material);
    baseMesh.updateMatrix(true);

    const holes = CSG.union(hole1, hole2);
    holes.updateMatrix(true);

    const result = CSG.subtract(baseMesh, holes);
    result.geometry.deleteAttribute('normal');

    const merged = mergeVertices(result.geometry, 1e-5);
    merged.computeVertexNormals();

    finalMesh = new THREE.Mesh(merged, material);
   
    scene.add(finalMesh);

    // label h
    const div = document.createElement('div');
    div.style.color = 'white';
    div.style.fontSize = '14px';
    div.style.background = 'rgba(0,0,0,0.5)';
    div.style.padding = '4px';
    div.style.borderRadius = '4px';
    div.style.whiteSpace = 'pre';
    div.textContent = `${b}`;

    paramLabel = new CSS2DObject(div);
    paramLabel.position.set((h/2), s+(b/2)+25, e/2);
    scene.add(paramLabel);
   
    // label b
    const div1 = document.createElement('div');
    div1.style.color = 'white';
    div1.style.fontSize = '14px';
    div1.style.background = 'rgba(0,0,0,0.5)';
    div1.style.padding = '4px';
    div1.style.borderRadius = '4px';
    div1.style.whiteSpace = 'pre';
    div1.textContent = `${h}`;

    paramLabel1 = new CSS2DObject(div1);
    paramLabel1.position.set(0, s+(b/2)+5, e/2);
    scene.add(paramLabel1);
    
    // label w
    const div2 = document.createElement('div');
    div2.style.color = 'white';
    div2.style.fontSize = '14px';
    div2.style.background = 'rgba(0,0,0,0.5)';
    div2.style.padding = '4px';
    div2.style.borderRadius = '4px';
    div2.style.whiteSpace = 'pre';
    div2.textContent = `${w}`;

    paramLabel2 = new CSS2DObject(div2);
    paramLabel2.position.set(w/2, -5, e/2);
    scene.add(paramLabel2);

    // CSS2D renderer
    if (!labelRenderer) {
        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none'; // Belangrijk!
        document.body.appendChild(labelRenderer.domElement);
    }
}



// GUI
const exporter = new STLExporter();
gui.add({ exportSTL: () => {
    if (!finalMesh) return;
    const stl = exporter.parse(finalMesh);
    const blob = new Blob([stl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finalMesh.stl';
    a.click();
    URL.revokeObjectURL(url);
}}, 'exportSTL');

gui.add(params, 'e', 1, 500).onChange(rebuild);
gui.add(params, 'w', 1, 20).onChange(rebuild);
gui.add(params, 'h', 1, 500).onChange(rebuild);
gui.add(params, 'b', 1, 500).onChange(rebuild);
gui.add(params, 's', 20, 1000).onChange(rebuild);
gui.add(params, 'g', 1, 15).onChange(rebuild);

rebuild();

// Sizes
const sizes = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    labelRenderer.setSize(sizes.width, sizes.height);
});

// Camera
const aspect = sizes.width / sizes.height;
const frustumHeight = 1000;
const frustumWidth = frustumHeight * aspect;

const camera = new THREE.OrthographicCamera(
    -frustumWidth / 2,
    frustumWidth / 2,
    frustumHeight / 2,
    -frustumHeight / 2,
    0.1,
    10000
);
camera.position.set(100, 50, 100);



scene.add(camera);



// Controls **correcte koppeling – werkt 100%**
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Loop
function tick() {
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    requestAnimationFrame(tick);
}
tick();

