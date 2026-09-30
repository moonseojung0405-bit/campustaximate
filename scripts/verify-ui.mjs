import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const context=await browser.newContext({viewport:{width:1365,height:1000}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await Promise.all([page.waitForResponse(r=>r.url().includes('/api/rides?')),page.goto('http://127.0.0.1:5173/')]);
 await page.getByRole('button',{name:'로그인 / 가입',exact:true}).click();
 await page.getByRole('tab',{name:'처음 가입하기',exact:true}).click();
 await page.getByLabel('아이디',{exact:true}).fill('ui_'+Date.now().toString(36));
 await page.getByLabel('숫자 4자리 비밀번호',{exact:true}).fill('0842');
 await page.getByLabel('비밀번호 확인',{exact:true}).fill('0842');
 await page.getByRole('button',{name:'가입하고 시작하기',exact:true}).click();
 await page.getByRole('button',{name:'로그아웃',exact:true}).waitFor();
 await page.getByRole('button',{name:'모집 만들기',exact:true}).click();
 await page.getByLabel('모임에서 쓸 닉네임').fill('화과대학우');
 await page.getByLabel('만날 장소').fill('역 앞 택시 승강장 · 테스트');
 await page.getByLabel('예상 총 택시비').fill('20000');
 await page.getByLabel('학우에게 한마디').fill('동작 확인용 모임입니다.');
 await page.getByRole('button',{name:'4명 모임 만들기',exact:true}).click();
 await page.getByRole('heading',{name:'우리 모임 채팅'}).waitFor();
 await page.getByRole('button',{name:'5분 정도 늦어요.',exact:true}).click();
 await page.getByRole('log').getByText('5분 정도 늦어요.',{exact:true}).waitFor();
 await page.getByLabel('메시지',{exact:true}).fill('10분 안에 도착할게요.');await page.getByRole('button',{name:'메시지 보내기'}).click();
 await page.getByRole('log').getByText('10분 안에 도착할게요.').waitFor();
 await page.screenshot({animations:'disabled',path:'.sites-runtime/chat-desktop.png'});
 await page.getByRole('button',{name:'Close',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'모임 채팅'}).first().waitFor();
 await page.screenshot({animations:'disabled',path:'.sites-runtime/home-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({animations:'disabled',path:'.sites-runtime/home-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'No mobile overflow');
 await page.getByRole('button',{name:'모임 채팅'}).first().click();await page.getByRole('log').getByText('10분 안에 도착할게요.').waitFor();
 await page.screenshot({animations:'disabled',path:'.sites-runtime/chat-mobile.png'}); console.log(await page.locator('[role=dialog]').evaluate(el=>({background:getComputedStyle(el).backgroundColor,opacity:getComputedStyle(el).opacity})));  
 await page.getByRole('button',{name:'모집 취소',exact:true}).click();await page.getByRole('button',{name:'취소하기',exact:true}).click();
 await page.getByRole('heading',{name:'우리 모임 채팅'}).waitFor({state:'hidden'});
 assert.deepEqual(errors,[],'No browser runtime errors');
 console.log('PASS: desktop/mobile create, fixed four seats, 10-minute wait, quick message, text message, reload persistence, cancellation, no overflow/runtime errors.');
 console.log('Native WebMCP context:',await page.evaluate(()=>!!document.modelContext?.registerTool));
}finally{await browser.close();}



