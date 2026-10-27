__MARKETPLACE__
const assets = __ASSETS__;
const products = __PRODUCTS__;
const fallbackPhotos = {
 'morabo':'https://www.ikea.com/ca/en/images/products/morabo-sofa-gunnared-light-green-wood__0815942_pe773129_s5.jpg?f=xl',
 'kivik':'https://www.ikea.com/ch/en/images/products/kivik-3-seat-sofa-gunnared-light-green__0781505_pe760811_s5.jpg',
 'poang-birch':'https://www.ikea.com/ch/en/images/products/poaeng-armchair-birch-veneer-gunnared-beige__1192139_pe900879_s5.jpg',
 'stockholm':'https://d2xjmi1k71iy2m.cloudfront.net/dairyfarm/id/images/812/0181245_PE332924_S5.jpg',
 'lack':'https://ikeabulgaria.akamaized.net/images/1860x1860/4/variantimages/40104294/0.jpg',
 'hemnes':'https://www.ikea.com/ca/en/images/products/hemnes-nightstand-black-brown__0624435_pe691842_s5.jpg',
 'micke':'https://www.ikea.is/static/web/ikea4/images/267/0526706_PE645107_S5.jpg?v=4bab895f',
 'ranarp':'https://www.ikea.com.tw/dairyfarm/tw/images/068/0606896_PE682604_S5.jpg'
};
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x2F;/gi,'/');
export function validImage(value,product){
 try{const u=new URL(value,product.url);const host=u.hostname;
 const retailerHosts={IKEA:['ikea.com'],Article:['article.com'],Castlery:['castlery.com','res.cloudinary.com'],Target:['target.com','target.scene7.com']};
 const allowed=(retailerHosts[product.retailer]||[]).some(h=>host===h||host.endsWith('.'+h));
 if(u.protocol!=='https:'||u.username||u.password||!allowed||/default_image|placeholder/i.test(u.pathname))return null;
 if(host==='res.cloudinary.com'&&!u.pathname.startsWith('/castlery/'))return null;
 return u.href;
 }catch{return null;}
}
export function extractImage(html,product={url:'https://www.ikea.com',retailer:'IKEA'}){
 for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){
  const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g))attrs[m[1].toLowerCase()]=decode(m[3]);
  if((attrs.property==='og:image'||attrs.name==='og:image')&&attrs.content){
   const image=validImage(attrs.content,product);if(image)return image;
  }
 }
 return null;
}
const photoResponse=url=>new Response(null,{status:302,headers:{Location:url,'Cache-Control':'public, max-age=86400'}});
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 if(url.pathname==='/api/marketplace'){const body=JSON.stringify({mode:'demo',live:false,listings:filterMarketplace(url.searchParams)});return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
 if(url.pathname==='/api/product-photo'){
  const id=url.searchParams.get('id');const p=products.find(p=>p.id===id);
  if(!p)return new Response('Unknown product',{status:404});
  if(p.imageFallback&&validImage(p.imageFallback,p))return photoResponse(p.imageFallback);
  const key=new Request(new URL('/api/product-photo?id='+encodeURIComponent(id),url.origin));
  const cache=globalThis.caches?.default;const cached=await cache?.match(key);if(cached)return cached;
  try{
   const page=await fetch(p.url,{headers:{Accept:'text/html','Accept-Language':'en-US,en;q=0.9'},signal:AbortSignal.timeout(12000)});
   if(page.ok){const image=extractImage(await page.text(),p);if(image){const response=photoResponse(image);if(cache&&ctx?.waitUntil)ctx.waitUntil(cache.put(key,response.clone()));return response;}}
  }catch{}
  if(p.imageFallback&&validImage(p.imageFallback,p))return photoResponse(p.imageFallback);
  if(fallbackPhotos[id])return photoResponse(fallbackPhotos[id]);
  return new Response('Product photo temporarily unavailable',{status:502,headers:{'Cache-Control':'no-store'}});
 }
 const path=url.pathname==='/'?'/index.html':url.pathname;
 const asset=assets[path];if(!asset)return new Response('Not found',{status:404});
 return new Response(request.method==='HEAD'?null:asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
}};
