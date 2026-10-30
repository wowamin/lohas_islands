import * as T from 'three';
import { seededRandom, CITY_SEED } from '../../game/cityLayout';
import type { Quality } from '../../game/citySettings';

// Decorative scenery is separate from the fixed board, its hit targets and its shadow bounds.
export function buildLandscape(night = false, quality: Quality = 'medium') {
  const root = new T.Group(); root.name = 'OuterMountainRiverLandscape';
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
  const random = seededRandom(CITY_SEED + 907);
  const geometry = <G extends T.BufferGeometry>(g: G) => { geometries.add(g); return g; };
  const material = (color: string) => {
    const m = new T.MeshLambertMaterial({ color, flatShading: true }); materials.add(m); return m;
  };
  const terrain = new T.Mesh(geometry(new T.RingGeometry(16.7, 110, quality === 'low' ? 64 : 96, 3)), material(night ? '#334d48' : '#a8bd90'));
  terrain.rotation.x = -Math.PI / 2; terrain.position.y = -1.25; root.add(terrain);

  const river = new T.CatmullRomCurve3([
    [-60,-25],[-39,-23],[-25,-25],[-12,-20],[1,-23],[17,-21],[23,-9],[21,7],[28,25],[46,35],[65,31],
  ].map(([x,z]) => new T.Vector3(x, 0, z)), false, 'centripetal');
  const tributary = new T.CatmullRomCurve3([
    [-56,24],[-39,15],[-30,2],[-31,-10],[-25,-25],
  ].map(([x,z]) => new T.Vector3(x, 0, z)), false, 'centripetal');
  const samples = quality === 'low' ? 96 : 160;
  function ribbon(curve: T.CatmullRomCurve3, width: number, y: number, color: string) {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const point = curve.getPoint(i / samples), tangent = curve.getTangent(i / samples);
      const side = new T.Vector3(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2);
      vertices.push(point.x + side.x, y, point.z + side.z, point.x - side.x, y, point.z - side.z);
      if (i < samples) { const a = i * 2; indices.push(a, a+2, a+1, a+1, a+2, a+3); }
    }
    const g = geometry(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    const m = material(color); m.side = T.DoubleSide;
    const mesh = new T.Mesh(g,m); root.add(mesh);return mesh;
  }
  for (const [curve, width] of [[river, 2.4], [tributary, 1.1]] as const) {
    ribbon(curve, width + 1.1, -1.20, night ? '#67776a' : '#ddd5b0');
    const water = ribbon(curve, width, -1.17, night ? '#427b8c' : '#78b9c4'); water.name = 'OuterRiver';
    // Thin highlights follow the actual river rather than using animated textures.
    ribbon(curve, .07, -1.16, night ? '#6296a4' : '#c2e4df');
  }

  const matrix = new T.Object3D();
  function batch(name: string, shape: T.BufferGeometry, count: number, color: string,
    placement: (index:number) => {x:number;y:number;z:number;sx:number;sy:number;sz:number}) {
    const mesh = new T.InstancedMesh(shape, material(color), count); mesh.name = name;
    for(let i=0;i<count;i++) {
      const p=placement(i);matrix.position.set(p.x,p.y,p.z);matrix.scale.set(p.sx,p.sy,p.sz);matrix.rotation.set(0,random()*Math.PI,0);matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix);
      mesh.setColorAt(i,new T.Color().setScalar(.88 + random()*.16));
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);return mesh;
  }
  // Wide faceted silhouettes and overlapping foothills evoke the supplied rolling mountain reference.
  const mountain = geometry(new T.ConeGeometry(1,1,7,2));
  batch('DistantBlueRidges',mountain,14,night?'#31495d':'#91adb9',i=>{
    const a=i/14*Math.PI*2,r=36+random()*5,rear=Math.max(0,-Math.cos(a)*.57-Math.sin(a)*.82),height=3+rear*9+random()*2;
    return{x:Math.cos(a)*r,y:height/2-1.4,z:Math.sin(a)*r,sx:7+random()*4,sy:height,sz:6+random()*3};
  });
  batch('SageMountainRidges',mountain,18,night?'#3b5756':'#789d91',i=>{
    const a=i/18*Math.PI*2+.2,r=28+random()*4,rear=Math.max(0,-Math.cos(a)*.57-Math.sin(a)*.82),height=2+rear*6+random();
    return{x:Math.cos(a)*r,y:height/2-1.4,z:Math.sin(a)*r,sx:5+random()*2,sy:height,sz:4+random()*2};
  });
  const hill=geometry(new T.IcosahedronGeometry(1,quality==='low'?0:1));
  batch('RollingGreenFoothills',hill,22,night?'#49624e':'#98b47d',i=>{
    const a=i/22*Math.PI*2,r=24+random()*5;
    return{x:Math.cos(a)*r,y:-1.1,z:Math.sin(a)*r,sx:3+random()*2,sy:1.2+random()*.8,sz:2.5+random()*2};
  });
  // Keep the foreground beside the island open; forests sit beyond the river and outside the board.
  const riverPoints=river.getPoints(samples),tributaryPoints=tributary.getPoints(80);
  const forest = Array.from({length:quality==='low'?35:quality==='medium'?60:85},()=>{
    const a=random()*Math.PI*2,r=27+random()*8;return{x:Math.cos(a)*r,z:Math.sin(a)*r,s:.65+random()*.6};
  }).filter(p=>riverPoints.every(v=>Math.hypot(v.x-p.x,v.z-p.z)>3.3)&&tributaryPoints.every(v=>Math.hypot(v.x-p.x,v.z-p.z)>2.5));
  batch('OuterForest',geometry(new T.ConeGeometry(1,1,5)),forest.length,night?'#355b49':'#709477',i=>{
    const p=forest[i];return{x:p.x,y:-.6,z:p.z,sx:p.s*.45,sy:p.s*1.4,sz:p.s*.45};
  });
  root.userData.boardClearRadius=16.7;
  root.userData.riverClearance=Math.min(...riverPoints.map(p=>Math.hypot(p.x,p.z)-1.75),...tributaryPoints.map(p=>Math.hypot(p.x,p.z)-1.1));
  // These meshes neither cast shadows nor participate in building raycasts.
  return { root, dispose() { root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.clear(); } };
}
