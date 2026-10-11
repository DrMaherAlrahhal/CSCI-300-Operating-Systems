const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../dist'),context=vm.createContext({});
for(const file of ['content.js','questions.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const {courses,quizzes,exams}=vm.runInContext('({courses:COURSES,quizzes:QUIZZES,exams:EXAMS})',context);
const expected={2:6,3:7,4:6};
let count=0;
for(const w of [2,3,4]){
 const c=courses[w],qs=quizzes[w],e=exams[w];
 assert.equal(c.lessons.length,expected[w]);assert.equal(new Set(c.lessons.map(l=>l.id)).size,c.lessons.length);
 for(const l of c.lessons){for(const field of ['title','question','explanation','example','lab','labTitle','check','transition'])assert.ok(l[field],`${w}/${l.id}: ${field}`);assert.equal(l.check.options.length,4);assert.ok(l.check.answer>=0&&l.check.answer<4);count++;}
 assert.equal(qs.length,15);for(const d of ['Easy','Medium','Difficult'])assert.equal(qs.filter(q=>q.difficulty===d).length,5);
 for(const q of qs){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);assert.ok(q.why.length>15);}
 assert.equal(e.short.length,4);assert.equal(e.long.length,2);assert.equal(e.mcqs.length,5);for(const i of e.mcqs)assert.ok(qs[i]);
}
for(const file of ['content.js','questions.js','app.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const asset of ['styles.css','content.js','questions.js','app.js'])assert.ok(html.includes(asset)&&fs.existsSync(path.join(root,asset)));
console.log(`PASS: ${count} major lessons, 45 quiz questions (5 per difficulty per week), 33 exam questions, valid scripts and local assets.`);
