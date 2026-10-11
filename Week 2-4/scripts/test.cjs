/* Dependency-free application-state tests. The minimal document adapter captures
   rendered output and event handlers; it is not a browser or layout engine. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist'),elements=new Map(),handlers={},tools={},storage=new Map(),intervalFns=new Map();let timerId=0;
class Element {
 constructor(key){this.key=key;this.innerHTML='';this.textContent='';this.attrs={};this.dataset={};this.hidden=false;this.disabled=false;this.value='';this.style={};const classes=new Set();this.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>{if(on??!classes.has(c))classes.add(c);else classes.delete(c);},contains:c=>classes.has(c)};}
 querySelector(selector){return get(this.key+' '+selector);}
 querySelectorAll(){return [];}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
 removeAttribute(k){delete this.attrs[k];}
 focus(){} scrollIntoView(){} matches(){return false;} getBoundingClientRect(){return {left:0,top:0,width:100,height:40};}
}
function get(key){if(!elements.has(key))elements.set(key,new Element(key));return elements.get(key);}
const sandbox={console,setInterval:fn=>{intervalFns.set(++timerId,fn);return timerId;},clearInterval:id=>intervalFns.delete(id),location:{hash:'#home'},history:{replaceState(a,b,url){sandbox.location.hash=url;}},window:{scrollTo(){},addEventListener(){}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:get,querySelectorAll:()=>[],addEventListener:(name,fn)=>handlers[name]=fn,modelContext:{registerTool:t=>tools[t.name]=t}}};
vm.createContext(sandbox);for(const file of ['content.js','questions.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const run=code=>vm.runInContext(code,sandbox);
let assertions=0;const ok=(v,m)=>{assert.ok(v,m);assertions++;};
function nav(hash){sandbox.location.hash=hash;run('render()');return get('#app').innerHTML;}
function click(action,extra={}){const el=new Element('button');el.dataset={action,...extra};handlers.click({target:{closest:()=>el}});return el;}
function submitQuiz(w,answer){const form=new Element('quizform');form.id='weekly-quiz';form.dataset={week:String(w)};form.querySelector=s=>s==='input:checked'?(answer===null?null:{value:String(answer)}):null;handlers.submit({target:form,preventDefault(){}});}
ok(nav('#home').includes('Three weeks. One connected story.'),'Homepage modules');
let pages=0;
for(const w of [2,3,4]){
 const ids=run(`progressItems(${w})`);
 for(const id of ids){const html=nav(`#week/${w}/${id}`);ok(html.includes('id="main"'),`Main landmark: ${w}/${id}`);ok(html.includes('Previous')||id==='overview'||id==='quiz',`Navigation: ${w}/${id}`);pages++;}
 const html=nav(`#exam/${w}`);ok((html.match(/Show Answer/g)||[]).length===6,`Six hidden model answers, week ${w}`);ok((html.match(/data-question="exam-/g)||[]).length===5,`Five exam MCQs, week ${w}`);
 nav(`#quiz/${w}`);ok(!get('#quiz-body').innerHTML.includes('class="feedback'),'No quiz answer before submit');
 const initial=run(`quizzes[${w}].index`);click('quiz-next',{week:String(w)});ok(run(`quizzes[${w}].index`)===initial,'Cannot advance before submission');
 submitQuiz(w,null);ok(run(`quizzes[${w}].answers.length`)===0,'No score without an answer');
 for(let n=0;n<15;n++){
  const right=run(`QUIZZES[${w}][quizzes[${w}].order[quizzes[${w}].index]].answer`);
  submitQuiz(w,right);submitQuiz(w,right);ok(run(`quizzes[${w}].answers.length`)===n+1,'Submission counted once');
  ok(get('#quiz-body').innerHTML.includes('Correct ·'),'Correct feedback after submission');
  click('quiz-next',{week:String(w)});
 }
 ok(run(`quizzes[${w}].finished`),'Quiz finishes');ok(get('#quiz-body').innerHTML.includes('Final Score · 100%'),'Perfect score');ok(storage.get('csci300-progress-v1').includes(`${w}/quiz`),'Quiz completion persisted');
 const old=run(`quizzes[${w}].order.join(',')`);click('quiz-restart',{week:String(w)});ok(run(`quizzes[${w}].answers.length`)===0,'Try Again resets answers');ok(run(`quizzes[${w}].order.join(',')`)!==old,'Restart reshuffles order');
 for(let n=0;n<15;n++){const right=run(`QUIZZES[${w}][quizzes[${w}].order[quizzes[${w}].index]].answer`);submitQuiz(w,(right+1)%4);ok(get('#quiz-body').innerHTML.includes('Incorrect ·'),'Incorrect feedback');click('quiz-next',{week:String(w)});}
 ok(get('#quiz-body').innerHTML.includes('Final Score · 0%'),'All-wrong score');
}
nav('#week/2/system-calls');click('flow-step',{flow:'main',index:'3'});ok(run('flowStates.main.index')===3,'Flow stage selection');ok(get('#flow-main .step-caption').innerHTML.includes('Storage'),'Flow caption matches stage');click('flow-restart',{flow:'main'});ok(run('flowStates.main.index')===0,'Flow reset');click('flow-play',{flow:'main'});ok(run('!!flowStates.main.timer'),'Flow play');click('flow-pause',{flow:'main'});ok(!run('flowStates.main.timer'),'Flow pause');
nav('#week/3/scheduling');click('schedule');ok(get('#running').innerHTML.includes('Chrome'),'CPU dispatch');click('schedule');ok(get('#running').innerHTML.includes('Teams'),'CPU rotation');click('schedule-reset');ok(run('labStates.queue.length')===4,'CPU restart');
nav('#week/3/shared-memory');click('flow-step',{flow:'shared',index:'2'});ok(get('#shared-value').textContent.includes('read by B'),'Shared memory receiver');
nav('#week/4/multicore');get('#task-picker').value='Display Page';click('assign-core',{index:'0'});click('assign-core',{index:'1'});ok(run('labStates.cores.filter(Boolean).length')===1,'Moving a task does not duplicate it');click('cores-play');ok(run('labStates.coresRunning'),'Core play');click('cores-pause');ok(!run('labStates.coresRunning'),'Core pause');click('cores-reset');ok(run('labStates.cores.every(x=>x===null)'),'Core reset');
nav('#week/4/issues');click('flow-step',{flow:'issue',index:'4'});ok(get('#counter-value').textContent.endsWith('1'),'Uncoordinated result');run("flowStop('issue');issueHTML(1);flowStates.issue.index=4;flowUpdate('issue')");ok(get('#counter-value').textContent.endsWith('2'),'Coordinated result');
nav('#week/2/overview');click('complete',{week:'2',id:'overview'});ok(storage.get('csci300-progress-v1').includes('2/overview'),'Lesson completion persisted');
nav('#week/2/system-calls');click('flow-play',{flow:'main'});const tick=intervalFns.get(run('flowStates.main.timer'));tick();ok(run('flowStates.main.index')===1,'Playback advances on timer');for(let n=0;n<4;n++)tick();ok(!run('flowStates.main.timer'),'Playback stops at final stage');ok(run('flowStates.main.index')===5,'Playback reaches final stage');click('flow-play',{flow:'main'});ok(run('flowStates.main.index')===0,'Replay starts from first stage');nav('#home');ok(intervalFns.size===0,'Navigation cleans up animation timers');
nav('#week/2/services');click('service',{name:'Keyboard'});ok(get('#service-info').innerHTML.includes('Input'),'Device explains its OS service');click('card',{key:'concept',index:'0'});ok(get('#detail-concept').innerHTML.includes('Opening Chrome'),'Concept card reveals example');
const form=new Element('checkform');form.dataset={question:'lesson-check'};form.matches=selector=>selector==='[data-question]';form.querySelector=selector=>selector==='input:checked'?{value:'0'}:get('#checkfeedback');handlers.submit({target:form,preventDefault(){}});ok(get('#checkfeedback').innerHTML.includes('Correct'),'Knowledge-check feedback');
nav('#week/2/structure');click('layer',{index:'2'});ok(run('flowStates.layers.index')===2,'Layer diagram follows selection');
nav('#week/4/models');const modelButton=new Element('model');modelButton.dataset={action:'model',index:'2'};modelButton.parentElement={querySelectorAll:()=>[modelButton]};handlers.click({target:{closest:()=>modelButton}});ok(get('#model-view').innerHTML.includes('Many-to-Many'),'Model selector updates diagram');
nav('#week/4/implicit');const implicitButton=new Element('implicit');implicitButton.dataset={action:'implicit',index:'1'};implicitButton.parentElement={querySelectorAll:()=>[implicitButton]};handlers.click({target:{closest:()=>implicitButton}});ok(get('#implicit-view').innerHTML.includes('Framework / Runtime'),'Implicit management comparison');
nav('#week/4/process-thread');click('threads-play');ok(get('[data-action="threads-play"]').disabled,'Threads play state');click('threads-pause');ok(get('[data-action="threads-pause"]').disabled,'Threads pause state');
const reveal=new Element('reveal');reveal.dataset={action:'reveal'};reveal.attrs['aria-controls']='answer-short-0';get('#answer-short-0').hidden=true;handlers.click({target:{closest:()=>reveal}});ok(!get('#answer-short-0').hidden&&reveal.textContent==='Hide Answer','Exam reveal');handlers.click({target:{closest:()=>reveal}});ok(get('#answer-short-0').hidden&&reveal.textContent==='Show Answer','Exam answer hides again');
ok(nav('#big-picture').includes('CPU/Core Execution'),'Big Picture connection');ok(nav('#week/99/invalid').includes('Three weeks.'),'Invalid routes recover');
async function finish(){ok(!!tools.navigate_learning_section,'WebMCP registered in supported context');await tools.navigate_learning_section.execute({week:3,section:'ipc'});ok(get('#app').innerHTML.includes('Interprocess Communication (IPC)'),'Tool opens same lesson');let rejected=false;try{await tools.navigate_learning_section.execute({week:3,section:'missing'});}catch{rejected=true;}ok(rejected,'Invalid navigation intentionally rejected');console.log(`PASS: ${assertions} checks; ${pages} weekly routes; all three quizzes tested at 100% and 0%; submissions, restart, progress, flows, CPU, memory, cores, shared-data examples and navigation tool.`);}
finish().catch(e=>{console.error(e);process.exitCode=1;});
