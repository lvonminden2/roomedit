import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const child=spawn(process.execPath,['railway-server.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','inherit']});
try{
 const port=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server startup timeout')),10000);child.stdout.on('data',b=>{output+=b;const match=output.match(/port (\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});child.on('error',reject);});
 const base='http://127.0.0.1:'+port;
 for(const path of ['/','/photo.js','/room-tools.js','/marketplace.js','/healthz'])assert.equal((await fetch(base+path)).status,200,path);
 const result=await (await fetch(base+'/api/marketplace?budget=100')).json();assert.equal(result.mode,'demo');assert.ok(result.listings.every(p=>p.price<=100));
 assert.equal((await fetch(base+'/healthz',{method:'HEAD'})).status,200);
 assert.equal((await fetch(base+'/api/marketplace',{method:'POST'})).status,405);
 assert.equal((await fetch(base+'/.env')).status,404);
 assert.equal((await fetch(base+'/api/product-photo?id=article-sven-sofa',{redirect:'manual'})).status,302);
 console.log('HTTP smoke checks passed: pages, API, health, methods, private paths and image redirect.');
}finally{child.kill('SIGTERM');}
