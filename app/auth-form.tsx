'use client';
import {useState} from 'react';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
export type Account={username:string};
export function notifyAuthChange(){const channel=new BroadcastChannel('campus-taxi-auth');channel.postMessage('changed');channel.close();}
export default function AuthForm({onSuccess,onGuest,legacyRecords}:{onSuccess:(account:Account)=>void;onGuest:()=>void;legacyRecords:boolean}){
 const [mode,setMode]=useState('login'),[username,setUsername]=useState(''),[pin,setPin]=useState(''),[confirmPin,setConfirmPin]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const response=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:mode==='register'?'register':'login',username,pin,confirmPin})});const data=await response.json() as {error?:string;account:Account};if(!response.ok)throw new Error(data.error||'다시 시도해 주세요.');setPin('');setConfirmPin('');notifyAuthChange();onSuccess(data.account);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="auth-box"><div className="guest-choice"><b>가입은 선택이에요</b><p>비회원도 모집·참여·채팅을 모두 이용할 수 있어요.</p><button type="button" className="secondary full" disabled={busy} onClick={onGuest}>비회원으로 이용하기</button><small>같은 브라우저에서는 내 모임이 유지돼요. 쿠키 삭제·브라우저 변경 시 다시 찾을 수 없어요. 나중에 여기서 가입하면 기록이 연결돼요.</small></div><Tabs value={mode} onValueChange={value=>{if(!busy){setMode(value);setError('');setPin('');setConfirmPin('');}}}><TabsList className="auth-tabs" aria-label="계정 이용 방식"><TabsTrigger value="login">로그인</TabsTrigger><TabsTrigger value="register">처음 가입하기</TabsTrigger></TabsList></Tabs>
 <p className="auth-intro">{mode==='register'?'아이디와 비밀번호를 한 번 정하면 다른 기기에서도 내 모임을 이어갈 수 있어요.':'전에 정한 아이디와 숫자 4자리 비밀번호를 입력해 주세요.'}</p>
 {legacyRecords&&<p className="legacy-notice">이 브라우저에 이전 참여 기록이 있어요. <b>처음 가입하기</b>로 계정을 만들면 기존 모집과 채팅이 연결돼요.</p>}
 <form className="ride-form" onSubmit={submit}><label>아이디<input aria-label="아이디" required autoComplete="username" minLength={4} maxLength={20} pattern="[a-zA-Z0-9_]{4,20}" value={username} onChange={e=>setUsername(e.target.value)} placeholder="영문·숫자·밑줄 4~20자" autoCapitalize="none" spellCheck={false}/><small>영문 대소문자는 구분하지 않아요. 채팅에는 별도 닉네임이 보여요.</small></label>
 <label>숫자 4자리 비밀번호<input aria-label="숫자 4자리 비밀번호" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required autoComplete={mode==='register'?'new-password':'current-password'} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))} placeholder="숫자 4자리"/></label>
 {mode==='register'&&<label>비밀번호 확인<input aria-label="비밀번호 확인" type="password" inputMode="numeric" pattern="[0-9]{4}" minLength={4} maxLength={4} required autoComplete="new-password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value.replace(/\D/g,''))} placeholder="한 번 더 입력해 주세요"/></label>}
 {error&&<p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy?'확인 중…':mode==='register'?'가입하고 시작하기':'로그인하기'}</button>
 <p className="fine-print">로그인은 이 기기에서 자동으로 유지돼요. 공용 기기에서는 이용 후 로그아웃해 주세요.</p>{mode==='register'&&<p className="fine-print">아이디와 비밀번호를 기억해 주세요. 현재는 분실 시 복구 기능이 없어요. 다른 서비스와 같은 비밀번호는 피해주세요.</p>}</form></div>;
}
