'use strict';
const {randomInt,randomBytes,createHmac,timingSafeEqual,scrypt:rawScrypt}=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(rawScrypt);
const OWNER_EMAIL='kmin5940@naver.com';
const SESSION_MS=12*60*60*1000,OTP_MS=5*60*1000,MAX_ATTEMPTS=5;
class VaultError extends Error{constructor(status,message){super(message);this.status=status;}}
function requireOwner(claims,access=false,now=Date.now()){
 if(!claims||claims.email!==OWNER_EMAIL||claims.email_verified!==true||claims.vault_owner!==true||!Number.isFinite(claims.vault_otp_at)||now-claims.vault_otp_at>SESSION_MS||claims.vault_otp_at>now+5000||(access&&claims.vault_access!==true))throw new VaultError(401,'인증이 필요합니다.');
 return claims;
}
function otpHash(id,code,pepper){return createHmac('sha256',pepper).update(id+':'+code).digest('hex');}
function makeChallenge(pepper,now=Date.now()){
 const id=randomBytes(24).toString('hex'),code=String(randomInt(0,1000000)).padStart(6,'0');
 return{id,code,record:{hash:otpHash(id,code,pepper),expiresMs:now+OTP_MS,attempts:0,used:false}};
}
function verifyChallenge(record,id,code,pepper,now=Date.now()){
 if(!record||record.used||record.expiresMs<=now||record.attempts>=MAX_ATTEMPTS)return{ok:false};
 const valid=/^\d{6}$/.test(code)&&timingSafeEqual(Buffer.from(record.hash,'hex'),Buffer.from(otpHash(id,code,pepper),'hex'));
 return valid?{ok:true,patch:{used:true}}:{ok:false,patch:{attempts:record.attempts+1}};
}
function normalizePasswords(values){
 if(!Array.isArray(values)||values.length<1||values.length>3||values.some(v=>typeof v!=='string'))throw new VaultError(400,'암호를 확인해주세요.');
 const passwords=values.map(v=>v.trim().normalize('NFC'));
 if(passwords.some(v=>!v||v.length>1024)||passwords[0].length>13||(passwords.length>1&&!/^\d{6}$/.test(passwords[1])))throw new VaultError(400,'1차 최대 13자, 2차 숫자 6자리 형식을 확인해주세요.');
 return passwords;
}
async function hashPasswords(values){return Promise.all(normalizePasswords(values).map(async password=>{const salt=randomBytes(16).toString('hex');return{salt,hash:(await scrypt(password,salt,64)).toString('hex')};}));}
async function verifyPasswords(values,stored){
 if(!Array.isArray(values)||!Array.isArray(stored)||values.length!==stored.length||values.some(v=>typeof v!=='string'||v.length>1024))return false;
 const results=await Promise.all(values.map(async(value,i)=>{const actual=await scrypt(value.trim().normalize('NFC'),stored[i].salt,64);return timingSafeEqual(actual,Buffer.from(stored[i].hash,'hex'))}));
 return results.every(Boolean);
}
function consumeRate(previous,now,limit,cooldownMs){
 const record=previous&&now-previous.start<3600000?previous:{start:now,count:0,last:0};
 if(record.count>=limit||(record.last&&now-record.last<cooldownMs))throw new VaultError(429,'잠시 후 다시 요청해주세요.');
 return{start:record.start,count:record.count+1,last:now};
}
module.exports={OWNER_EMAIL,SESSION_MS,OTP_MS,MAX_ATTEMPTS,VaultError,requireOwner,makeChallenge,verifyChallenge,normalizePasswords,hashPasswords,verifyPasswords,consumeRate,otpHash};
