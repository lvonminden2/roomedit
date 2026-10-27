import http from 'node:http';
import {Readable} from 'node:stream';
import worker from './dist/server/index.js';
const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid PORT');
const server=http.createServer(async(req,res)=>{
 try{
  if(req.url==='/healthz'&&['GET','HEAD'].includes(req.method)){res.writeHead(200,{'Content-Type':'application/json'});res.end(req.method==='HEAD'?undefined:'{"status":"ok"}');return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');req.resume();return;}
  const request=new Request(new URL(req.url,'http://localhost'),{method:req.method,headers:req.headers});
  const response=await worker.fetch(request,{}, {waitUntil:p=>Promise.resolve(p).catch(()=>{})});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  if(req.method==='HEAD'||!response.body)res.end();else Readable.fromWeb(response.body).on('error',()=>res.destroy()).pipe(res);
 }catch(error){console.error('Request failed:',error.message);if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain'});res.end('Internal server error');}
});
server.listen(port,'0.0.0.0',()=>console.log('Room Edit listening on port '+server.address().port));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
