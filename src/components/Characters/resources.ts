import * as T from 'three';
import type { Quality } from '../../game/citySettings';
interface ResourcePool {refs:number;geometries:Map<string,T.BufferGeometry>;materials:Map<string,T.MeshStandardMaterial>;textures:Map<string,T.DataTexture>}
const pools=new Map<Quality,ResourcePool>();
export function acquireCharacterResources(quality:Quality){
  let pool=pools.get(quality);if(!pool){pool={refs:0,geometries:new Map(),materials:new Map(),textures:new Map()};pools.set(quality,pool);}pool.refs++;
  const current=pool;
  const geometry=(key:string,make:()=>T.BufferGeometry)=>{if(!current.geometries.has(key))current.geometries.set(key,make());return current.geometries.get(key)!;};
  const material=(color:string,pattern?:'plaid'|'houndstooth')=>{
    const key=color+':'+(pattern??'');
    if(!current.materials.has(key)){
      let map:T.DataTexture|undefined;
      if(pattern){
        map=current.textures.get(pattern);
        if(!map){
          const n=128,data=new Uint8Array(n*n*4),a=new T.Color(pattern==='plaid'?'#245d9a':'#d82d63'),b=new T.Color(pattern==='plaid'?'#d3e7f0':'#ff91b2');
          const encodedA=a.clone().convertLinearToSRGB(),encodedB=b.clone().convertLinearToSRGB();
          for(let y=0;y<n;y++)for(let x=0;x<n;x++){
            const warp=Math.floor(x/2),weft=Math.floor(y/2),over=((warp-weft)%4+4)%4<2;
            const alt=pattern==='plaid'?x%16<1||y%16<1:over?warp%8<4:weft%8<4;
            const color=alt?encodedB:encodedA,i=(y*n+x)*4;data[i]=Math.round(color.r*255);data[i+1]=Math.round(color.g*255);data[i+2]=Math.round(color.b*255);data[i+3]=255;
          }
          map=new T.DataTexture(data,n,n);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(1.5,1);map.magFilter=T.NearestFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;current.textures.set(pattern,map);
        }
      }
      current.materials.set(key,new T.MeshStandardMaterial({color:pattern?'#ffffff':color,map:map??null,roughness:.68,metalness:0}));
    }
    return current.materials.get(key)!;
  };
  const contactShadowMaterial=()=>{
    const key='contact-shadow';
    if(!current.materials.has(key)){
      const n=32,data=new Uint8Array(n*n*4);
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,r=Math.hypot((x+.5)/n*2-1,(y+.5)/n*2-1);data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.max(0,1-r)**2*150);}
      const map=new T.DataTexture(data,n,n);map.magFilter=T.LinearFilter;map.needsUpdate=true;current.textures.set(key,map);
      current.materials.set(key,new T.MeshStandardMaterial({map,color:'#344e3d',transparent:true,opacity:.38,depthWrite:false,roughness:1}));
    }
    return current.materials.get(key)!;
  };
  let released=false;
  return {geometry,material,contactShadowMaterial,release(){if(released)return;released=true;if(--current.refs===0){current.geometries.forEach(g=>g.dispose());current.materials.forEach(m=>m.dispose());current.textures.forEach(t=>t.dispose());pools.delete(quality);}}};
}
export function characterResourceStats(){return [...pools].map(([quality,p])=>({quality,refs:p.refs,geometries:p.geometries.size,materials:p.materials.size,textures:p.textures.size}));}
