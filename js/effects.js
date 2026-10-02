export function createEffects(container){
  const active=new Map();
  const animations=new Map();
  function remove(node){clearTimeout(active.get(node));active.delete(node);node.remove();}
  function add(text,x,y,type=''){
    while(active.size>=20)remove(active.keys().next().value);
    const node=document.createElement('span');node.className=`effect ${type}`;node.textContent=text;
    node.style.left=`${x}px`;node.style.top=`${y}px`;node.style.setProperty('--drift',`${Math.random()*60-30}px`);
    container.append(node);active.set(node,setTimeout(()=>remove(node),600));
  }
  function animate(element,name,reduced){
    if(reduced)return;
    const previous=animations.get(element);if(previous){clearTimeout(previous.timer);element.classList.remove(previous.name);}
    element.classList.remove(name);void element.offsetWidth;element.classList.add(name);
    animations.set(element,{name,timer:setTimeout(()=>{element.classList.remove(name);animations.delete(element);},220)});
  }
  function hit(x,y,reduced){
    if(reduced)return;
    const words=['BONK!','啪！','BOINK!','咚！','💢'];
    add(words[Math.floor(Math.random()*words.length)],x,y);
    for(let i=0;i<3;i++)add(i%2?'✦':'·',x+(Math.random()-.5)*85,y+Math.random()*25,'particle');
  }
  function celebrate(reduced){if(!reduced)for(let i=0;i<12;i++)add(['✦','●','▰'][i%3],Math.random()*container.clientWidth,100+Math.random()*180,'confetti');}
  function clear(){for(const node of [...active.keys()])remove(node);for(const [element,{name,timer}] of animations){clearTimeout(timer);element.classList.remove(name);}animations.clear();}
  return {hit,animate,celebrate,clear};
}

// Decorative only: no counters or saved state are changed here.
export function createBackgroundCat(element,reduced){
  let hits=0,previous=0,idleTimer=null,reactionTimer=null,busy=false;
  function stop(){clearTimeout(idleTimer);clearTimeout(reactionTimer);idleTimer=reactionTimer=null;busy=false;element.classList.remove('cat-walk','cat-reverse');delete element.dataset.reaction;}
  function schedule(){
    clearTimeout(idleTimer);idleTimer=null;
    if(document.hidden||reduced()||hits>=30)return;
    idleTimer=setTimeout(()=>{
      if(document.hidden||reduced()||hits>=30)return;
      element.classList.toggle('cat-reverse',Math.random()<.5);element.classList.add('cat-walk');
    },7000+Math.random()*5000);
  }
  function react(kind){
    if(document.hidden||reduced()||busy)return;
    busy=true;clearTimeout(idleTimer);element.classList.remove('cat-walk');element.dataset.reaction=kind;
    reactionTimer=setTimeout(()=>{busy=false;element.dataset.reaction='watch';},1000);
  }
  element.addEventListener('animationend',event=>{
    if(event.animationName==='cat-stroll'){element.classList.remove('cat-walk','cat-reverse');schedule();}
  });
  function update(value){
    hits=value;const crossed=previous<30&&hits>=30;previous=hits;
    element.dataset.mode=hits>=30?'reaction':'normal';
    if(document.hidden||reduced()){stop();return;}
    if(hits>=30){clearTimeout(idleTimer);idleTimer=null;element.classList.remove('cat-walk');}
    else if(!idleTimer&&!element.classList.contains('cat-walk')){stop();schedule();}
    if(crossed){
      stop();busy=true;element.dataset.reaction='surprise';
      reactionTimer=setTimeout(()=>{element.dataset.reaction='grin';busy=false;},500);
    }
  }
  function onBonk(value){
    if(value>30&&Math.random()<.2)react(['surprise','step-back','watch','grin','tail-up','flinch'][Math.floor(Math.random()*6)]);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else update(hits);});
  schedule();return {update,onBonk};
}
