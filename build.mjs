import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {catalog} from './dist/catalog.js';
const assets={};
for(const name of ['index.html','app.js','photo.js','photo.css','catalog.js','matcher-worker.js','room-tools.js','room-tools.css','marketplace.js']){
 const type=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';
 assets['/'+name]={type,body:await readFile('dist/'+name,'utf8')};
}
const marketSource=(await readFile('dist/marketplace-data.js','utf8')).replaceAll('export ','');
const worker=(await readFile('server.mjs','utf8')).replace('__MARKETPLACE__',()=>marketSource).replace('__ASSETS__',()=>JSON.stringify(assets)).replace('__PRODUCTS__',()=>JSON.stringify(catalog.map(({id,url,retailer,imageFallback})=>({id,url,retailer,imageFallback}))));
await mkdir('dist/server',{recursive:true});await writeFile('dist/server/index.js',worker);
console.log('Built photo resolver and preserved all existing pages.');
