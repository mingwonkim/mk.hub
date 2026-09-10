// Run only after the authenticated frontend, Storage CORS and owner login are verified.
// Dry-run is default. Requires administrator Application Default Credentials.
'use strict';
const {initializeApp,applicationDefault}=require('firebase-admin/app');
const {getStorage}=require('firebase-admin/storage');
initializeApp({credential:applicationDefault(),projectId:'mingwon-hub'});
(async()=>{
 const apply=process.argv.includes('--apply'),bucket=getStorage().bucket('mingwon-hub.firebasestorage.app');let examined=0,sealed=0;
 for(const prefix of ['mk_files/','mk_drawings/']){
  for await(const file of bucket.getFilesStream({prefix})){
   const [metadata]=await file.getMetadata();examined++;
   if(!metadata.metadata?.firebaseStorageDownloadTokens)continue;
   if(apply)await bucket.file(file.name,{generation:metadata.generation}).setMetadata({metadata:{firebaseStorageDownloadTokens:null}});
   sealed++;
  }
 }
 console.log(JSON.stringify({mode:apply?'applied':'dry-run',examined,tokenBearingFiles:sealed}));
})().catch(error=>{console.error('Private-file sealing failed:',error.code||'unknown');process.exitCode=1});
