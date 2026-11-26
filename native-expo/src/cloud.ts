import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import {createClient, SupabaseClient} from '@supabase/supabase-js';

// Public project URL and publishable key are not secrets. Never ship the service-role key.
// If unset, this app stays entirely offline with no simulated login.
const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const publicKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secureStorage={
  getItem:(key:string)=>SecureStore.getItemAsync(key),
  setItem:(key:string,value:string)=>SecureStore.setItemAsync(key,value),
  removeItem:(key:string)=>SecureStore.deleteItemAsync(key)
};
export const cloud:SupabaseClient|null=(url?.startsWith('https://')&&publicKey)
  ?createClient(url,publicKey,{
    auth:{storage:secureStorage,autoRefreshToken:true,persistSession:true,
      detectSessionInUrl:false,flowType:'pkce'}
  }):null;
const required=()=>{if(!cloud)throw new Error('Cloud login is disabled until an HTTPS backend is configured.');return cloud};
const safeEmail=(s:string)=>s.trim().toLowerCase();
export const signIn=async(email:string,password:string)=>{
  if(!/^\S+@\S+\.\S+$/.test(email)||!password)throw new Error('Enter a valid email and password.');
  const {data,error}=await required().auth.signInWithPassword({email:safeEmail(email),password});
  if(error)throw error;return data
};
export const signUp=async(email:string,password:string,birthDate:string)=>{
  if(!/^\S+@\S+\.\S+$/.test(email)||password.length<12||password.length>128)
    throw new Error('Use a valid email and a password of 12–128 characters.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))throw new Error('Provide birth date as YYYY-MM-DD.');
  const dob=new Date(birthDate+'T12:00:00');
  if(!Number.isFinite(dob.valueOf())||dob>new Date())throw new Error('Invalid birth date.');
  const ageDate=new Date();ageDate.setFullYear(ageDate.getFullYear()-18);
  // Cloud signups for minors remain blocked until a verified parental-consent flow exists.
  if(dob>ageDate)throw new Error('Cloud accounts are unavailable for users under 18 until verified parental consent is enabled.');
  const {data,error}=await required().auth.signUp({email:safeEmail(email),password,
    options:{data:{adult_verified_by_self_declaration:true}}});
  if(error)throw error;return data
};
export const requestPasswordReset=async(email:string)=>{
  if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Enter a valid email.');
  const {error}=await required().auth.resetPasswordForEmail(safeEmail(email));if(error)throw error
};
export const logOut=async()=>{const {error}=await required().auth.signOut();if(error)throw error};
export const beginTOTP=async()=>{
  const {data,error}=await required().auth.mfa.enroll({factorType:'totp',issuer:'NextStep Study'});
  if(error)throw error;return data;
};
export const verifyTOTP=async(factorId:string,code:string)=>{
  if(!/^\d{6}$/.test(code))throw new Error('Enter the 6-digit code.');
  const api=required().auth.mfa;
  const challenge=await api.challenge({factorId});if(challenge.error)throw challenge.error;
  const verify=await api.verify({factorId,challengeId:challenge.data.id,code});
  if(verify.error)throw verify.error;return verify.data;
};
export const cloudSave=async(payload:Record<string,unknown>)=>{
  const api=required(),{data:{user},error}=await api.auth.getUser();
  if(error||!user)throw new Error('Sign in first.');
  const serialized=JSON.stringify(payload);
  if(serialized.length>500_000)throw new Error('Your backup exceeds the 500KB cloud limit.');
  // User id comes only from the authenticated Supabase session. RLS checks ownership.
  const {error:writeError}=await api.from('study_backups').upsert({user_id:user.id,payload,updated_at:new Date().toISOString()});
  if(writeError)throw writeError;
};
export const cloudLoad=async()=>{
  const api=required(),{data:{user},error}=await api.auth.getUser();
  if(error||!user)throw new Error('Sign in first.');
  const {data,error:readError}=await api.from('study_backups').select('payload').eq('user_id',user.id).maybeSingle();
  if(readError)throw readError;return data?.payload??null
};
export const deleteCloudAccount=async()=>{
  const api=required(),{data:{session}}=await api.auth.getSession();
  if(!session?.access_token)throw new Error('Sign in first.');
  const {error}=await api.functions.invoke('delete-account',{body:{confirm:'DELETE MY ACCOUNT'}});
  if(error)throw error;
  await api.auth.signOut({scope:'local'});
};
