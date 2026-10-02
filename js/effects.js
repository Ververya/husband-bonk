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
