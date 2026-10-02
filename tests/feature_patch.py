"""Feature patch browser checks; isolated storage, no outgoing shares."""
from pathlib import Path
import ast,json,subprocess,urllib.request,threading,base64
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/run_browser.py').read_text(encoding='utf-8-sig'))
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))],type_ignores=[]),'<driver>','exec'))
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',8004),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
browser=subprocess.Popen([r'C:\Program Files\Google\Chrome\Application\chrome.exe','--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9226',f'--user-data-dir={ROOT / ".browser-test-feature"}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
results={}
try:
 pages=until(lambda:json.load(urllib.request.urlopen('http://127.0.0.1:9226/json/list')))
 cdp=CDP(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
 cdp.call('Page.enable');cdp.call('Runtime.enable')
 cdp.call('Page.navigate',{'url':'http://127.0.0.1:8004/'})
 until(lambda:cdp.evaluate("!!document.querySelector('#character svg')"))
 time.sleep(.5)
 cdp.evaluate("localStorage.removeItem('husbandBonk_v2');localStorage.removeItem('husbandBonk_v1')")
 cdp.call('Page.reload');time.sleep(.5)
 for width in [320,375,390,430,768,1024,1280,1440,1920,390]:
  cdp.call('Emulation.setDeviceMetricsOverride',{'width':width,'height':960,'deviceScaleFactor':1,'mobile':width<=600})
  time.sleep(.2)
  metrics=cdp.evaluate("""(()=>{const rect=id=>document.getElementById(id).getBoundingClientRect();const husband=rect('husband'),cat=rect('background-cat'),credit=document.querySelector('.author-footer').getBoundingClientRect(),svg=document.querySelector('#character svg').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,gameWidth:rect('game').width,characterRatio:svg.width/svg.height,footerBelow:credit.top>=husband.bottom,catBehind:Number(getComputedStyle(document.getElementById('background-cat')).zIndex)<Number(getComputedStyle(document.getElementById('husband')).zIndex),catNoPointer:getComputedStyle(document.getElementById('background-cat')).pointerEvents==='none',effectsClipped:getComputedStyle(document.getElementById('effects')).overflow==='hidden',progressFits:rect('progress').right<=rect('game').right};})()""")
  assert not metrics['overflow'],(width,metrics)
  assert all(metrics[k] for k in ['footerBelow','catBehind','catNoPointer','effectsClipped','progressFits']),(width,metrics)
  assert .9<metrics['characterRatio']<.94
  if width>1024:assert 900<=metrics['gameWidth']<=1100
  cdp.evaluate("document.querySelector('#author-button').click()")
  dialog=cdp.evaluate("(()=>{const d=document.querySelector('#author-dialog'),r=d.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,iw:innerWidth,ih:innerHeight,open:d.open,centered:Math.abs(r.x+r.width/2-document.documentElement.clientWidth/2)<2&&Math.abs(r.y+r.height/2-innerHeight/2)<2};})()")
  assert dialog['open'] and dialog['centered'],(width,dialog)
  cdp.evaluate("document.querySelector('#author-close').click()")
  for modal_id in ['alert-dialog','rage-dialog','settings-dialog','reset-dialog']:
   positioned=cdp.evaluate(f"(()=>{{const d=document.getElementById('{modal_id}');d.showModal();const r=d.getBoundingClientRect();const ok=Math.abs(r.x+r.width/2-document.documentElement.clientWidth/2)<2&&Math.abs(r.y+r.height/2-innerHeight/2)<2;d.close();return ok;}})()")
   assert positioned,(width,modal_id)

  results[str(width)]={**metrics,'authorModalCentered':True}
  if width in [390,1440]:
   shot=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':True})
   (ROOT/f'.tools/feature-{width}.png').write_bytes(base64.b64decode(shot['data']))
 def seed(session,alert,ack=False):
  cdp.evaluate(f"localStorage.setItem('husbandBonk_v2',JSON.stringify({{schemaVersion:2,sessionHits:{session},alertHits:{alert},lifetimeHits:{max(session,alert)},sessionAcknowledged:{str(ack).lower()}}}))")
  cdp.call('Page.reload');time.sleep(.5)
 seed(29,98)
 cdp.evaluate("document.querySelector('#husband').click()")
 assert cdp.evaluate("document.querySelector('#rage-dialog').open && document.querySelector('#background-cat').dataset.reaction==='surprise'")
 time.sleep(.6)
 assert cdp.evaluate("document.querySelector('#background-cat').dataset.reaction==='grin'")
 cdp.evaluate("document.querySelector('#continue-session').click();document.querySelector('#husband').click()")
 assert cdp.evaluate("document.querySelector('#alert-dialog').open")
 cdp.call('Page.reload');time.sleep(.5)
 assert cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).sessionHits===31")
 results['30And100TriggersAndStorage']=True
 seed(31,0,True)
 cdp.evaluate("window.originalRandom=Math.random;Math.random=()=>.19;for(let i=0;i<20;i++)document.querySelector('#husband').click();Math.random=originalRandom")
 assert cdp.evaluate("document.querySelectorAll('.effect').length<=20 && document.querySelector('#background-cat').getAnimations({subtree:true}).length<=1")
 assert cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).sessionHits===51")
 results['rapidBonkBounded']=True
 cdp.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
 assert cdp.evaluate("!document.querySelector('#background-cat').classList.contains('cat-walk') && !document.querySelector('#background-cat').dataset.reaction")
 cdp.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))")
 results['simulatedHiddenStopsCat']=True
 cdp.call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
 time.sleep(.2)
 cdp.evaluate("document.querySelector('#husband').click()")
 assert cdp.evaluate("document.querySelector('#background-cat').getAnimations({subtree:true}).length===0")
 results['reducedMotionStatic']=True
 # Normal idle movement starts after a quiet pause and stops when hidden.
 cdp.call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'no-preference'}]})
 seed(0,0)
 cdp.evaluate("Math.random=()=>0;Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))")
 until(lambda:cdp.evaluate("document.querySelector('#background-cat').classList.contains('cat-walk')"),timeout=10)
 results['occasionalIdleWalk']=True
 (ROOT/'tests/feature-patch-results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
 print(json.dumps(results,indent=2))
 cdp.call('Browser.close')
finally:
 server.shutdown();server.server_close()
 if browser.poll() is None:browser.terminate()
