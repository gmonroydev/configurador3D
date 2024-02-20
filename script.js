import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

//************************************Parametros modificables*********************************************
const panelwidth=2;//grueso de los paneles que conforman el mueble                                       *
const totalISX=50,totalISY=100,totalISZ=50;//dimensiones del mueble                                      *
const minX=30, maxX=200, minY=50, maxY=200, minZ=20, maxZ=100;//dimensiones minimas y maximas del mueble *
const modSize=2;//cuantas unidades se modifica la dimension con los botones de +-                        *
//********************************************************************************************************
const latpanISX=panelwidth, latpanISY=totalISY, latpanISZ=totalISZ;//dimensiones iniciales de los paneles laterales
const shelfISX=totalISX-(2*panelwidth), shelfISY=panelwidth, shelfISZ=totalISZ;//dimensiones laterales de repisas y tapas
let scaleX=0, scaleY=0, scaleZ=0;//almacenan la cantidad de unidades que se han agregado o quitado de la dimension inicial del mueble
let nShelves=0;//cantidad de repisas del mueble
let selectedWood;//almacena la ultima textura seleccionada

//Clase con las propiedades de los paneles que conforman el mueble
class Panel{
	constructor(x,y,z,sX,sY,sZ,wood,color,direction){
		this.positionX=x;
		this.positionY=y;
		this.positionZ=z;
		this.sizeX=sX;
	    this.sizeY=sY;
		this.sizeZ=sZ;
		this.wood=wood;
		this.color=color;
		this.direction=direction; //Ubicacion positiva o negativa en los ejes xyz
	}
}

//Creacion de los cuatro paneles que conforman la estructura basica del mueble
const lateralPanel=new Panel((totalISX/2)-(panelwidth/2),0,0,latpanISX,latpanISY,latpanISZ,"wood",0x1E88E5,1);
const topPanel=new Panel(0,(totalISY/2)-(panelwidth/2),0,shelfISX,shelfISY,shelfISZ,"wood",0x1E88E5,1); 
const lateralPanel2={...lateralPanel};//se crea el segundo panel lateral cloando el primero
lateralPanel2.positionX*=-1;//se asigna al segundo panel direccion negativa para que aparezca en el lado opuesto al primero
lateralPanel2.direction=-1;
const bottomPanel={...topPanel};
bottomPanel.positionY*=-1;
bottomPanel.direction=-1;
//Los paneles que conforman el muble se almacenan en el arreglo "panels"
let panels=[lateralPanel, lateralPanel2, topPanel, bottomPanel];

//Elementos de THREEJS
//Scene
const scene=new THREE.Scene();
//Textures
const loader=new THREE.TextureLoader();
const materials=[
    loader.load("textures/pino.jpg"),
    loader.load("textures/cedro.png"),
    loader.load("textures/caoba.jpg"),
	loader.load("textures/primer.png")
];
//Mesh
let panelsMesh=[], panelsLine=[];
for(let panel of panels){
	const geometry=new THREE.BoxGeometry(panel.sizeX, panel.sizeY, panel.sizeZ);
	const material=new THREE.MeshPhongMaterial({color:panel.color, shininess: 150});
	const mesh=new THREE.Mesh(geometry, material);
	mesh.material.map=materials[0];
	panelsMesh.push(mesh);
	const edges=new THREE.EdgesGeometry(geometry); 
	const line=new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x000000})); 
	panelsLine.push(line);
	mesh.receiveShadow=true;
	mesh.castShadow=true;
	mesh.position.x=panel.positionX;
	mesh.position.y=panel.positionY;
	mesh.position.z=panel.positionZ;
	line.position.x=panel.positionX;
	line.position.y=panel.positionY;
	line.position.z=panel.positionZ;
	scene.add(mesh);
    scene.add(line);
}
//Camera
const camera=new THREE.PerspectiveCamera(90, window.innerWidth*0.7/window.innerHeight, 0.1, 1000);
camera.position.z=300;
//Renderer
const renderer=new THREE.WebGLRenderer({canvas:tjsCanvas, antialias:true});
//Light
const directionalLight=new THREE.DirectionalLight(0xffffff, 2.7)
directionalLight.position.copy(camera.position);
//Controls
const controls=new OrbitControls(camera, renderer.domElement);
controls.minDistance=50;
controls.maxDistance=300;
controls.zoomSpeed=2;

//Funciones
function init(){
    scene.background=new THREE.Color(0xE7E7E7);
    scene.add(directionalLight);
	window.addEventListener('resize', onWindowResize, false);
	renderer.setSize(window.innerWidth*0.7, window.innerHeight);//modifica el tamaño del objeto con respecto al tamaño de la ventana
    renderer.shadowMapEnabled=true;
}

function onWindowResize(){
	camera.aspect=window.innerWidth*0.7/window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth*0.7,window.innerHeight);
}

function animate(){
	requestAnimationFrame(animate);
	directionalLight.position.copy(camera.position);
	renderer.render(scene, camera);
}

function changeColor(e){
	for(let panelMesh of panelsMesh){
		panelMesh.material.color.set(e.target.value);
	}
}

function changeSizeX(sx, sign){
	for(let i=0; i<panelsMesh.length; i++){
		if(i>=2){
			panelsMesh[i].scale.x=(totalISX+sx)/totalISX;
			panelsLine[i].scale.x=(totalISX+sx)/totalISX;
		}
		else{
			panels[i].positionX+=((modSize*panels[i].direction)/2)*sign*0.92;
			panelsMesh[i].position.x=panels[i].positionX
			panelsLine[i].position.x=panels[i].positionX
		}
	}
}

function changeSizeY(sy, sign){
	for(let i=0; i<panelsMesh.length; i++){
		if(i<2){
			panelsMesh[i].scale.y=(totalISY+sy)/totalISY;
			panelsLine[i].scale.y=(totalISY+sy)/totalISY;
		}
		else{
			panels[i].positionY+=((modSize*panels[i].direction)/2)*sign*1.002;
			panelsMesh[i].position.y=panels[i].positionY
			panelsLine[i].position.y=panels[i].positionY
			positionShelves();
		}	
	}
}

function changeSizeZ(sz, sign){
	for(let i=0; i<panelsMesh.length; i++){
		panelsMesh[i].scale.z=(totalISZ+sz)/totalISZ;
		panelsLine[i].scale.z=(totalISZ+sz)/totalISZ;
	}
}

function positionShelves(){
	let spaceBtwnShelves=(totalISY+scaleY)/(nShelves+1);
	let acmBtwnShelves=0;
	for(let i=4; i<panelsMesh.length; i++){
		acmBtwnShelves+=spaceBtwnShelves;
		panelsMesh[i].position.set(0,panelsMesh[3].position.y+acmBtwnShelves,0);
		panelsLine[i].position.set(0,panelsMesh[3].position.y+acmBtwnShelves,0);
		panels[i].positionY=panelsMesh[3].position.y+acmBtwnShelves;
	}
};

function addShelf(){
	const mesh=panelsMesh[3].clone();
	mesh.material=panelsMesh[3].material.clone();
	mesh.name="shelfMesh"+nShelves;
	const line=panelsLine[3].clone();
	line.name="shelfLine"+nShelves;
	panelsMesh.push(mesh);
	panelsLine.push(line);
	panels.push(mesh);
	positionShelves();
	scene.add(mesh);
	scene.add(line);
}

function quitShelf(){
	let lastShelfMesh=scene.getObjectByName("shelfMesh"+(nShelves+1));
	let lastShelfLine=scene.getObjectByName("shelfLine"+(nShelves+1));
	scene.remove(lastShelfMesh);
	scene.remove(lastShelfLine);
	panelsMesh.pop();
	panelsLine.pop();
	panels.pop();
	positionShelves();
}

function updateTexture(nTexture){
	for(let panelMesh of panelsMesh){
		panelMesh.material.map=materials[nTexture];
	}
}

function changeWood(e){
	if(this.checked){
		if(this.value==="pine"){
			selectedWood=0;
			updateTexture(0);
		}
		else if(this.value==="cedar"){
			selectedWood=1;
			updateTexture(1);
		}
		else if(this.value==="mahogany"){
			selectedWood=2;
			updateTexture(2);
		}
	}
}

function changeFinished(e){
	if(this.value==="varnish"){
		updateTexture(selectedWood);
	}
	else if(this.value==="paint"){
		updateTexture(3);
	}
}

//Controles para mofificar el objeto
const rdobtnPaint=document.getElementById("slcPaint");
rdobtnPaint.addEventListener("input", changeColor)

const rdobtnVarnish=document.getElementById("slcVarnish");
rdobtnVarnish.addEventListener("input", changeColor)

const btnIncH=document.getElementById("incHeigth");
btnIncH.addEventListener("click", ()=>{
	changeSizeY(scaleY+=modSize, 1)
});

const btnDecH=document.getElementById("decHeigth");
btnDecH.addEventListener("click", ()=>{
	changeSizeY(scaleY-=modSize, -1)
});

const btnIncL=document.getElementById("incLenght");
btnIncL.addEventListener("click", ()=>{
	changeSizeX(scaleX+=modSize, 1)
});

const btnDecL=document.getElementById("decLenght");
btnDecL.addEventListener("click", ()=>{
	changeSizeX(scaleX-=modSize, -1)
});

const btnIncW=document.getElementById("incWidth");
btnIncW.addEventListener("click", ()=>{
	changeSizeZ(scaleZ+=modSize, 1)
});

const btnDecW=document.getElementById("decWidth");
btnDecW.addEventListener("click", ()=>{
	changeSizeZ(scaleZ-=modSize,-1)
});

const btnAddShelf=document.getElementById("addShelf");
btnAddShelf.addEventListener("click", ()=>{
	nShelves+=1;
	addShelf();
});

const btnQuitShelf=document.getElementById("quitShelf");
btnQuitShelf.addEventListener("click", ()=>{
	nShelves-=1;
	quitShelf();
});

const rdobtnWood=document.querySelectorAll("input[name='slcMaterial']");
for (const radioButton of rdobtnWood){
	radioButton.addEventListener("change", changeWood)
};

const rdobtnFinished=document.querySelectorAll("input[name='slcFinished']");
for (const radioButton of rdobtnFinished){
	radioButton.addEventListener("change", changeFinished)
};

init();
animate();