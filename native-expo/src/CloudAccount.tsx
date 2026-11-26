import React,{useEffect,useState} from 'react';
import {ActivityIndicator,Alert,Pressable,Text,TextInput,View} from 'react-native';
import {cloud,cloudLoad,cloudSave,deleteCloudAccount,beginTOTP,verifyTOTP,logOut,requestPasswordReset,signIn,signUp} from './cloud';

type Props={theme:{card:string;ink:string;muted:string;border:string;pale:string};data:Record<string,unknown>;
  onRestore:(value:Record<string,unknown>)=>void;onDelete:()=>Promise<void>};
const indigo='#4338CA',yellow='#FFC93C';
export default function CloudAccount({theme,data,onRestore,onDelete}:Props){
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[birthDate,setBirthDate]=useState('');
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [userEmail,setUserEmail]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [totpSecret,setTotpSecret]=useState(''),[totpFactorId,setTotpFactorId]=useState(''),[code,setCode]=useState('');
  const [requiresMFA,setRequiresMFA]=useState(false);
  const text=(n:number,bold=false,color=theme.ink):any=>({
    color,fontSize:n,fontFamily:bold?'Poppins_700Bold':'Poppins_400Regular'
  });
  useEffect(()=>{if(!cloud)return;
    let mounted=true;
    const read=async()=>{
      const {data:userData}=await cloud.auth.getUser();
      if(mounted)setUserEmail(userData.user?.email||'');
      const assurance=await cloud.auth.mfa.getAuthenticatorAssuranceLevel();
      if(mounted)setRequiresMFA(assurance.data?.nextLevel==='aal2'&&assurance.data?.currentLevel==='aal1');
    };read().catch(()=>{});
    const {data:watch}=cloud.auth.onAuthStateChange(()=>{read().catch(()=>{})});
    return()=>{mounted=false;watch.subscription.unsubscribe()}
  },[]);
  const run=async(fn:()=>Promise<unknown>,success:string)=>{
    if(busy)return;setBusy(true);setMessage('');
    try{await fn();setMessage(success)}catch(e){setMessage(e instanceof Error?e.message:'Operation failed.')}
    finally{setBusy(false)}
  };
  const input=(value:string,change:(s:string)=>void,placeholder:string,secret=false)=>
    <TextInput value={value} onChangeText={change} placeholder={placeholder} accessibilityLabel={placeholder}
      placeholderTextColor={theme.muted} secureTextEntry={secret} autoCapitalize="none"
      style={{borderWidth:1.4,borderColor:theme.border,borderRadius:14,minHeight:49,padding:12,
        marginTop:8,backgroundColor:theme.card,color:theme.ink,fontSize:14}}/>;
  const action=(label:string,press:()=>void,primary=false)=> <Pressable disabled={busy} onPress={press}
    accessibilityRole="button" accessibilityLabel={label} style={{minHeight:48,justifyContent:'center',alignItems:'center',
      borderRadius:16,paddingHorizontal:12,marginTop:10,backgroundColor:primary?indigo:yellow}}>
    <Text style={text(13,true,primary?'#fff':'#1B1740')}>{label}</Text>
  </Pressable>;
  if(!cloud)return <View style={{backgroundColor:theme.card,borderRadius:22,padding:18,marginBottom:14}}>
    <Text style={text(17,true)}>🔐 Secure account</Text>
    <Text style={[text(12,false,theme.muted),{marginTop:9}]}>
      Offline mode is enabled. Cloud sign-in is disabled until you configure a verified HTTPS backend, email confirmation, MFA and database security policies.
    </Text>
  </View>;
  return <View style={{backgroundColor:theme.card,borderRadius:22,padding:18,marginBottom:14}}>
    <Text style={text(17,true)}>🔐 Secure cloud account</Text>
    {userEmail?<>
      <Text style={[text(13),{marginTop:7}]}>Signed in: {userEmail}</Text>
      {requiresMFA?<>
        <Text style={[text(12,false,theme.muted),{marginTop:7}]}>Two-factor authentication is required for cloud operations.</Text>
        {input(code,setCode,'6-digit authenticator code')}
        {action('Verify 2FA',()=>run(async()=>{
          const listed=await cloud.auth.mfa.listFactors();
          const factor=listed.data?.totp?.find(x=>x.status==='verified');
          if(!factor)throw new Error('No verified TOTP factor is available.');
          await verifyTOTP(factor.id,code);setRequiresMFA(false);setCode('');
        },'2FA verified'),true)}
      </>:<>
        {action('Save study data to cloud',()=>run(async()=>{await cloudSave(data)},'Your study backup was saved.'),true)}
        {action('Restore study data from cloud',()=>run(async()=>{
          const payload=await cloudLoad();
          if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('No usable cloud backup exists.');
          onRestore(payload as Record<string,unknown>);
        },'Cloud backup restored.'))}
        {totpSecret?<View style={{padding:10,backgroundColor:theme.pale,borderRadius:10,marginTop:9}}>
          <Text style={text(12,true)}>Authenticator setup secret:</Text>
          <Text selectable style={text(13)}>{totpSecret}</Text>
          <Text style={text(11,false,theme.muted)}>Add this secret to your authenticator app, then enter the current 6-digit code below.</Text>
          {input(code,setCode,'6-digit code')}
          {action('Finish 2FA setup',()=>run(async()=>{
            await verifyTOTP(totpFactorId,code);
            setCode('');setTotpSecret('');setTotpFactorId('');
          },'2FA enabled.'),true)}
        </View>:action('Enable optional 2FA',()=>run(async()=>{
          const data=await beginTOTP();if(!data.totp?.secret)throw new Error('Could not enroll 2FA.');
          setTotpSecret(data.totp.secret);setTotpFactorId(data.id);
        },'Follow the steps below.'))}
      </>}
      {action('Log out',()=>run(async()=>{await logOut();setUserEmail('')},'Logged out.'))}
      {action('Delete my cloud account',()=>Alert.alert('Delete account permanently',
        'This deletes your server-side account and cloud backup. Your local data will also be erased.',
        [{text:'Cancel',style:'cancel'},{text:'Delete account',style:'destructive',onPress:()=>run(async()=>{
          await deleteCloudAccount();await onDelete();setUserEmail('');
        },'Your account and local data were deleted.')}]))}
    </>:<>
      <Text style={[text(12,false,theme.muted),{marginTop:9}]}>
        Email verification is required. Registration is currently restricted to adults until a parental-consent verification flow is deployed.
      </Text>
      {input(email,setEmail,'Email address')}
      {input(password,setPassword,'Password (12+ characters)',true)}
      {mode==='signup'?input(birthDate,setBirthDate,'Date of birth (YYYY-MM-DD)'):null}
      {action(mode==='login'?'Sign in':'Create verified account',()=>run(async()=>{
        if(mode==='login'){const result=await signIn(email,password);setUserEmail(result.user?.email||'')}
        else{const result=await signUp(email,password,birthDate);if(result.session)setUserEmail(result.user?.email||'')}
      },mode==='login'?'Signed in.':'Check your email to verify your account.'),true)}
      {action(mode==='login'?'Create an account instead':'Already have an account? Sign in',
        ()=>{setMode(mode==='login'?'signup':'login');setMessage('')})}
      {mode==='login'?action('Reset password',()=>run(async()=>{await requestPasswordReset(email)},'Check your email for reset instructions.')):null}
    </>}
    {!!message&&<View accessibilityRole="alert" style={{marginTop:12,padding:10,backgroundColor:theme.pale,borderRadius:12}}>
      <Text style={text(12)}>{message}</Text></View>}
    {busy?<ActivityIndicator style={{marginTop:12}} color={indigo}/>:null}
  </View>;
}
