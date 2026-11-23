'use strict';
const $ = id => document.getElementById(id);
const copy = value => JSON.parse(JSON.stringify(value));
const labels = {tasks:'Задания',number:'Номер задания',templates:'Шаблоны',title:'Название',id:'Идентификатор',task:'Номер задания',condition:'Условие',path:'Путь к папке',inputMode:'Режим ввода',tests:'Тесты',expected:'Ожидаемый вывод',variables:'Входные переменные',files:'Файлы',explanations:'Объяснения строк',gaps:'Пропуски',fullCodeHints:'Подсказки ко всему коду',levels:'Уровни сложности',start:'Начальная позиция',end:'Конечная позиция',kind:'Тип пропуска',hints:'Подсказки',line:'Строка',text:'Объяснение'};
let value = copy(presets.config), rawMode = false, dirty = false;
function message(text,error=false){$('status').textContent=text;$('status').className=error?'error':'';}
function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
function button(text,action){const b=node('button',text);b.onclick=action;return b;}
function changed(){dirty=true;message('Есть несохранённые изменения.');}
function parseRaw(){try{value=JSON.parse($('raw').value);return true;}catch(err){message('Ошибка JSON. '+err.message,true);return false;}}
function render(){const tree=$('tree');tree.replaceChildren();field(tree,'Документ',value,v=>{value=v;},true);}
function field(parent,key,data,assign,root=false){
 const title=labels[key]||String(key);
 if(data!==null && typeof data==='object'){
  const array=Array.isArray(data), box=node('details'), summary=node('summary');
  box.open=root;parent.append(box);box.append(summary);
  function children(){
   summary.textContent=title+' ('+Object.keys(data).length+')';
   while(box.children.length>1)box.lastElementChild.remove();
   for(const k of Object.keys(data)){
    const wrap=node('div');wrap.className='item';box.append(wrap);
    field(wrap,array?'№ '+(Number(k)+1):k,data[k],v=>{data[k]=v;});
    if(array)wrap.append(button('Удалить элемент',()=>{if(confirm('Удалить элемент '+(Number(k)+1)+'?')){data.splice(Number(k),1);changed();children();}}));
   }
   if(array)box.append(button('Добавить элемент',()=>{
    const model=data.at(-1)??({tasks:presets.catalog.tasks[0],templates:presets.catalog.tasks[0].templates[0],tests:presets.config.tests[0],gaps:presets.config.gaps[0],explanations:presets.config.explanations[0],levels:15}[key]??'');
    data.push(copy(model));changed();children();
   }));
   else box.append(button('Добавить поле',()=>{
    const k=prompt('Имя нового поля');if(!k)return;
    if(Object.hasOwn(data,k)){message('Такое поле уже есть.',true);return;}
    Object.defineProperty(data,k,{value:'',enumerable:true,writable:true,configurable:true});changed();children();
   }));
  }
  children();return;
 }
 const row=node('div'),label=node('label',title);row.className='row';row.append(label);parent.append(row);
 if(typeof data==='string'){
  const input=node('textarea');input.rows=Math.min(7,Math.max(1,data.split('\n').length));input.value=data;
  input.oninput=()=>{assign(input.value);changed();};label.append(input);
 }else{
  const input=node('input');input.value=JSON.stringify(data);label.append(input);
  input.oninput=()=>{changed();try{const v=JSON.parse(input.value);if(typeof v!==typeof data || (data===null&&v!==null))throw Error();assign(v);input.setCustomValidity('');}catch{input.setCustomValidity('Проверь тип и значение поля.');input.reportValidity();}};
 }
}
function validForm(){const bad=$('tree').querySelector(':invalid');if(bad){for(let p=bad.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;bad.reportValidity();return false;}return true;}
function show(raw){rawMode=raw;$('raw').hidden=!raw;$('tree').hidden=raw;$('format').hidden=!raw;$('source').setAttribute('aria-pressed',raw);$('fields').setAttribute('aria-pressed',!raw);if(raw)$('raw').value=JSON.stringify(value,null,2);else render();}
function replace(v,name){value=v;$('name').value=name;dirty=false;show(false);message('Документ открыт.');}
const replaceOK=()=>!dirty||confirm('Закрыть текущий документ без скачивания изменений?');
$('create').onclick=()=>{if(!replaceOK())return;const t=$('type').value;replace(copy(presets[t]),t==='other'?'document.json':t+'.json');};
$('open').onclick=()=>$('file').click();
$('file').onchange=async()=>{const f=$('file').files[0];$('file').value='';if(!f)return;try{const v=JSON.parse((await f.text()).replace(/^\uFEFF/,''));if(replaceOK())replace(v,f.name);}catch(e){message('Не удалось открыть файл. '+e.message,true);}};
$('source').onclick=()=>{if(!rawMode&&validForm())show(true);};
$('fields').onclick=()=>{if(rawMode&&parseRaw()){show(false);message('JSON прочитан.');}};
$('raw').oninput=changed;$('name').oninput=changed;
$('format').onclick=()=>{if(parseRaw()){show(true);message('JSON отформатирован.');}};
$('download').onclick=()=>{if(!(rawMode?parseRaw():validForm()))return;
 const a=node('a');let name=$('name').value.trim()||'document.json';a.download=/\.json$/i.test(name)?name:name+'.json';
 const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));a.href=url;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);dirty=false;message('Файл подготовлен к скачиванию.');};
window.onbeforeunload=e=>{if(dirty){e.preventDefault();e.returnValue='';}};
show(false);
