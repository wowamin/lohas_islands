import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// One pool per city lifetime. Batching retains the center hit target for each instance.
export function createDioramaKit(root:T.Group,night:boolean){
  const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>(),textures:T.Texture[]=[];
  const geo=(id:string,make:()=>T.BufferGeometry)=>{if(!geometries.has(id))geometries.set(id,make());return geometries.get(id)!;};
  const material=(color:string,kind='matte')=>{
    const key=color+kind;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:kind==='water'?.24:kind==='glass'?.22:.88,metalness:kind==='glass'?.08:0,envMapIntensity:kind==='water'?.55:.18,emissive:night&&kind==='glass'?'#ffd69c':'#000000',emissiveIntensity:night&&kind==='glass'?.5:0}));return materials.get(key)!;
  };
  function mesh(shape:T.BufferGeometry,color:string,at:readonly number[],parent=root,kind='matte'){
    const object=new T.Mesh(shape,material(color,kind));object.position.set(at[0],at[1],at[2]);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
  }
  function box(size:readonly [number,number,number],at:readonly number[],color:string,parent=root,radius=.035){
    const r=Math.min(radius,...size.map(n=>n*.45));
    return mesh(geo('box'+size.join(',')+':'+r,()=>r>0?new RoundedBoxGeometry(...size,1,r):new T.BoxGeometry(...size)),color,at,parent);
  }
  function orb(radius:number,at:readonly number[],color:string,parent=root){return mesh(geo('orb'+radius,()=>new T.IcosahedronGeometry(radius,1)),color,at,parent);}
  function cylinder(radius:number,height:number,at:readonly number[],color:string,parent=root,segments=12){return mesh(geo('cylinder'+[radius,height,segments],()=>new T.CylinderGeometry(radius,radius,height,segments)),color,at,parent);}
  function sign(text:string,width:number,at:readonly number[],parent=root){
    const panel=box([width,.43,.09],at,'#f8f2e7',parent);panel.userData.text=text;
    if(typeof document!=='undefined'){
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');
      if(ctx){ctx.fillStyle='#f8f2e7';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#4b463f';ctx.font='700 115px "Microsoft JhengHei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,132,960);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.push(texture);const mat=new T.MeshStandardMaterial({map:texture,roughness:.85});materials.set('sign:'+text,mat);const face=new T.Mesh(geo('signface'+width,()=>new T.PlaneGeometry(width*.96,.4)),mat);face.position.set(at[0],at[1],at[2]+.051);parent.add(face);}
    }
    return panel;
  }
  function contact(width:number,depth:number,at:readonly number[],parent=root){
    const key='contact-shadow';
    if(!materials.has(key)){
      const n=64,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,r=Math.max(Math.abs((x+.5)/n*2-1),Math.abs((y+.5)/n*2-1));data[i]=48;data[i+1]=61;data[i+2]=48;data[i+3]=Math.round(Math.max(0,1-r)**1.2*75);}
      const texture=new T.DataTexture(data,n,n);texture.needsUpdate=true;textures.push(texture);const m=new T.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,roughness:1});materials.set(key,m);
    }
    const shadow=new T.Mesh(geo('contact-plane'+width+','+depth,()=>new T.PlaneGeometry(width,depth)),materials.get(key));shadow.position.set(at[0],at[1],at[2]);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;parent.add(shadow);
  }
  function batch(){
    root.updateMatrixWorld(true);
    const batches=new Map<string,{geometry:T.BufferGeometry;material:T.Material;items:{mesh:T.Mesh;matrix:T.Matrix4;centerId?:string}[]}>();
    root.traverse(o=>{
      if(!(o instanceof T.Mesh)||o instanceof T.InstancedMesh||Array.isArray(o.material)||o.userData.keepMesh)return;
      let parent:T.Object3D|null=o,centerId:string|undefined;while(parent){if(parent.userData.centerId){centerId=parent.userData.centerId;break;}parent=parent.parent;}
      const key=o.geometry.uuid+':'+o.material.uuid;let b=batches.get(key);if(!b){b={geometry:o.geometry,material:o.material,items:[]};batches.set(key,b);}b.items.push({mesh:o,matrix:o.matrixWorld.clone(),centerId});
    });
    for(const b of batches.values()){
      const object=new T.InstancedMesh(b.geometry,b.material,b.items.length);b.items.forEach((item,i)=>{object.setMatrixAt(i,item.matrix);item.mesh.removeFromParent();});object.userData.centerIds=b.items.map(item=>item.centerId);object.castShadow=b.items.some(i=>i.mesh.castShadow);object.receiveShadow=true;object.instanceMatrix.needsUpdate=true;root.add(object);
    }
  }
  return {geo,material,mesh,box,orb,cylinder,sign,contact,batch,dispose(){root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
export type DioramaKit=ReturnType<typeof createDioramaKit>;
