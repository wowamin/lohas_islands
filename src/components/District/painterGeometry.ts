import * as T from 'three';

// SVG uses a painter's algorithm. Short faces prevent a long ground/pond triangle
// from sorting in front of an otherwise correctly positioned building.
export function refinePainterSurfaces(root:T.Object3D,maxEdge=.7) {
  const refined=new Map<T.BufferGeometry,T.BufferGeometry>();
  root.traverse(o=>{
    if(!(o instanceof T.Mesh)||!(o.geometry instanceof T.BufferGeometry))return;
    const original=o.geometry;
    if(refined.has(original)){o.geometry=refined.get(original)!;return;}
    const input=original.index?original.toNonIndexed():original;
    const p=input.getAttribute('position'),n=input.getAttribute('normal');
    const vertices:number[]=[],normals:number[]=[];
    type V={p:T.Vector3;n:T.Vector3};
    const midpoint=(a:V,b:V):V=>({p:a.p.clone().add(b.p).multiplyScalar(.5),n:a.n.clone().add(b.n).normalize()});
    const emit=(a:V,b:V,c:V,depth=0)=>{
      if(depth<6&&Math.max(a.p.distanceTo(b.p),a.p.distanceTo(c.p),b.p.distanceTo(c.p))>maxEdge){const ab=midpoint(a,b),bc=midpoint(b,c),ca=midpoint(c,a);emit(a,ab,ca,depth+1);emit(ab,b,bc,depth+1);emit(ca,bc,c,depth+1);emit(ab,bc,ca,depth+1);}
      else for(const v of[a,b,c]){vertices.push(v.p.x,v.p.y,v.p.z);normals.push(v.n.x,v.n.y,v.n.z);}
    };
    for(let i=0;i<p.count;i+=3){const v=(j:number):V=>({p:new T.Vector3().fromBufferAttribute(p,j),n:n?new T.Vector3().fromBufferAttribute(n,j):new T.Vector3(0,1,0)});emit(v(i),v(i+1),v(i+2));}
    const g=new T.BufferGeometry();g.userData.originalType=original.type;g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));refined.set(original,g);o.geometry=g;if(input!==original)input.dispose();
  });
  return()=>refined.forEach(g=>g.dispose());
}

// Keep the tiny facade details together with their own building in SVG mode.
export function sortPainterGroups(root:T.Object3D,camera:T.Camera) {
  root.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const point=new T.Vector3();
  for(const child of root.children){
    const groupBox=new T.Box3().setFromObject(child);
    groupBox.getCenter(point).applyMatrix4(camera.matrixWorldInverse);
    const order=point.z*100;
    child.traverse(o=>{
      if(!(o instanceof T.Mesh))return;
      const worldBox=new T.Box3().setFromObject(o);
      if(worldBox.max.y<.35){o.renderOrder=-100000+worldBox.max.y*100;return;}
      o.geometry.computeBoundingBox();const box=o.geometry.boundingBox;if(!box)return;
      const size=box.getSize(new T.Vector3());
      const thin=Math.min(size.x,size.y,size.z)<.08;
      const roof=o.geometry.type==='ExtrudeGeometry'||(o.geometry.userData.originalType==='ExtrudeGeometry');
      o.renderOrder=order+(roof?4:thin?2:0);
    });
  }
}
