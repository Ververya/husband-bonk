"""Dependency-free Chrome browser verification, isolated profile and local server."""
from pathlib import Path
import base64,json,os,socket,struct,subprocess,time,urllib.request
ROOT=Path(__file__).resolve().parents[1]
class CDP:
    def __init__(self,url):
        from urllib.parse import urlparse
        u=urlparse(url);self.sock=socket.create_connection((u.hostname,u.port));self.sock.settimeout(45);self.seq=0
        key=base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall(f'GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode())
        header=b''
        while not header.endswith(b'\r\n\r\n'):header+=self.sock.recv(1)
        if b'101' not in header:raise RuntimeError(header)
    def receive(self,n):
        out=b''
        while len(out)<n:
            part=self.sock.recv(n-len(out))
            if not part:raise RuntimeError('Socket closed')
            out+=part
        return out
    def call(self,method,params=None):
        self.seq+=1;payload=json.dumps({'id':self.seq,'method':method,'params':params or {}}).encode();mask=os.urandom(4)
        n=len(payload);head=bytes([0x81,0x80|(n if n<126 else 126 if n<65536 else 127)])
        if n>=126:head+=struct.pack('!H' if n<65536 else '!Q',n)
        self.sock.sendall(head+mask+bytes(c^mask[i%4] for i,c in enumerate(payload)))
        while True:
            first,second=self.receive(2);length=second&127
            if length==126:length=struct.unpack('!H',self.receive(2))[0]
            elif length==127:length=struct.unpack('!Q',self.receive(8))[0]
            masking=self.receive(4) if second&128 else None;data=self.receive(length)
            if masking:data=bytes(c^masking[i%4] for i,c in enumerate(data))
            if first&15!=1:continue
            message=json.loads(data)
            if message.get('id')==self.seq:
                if 'error' in message:raise RuntimeError(message['error'])
                return message.get('result',{})
    def evaluate(self,expression):
        r=self.call('Runtime.evaluate',{'expression':expression,'returnByValue':True,'awaitPromise':True})
        if 'exceptionDetails' in r:raise RuntimeError(r['exceptionDetails'])
        return r.get('result',{}).get('value')

def until(fn,timeout=35):
    start=time.time()
    while time.time()-start<timeout:
        try:
            value=fn()
            if value:return value
        except (OSError,ValueError):pass
        time.sleep(.1)
    raise TimeoutError('Browser condition timed out')

server=subprocess.Popen(['python','-m','http.server','8001','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
browser=None
try:
    until(lambda:urllib.request.urlopen('http://127.0.0.1:8001/').status==200)
    browser=subprocess.Popen([r'C:\Program Files\Google\Chrome\Application\chrome.exe','--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9223',f'--user-data-dir={ROOT / ".browser-test-cdp"}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
    pages=until(lambda:json.load(urllib.request.urlopen('http://127.0.0.1:9223/json/list')))
    cdp=CDP(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))
    cdp.call('Page.enable');cdp.call('Runtime.enable')
    cdp.call('Page.navigate',{'url':'http://127.0.0.1:8001/tests/browser.html'})
    until(lambda:cdp.evaluate("document.getElementById('results')?.textContent?.includes('Offline core cached')"))
    result=json.loads(cdp.evaluate("document.getElementById('results').textContent"))
    Path(ROOT/'tests/browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Functional checks:',len(result['results']),'Failures:',[r for r in result['results'] if not r['pass']])
    cdp.call('Page.navigate',{'url':'http://127.0.0.1:8001/'})
    until(lambda:cdp.evaluate("document.getElementById('character')?.querySelector('svg')!==null && !!document.getElementById('husband')"))
    cdp.evaluate("navigator.serviceWorker.ready.then(()=>true)")
    until(lambda:cdp.evaluate('!!navigator.serviceWorker.controller'))
    cdp.evaluate("localStorage.removeItem('husbandBonk_v1');localStorage.removeItem('husbandBonk_v2')")
    cdp.call('Page.reload');until(lambda:cdp.evaluate("document.getElementById('count')?.textContent==='0'"))
    cdp.evaluate("document.getElementById('husband').focus()")
    for key,code,vkey in [('Enter','Enter',13),(' ','Space',32)]:
        cdp.call('Input.dispatchKeyEvent',{'type':'keyDown','key':key,'code':code,'windowsVirtualKeyCode':vkey,'text':'\r' if vkey==13 else ' '})
        cdp.call('Input.dispatchKeyEvent',{'type':'keyUp','key':key,'code':code,'windowsVirtualKeyCode':vkey})
    keyboard=cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).sessionHits===2")
    print('Keyboard Enter/Space:',keyboard)
    cdp.call('Emulation.setDeviceMetricsOverride',{'width':390,'height':900,'deviceScaleFactor':1,'mobile':True})
    time.sleep(.3)
    capture=cdp.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':True})
    (ROOT/'tests/preview.png').write_bytes(base64.b64decode(capture['data']))
    server.terminate();server.wait(timeout=5)
    cdp.call('Page.reload')
    until(lambda:cdp.evaluate("document.getElementById('count')?.textContent==='2' && !!document.getElementById('character')?.querySelector('svg')"))
    cdp.evaluate("document.getElementById('husband').click()")
    offline=cdp.evaluate("JSON.parse(localStorage.getItem('husbandBonk_v2')).sessionHits===3")
    print('Offline reload and BONK (HTTP server stopped):',offline)
    extra={'keyboardEnterSpace':keyboard,'offlineReloadAndBonkServerStopped':offline}
    (ROOT/'tests/integration-results.json').write_text(json.dumps(extra,indent=2),encoding='utf-8')
    assert all(r['pass'] for r in result['results']) and keyboard and offline
    cdp.call('Browser.close')
finally:
    if server.poll() is None:server.terminate()
    if browser and browser.poll() is None:browser.terminate()
