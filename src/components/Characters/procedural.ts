import * as T from 'three';
import { acquireCharacterResources } from './resources';
import { CHARACTER_HEIGHT } from './types';
import type { CharacterModel, CharacterOptions, CharacterPose } from './types';

export function createProceduralCharacter({characterId,color,quality='medium'}:CharacterOptions):CharacterModel{
  const grandma=characterId==='grandma',resources=acquireCharacterResources(quality),root=new T.Group(),rig=new T.Group(),body=new T.Group();
  root.name='Character-'+characterId;root.userData.characterId=characterId;root.userData.color=color;root.add(rig);rig.add(body);body.name='BodyMotion';
  const segments=quality==='low'?12:20;
  const sphere=resources.geometry('sphere',()=>new T.SphereGeometry(1,segments,quality==='low'?8:12));
  const cylinder=resources.geometry('cylinder',()=>new T.CylinderGeometry(1,1,1,segments));
  const box=resources.geometry('box',()=>new T.BoxGeometry(1,1,1));
  function part(parent:T.Group,name:string,g:T.BufferGeometry,at:readonly number[],scale:readonly number[],tint:string,pattern?:'plaid'|'houndstooth'){
    const mesh=new T.Mesh(g,resources.material(tint,pattern));mesh.name=name;mesh.position.set(at[0],at[1],at[2]);mesh.scale.set(scale[0],scale[1],scale[2]);mesh.castShadow=quality!=='low'&&['PatternedShirt','LowerBody','HairBack','HairCurl','CapDome'].includes(name);mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const ball=(parent:T.Group,name:string,at:readonly number[],scale:readonly number[],tint:string,pattern?:'plaid'|'houndstooth')=>part(parent,name,sphere,at,scale,tint,pattern);
  function bar(parent:T.Group,name:string,a:T.Vector3,b:T.Vector3,r:number,tint:string){const d=b.clone().sub(a),mesh=part(parent,name,cylinder,a.clone().add(b).multiplyScalar(.5).toArray(),[r,d.length(),r],tint);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return mesh;}
  const skin='#efc29d',hair=grandma?'#f38bb9':'#b8dab9',shirt=grandma?'#d82d63':'#245d9a',pattern=grandma?'houndstooth':'plaid';
  const shadow=new T.Mesh(resources.geometry('contact-shadow',()=>new T.PlaneGeometry(2.1,1.5)),resources.contactShadowMaterial());shadow.name='SoftContactShadow';shadow.rotation.x=-Math.PI/2;shadow.position.y=.001;rig.add(shadow);
  const base=part(rig,'PlayerColorBase',cylinder,[0,.055,0],[.87,.11,.57],color);base.castShadow=false;
  part(rig,'IvoryBaseTop',cylinder,[0,.12,0],[.82,.04,.53],'#f4e6d4');
  for(const x of [-.25,.25])ball(body,'RedShoe',[x,.22,.12],[.23,.12,.30],'#bd263c');
  ball(body,'LowerBody',[0,.70,-.02],[.76,.49,.45],grandma?'#f16f62':'#823fa5');
  if(!grandma){
    for(const x of [-.27,.27])ball(body,'TrouserLeg',[x,.48,.01],[.34,.28,.43],'#823fa5');
    bar(body,'TrouserSeam',new T.Vector3(0,.34,.40),new T.Vector3(0,.72,.44),.012,'#643181');
  }
  ball(body,'PatternedShirt',[0,1.18,0],[.82,.55,.49],shirt,pattern);
  const head=new T.Group();head.name='Head';body.add(head);
  ball(head,'HairBack',[0,2.07,-.17],grandma?[.74,.66,.51]:[.65,.48,.43],hair);
  ball(head,'Face',[0,1.98,.075],[.65,.57,.47],skin);
  for(const x of [-.64,.64]){ball(head,'Ear',[x,1.98,.03],[.12,.14,.10],skin);ball(head,'EarInner',[x,1.98,.115],[.062,.075,.026],'#df9f99');}
  for(const x of [-.31,.31]){
    ball(head,'FullCheek',[x,1.77,.39],[.30,.30,.23],skin);
    for(let i=0;i<3;i++){const blush=part(head,'Blush',box,[x+(i-1)*.047,1.85,.60],[.018,.065,.012],'#de7f93');blush.rotation.z=-.35;}
  }
  const eyes:T.Group[]=[];
  for(const x of [-.235,.235]){
    const eye=new T.Group();eye.name='Eye';eye.position.set(x,2.09,.49);head.add(eye);eyes.push(eye);
    ball(eye,'EyeWhite',[0,0,0],[.17,.18,.09],'#fff8e9');ball(eye,'Iris',[0,-.005,.069],[.108,.125,.044],'#40302d');ball(eye,'Pupil',[0,-.005,.101],[.068,.086,.022],'#171f24');
    ball(eye,'EyeHighlight',[-.038,.047,.123],[.035,.036,.011],'#ffffff');ball(eye,'EyeHighlight',[.036,-.035,.122],[.014,.016,.009],'#ffffff');
    ball(head,'Eyebrow',[x,2.30,.50],[.14,.043,.045],grandma?'#d65886':'#b8dab9');
  }
  ball(head,'Nose',[0,1.94,.60],[.092,.078,.085],skin);
  ball(head,'Mouth',[0,1.68,.596],[.123,.071,.034],'#892b48');
  ball(head,'UpperLip',[0,1.72,.624],[.126,.046,.041],'#ef5481');ball(head,'LowerLip',[0,1.655,.619],[.108,.047,.037],'#f27596');
  if(grandma){
    const glasses=new T.Group();glasses.name='RedRoundGlasses';head.add(glasses);
    const ring=resources.geometry('glasses',()=>new T.TorusGeometry(.208,.034,8,24));
    for(const x of [-.235,.235])part(glasses,'RoundFrame',ring,[x,2.09,.638],[1,1,1],'#b91839');
    bar(glasses,'Bridge',new T.Vector3(-.035,2.12,.64),new T.Vector3(.035,2.12,.64),.021,'#b91839');
    for(const side of [-1,1])bar(glasses,'GlassesArm',new T.Vector3(side*.44,2.10,.63),new T.Vector3(side*.66,2.10,.04),.022,'#b91839');
    const curls=new T.Group();curls.name='PinkCurls';head.add(curls);
    for(let row=0;row<4;row++){
      const theta=.28+row*.60,count=[7,12,14,12][row];
      for(let i=0;i<count;i++){
        const phi=i/count*Math.PI*2,normal=new T.Vector3(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi));
        if(normal.z>.35&&row>1)continue;
        const point=new T.Vector3(normal.x*.64,2.13+normal.y*.52,-.11+normal.z*.48),r=.20+(i%3)*.017;
        ball(curls,'HairCurl',point.toArray(),[r,r*.95,r],hair);
        if(i%3===0){const dot=point.clone().addScaledVector(normal,r*.88);ball(curls,'DeepPinkDot',dot.toArray(),[.08,.08,.065],'#df4b93');}
      }
    }
    for(let i=0;i<12;i++){const a=i/11*Math.PI;ball(body,'Pearl',[Math.cos(a)*.43,1.51-Math.sin(a)*.23,.47+Math.sin(a)*.045],[.062,.062,.062],'#fff9ed');}
  }else{
    const cap=new T.Group();cap.name='GreenRoundCap';head.add(cap);
    const dome=resources.geometry('cap-dome',()=>{
      const vertices:number[]=[],indices:number[]=[],rows=12;
      for(let row=0;row<=rows;row++)for(let column=0;column<=segments;column++){
        const phi=column/segments*Math.PI*2,theta=row/rows*(Math.PI/2+(1-Math.cos(phi))*.5);
        vertices.push(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi));
      }
      for(let row=0;row<rows;row++)for(let column=0;column<segments;column++){const a=row*(segments+1)+column,b=a+1,c=a+segments+1,d=c+1;indices.push(a,c,b,b,c,d);}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
    });
    part(cap,'CapDome',dome,[0,2.29,-.06],[.76,.52,.58],'#79c77d');
    for(const x of [-.52,-.28,0,.28,.52])ball(cap,'MintFringe',[x,2.30,.36-Math.abs(x)*.3],[.19,.085,.13],'#b8dab9');
    const mustache=new T.Group();mustache.name='MintMustache';head.add(mustache);for(const x of [-.14,0,.14])ball(mustache,'MustacheLobe',[x,1.82,.623],[.10,.075,.056],'#b8dab9');
    for(const x of [-.38,.38]){
      bar(body,'FrontSuspender',new T.Vector3(x,.91,.45),new T.Vector3(x,1.54,.41),.043,'#bbdca2');
      bar(body,'BackSuspender',new T.Vector3(x,.91,-.45),new T.Vector3(-x,1.52,-.39),.043,'#bbdca2');
      ball(body,'YellowButton',[x,.91,.49],[.09,.09,.045],'#f1c846');
    }
    for(const y of [1.08,1.30])ball(body,'ShirtButton',[0,y,.497],[.035,.035,.026],'#d94a5a');
  }
  const arms:T.Group[]=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.name=side<0?'LeftArm':'RightArm';arm.position.set(side*.72,1.28,.03);body.add(arm);arms.push(arm);
    ball(arm,'Sleeve',[side*.025,-.14,0],[.20,.32,.25],shirt,pattern);
    ball(arm,'Hand',[side*.01,-.22,.27],[.145,.15,.13],skin);
  }
  const drink=new T.Group();drink.name=grandma?'BubbleTea':'CoconutDrink';drink.position.set(.07,-.22,.40);arms[1].add(drink);
  if(grandma){
    part(drink,'TeaCup',cylinder,[0,.05,.02],[.16,.44,.16],'#d7a27e');part(drink,'TeaLid',cylinder,[0,.285,.02],[.18,.055,.18],'#ee795f');
    for(let row=0;row<3;row++)for(let i=0;i<4;i++){const a=(i-1.5)*.42;ball(drink,'TapiocaPearl',[Math.sin(a)*.147,-.10+row*.055,.02+Math.cos(a)*.15],[.024,.024,.024],'#332d28');}
    bar(drink,'TeaStraw',new T.Vector3(.04,.29,.02),new T.Vector3(.055,.60,.02),.025,'#389d67');
  }else{
    ball(drink,'GreenCoconut',[0,.12,.02],[.26,.28,.235],'#89ca71');
    part(drink,'CoconutTop',cylinder,[0,.36,.02],[.19,.025,.17],'#f2dc9b');
    bar(drink,'CoconutStraw',new T.Vector3(.015,.37,.02),new T.Vector3(.015,.59,.02),.027,'#359365');bar(drink,'BentStraw',new T.Vector3(.015,.59,.02),new T.Vector3(-.09,.59,.02),.027,'#359365');
  }
  // Batch static parts per articulated group, preserving independently animated eyes and arms.
  function batch(group:T.Group){
    for(const child of [...group.children])if(child instanceof T.Group)batch(child);
    const batches=new Map<string,T.Mesh[]>();
    for(const child of [...group.children])if(child instanceof T.Mesh&&!Array.isArray(child.material)){const key=child.geometry.uuid+child.material.uuid;const items=batches.get(key)??[];items.push(child);batches.set(key,items);}
    for(const items of batches.values())if(items.length>1){const first=items[0],inst=new T.InstancedMesh(first.geometry,first.material,items.length);inst.name='Parts-'+first.name;inst.castShadow=items.some(mesh=>mesh.castShadow);inst.receiveShadow=true;items.forEach((mesh,i)=>{mesh.updateMatrix();inst.setMatrixAt(i,mesh.matrix);mesh.removeFromParent();});inst.instanceMatrix.needsUpdate=true;group.add(inst);}
  }
  batch(rig);rig.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(rig),scale=CHARACTER_HEIGHT/(bounds.max.y-bounds.min.y);rig.scale.setScalar(scale);rig.position.y=-bounds.min.y*scale;
  root.userData.forward='+Z';root.userData.height=CHARACTER_HEIGHT;
  let elapsed=0,motionTime=0,lastMotion:CharacterPose['motion']='idle',disposed=false;
  return {root,characterId,height:CHARACTER_HEIGHT,update(delta,pose){
    if(disposed)return;const dt=Math.min(.1,Math.max(0,delta));elapsed+=dt;if(lastMotion!==pose.motion){lastMotion=pose.motion;motionTime=0;}else motionTime+=dt;
    const t=elapsed+(pose.phaseOffset??0),reduced=pose.reducedMotion;
    body.position.y=reduced?0:pose.motion==='walking'?Math.abs(Math.sin(t*12))*.13:pose.motion==='charging'?-.06*(1-Math.cos(motionTime*10)):pose.motion==='cheering'?Math.max(0,Math.sin(Math.min(1,motionTime/.45)*Math.PI))*.25:pose.motion==='landing'?Math.sin(Math.min(1,motionTime/.32)*Math.PI)*.13:Math.sin(t*1.8)*.045;
    body.rotation.z=reduced?0:Math.sin(t*(pose.motion==='walking'?6:1.5))*.025;
    arms[0].rotation.z=reduced?0:pose.motion==='cheering'?-.65:pose.motion==='walking'?Math.sin(t*8)*.12:Math.sin(t*1.8)*.035;
    arms[1].rotation.z=reduced?0:pose.motion==='cheering'?.28:Math.sin(t*1.6)*.025;
    const blink=t%4.6,eyeScale=reduced||blink>.14?1:1-.94*Math.sin(blink/.14*Math.PI);for(const eye of eyes)eye.scale.y=eyeScale;
  },dispose(){if(disposed)return;disposed=true;root.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});root.clear();resources.release();}};
}
