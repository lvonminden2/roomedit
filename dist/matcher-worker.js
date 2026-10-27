// Run vision inference off the UI thread. Only model files are downloaded;
// the user's photo is never sent to a server.
let classifier;
const irrelevant=['a person taking a selfie','a dog or cat','food on a plate','an outdoor landscape','a car or vehicle','a document or text screenshot'];
const furniture=['a living room with furniture','a bedroom with a bed and furniture','a home office with a desk','a sofa','an armchair','a coffee table','a bed frame','a desk','a shelving unit','an area rug','a floor lamp'];
self.onmessage=async({data})=>{
 try {
  if(!classifier){
   self.postMessage({type:'status',text:'Downloading image matching. First use can take a minute…'});
   const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
   env.allowLocalModels=false;
   env.backends.onnx.wasm.numThreads=1;
   classifier=await pipeline('zero-shot-image-classification','Xenova/clip-vit-base-patch32',{device:'wasm',dtype:'q8',progress_callback:p=>{
    if(p.status==='progress'&&Number.isFinite(p.progress))self.postMessage({type:'progress',value:p.progress,text:'Downloading image matching files… '+Math.round(p.progress)+'% of current file'});
   }});
  }
  self.postMessage({type:'status',text:'Reading the shapes, materials and colors in your photo…'});
  const combined=new Map();let count=0;
  for(const image of data.images||[data.image]){
   const kind=await classifier(image,[...furniture,...irrelevant]);
   if(irrelevant.includes(kind[0].label))continue;
   self.postMessage({type:'status',text:'Comparing inspiration '+(count+1)+' with furniture listings…'});
   const result=await classifier(image,data.labels);
   for(const s of result)combined.set(s.label,(combined.get(s.label)||0)+s.score);
   count++;
  }
  if(!count){self.postMessage({type:'unrecognized'});return;}
  const scores=[...combined].map(([label,score])=>({label,score:score/count})).sort((a,b)=>b.score-a.score);
  self.postMessage({type:'result',scores});
 } catch(error){
  classifier=null;
  self.postMessage({type:'error',message:'Photo matching could not load. Check your internet connection and try again in an up-to-date Chrome, Edge, Firefox or Safari browser.'});
 }
};
