from pathlib import Path
import ast,json,subprocess,urllib.request
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/run_browser.py').read_text(encoding='utf-8-sig'))
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))],type_ignores=[]),'<driver>','exec'))
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import threading
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',8005),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
browser=subprocess.Popen([r'C:\Program Files\Google\Chrome\Application\chrome.exe','--headless','--disable-gpu','--no-first-run','--remote-debugging-port=9225',f'--user-data-dir={ROOT / ".browser-test-public"}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
try:
    pages=until(lambda:json.load(urllib.request.urlopen('http://127.0.0.1:9225/json/list')))
    cdp=CDP(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
    cdp.call('Page.enable');cdp.call('Runtime.enable');cdp.call('Network.enable')
    cdp.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
    base='http://127.0.0.1:8005/'
    cdp.call('Page.navigate',{'url':base})
    until(lambda:cdp.evaluate("!!document.querySelector('#character svg')"))
    time.sleep(.5)
    cdp.evaluate("localStorage.setItem('husbandBonk_v2',JSON.stringify({schemaVersion:2,sessionHits:0,alertHits:99,lifetimeHits:99}))")
    cdp.call('Page.reload');time.sleep(.5)
    cdp.evaluate("window.savedRandom=Math.random;window.randomCalls=0;Math.random=()=>{randomCalls++;return .24};document.querySelector('#husband').click();Math.random=savedRandom")
    until(lambda:cdp.evaluate("document.querySelector('#alert-dialog').open"))
    modal=cdp.evaluate("document.querySelector('#alert-message').textContent")
    alert_id=cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).alertMessageIndex")
    assert alert_id==3
    expected=cdp.evaluate("import('./js/share.js').then(m=>m.husbandAlertShareMessage(document.querySelector('#alert-message').textContent))")
    suffix="\n\n"+"\u2500"*12+"\n\n\U0001f6df \u8001\u516c\u6c42\u751f\u5efa\u8b70\n\n\u795d \u4f60 \u597d \u904b \U0001f642"
    assert expected==modal+suffix
    assert '\u6c42\u751f\u5efa\u8b70' not in modal
    cdp.evaluate("window.captured={};window.open=(url)=>{captured.line=new URL(url).searchParams.get('text');return {opener:null}};Object.defineProperty(navigator,'share',{configurable:true,writable:true,value:async({text})=>{captured.web=text}});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{captured.copy=text}}})")
    for button in ['line-share','web-share','copy-message']:
        cdp.evaluate(f"document.getElementById('{button}').click()")
        time.sleep(.2)
    capture=cdp.evaluate('captured')
    assert all(text==expected for text in capture.values()) and len(capture)==3,capture
    assert cdp.evaluate("document.querySelector('#alert-message').textContent")==modal
    cdp.evaluate("window.open=()=>null;navigator.share=async()=>{throw new Error('blocked')};captured.copy=null;document.querySelector('#line-share').click()")
    until(lambda:cdp.evaluate('captured.copy')==expected)
    cdp.evaluate("navigator.clipboard.writeText=async()=>{throw new Error('blocked')};document.querySelector('#copy-message').click()")
    until(lambda:cdp.evaluate("!document.querySelector('#copy-text').hidden"))
    assert cdp.evaluate("document.querySelector('#copy-text').value")==expected
    print('PASS: LINE, Web Share, clipboard, chained fallback, manual copy all identical; random modal unchanged')
    cdp.evaluate("document.querySelector('#keep-alert').click()")
    cdp.call('Page.reload');time.sleep(.5)
    cdp.evaluate("Math.random=()=>.99;document.querySelector('#notify').click()")
    assert cdp.evaluate("document.querySelector('#alert-message').textContent")==modal
    assert cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).alertMessageIndex")==alert_id
    cdp.evaluate("document.querySelector('#share-complete').click()")
    assert cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).alertHits===0 && JSON.parse(localStorage.getItem('husbandBonk_v2')).alertMessageIndex===null")
    cdp.evaluate("Math.random=()=>.54;for(let i=0;i<100;i++){document.querySelector('#husband').click();if(document.querySelector('#rage-dialog').open)document.querySelector('#release').click()}")
    assert cdp.evaluate("document.querySelector('#alert-dialog').open && JSON.parse(localStorage.getItem('husbandBonk_v2')).alertMessageIndex===8")
    assert cdp.evaluate("document.querySelector('#alert-message').textContent")!=modal
    print('PASS A-E: one saved alert, identical share body+suffix, refresh/deferred reopen unchanged, reset clears id, next 100 selects new alert')
    cdp.call('Browser.close')
finally:
    server.shutdown();server.server_close()
    if browser.poll() is None:browser.terminate()
