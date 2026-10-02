"""Validate production at a GitHub Pages style subdirectory in real Chrome."""
from pathlib import Path
import ast, base64, json, subprocess, threading, time, urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
ROOT=Path(__file__).resolve().parents[1]
# Reuse the existing dependency-free browser driver without running gameplay tests.
tree=ast.parse((ROOT/'tests/run_browser.py').read_text(encoding='utf-8-sig'))
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,(ast.Import,ast.ImportFrom,ast.ClassDef,ast.FunctionDef))],type_ignores=[]),'<browser driver>','exec'))
browser=None
server=None
try:
    browser=subprocess.Popen([r'C:\Program Files\Google\Chrome\Application\chrome.exe','--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9224',f'--user-data-dir={ROOT / ".browser-test-deployment"}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
    pages=until(lambda:json.load(urllib.request.urlopen('http://127.0.0.1:9224/json/list')))
    cdp=CDP(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
    cdp.call('Page.enable');cdp.call('Runtime.enable')
    # Rasterize the existing vector favicon without changing its artwork.
    svg=base64.b64encode((ROOT/'assets/icons/husband.svg').read_bytes()).decode()
    for size,name in [(180,'apple-touch-icon'),(192,'icon-192'),(512,'icon-512')]:
        target=ROOT/f'assets/icons/{name}.png'
        if not target.exists():
            expression=f'''(async()=>{{const img=new Image();img.src='data:image/svg+xml;base64,{svg}';await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height={size};const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f3e9';ctx.fillRect(0,0,{size},{size});ctx.drawImage(img,0,0,{size},{size});return canvas.toDataURL('image/png').split(',')[1];}})()'''
            target.write_bytes(base64.b64decode(cdp.evaluate(expression)))
    subprocess.run(['python',str(ROOT/'scripts/build_site.py')],check=True)
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'dist'),**kwargs)
        def do_GET(self):
            if self.path.startswith('/husband-bonk/'):
                self.path=self.path[len('/husband-bonk'):]
            super().do_GET()
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',8003),Handler)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    results={}
    cdp.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
    for prefix in ['/','/husband-bonk/']:
        url='http://127.0.0.1:8003'+prefix
        cdp.call('Page.navigate',{'url':url})
        until(lambda:cdp.evaluate("!!document.querySelector('#character svg')"))
        cdp.evaluate('navigator.serviceWorker.ready.then(()=>true)')
        until(lambda:cdp.evaluate('!!navigator.serviceWorker.controller'))
        manifest=json.load(urllib.request.urlopen(url+'manifest.json'))
        assert manifest['scope']==manifest['start_url']=='./'
        for icon in manifest['icons']:
            assert urllib.request.urlopen(url+icon['src']).status==200
        assert urllib.request.urlopen(url+'assets/icons/apple-touch-icon.png').status==200
        scope=cdp.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.scope)')
        assert scope==url,(scope,url)
        cdp.evaluate("localStorage.removeItem('husbandBonk_v2');localStorage.removeItem('husbandBonk_v1')")
        cdp.call('Page.reload')
        until(lambda:cdp.evaluate("document.querySelector('#count')?.textContent==='0'"))
        time.sleep(.5)
        cdp.evaluate("document.querySelector('#husband').click()")
        cdp.call('Page.reload')
        until(lambda:cdp.evaluate("document.querySelector('#count')?.textContent==='1'"))
        resources=cdp.evaluate("performance.getEntriesByType('resource').map(r=>r.name)")
        assert all(u.startswith(url) for u in resources),resources
        cache=cdp.evaluate("navigator.serviceWorker.getRegistration().then(async r=>{const names=await caches.keys();const own=names.find(n=>n.endsWith(r.scope));return (await (await caches.open(own)).keys()).map(k=>k.url);})")
        assert url+'manifest.json' in cache
        results[prefix]={'load':True,'reloadStorage':True,'workerScope':scope,'manifestAndIcons':True,'onlySameSiteRequests':True,'cachedAssets':len(cache)}
    server.shutdown();server.server_close();server=None
    cdp.call('Page.reload')
    until(lambda:cdp.evaluate("document.querySelector('#count')?.textContent==='1' && !!document.querySelector('#character svg')"))
    cdp.evaluate("document.querySelector('#husband').click()")
    assert cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).sessionHits===2")
    results['offlineSubdirectoryReloadAndPlay']=True
    (ROOT/'tests/deployment-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(results,ensure_ascii=False,indent=2))
    cdp.call('Browser.close')
finally:
    if server:server.shutdown();server.server_close()
    if browser and browser.poll() is None:browser.terminate()

