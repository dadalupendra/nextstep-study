import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, Platform,
  Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Switch,
  Text, TextInput, View
} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Circle} from 'react-native-svg';
import {useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold} from '@expo-google-fonts/poppins';
import {
  Home, BookOpen, CalendarDays, ChartColumn, UserRound, Timer, Layers3, NotebookPen,
  CircleHelp, ChevronRight, Play, Pause, RotateCcw, Plus, Trash2, Search, Check,
  Moon, Sun, Bell, Shield, ArrowLeft, Target, Award, Flame, LockKeyhole,
  Clock3, Folder, Globe2, X, AlertCircle, CheckCircle2, Settings2
} from 'lucide-react-native';

const PALETTE = {
  ink:'#1B1740', muted:'#5B5780', indigo:'#4338CA', deep:'#2A2370',
  yellow:'#FFC93C', mint:'#7EE0B5', sky:'#8FD3FA', coral:'#FF9B85', cream:'#FFF8EE',
  white:'#FFFFFF', pale:'#E4E1FB'
};
const STORAGE = 'nextstep-native-offline-v1';
const GOAL_MINUTES = 180;
const LEVELS = ['N5','N4','N3','N2','N1'] as const;
const MODES = {focus:1500,break:300,long:900} as const;
type Mode = keyof typeof MODES;
type Tab = 'Home'|'Study'|'Planner'|'Stats'|'Profile';
type Tool = 'timer'|'cards'|'notes'|'quiz'|null;
type Task = {id:string;title:string;due:string;done:boolean;subject:string};
type Note = {id:string;title:string;body:string;folder:string;tags:string};
type Flashcard = {id:string;front:string;back:string;step:number;due:string};
type Session = {id:string;day:string;subject:string;minutes:number};
type LocalState = {
  tasks:Task[];notes:Note[];cards:Flashcard[];sessions:Session[];tests:number;
  examDate:string;language:'en'|'ne';dark:boolean;fontScale:number;reminders:boolean;
  selectedLevel:string;displayName:string
};
const initial:LocalState = {
  tasks:[],notes:[],cards:[],sessions:[],tests:0,examDate:'',
  language:'en',dark:false,fontScale:1,reminders:false,selectedLevel:'N2',
  displayName:'Student'
};
const labels = {
  en:{hello:'Namaste',goal:"Today's goal",done:'done',continue:'Continue studying',quick:'Quick actions',
    next:'Up next',subjects:'Your study subjects',emptyTasks:'No tasks yet. Create your first!',
    emptyNotes:'No notes yet, create your first!',emptyCards:'No cards due. Create your first flashcard!',
    save:'Save',cancel:'Cancel',newTask:'New task',newNote:'New note',newCard:'New flashcard',
    week:'This week',bySubject:'By subject',loading:'Loading your study space...',privacy:'Privacy & data',
    delete:'Delete my local data',dark:'Dark mode',language:'Language',timer:'Study Timer',planner:'Planner',
    stats:'Progress',profile:'Profile',study:'Study',notes:'Notes',cards:'Flashcards',quiz:'Quiz',
    notification:'Reminder preference',exam:'Exam countdown',settings:'Settings'},
  ne:{hello:'नमस्ते',goal:'आजको लक्ष्य',done:'पूरा',continue:'पढाइ जारी राख्नुहोस्',quick:'छिटो खोल्नुहोस्',
    next:'अब गर्ने',subjects:'तिम्रा अध्ययन विषय',emptyTasks:'अहिलेसम्म कुनै काम छैन। पहिलो काम थप!',
    emptyNotes:'अहिलेसम्म नोट छैन। पहिलो नोट बनाऊ!',emptyCards:'अहिले कार्ड छैन। पहिलो Flashcard बनाऊ!',
    save:'सुरक्षित',cancel:'रद्द',newTask:'नयाँ काम',newNote:'नयाँ नोट',newCard:'नयाँ फ्ल्यासकार्ड',
    week:'यो हप्ता',bySubject:'विषयअनुसार',loading:'अध्ययन एप खोलिँदैछ...',privacy:'गोपनीयता र डाटा',
    delete:'स्थानीय डाटा हटाउनुहोस्',dark:'डार्क मोड',language:'भाषा',timer:'अध्ययन टाइमर',planner:'योजना',
    stats:'प्रगति',profile:'प्रोफाइल',study:'पढाइ',notes:'नोट्स',cards:'फ्ल्यासकार्ड',quiz:'प्रश्नोत्तर',
    notification:'रिमाइन्डर प्राथमिकता',exam:'परीक्षा काउन्टडाउन',settings:'सेटिङ'}
} as const;
const toDay = (date:Date=new Date()) => {
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
};
const addDays = (days:number) => {const d=new Date();d.setDate(d.getDate()+days);return toDay(d)};
const minText = (mins:number) => Math.floor(mins/60)+'h '+(mins%60)+'m';
const newId = () => String(Date.now())+'-'+Math.random().toString(36).slice(2,8);
const studyUrl='https://dadalupendra.github.io/nextstep-study/mobile-app/learn.html?level=';
const quizQuestions = [
  {q:'「大切」の読み方は？',o:['たいせつ','だいせつ','おおせつ','だいきり'],a:0,
   why:'大切（たいせつ） means important. / 大切 को अर्थ महत्त्वपूर्ण हो।'},
  {q:'毎朝、学校へ（　）。',o:['行きます','行きませんでしたか','行くな','行くこと'],a:0,
   why:'毎朝 expresses a repeated routine; 行きます is the natural polite form. / 毎朝 भनेको हरेक बिहान हो।'},
  {q:'「予定」の意味は？',o:['schedule or plan','rain','river','question'],a:0,
   why:'予定（よてい） means a plan or schedule. / 予定 को अर्थ योजना वा तालिका हो।'},
  {q:'彼は病気（　）、学校を休みました。',o:['ので','まで','だけ','ほど'],a:0,
   why:'ので expresses a reason: because he was ill. / ので ले कारण जनाउँछ।'},
  {q:'「経験」の読み方は？',o:['けいけん','けんけい','けいげん','きょうけん'],a:0,
   why:'経験 is read けいけん and means experience. / अनुभव भन्ने अर्थ हो।'}
];

type IconComponent = React.ComponentType<{size?:number;color?:string;strokeWidth?:number}>;
const NAV:{key:Tab;label:string;icon:IconComponent}[] = [
  {key:'Home',label:'Home',icon:Home},{key:'Study',label:'Study',icon:BookOpen},
  {key:'Planner',label:'Planner',icon:CalendarDays},{key:'Stats',label:'Stats',icon:ChartColumn},
  {key:'Profile',label:'Profile',icon:UserRound}
];
function ProgressRing({progress,size=104,onDark=false,label}:{progress:number;size?:number;onDark?:boolean;label?:string}) {
  const stroke=11,center=size/2,r=(size-stroke)/2-3,circ=2*Math.PI*r;
  return <View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={r} fill="none" stroke={onDark?'#FFFFFF55':'#E4E1FB'} strokeWidth={stroke}/>
      <Circle cx={center} cy={center} r={r} fill="none" stroke={PALETTE.yellow}
        strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ}
        strokeDashoffset={circ*(1-Math.min(1,Math.max(0,progress)))}
        rotation={-90} originX={center} originY={center}/>
    </Svg>
    <Text style={{position:'absolute',fontFamily:'Poppins_700Bold',fontSize:size>180?36:24,
      color:onDark?PALETTE.white:PALETTE.ink}}>{label||String(Math.round(progress*100))+'%'}</Text>
  </View>;
}
function Field({label,value,onChange,placeholder,multiline=false,theme}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;multiline?:boolean;theme:any}) {
  return <View style={{marginBottom:12}}>
    <Text style={{color:theme.muted,fontFamily:'Poppins_600SemiBold',marginBottom:5}}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholder={placeholder||label} placeholderTextColor={theme.muted}
      value={value} onChangeText={onChange} multiline={multiline}
      style={{borderWidth:1.4,borderColor:theme.border,borderRadius:15,minHeight:multiline?105:48,
        paddingHorizontal:14,paddingVertical:11,color:theme.ink,backgroundColor:theme.card,
        fontFamily:'Poppins_400Regular',textAlignVertical:multiline?'top':'center'}}/>
  </View>;
}
export default function App() {
  const [fontsLoaded]=useFonts({Poppins_400Regular,Poppins_600SemiBold,Poppins_700Bold});
  const [data,setData]=useState<LocalState>(initial);
  const [loaded,setLoaded]=useState(false);
  const [tab,setTab]=useState<Tab>('Home');
  const [tool,setTool]=useState<Tool>(null);
  const [form,setForm]=useState<'task'|'note'|'card'|null>(null);
  const [fields,setFields]=useState({title:'',body:'',extra:'',due:toDay(),folder:'General',tags:''});
  const [search,setSearch]=useState('');
  const [mode,setMode]=useState<Mode>('focus');
  const [remaining,setRemaining]=useState(MODES.focus);
  const [running,setRunning]=useState(false);
  const [showAnswer,setShowAnswer]=useState(false);
  const [cardIndex,setCardIndex]=useState(0);
  const [qIndex,setQIndex]=useState(0);
  const [selected,setSelected]=useState<number|null>(null);
  const [seconds,setSeconds]=useState(300);
  const [quizRunning,setQuizRunning]=useState(false);
  const [toast,setToast]=useState('');
  const [subject,setSubject]=useState('Japanese · JLPT N2');
  const [folder,setFolder]=useState('All');
  const [showPolicy,setShowPolicy]=useState(false);

  useEffect(()=>{(async()=>{
    try{const value=await AsyncStorage.getItem(STORAGE);
      if(value){const parsed=JSON.parse(value);setData({...initial,...parsed})}}
    catch(e){Alert.alert('Storage issue','Could not read saved local study data.')}
    finally{setLoaded(true)}
  })()},[]);
  useEffect(()=>{if(loaded)AsyncStorage.setItem(STORAGE,JSON.stringify(data)).catch(()=>notify('Storage is full or unavailable'))},[data,loaded]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),2400);return()=>clearTimeout(id)},[toast]);
  const notify=(s:string)=>setToast(s);
  const patch=(next:Partial<LocalState>)=>setData(d=>({...d,...next}));
  const t=labels[data.language];
  const theme=useMemo(()=>data.dark?{
    bg:'#18142E',card:'#282347',ink:'#F8F6FF',muted:'#D6D1F2',border:'#605B80',
    pale:'#3B3464'
  }:{bg:PALETTE.cream,card:PALETTE.white,ink:PALETTE.ink,muted:PALETTE.muted,
    border:'#D8D1E7',pale:PALETTE.pale},[data.dark]);
  const scale=data.fontScale;
  const font=(size:number,weight:'regular'|'semi'|'bold'='regular',color=theme.ink):any=>({
    fontSize:size*scale,color,fontFamily:weight==='bold'?'Poppins_700Bold':weight==='semi'?'Poppins_600SemiBold':'Poppins_400Regular'
  });
  const cardStyle:any={backgroundColor:theme.card,borderRadius:24,padding:18,marginBottom:14,
    shadowColor:'#181044',shadowOpacity:.07,shadowRadius:12,elevation:2};
  const title=(s:string)=> <Text style={[font(22,'bold'),{marginBottom:12}]}>{s}</Text>;
  const today=toDay();
  const todayMin=data.sessions.filter(s=>s.day===today).reduce((n,s)=>n+s.minutes,0);
  const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return {
    label:d.toLocaleDateString('en',{weekday:'short'}),date:toDay(d),
    minutes:data.sessions.filter(s=>s.day===toDay(d)).reduce((n,s)=>n+s.minutes,0)
  }});
  const weekMinutes=week.reduce((n,d)=>n+d.minutes,0);
  const streak=(()=>{const days=new Set(data.sessions.map(s=>s.day));const d=new Date();if(!days.has(toDay(d)))d.setDate(d.getDate()-1);let count=0;while(days.has(toDay(d))){count++;d.setDate(d.getDate()-1)}return count})();
  const dueCards=data.cards.filter(c=>c.due<=today);
  const grouped=useMemo(()=>Object.entries(data.sessions.reduce((a,s)=>{
    a[s.subject]=(a[s.subject]||0)+s.minutes;return a
  },{} as Record<string,number>)).sort((a,b)=>b[1]-a[1]),[data.sessions]);
  const openUrl=(url:string)=>Linking.openURL(url).catch(()=>Alert.alert('Cannot open link','Please check your internet connection.'));
  const openLevel=(lv:string)=>openUrl(studyUrl+lv);
  const section=(name:string)=> <Text style={[font(19,'bold'),{marginTop:5,marginBottom:12}]}>{name}</Text>;
  const button=(text:string,fn:()=>void,variant:'primary'|'yellow'|'outline'='primary',icon?:IconComponent)=> {
    const color=variant==='primary'?PALETTE.white:variant==='yellow'?PALETTE.ink:theme.ink;
    const I=icon;
    return <Pressable onPress={fn} accessibilityRole="button" accessibilityLabel={text}
      style={{minHeight:48,backgroundColor:variant==='primary'?PALETTE.indigo:variant==='yellow'?PALETTE.yellow:theme.card,
        borderWidth:variant==='outline'?1.5:0,borderColor:theme.border,borderRadius:17,
        paddingHorizontal:16,paddingVertical:10,flexDirection:'row',justifyContent:'center',
        alignItems:'center',gap:8,flexGrow:1}}>
      {I?<I size={18} color={color} strokeWidth={2}/>:null}
      <Text style={font(13,'bold',color)}>{text}</Text>
    </Pressable>
  };
  const tile=(name:string,icon:IconComponent,color:string,onPress:()=>void)=>{
    const Icon=icon;
    return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name}
      style={{flex:1,backgroundColor:color,borderRadius:19,minHeight:96,alignItems:'center',justifyContent:'center',gap:5}}>
      <Icon size={25} strokeWidth={2} color={PALETTE.ink}/>
      <Text style={{...font(12,'semi',PALETTE.ink)}}>{name}</Text>
    </Pressable>;
  };
  const startTool=(next:Tool)=>{setTool(next);setTab('Study')};
  const startForm=(kind:'task'|'card'|'note')=>{
    setFields({title:'',body:'',extra:'',due:toDay(),folder:'General',tags:''});setForm(kind)
  };
  const saveForm=()=>{
    const name=fields.title.trim();if(!name)return Alert.alert('Required','Please enter a title or word.');
    if(fields.title.length>120||fields.body.length>12000)return Alert.alert('Too long','Please shorten your text.');
    if(form==='task'){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(fields.due)||Number.isNaN(new Date(fields.due+'T12:00:00').valueOf()))
        return Alert.alert('Date','Enter a date as YYYY-MM-DD.');
      patch({tasks:[{id:newId(),title:name,due:fields.due,subject:fields.extra||'Japanese',done:false},...data.tasks]});
    } else if(form==='note'){
      patch({notes:[{id:newId(),title:name,body:fields.body,folder:fields.folder||'General',tags:fields.tags},...data.notes]});
    } else if(form==='card'){
      if(!fields.body.trim())return Alert.alert('Required','Enter the flashcard answer.');
      patch({cards:[...data.cards,{id:newId(),front:name,back:fields.body,step:0,due:today}]});
    }
    setForm(null);notify('✓ Saved successfully');
  };
  const completeFocus=()=>{
    if(mode==='focus'){
      patch({sessions:[...data.sessions,{id:newId(),day:today,subject,minutes:25}]});
      notify('🎉 Focus session complete! +25 XP');
    }else notify('✓ Break complete');
    setRunning(false);setRemaining(MODES[mode]);
  };
  useEffect(()=>{if(!running)return;const timer=setInterval(()=>{
    setRemaining(n=>{if(n<=1){setRunning(false);return 0}return n-1})
  },1000);return()=>clearInterval(timer)},[running]);
  useEffect(()=>{if(remaining===0)completeFocus()},[remaining]);
  useEffect(()=>{if(!quizRunning)return;const id=setInterval(()=>setSeconds(x=>Math.max(0,x-1)),1000);return()=>clearInterval(id)},[quizRunning]);
  useEffect(()=>{if(seconds===0&&quizRunning){setQuizRunning(false);notify('Quiz time finished')}},[seconds,quizRunning]);
  const changeMode=(m:Mode)=>{setMode(m);setRunning(false);setRemaining(MODES[m])};
  const due=dueCards[Math.min(cardIndex,dueCards.length-1)];
  const rate=(rating:'again'|'good'|'easy')=>{
    if(!due)return;
    const newStep=rating==='again'?0:due.step+1;
    const gap=rating==='again'?0:rating==='easy'?Math.max(3,newStep*3):Math.max(1,Math.round(1.7**newStep));
    const nextDue=addDays(gap);
    patch({cards:data.cards.map(c=>c.id===due.id?{...c,step:newStep,due:nextDue}:c)});
    setCardIndex(0);setShowAnswer(false);notify('✓ Review saved');
  };
  const finishQuiz=()=>{patch({tests:data.tests+1});setQuizRunning(false);setQIndex(0);setSelected(null);setSeconds(300);notify('✓ Quiz finished — +20 XP')};
  const resetAll=()=>Alert.alert('Delete local data','This permanently removes all notes, cards, tasks and study statistics saved on this device. No cloud account exists in this version.',
    [{text:'Cancel',style:'cancel'},{text:'Delete all',style:'destructive',onPress:async()=>{try{await AsyncStorage.removeItem(STORAGE);setData(initial);notify('Your local data was deleted')}catch{Alert.alert('Error','Could not delete the saved data.')}}}]);

  const HomeView=()=>{
    const pct=Math.min(1,todayMin/GOAL_MINUTES);
    return <>
      <View style={{flexDirection:'row',alignItems:'center',gap:12,marginBottom:14}}>
        <View style={{height:51,width:51,borderRadius:26,backgroundColor:PALETTE.yellow,alignItems:'center',justifyContent:'center'}}>
          <Text style={font(22,'bold',PALETTE.ink)}>{data.displayName.trim().charAt(0).toUpperCase()||'S'}</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={font(13,'regular',theme.muted)}>{t.hello} 👋</Text>
          <Text style={font(19,'bold')}>{data.displayName}</Text>
        </View>
        <View style={{backgroundColor:PALETTE.coral,borderRadius:13,paddingHorizontal:9,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:4}}>
          <Flame color={PALETTE.ink} size={16}/><Text style={font(11,'bold',PALETTE.ink)}>{streak} day streak</Text>
        </View>
      </View>
      <View style={[cardStyle,{backgroundColor:PALETTE.indigo,padding:22}]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:15}}>
          <ProgressRing progress={pct} onDark/>
          <View style={{flex:1}}>
            <Text style={font(14,'semi',PALETTE.white)}>{t.goal}</Text>
            <Text style={[font(21,'bold',PALETTE.white),{lineHeight:28}]}>{minText(todayMin)} / 3h</Text>
            <Text style={font(12,'regular',PALETTE.white)}>{Math.round(pct*100)}% {t.done}</Text>
          </View>
        </View>
        <View style={{marginTop:16}}>{button('▶ '+t.continue+': '+data.selectedLevel,()=>startTool('timer'),'yellow')}</View>
      </View>
      {section(t.quick)}
      <View style={{flexDirection:'row',gap:9,marginBottom:20}}>
        {tile('Timer',Timer,PALETTE.sky,()=>startTool('timer'))}
        {tile('Cards',Layers3,PALETTE.mint,()=>startTool('cards'))}
        {tile('Notes',NotebookPen,PALETTE.yellow,()=>startTool('notes'))}
        {tile('Quiz',CircleHelp,PALETTE.coral,()=>startTool('quiz'))}
      </View>
      {section(t.subjects)}
      <View style={{flexDirection:'row',gap:10,marginBottom:20}}>
        {(['N5','N3','N1'] as const).map((lv,i)=>{
          const n=data.sessions.filter(x=>x.subject.includes(lv)).reduce((a,x)=>a+x.minutes,0);
          return <Pressable key={lv} onPress={()=>openLevel(lv)} accessibilityLabel={'Open JLPT '+lv}
            style={{flex:1,minHeight:125,borderRadius:19,padding:12,backgroundColor:[PALETTE.sky,PALETTE.mint,PALETTE.yellow][i]}}>
            <Text style={font(20,'bold',PALETTE.ink)}>{lv}</Text>
            <Text style={font(11,'semi',PALETTE.ink)}>{minText(n)}</Text>
            <View style={{height:8,backgroundColor:'#1B174030',borderRadius:8,overflow:'hidden',marginTop:10}}>
              <View style={{width:String(Math.min(100,Math.round(n/300*100)))+'%',height:8,backgroundColor:PALETTE.indigo}}/>
            </View>
            <Text style={font(10,'semi',PALETTE.ink)}>Open lessons ↗</Text>
          </Pressable>
        })}
      </View>
      {section(t.next)}
      {data.tasks.filter(x=>!x.done).length===0?
        <View style={cardStyle}><Text style={font(14,'regular',theme.muted)}>{t.emptyTasks}</Text>
          <View style={{marginTop:13}}>{button('+ '+t.newTask,()=>startForm('task'),'outline',Plus)}</View></View>:
        data.tasks.filter(x=>!x.done).slice(0,3).map(x=><Pressable key={x.id} onPress={()=>setTab('Planner')}
          style={[cardStyle,{flexDirection:'row',alignItems:'center',gap:10,minHeight:75}]}>
          <View style={{height:43,width:5,borderRadius:5,backgroundColor:x.due<=today?PALETTE.coral:PALETTE.mint}}/>
          <View style={{flex:1}}><Text style={font(13,'semi')}>{x.title}</Text><Text style={font(11,'regular',theme.muted)}>Due: {x.due}</Text></View>
          <View style={{backgroundColor:x.due<=today?PALETTE.coral:PALETTE.mint,padding:8,borderRadius:11}}>
            <Text style={font(10,'bold',PALETTE.ink)}>{x.due<=today?'Urgent':'Planned'}</Text>
          </View>
        </Pressable>)}
    </>
  };

  const TimerView=()=>{
    const pct=1-remaining/MODES[mode];
    const time=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
    const doneToday=data.sessions.filter(x=>x.day===today).length;
    return <View style={{backgroundColor:PALETTE.deep,borderRadius:28,padding:22,alignItems:'center'}}>
      <Text style={font(22,'bold',PALETTE.white)}>⏱ {t.timer}</Text>
      <Text style={[font(13,'semi',PALETTE.white),{marginVertical:9,textAlign:'center'}]}>{subject}</Text>
      <View style={{flexDirection:'row',gap:6,marginVertical:12}}>
        {(['focus','break','long'] as Mode[]).map((m)=> <Pressable key={m} onPress={()=>changeMode(m)}
          style={{flex:1,minHeight:46,backgroundColor:mode===m?PALETTE.yellow:'#FFFFFF1A',
            borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:5}}>
          <Text style={font(12,'semi',mode===m?PALETTE.ink:PALETTE.white)}>
            {m==='focus'?'Focus 25':m==='break'?'Break 5':'Long 15'}
          </Text></Pressable>)}
      </View>
      <View style={{marginVertical:10}}>
        <ProgressRing progress={pct} size={236} onDark label={time}/>
      </View>
      <Text style={[font(13,'semi',PALETTE.white),{marginVertical:8}]}>Session {(doneToday%4)+1} of 4</Text>
      <View style={{flexDirection:'row',gap:9,marginBottom:21}}>
        {[0,1,2,3].map(i=><View key={i} style={{width:11,height:11,borderRadius:8,
          backgroundColor:i<(doneToday%4)?PALETTE.yellow:'#FFFFFF55'}}/>)}
      </View>
      <View style={{flexDirection:'row',gap:10,width:'100%'}}>
        {button('Reset',()=>{setRunning(false);setRemaining(MODES[mode])},'outline',RotateCcw)}
        {button(running?'Pause':'Start',()=>setRunning(!running),'yellow',running?Pause:Play)}
      </View>
      <View style={{backgroundColor:'#FFFFFF14',borderRadius:18,padding:15,width:'100%',marginTop:19}}>
        <Text style={font(12,'semi',PALETTE.white)}>🔕 Distraction block: unavailable</Text>
        <Text style={font(11,'regular',PALETTE.white)}>A study app cannot block other apps without additional platform permissions.</Text>
      </View>
    </View>;
  };

  const FlashcardView=()=>{
    return <>
      {title('🃏 '+t.cards)}
      <View style={{flexDirection:'row',gap:9,marginBottom:15}}>
        {button('+ '+t.newCard,()=>startForm('card'),'primary',Plus)}
      </View>
      {!due?<View style={cardStyle}><Text style={font(15,'semi')}>{t.emptyCards}</Text>
        <Text style={font(12,'regular',theme.muted)}>Total saved: {data.cards.length}. The next review appears on its scheduled date.</Text></View>:
      <View style={cardStyle}>
        <Text style={font(12,'semi',theme.muted)}>{dueCards.length} cards due today</Text>
        <Pressable onPress={()=>setShowAnswer(!showAnswer)} accessibilityRole="button" accessibilityLabel="Flip flashcard"
          style={{minHeight:195,alignItems:'center',justifyContent:'center',backgroundColor:theme.pale,borderRadius:22,marginVertical:16,padding:18}}>
          <Text style={[font(25,'bold'),{textAlign:'center'}]}>{showAnswer?due.back:due.front}</Text>
          <Text style={[font(11,'semi',theme.muted),{marginTop:11}]}>Tap to flip</Text>
        </Pressable>
        {!showAnswer?button('Show answer',()=>setShowAnswer(true),'yellow'):
        <View style={{flexDirection:'row',gap:5}}>
          {button('Again',()=>rate('again'),'outline')}
          {button('Good',()=>rate('good'))}
          {button('Easy',()=>rate('easy'),'yellow')}
        </View>}
      </View>}
    </>
  };
  const NotesView=()=>{
    const dirs=['All',...new Set(data.notes.map(n=>n.folder))];
    const found=data.notes.filter(n=>(folder==='All'||n.folder===folder)&&
      (n.title+' '+n.body+' '+n.tags).toLowerCase().includes(search.toLowerCase()));
    return <>{title('📝 '+t.notes)}
      <View style={{flexDirection:'row',gap:8,marginBottom:13}}>{button('+ '+t.newNote,()=>startForm('note'),'primary',Plus)}</View>
      <View style={{borderRadius:16,borderWidth:1,borderColor:theme.border,backgroundColor:theme.card,flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:11,marginBottom:12}}>
        <Search color={theme.muted} size={19}/>
        <TextInput placeholder="Search notes and tags" placeholderTextColor={theme.muted} value={search}
          onChangeText={setSearch} accessibilityLabel="Search notes" style={{flex:1,color:theme.ink,height:50}}/>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
        {dirs.map(f=><Pressable key={f} onPress={()=>setFolder(f)} style={{borderRadius:12,paddingHorizontal:14,
          backgroundColor:folder===f?PALETTE.yellow:theme.card,minHeight:44,justifyContent:'center',marginRight:7}}>
          <Text style={font(12,'semi',folder===f?PALETTE.ink:theme.ink)}>{f}</Text>
        </Pressable>)}
      </ScrollView>
      {!found.length?<View style={cardStyle}><Text style={font(14,'regular',theme.muted)}>{t.emptyNotes}</Text></View>:
      found.map(n=><View key={n.id} style={cardStyle}>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <Folder size={18} color={PALETTE.indigo}/><Text style={[font(17,'bold'),{flex:1}]}>{n.title}</Text>
          <Pressable onPress={()=>Alert.alert('Delete note','Delete this note?',[{text:'Cancel'},{text:'Delete',style:'destructive',onPress:()=>{patch({notes:data.notes.filter(x=>x.id!==n.id)});notify('Note deleted')}}])} accessibilityRole="button" accessibilityLabel={'Delete note '+n.title} style={{padding:12}}>
            <Trash2 color={PALETTE.coral} size={19}/>
          </Pressable>
        </View>
        <Text style={[font(13),{marginVertical:8}]}>{n.body}</Text>
        <Text style={font(11,'regular',theme.muted)}>{n.folder} · {n.tags}</Text>
      </View>)}
    </>;
  };
  const QuizView=()=>{
    const current=quizQuestions[qIndex];
    return <>{title('📝 '+t.quiz)}
      <View style={[cardStyle,{flexDirection:'row',justifyContent:'space-between'}]}>
        <Text style={font(12,'semi')}>Question {qIndex+1} / {quizQuestions.length}</Text>
        <Text style={font(12,'bold',PALETTE.indigo)}>⏱ {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</Text>
      </View>
      <View style={cardStyle}>
        <Text style={font(19,'bold')}>{current.q}</Text>
        {current.o.map((v,i)=><Pressable key={i} disabled={selected!==null||seconds===0} onPress={()=>{setSelected(i);setQuizRunning(false)}}
          accessibilityRole="button" accessibilityLabel={'Answer '+(i+1)+': '+v}
          style={{minHeight:56,borderRadius:15,borderWidth:2,borderColor:selected===null?theme.border:i===current.a?'#188353':i===selected?'#B94042':theme.border,
            padding:13,marginTop:11,backgroundColor:theme.card}}>
          <Text style={font(14,'semi')}>{String.fromCharCode(65+i)}. {v}</Text>
        </Pressable>)}
        {selected!==null||seconds===0?<View style={{padding:14,backgroundColor:theme.pale,borderRadius:16,marginVertical:13}}>
          <Text style={font(14,'bold')}>{selected===current.a?'✓ Correct': '✕ Review the answer'}</Text>
          <Text style={[font(13),{marginTop:7}]}>{current.why}</Text>
        </View>:null}
        <View style={{marginTop:13}}>
          {selected===null&&seconds>0?button(quizRunning?'Pause timer':'Start timed quiz',()=>setQuizRunning(!quizRunning),'yellow',quizRunning?Pause:Play):
            button(qIndex===quizQuestions.length-1?'Finish quiz':'Next question',()=>{
              if(qIndex===quizQuestions.length-1)finishQuiz();else{setQIndex(qIndex+1);setSelected(null);setQuizRunning(true)}
            },'yellow',ChevronRight)}
        </View>
        <Text style={[font(11,'regular',theme.muted),{marginTop:10}]}>Original example questions, not official JLPT examination items.</Text>
      </View>
      {button('Open full JLPT exam papers',()=>openUrl('https://dadalupendra.github.io/nextstep-study/exams/?level='+data.selectedLevel),'outline',BookOpen)}
    </>;
  };
  const StudyView=()=>{
    if(tool)return <>
      <Pressable onPress={()=>{setTool(null);setQuizRunning(false)}} accessibilityRole="button" accessibilityLabel="Back to Study menu"
        style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:48}}>
        <ArrowLeft size={20} color={theme.ink}/><Text style={font(13,'semi')}>Back to Study</Text>
      </Pressable>
      {tool==='timer'?<TimerView/>:tool==='cards'?<FlashcardView/>:tool==='notes'?<NotesView/>:<QuizView/>}
    </>;
    return <>{title('📚 JLPT Learning Library')}
      <Text style={[font(13,'regular',theme.muted),{marginBottom:15}]}>Each JLPT level has its Kanji, Vocabulary, Grammar, Reading, Listening and Exam Papers together.</Text>
      {LEVELS.map((lv,i)=>{
        const bg=[PALETTE.mint,PALETTE.sky,PALETTE.yellow,PALETTE.coral,'#D5C9FB'][i];
        return <Pressable key={lv} onPress={()=>{patch({selectedLevel:lv});setSubject('Japanese · JLPT '+lv);openLevel(lv)}}
          accessibilityRole="button" accessibilityLabel={'Open all JLPT '+lv+' lessons'}
          style={{backgroundColor:bg,borderRadius:22,padding:16,flexDirection:'row',alignItems:'center',marginBottom:11,minHeight:82}}>
          <BookOpen size={25} color={PALETTE.ink}/><View style={{flex:1,marginHorizontal:13}}>
            <Text style={font(18,'bold',PALETTE.ink)}>JLPT {lv}</Text>
            <Text style={font(11,'regular',PALETTE.ink)}>Kanji · Words · Grammar · Reading · Listening · Exams</Text>
          </View><ChevronRight size={23} color={PALETTE.ink}/>
        </Pressable>
      })}
      {section('Study tools')}
      <View style={{flexDirection:'row',gap:9,marginBottom:10}}>
        {tile('Timer',Timer,PALETTE.sky,()=>startTool('timer'))}
        {tile('Cards',Layers3,PALETTE.mint,()=>startTool('cards'))}
        {tile('Notes',NotebookPen,PALETTE.yellow,()=>startTool('notes'))}
        {tile('Quiz',CircleHelp,PALETTE.coral,()=>startTool('quiz'))}
      </View>
    </>;
  };

  const PlannerView=()=>{
    const examDays=data.examDate?Math.ceil((new Date(data.examDate+'T12:00:00').getTime()-new Date().getTime())/86400000):null;
    return <>{title('📅 '+t.planner)}
      <View style={cardStyle}>
        <Text style={font(16,'bold')}>Calendar · {new Date().toLocaleDateString(data.language==='ne'?'ne-NP':'en-US',{month:'long',year:'numeric'})}</Text>
        <View style={{flexDirection:'row',gap:5,marginTop:17}}>
          {Array.from({length:7},(_,i)=>{const date=new Date();date.setDate(date.getDate()+i);
            return <View key={i} style={{flex:1,alignItems:'center',borderRadius:14,paddingVertical:10,backgroundColor:i===0?PALETTE.yellow:theme.pale}}>
              <Text style={font(10,'semi',i===0?PALETTE.ink:theme.ink)}>{date.toLocaleDateString('en',{weekday:'short'})}</Text>
              <Text style={font(15,'bold',i===0?PALETTE.ink:theme.ink)}>{date.getDate()}</Text>
            </View>})}
        </View>
      </View>
      <View style={cardStyle}>
        <View style={{flexDirection:'row',alignItems:'center',gap:9,marginBottom:10}}>
          <Target color={PALETTE.indigo} size={21}/><Text style={font(17,'bold')}>{t.exam}</Text>
        </View>
        <Text style={font(12,'regular',theme.muted)}>Enter exam date as YYYY-MM-DD</Text>
        <TextInput accessibilityLabel="Exam date YYYY-MM-DD" keyboardType="numbers-and-punctuation" value={data.examDate}
          placeholder="2027-07-04" placeholderTextColor={theme.muted}
          onChangeText={x=>patch({examDate:x})}
          maxLength={10} style={{borderColor:theme.border,borderWidth:1.4,borderRadius:13,backgroundColor:theme.card,
            padding:11,color:theme.ink,marginVertical:9,minHeight:49}}/>
        <Text style={font(19,'bold',PALETTE.indigo)}>
          {examDays===null||Number.isNaN(examDays)?'Set your exam date':examDays<0?'Exam date passed':examDays+' days remaining'}
        </Text>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:9}}>
        <Text style={font(20,'bold')}>Daily to-do</Text>
        <Pressable onPress={()=>startForm('task')} accessibilityRole="button" accessibilityLabel="Add task" style={{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center',backgroundColor:PALETTE.yellow,borderRadius:15}}>
          <Plus size={22} color={PALETTE.ink}/>
        </Pressable>
      </View>
      {!data.tasks.length?<View style={cardStyle}><Text style={font(14,'regular',theme.muted)}>{t.emptyTasks}</Text></View>:data.tasks.map(x=><View key={x.id} style={[cardStyle,{flexDirection:'row',alignItems:'center',gap:11}]}>
        <Pressable onPress={()=>{patch({tasks:data.tasks.map(y=>y.id===x.id?{...y,done:!y.done}:y)});notify('✓ Task updated')}}
          accessibilityRole="checkbox" accessibilityState={{checked:x.done}} accessibilityLabel={'Mark task '+x.title}
          style={{minHeight:48,minWidth:48,alignItems:'center',justifyContent:'center'}}>
          <View style={{width:27,height:27,borderRadius:9,borderColor:PALETTE.indigo,borderWidth:2,backgroundColor:x.done?PALETTE.mint:theme.card,alignItems:'center',justifyContent:'center'}}>{x.done?<Check size={18} color={PALETTE.ink}/>:null}</View>
        </Pressable>
        <View style={{flex:1}}><Text style={[font(13,'semi'),x.done?{textDecorationLine:'line-through',opacity:.7}:null]}>{x.title}</Text>
          <Text style={font(11,'regular',theme.muted)}>{x.due} · {x.subject}</Text></View>
        <Pressable onPress={()=>patch({tasks:data.tasks.filter(y=>y.id!==x.id)})} accessibilityLabel={'Delete task '+x.title} style={{padding:12}}>
          <Trash2 size={19} color={theme.muted}/>
        </Pressable>
      </View>)}
    </>;
  };
  const StatsView=()=>{
    const max=Math.max(30,...week.map(x=>x.minutes));
    return <>{title('📊 '+t.week+', '+minText(weekMinutes)+' studied')}
      <View style={{flexDirection:'row',gap:8,marginBottom:16}}>
        {[
          {n:String(streak),s:'Day streak',color:PALETTE.mint},
          {n:String(data.cards.filter(c=>c.step>0).length),s:'Cards done',color:PALETTE.sky},
          {n:String(data.tests),s:'Tests',color:PALETTE.coral}
        ].map(x=><View key={x.s} style={{flex:1,paddingVertical:14,paddingHorizontal:5,borderRadius:18,alignItems:'center',backgroundColor:x.color}}>
          <Text style={font(23,'bold',PALETTE.ink)}>{x.n}</Text><Text style={font(10,'semi',PALETTE.ink)}>{x.s}</Text>
        </View>)}
      </View>
      <View style={cardStyle}>{section('Weekly study')}
        <View style={{height:185,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:8,marginTop:6}}>
          {week.map((x,i)=><View key={x.date} style={{flex:1,alignItems:'center',justifyContent:'flex-end',height:180,gap:5}}>
            <Text style={font(10,'semi',theme.muted)}>{x.minutes}m</Text>
            <View style={{width:'85%',height:Math.max(9,130*x.minutes/max),backgroundColor:
              [PALETTE.sky,PALETTE.mint,PALETTE.yellow,PALETTE.coral,'#D5C9FB',PALETTE.sky,PALETTE.mint][i],
              borderTopLeftRadius:11,borderTopRightRadius:11}}/>
            <Text style={font(10,'semi',theme.muted)}>{x.label}</Text>
          </View>)}
        </View>
      </View>
      <View style={cardStyle}>{section(t.bySubject)}
        {!grouped.length?<Text style={font(13,'regular',theme.muted)}>Complete a focus session to see your statistics.</Text>:
          grouped.map(([name,min])=><View key={name} style={{marginBottom:15}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}>
              <Text style={font(12,'semi')}>{name}</Text><Text style={font(12,'semi',theme.muted)}>{minText(min)}</Text>
            </View>
            <View style={{height:9,marginTop:7,backgroundColor:theme.pale,borderRadius:9}}>
              <View style={{width:String(Math.min(100,Math.round(min/Math.max(1,weekMinutes)*100)))+'%',height:9,backgroundColor:PALETTE.indigo,borderRadius:9}}/>
            </View>
          </View>)}
      </View>
      <View style={cardStyle}>{section('Badges')}
        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          {[{n:'7 days',got:streak>=7},{n:'100 cards',got:data.cards.filter(c=>c.step>0).length>=100},
            {n:'Early bird',got:false},{n:'Locked',got:false}].map(x=><View key={x.n} style={{flex:1,alignItems:'center',gap:4,opacity:x.got?1:.65}}>
            {x.got?<Award color={PALETTE.indigo} size={24}/>:<LockKeyhole color={theme.muted} size={24}/>}
            <Text style={[font(10,'semi',theme.muted),{textAlign:'center'}]}>{x.n}</Text>
          </View>)}
        </View>
      </View>
    </>;
  };
  const ProfileView=()=> <>
    {title('⚙️ '+t.settings)}
    <View style={cardStyle}>
      <Field label="Display name" theme={theme} value={data.displayName} onChange={x=>patch({displayName:x.slice(0,40)})}/>
      <Text style={[font(14,'semi'),{marginBottom:8}]}>{t.language}</Text>
      <View style={{flexDirection:'row',gap:10,marginBottom:15}}>
        {(['en','ne'] as const).map(l=>button(l==='en'?'English':'नेपाली',()=>patch({language:l}),data.language===l?'yellow':'outline'))}
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:58}}>
        <View style={{flexDirection:'row',gap:10,alignItems:'center'}}>{data.dark?<Moon color={theme.ink} size={21}/>:<Sun color={theme.ink} size={21}/>}
          <Text style={font(14,'semi')}>{t.dark}</Text></View>
        <Switch accessibilityLabel="Toggle dark mode" value={data.dark} onValueChange={dark=>patch({dark})}
          trackColor={{false:'#D8D1E7',true:PALETTE.indigo}} thumbColor={PALETTE.yellow}/>
      </View>
      <Text style={[font(14,'semi'),{marginTop:15}]}>Font size</Text>
      <View style={{flexDirection:'row',gap:8,marginTop:9}}>
        {[0.9,1,1.1,1.2].map(v=>button(String(Math.round(v*100))+'%',()=>patch({fontScale:v}),data.fontScale===v?'yellow':'outline'))}
      </View>
    </View>
    <View style={cardStyle}>
      <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <View style={{flexDirection:'row',gap:9,alignItems:'center'}}><Bell color={PALETTE.indigo} size={21}/>
          <Text style={font(14,'semi')}>{t.notification}</Text></View>
        <Switch value={data.reminders} onValueChange={reminders=>patch({reminders})}
          accessibilityLabel="Save reminder preference" trackColor={{false:'#D8D1E7',true:PALETTE.indigo}}/>
      </View>
      <Text style={[font(11,'regular',theme.muted),{marginTop:7}]}>Preference only. Scheduled push notifications are not active until a notification service is configured.</Text>
    </View>
    <View style={cardStyle}>
      <View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Shield color={PALETTE.indigo} size={22}/>
        <Text style={font(17,'bold')}>{t.privacy}</Text></View>
      <Text style={[font(12,'regular',theme.muted),{marginVertical:11}]}>Offline mode: notes, cards, tasks and progress stay on this device. There is no account, password or cloud synchronization in this version.</Text>
      <View style={{gap:10}}>
        {button('Read Privacy Policy',()=>setShowPolicy(true),'outline',Shield)}
        {button(t.delete,resetAll,'yellow',Trash2)}
      </View>
    </View>
  </>;

  const FormView=()=> <Modal visible={!!form} animationType="slide" transparent onRequestClose={()=>setForm(null)}>
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}
      style={{flex:1,justifyContent:'flex-end',backgroundColor:'#14102799'}}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{backgroundColor:theme.bg,borderTopLeftRadius:27,borderTopRightRadius:27,padding:23,maxHeight:650}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Text style={font(21,'bold')}>{form==='task'?t.newTask:form==='note'?t.newNote:t.newCard}</Text>
          <Pressable onPress={()=>setForm(null)} accessibilityLabel="Close form" style={{padding:12}}><X color={theme.ink} size={22}/></Pressable>
        </View>
        <Field label={form==='card'?'Japanese word / Question':'Title'} value={fields.title} onChange={title=>setFields(s=>({...s,title}))} theme={theme}/>
        {form==='task'?<>
          <Field label="Due date (YYYY-MM-DD)" value={fields.due} onChange={due=>setFields(s=>({...s,due}))} theme={theme}/>
          <Field label="Subject" value={fields.extra} onChange={extra=>setFields(s=>({...s,extra}))} theme={theme}/>
        </>:<>
          <Field label={form==='card'?'Answer / Meaning':'Note content'} value={fields.body} onChange={body=>setFields(s=>({...s,body}))} multiline theme={theme}/>
          {form==='note'?<>
            <Field label="Folder" value={fields.folder} onChange={folder=>setFields(s=>({...s,folder}))} theme={theme}/>
            <Field label="Tags (comma separated)" value={fields.tags} onChange={tags=>setFields(s=>({...s,tags}))} theme={theme}/>
          </>:null}
        </>}
        <View style={{flexDirection:'row',gap:11,marginTop:10}}>
          {button(t.cancel,()=>setForm(null),'outline')}{button(t.save,saveForm,'yellow',Check)}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>;

  const PrivacyView=()=> <Modal visible={showPolicy} animationType="slide" onRequestClose={()=>setShowPolicy(false)}>
    <View style={{flex:1,backgroundColor:theme.bg,paddingTop:Platform.OS==='android'?NativeStatusBar.currentHeight||32:50,paddingHorizontal:20}}>
      <Pressable onPress={()=>setShowPolicy(false)} style={{minHeight:48,justifyContent:'center'}}><Text style={font(14,'semi')}>← Back</Text></Pressable>
      <ScrollView><Text style={font(24,'bold')}>Privacy Policy · Offline version</Text>
        <Text style={[font(13),{marginVertical:13}]}>NextStep Study stores your display name, study notes, flashcards, tasks, language choice and study progress in the device's local app storage. No account is created in this version.</Text>
        <Text style={[font(13),{marginVertical:13}]}>Opening a JLPT lesson loads the existing GitHub Pages study site in your device browser. That website and third-party translation services can process network requests under their own policies. The native app does not send your personal notes to those services.</Text>
        <Text style={[font(13),{marginVertical:13}]}>You can delete saved app data using Profile → Delete my local data. Uninstalling the app usually removes its local data as well. This is not a cloud account deletion service.</Text>
        <Text style={[font(13),{marginVertical:13}]}>This offline prototype has no analytics, advertising, payments, identity verification, email authentication or active push-notification infrastructure. A separate legally reviewed policy and parental-consent flow will be required before a cloud account system is launched for minors.</Text>
      </ScrollView>
    </View>
  </Modal>;

  if(!loaded||!fontsLoaded)return <View style={{flex:1,backgroundColor:PALETTE.cream,alignItems:'center',justifyContent:'center'}}>
    <ActivityIndicator size="large" color={PALETTE.indigo}/>
    <Text style={{marginTop:14,color:PALETTE.ink}}>{labels.en.loading}</Text>
  </View>;
  return <View style={{flex:1,backgroundColor:theme.bg,paddingTop:Platform.OS==='android'?(NativeStatusBar.currentHeight||24):52}}>
    <StatusBar style={data.dark?'light':'dark'} backgroundColor={theme.bg}/>
    <ScrollView key={tab+'-'+tool} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:17,paddingTop:13,paddingBottom:110,maxWidth:760,width:'100%',alignSelf:'center'}}>
      {tab==='Home'?HomeView():tab==='Study'?StudyView():tab==='Planner'?PlannerView():tab==='Stats'?StatsView():ProfileView()}
    </ScrollView>
    <View style={{flexDirection:'row',backgroundColor:theme.card,borderTopLeftRadius:27,borderTopRightRadius:27,
      paddingBottom:Platform.OS==='ios'?20:10,paddingTop:8,paddingHorizontal:5,position:'absolute',bottom:0,left:0,right:0,
      shadowColor:'#1B1740',shadowRadius:14,shadowOpacity:.12,elevation:10}}>
      {NAV.map(item=>{
        const Icon=item.icon,active=tab===item.key;
        return <Pressable key={item.key} onPress={()=>{setTab(item.key);if(item.key!=='Study')setTool(null)}}
          accessibilityLabel={'Go to '+item.label} accessibilityRole="tab"
          accessibilityState={{selected:active}} style={{flex:1,alignItems:'center',justifyContent:'center',minHeight:61,gap:4}}>
          <View style={{backgroundColor:active?PALETTE.pale:'transparent',paddingHorizontal:16,paddingVertical:5,borderRadius:15}}>
            <Icon size={21} color={active?PALETTE.indigo:theme.muted} strokeWidth={2}/>
          </View>
          <Text style={font(10,'semi',active?PALETTE.indigo:theme.muted)}>{item.key==='Home'?labels[data.language].hello==='नमस्ते'?'होम':'Home':item.key==='Study'?t.study:item.key==='Planner'?t.planner:item.key==='Stats'?t.stats:t.profile}</Text>
        </Pressable>;
      })}
    </View>
    {!!toast&&<View accessible accessibilityRole="alert" style={{position:'absolute',bottom:91,alignSelf:'center',backgroundColor:PALETTE.deep,paddingHorizontal:17,paddingVertical:11,borderRadius:15}}>
      <Text style={font(12,'semi',PALETTE.white)}>{toast}</Text></View>}
    {FormView()}{PrivacyView()}
  </View>;
}
