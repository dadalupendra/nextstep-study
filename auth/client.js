/* Security-aware Firebase integration. No tracking or account is created for guests.
 * Firebase app configuration is intentionally absent until the owner connects it.
 * All private data permission checks are enforced in Firestore rules.
 */
(function(global){'use strict';
let sdkPromise=null,session=null;
function configured(){
 const cfg=global.NEXTSTEP_FIREBASE_CONFIG;
 return !!(cfg&&typeof cfg==='object'&&cfg.apiKey&&cfg.authDomain&&cfg.projectId&&cfg.appId)
}
async function sdk(){
 if(!configured())throw Error('Online accounts are not configured by the NextStep Study administrator yet. Continue as Guest.');
 if(sdkPromise)return sdkPromise;
 sdkPromise=(async()=>{
  const v='12.6.0',base='https://www.gstatic.com/firebasejs/'+v+'/';
  const [app,auth,store]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  const a=app.getApps().length?app.getApp():app.initializeApp(global.NEXTSTEP_FIREBASE_CONFIG);
  const authentication=auth.getAuth(a),db=store.getFirestore(a);
  return {app,auth,store,authentication,db}
 })().catch(error=>{sdkPromise=null;throw error});
 return sdkPromise
}
async function waitForUser(){
 const x=await sdk();
 return new Promise(resolve=>{const unsubscribe=x.auth.onAuthStateChanged(x.authentication,user=>{unsubscribe();resolve(user)},()=>{unsubscribe();resolve(null)})})
}
async function touch(user,{signedIn=false}={}){
 if(!user)return;
 const x=await sdk(),uid=user.uid;
 const document=x.store.doc(x.db,'profiles',uid),existing=await x.store.getDoc(document);
 const details={uid,displayName:String(user.displayName||'').slice(0,100),email:String(user.email||'').slice(0,200),provider:String(user.providerData?.[0]?.providerId||'password'),updatedAt:x.store.serverTimestamp(),lastActiveAt:x.store.serverTimestamp()};
 if(!existing.exists())details.createdAt=x.store.serverTimestamp();
 if(signedIn)details.lastSignInAt=x.store.serverTimestamp();
 await x.store.setDoc(document,details,{merge:true});
 return details
}
async function loginGoogle(){const x=await sdk();const credential=await x.auth.signInWithPopup(x.authentication,new x.auth.GoogleAuthProvider());await touch(credential.user,{signedIn:true});return credential.user}
async function loginFacebook(){
 if(global.NEXTSTEP_FACEBOOK_LOGIN_READY!==true)throw Error('Facebook login is not configured: the owner must connect a Meta Developer App and OAuth redirect.');
 const x=await sdk(),credential=await x.auth.signInWithPopup(x.authentication,new x.auth.FacebookAuthProvider());
 await touch(credential.user,{signedIn:true});return credential.user
}
async function loginEmail(email,password,register=false){
 const x=await sdk();if(!email||!password||password.length<8)throw Error('Enter an email and password (at least 8 characters).');
 const fn=register?x.auth.createUserWithEmailAndPassword:x.auth.signInWithEmailAndPassword;
 const credential=await fn(x.authentication,email,password);
 if(register)await x.auth.sendEmailVerification(credential.user);
 await touch(credential.user,{signedIn:true});return credential.user
}
async function logout(){const x=await sdk();await x.auth.signOut(x.authentication)}
async function getProfile(){
 const user=await waitForUser();if(!user)return null;
 const x=await sdk(),doc=await x.store.getDoc(x.store.doc(x.db,'profiles',user.uid));
 return {user,profile:doc.exists()?doc.data():null}
}
async function listProfiles(){
 const x=await sdk(),user=await waitForUser();if(!user)throw Error('Sign in first.');
 const admin=await x.store.getDoc(x.store.doc(x.db,'admins',user.uid));
 if(!admin.exists()||admin.data().enabled!==true)throw Error('Administrator access not granted.');
 const snapshot=await x.store.getDocs(x.store.collection(x.db,'profiles'));
 return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}))
}
async function watchProfiles(onData,onError){
 const x=await sdk(),user=await waitForUser();
 if(!user)throw Error('Sign in first.');
 const admin=await x.store.getDoc(x.store.doc(x.db,'admins',user.uid));
 if(!admin.exists()||admin.data().enabled!==true)throw Error('Administrator access not granted.');
 return x.store.onSnapshot(x.store.collection(x.db,'profiles'),snapshot=>{
  onData(snapshot.docs.map(doc=>({id:doc.id,...doc.data()})))
 },error=>onError?.(error))
}
function consent(){return localStorage.getItem('nextstep-profile-activity-consent')==='yes'}
async function markActivity(){
 if(!configured()||!consent())return;
 const now=Date.now(),key='nextstep-last-activity-sync';
 if(now-Number(localStorage.getItem(key)||0)<12*60*60*1000)return;
 const user=await waitForUser();if(!user)return;
 await touch(user);localStorage.setItem(key,String(now))
}
global.NextStepAuth={configured,sdk,waitForUser,touch,loginGoogle,loginFacebook,loginEmail,logout,getProfile,listProfiles,watchProfiles,markActivity};
})(window);
