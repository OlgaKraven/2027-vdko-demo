(()=>{'use strict';
const D=COURSE,C=ExamCore,E=C.escape,prefix='2027-vdko-demo:v1:',root=document.getElementById('app');
let fallback={},storageOK=true;
const get=(k,v=null)=>{try{return JSON.parse(localStorage.getItem(prefix+k))??v;}catch{storageOK=false;return fallback[k]??v;}};
const set=(k,v)=>{fallback[k]=v;try{localStorage.setItem(prefix+k,JSON.stringify(v));}catch{storageOK=false;}};
const modes=[['overview','Обзор'],['learn','Обучение'],['training','Тренировка'],['mock','Пробный экзамен'],['examples','Примеры'],['teacher','Преподавателю']];
const modeIcons = {
  overview: 'M12 2.5 2 11h3v9a1 1 0 0 0 1 1h3.5v-6h5v6H18a1 1 0 0 0 1-1v-9h3z',
  learn: 'M6 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm3.5 2h6a4 4 0 0 1 0 8H9a2 2 0 1 0 0 4h7.2l-2-2 1.4-1.4L20 19l-4.4 4.4-1.4-1.4 2-2H9a4 4 0 1 1 0-8h6.5a2 2 0 0 0 0-4h-6z',
  training: 'M9 1h6v3H9zM11 4h2v1h-2zM19 7l1.8-1.8 1.4 1.4-1.8 1.8zM21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-10-5h2v4.5l2.2 2.2-1.4 1.4-2.8-2.8z',
  mock: 'M9 3a3 3 0 0 1 6 0h3a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 1.2v2h4v-2zm-2 9.1 3.1 3.1 5.5-5.5-1.4-1.4-4.1 4.1-1.7-1.7z',
  examples: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm2 2h16V7H4zm5.4 2.6L6 14l3.4 3.4 1.2-1.2L8.4 14l2.2-2.2zm5.2 0-1.2 1.2 2.2 2.2-2.2 2.2 1.2 1.2L18 14z',
  teacher: 'M2 3h20v14h-9v2h4v2H7v-2h4v-2H2zm4.2 9 1.3 1.3 3-3 3 1.5 4.3-4.3-1.3-1.3-3.3 3.3-3-1.5z'
};
const toolIcons = {
  moon: 'M20.8 15.2A9 9 0 0 1 8.8 3.2a9.2 9.2 0 1 0 12 12Z',
  sun: 'M17.5 12a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0ZM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM3.5 4.9l1.4-1.4L7 5.6 5.6 7zm13.5 13.5 1.4-1.4 2.1 2.1-1.4 1.4zm0-12.8 2.1-2.1 1.4 1.4L18.4 7zM3.5 19.1 5.6 17 7 18.4l-2.1 2.1z',
  tour: 'M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm4.7 5.3-7 2.4-2.4 7 7-2.4z'
};
function readRoute(restore=false) {
  const fileRoute = location.protocol==='file:' && location.hash.startsWith('#mode=');
  const query = new URLSearchParams(fileRoute ? location.hash.slice(1) : location.search);
  const legacyTask = /^#task-([123])$/.exec(location.hash);
  const requestedMode = query.get('mode') || (legacyTask ? 'learn' : location.hash==='#variative' ? 'overview' : null) || (restore ? get('mode','overview') : 'overview');
  const requestedStage = query.get('module') || (legacyTask ? 'M'+legacyTask[1] : null) || (restore ? get('stage','documents') : 'documents');
  const requestedVariant = query.get('variant') || (restore ? get('variant','universal') : 'universal');
  const view = query.get('view');
  return {
    mode: requestedMode==='criteria'||modes.some(([id])=>id===requestedMode) ? requestedMode : 'overview',
    stage: D.stages.some(item=>item.id===requestedStage) ? requestedStage : 'documents',
    variant: D.variants.some(item=>item.id===requestedVariant) ? requestedVariant : 'universal',
    learningView: ['map','brief','steps','help'].includes(view) ? view : legacyTask ? 'brief' : query.has('module') ? 'steps' : 'map'
  };
}
let {mode,stage,variant,learningView} = readRoute(true);
let dark = get('dark',false);
const btn=(text,attrs='',primary=false)=>`<button class="btn${primary?' primary':''}" ${attrs}>${text}</button>`;
const link=(text,path)=>`<a class="btn" href="${E(path)}" target="_blank" rel="noopener">${E(text)}</a>`;
const baseVariant = D.variants[0];
const selectedVariant = () => D.variants.find(item => item.id === variant);

function ticketsDownload(entry) {
  const rows = [TICKET_COLUMNS, ...entry.tickets];
  const csv = rows.map(row => row.map(cell => '"' + cell.replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv + '\r\n');
  return `<a class="btn" href="${url}" download="tickets-${E(entry.id)}.csv">Исходные заявки · CSV</a>`;
}

function taskCondition(task) {
  return task.condition.map(([title, requirements]) =>
    `<section><h4>${E(title)}</h4><ul>${requirements.map(text => '<li>' + E(text) + '</li>').join('')}</ul></section>`
  ).join('');
}

function taskInputs(task, entry) {
  if (task.id === 'M1') {
    return `<details><summary>Показать 10 исходных заявок</summary>
      <ol>${entry.tickets.map(([number, source, contact, request]) =>
        `<li><strong>№ ${E(number)}</strong> · ${E(source)} · ${E(contact)}<br>${E(request)}</li>`
      ).join('')}</ol>${ticketsDownload(entry)}</details>`;
  }
  return `<p>${E(task.inputs)}</p>`;
}

function fullCondition(entry) {
  return D.tasks.map((task, index) =>
    `<section><h3>Задание ${index + 1}. ${E(task.title)}</h3>
      ${taskCondition(task)}
      <h4>Исходные данные</h4>${taskInputs(task, entry)}
      ${link('Страницы задания в КИМ', D.kim + '#page=' + task.page)}
    </section>`
  ).join('');
}
const current=()=>D.stages.find(s=>s.id===stage),scope=()=>mode+':'+(mode==='mock'?variant:'sample'),timer=()=>C.restoreTimer(JSON.stringify(get('timer:'+scope())),180*60,mode);
const header = (title, text) => `<div class="route-heading"><h1 tabindex="-1">${E(title)}</h1>${text?'<p>'+E(text)+'</p>':''}</div>`;
function iconButton(title, path, attributes) {
  return `<button type="button" class="btn" data-icon-button aria-label="${E(title)}" ${attributes}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="${path}"/></svg>
    <span class="icon-tooltip" aria-hidden="true">${E(title)}</span>
  </button>`;
}
function overview() {
  return `<section class="hero study-intro">
    <div class="banner-copy">
      <h1>Демонстрационный экзамен</h1>
      <ul class="banner-facts" aria-label="Параметры экзамена">
        <li>Профильный уровень</li><li><span>Рекомендуемое время</span> <time datetime="PT4H">4 часа</time></li><li>До 100 баллов</li>
      </ul>
      <p class="lead">Разберите обращения пользователей, разверните сервер баз данных и проведите диагностику компьютера.</p>
      <div class="button-row">${btn('Открыть маршрут обучения →','data-mode="learn"',true)}${btn('Материалы задания','id="materials-open"')}</div>
    </div>
    <div class="banner-mascot"><img src="mascot-exam.png" width="680" height="680" alt="Носорог-студент готовится к демоэкзамену"></div>
  </section><section class="route-panel" id="variative" aria-labelledby="variative-title"><h2 id="variative-title">Вариативная часть</h2><p><strong>Ждём данные по вариативной части.</strong> В профильном экзамене на неё приходится до 25 баллов.</p></section>${criteria()}`;
}
const shortStages = ['Старт', 'Заявки', 'Сервер', 'Диагностика'];
function stageNavigation(items, active, practice = false) {
  const completed = items.filter(item=>practice ? mode==='training' && practiceDone(item.id) : get('done:'+item.id,false));
  return `<nav class="stage-nav" aria-label="${practice?'Задания':'Этапы обучения'}">
    <div class="stage-nav-caption"><strong>${practice?'Задания':'Этапы'}</strong>
      ${mode==='mock'?'':`<span>Выполнено ${completed.length} из ${items.length}</span>`}
    </div>
    <ol class="stage-nav-list" role="list">${items.map((item,index)=>{
      const done = completed.includes(item);
      const number = index+Number(practice);
      return `<li><button type="button" class="stage-nav-node" ${practice?`data-task="${index}"`:`data-stage="${item.id}"`}
        aria-label="${number} · ${E(item.title)} · ${stageTiming(item.id)}${done?' · Выполнено':''}" ${item.id===active?'aria-current="step"':''} ${done?'data-completed':''}>
        <span class="stage-nav-marker" aria-hidden="true">${done?'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>':number}</span>
        <span class="stage-nav-label" aria-hidden="true">${E(item.title)}<small>${stageTiming(item.id)}</small></span>
        <span class="stage-nav-short" aria-hidden="true">${shortStages[number]}</span>
      </button></li>`;
    }).join('')}</ol>
  </nav>`;
}

const preparation = 'Проверьте исходные материалы и подготовьте рабочие папки для каждого задания.';
const stageOutputs = Object.fromEntries(D.stages.map(stage => [stage.id, stage.outputs]));

function stageTiming(id) {
  const task = D.tasks.find(entry=>entry.id===id);
  return task ? task.minutes+' мин' : 'Перед началом';
}
function stageTitle(item) {
  return item.module+(item.id==='documents'?'':' · '+stageTiming(item.id));
}
function resumeView(id) {
  return get('step:'+id)!==null || get('done:'+id,false) ? 'steps' : 'brief';
}
function stageResult(item) {
  return `<strong>Что сохранить</strong><ul class="result-files">${stageOutputs[item.id].map(([name,note])=>
    `<li>${name.includes('.')?`<code>${E(name)}</code>`:E(name)} · ${E(note)}</li>`).join('')}</ul>`;
}
function learningMap() {
  const opened = get('opened-stage','documents');
  return `<section class="map-panel">
    <div class="map-intro"><h1 tabindex="-1">Маршрут обучения</h1><p>Универсальный · подготовка и три задания инвариантной части.</p></div>
    <section class="map-stack" aria-labelledby="map-stack-title">
      <strong id="map-stack-title">Стек обучения</strong>
      <div class="map-stack-value">Windows + PostgreSQL<span>Изолированный стенд · офисный редактор · PostgreSQL и DBeaver</span></div>
    </section>
    <div class="learning-map">
      <ol class="map-nodes" aria-label="Этапы обучения">${D.stages.map((item,index)=>{
        const done = get('done:'+item.id,false);
        const current = !done && item.id===opened;
        const status = done?' · Завершён':current?' · Текущий этап':'';
        return `<li><button type="button" class="map-node" data-map-stage="${item.id}" aria-pressed="${item.id===stage}"
          ${current?'aria-current="step"':''} ${done?'data-completed':''}>
          <span class="map-circle" aria-hidden="true">${done?'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>':index}</span>
          <span><strong>${E(item.title)}</strong><small>${E(stageTitle(item)+status)}</small></span>
        </button></li>`;
      }).join('')}</ol>
      <article class="map-detail" aria-label="Выбранный этап">
        ${D.stages.map(item=>{
          const saved = get('step:'+item.id);
          const task = D.tasks.find(entry=>entry.id===item.id);
          const action = get('done:'+item.id,false) ? 'Открыть этап'
            : saved===item.steps.length ? 'Что сохранить'
            : saved!==null ? 'Продолжить с шага '+(saved+1)
            : task ? 'Прочитать условие' : 'Открыть подготовку';
          return `<div class="map-stage-preview" ${item.id===stage?'':'inert'}>
            <div class="map-stage-content">
              <p class="section-code">${E(stageTitle(item))}</p>
              <h2>${E(item.title)}</h2><p>${E(task?.text||preparation)}</p>
              ${stageResult(item)}
            </div>
            ${btn(action+' →',`data-stage="${item.id}" data-lesson-view="${resumeView(item.id)}"`,true)}
          </div>`;
        }).join('')}
      </article>
    </div>
  </section>`;
}

function lessonBrief(lesson) {
  const task = D.tasks.find(entry => entry.id === lesson.id);
  const documents = D.originals.map(file => link(file.name,file.path)).join('');
  return `<div class="lesson-brief">
    ${task ? '<h3>Условие задания</h3>' + taskCondition(task) + '<h3>Исходные данные</h3>' + taskInputs(task, baseVariant) : '<p>'+E(preparation)+'</p>'}
    ${stageResult(lesson)}
    <div class="button-row">${task ? link('Полное условие · КИМ',D.kim+'#page='+task.page) : documents}</div>
    ${btn(get('step:'+lesson.id)===null?'Перейти к шагам →':stepIndex(lesson)===lesson.steps.length?'Что сохранить →':'Продолжить с шага '+(stepIndex(lesson)+1)+' →','data-lesson-view="steps"',true)}
  </div>`;
}

function lessonHelp(lesson) {
  return `<div class="lesson-help">
    <h3>Как пройти этап</h3>
    <p>Читайте объяснение, выполните действия в указанном порядке и проверьте результат. Примеры кода и готовые файлы открываются в соответствующих шагах.</p>
    ${stageResult(lesson)}
    <div class="button-row">${btn('Материалы задания','id="materials-open"')}${btn('Гид по разбору','data-guide="lesson"')}</div>
  </div>`;
}

function explain(step) {
  return `<section class="lesson-explanation">
    <h3>Как это понять</h3><p>${E(step.why)}</p>
    <h3>Что сделать самостоятельно</h3><ol>${step.actions.map(action=>'<li>'+E(action)+'</li>').join('')}</ol>
    ${step.code?'<pre tabindex="0">'+E(step.code)+'</pre>':''}
    ${step.tickets ? ticketsDownload(baseVariant) : ''}
    ${step.file?'<div class="button-row">'+link('Файл для сверки',step.file)+'</div>':''}
    <div class="step-result"><strong>Проверьте себя</strong><p>${E(step.check)}</p></div>
  </section>`;
}

const lessonResultTitle = 'Что сохранить';
const stepIndex = (lesson=current()) => Math.max(0,Math.min(lesson.steps.length,get('step:'+lesson.id,0)));
function stepArrow(index,previous,label) {
  const path=previous?'M20 12H4m7-7-7 7 7 7':'M4 12h16m-7-7 7 7-7 7';
  return btn(`<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`,
    `data-step="${index}" aria-label="${label}" title="${label}" aria-keyshortcuts="${previous?'ArrowLeft':'ArrowRight'}"`,!previous);
}
function goToLessonStep(index) {
  set('step:'+stage,index);
  render();
  document.getElementById('lesson-step-title').focus();
}
function showLessonSteps() {
  const lesson=current(), index=stepIndex(lesson);
  const titles=[...lesson.steps.map(step=>step.title),lessonResultTitle];
  const dialog=modal('Шаги этапа · '+lesson.title,`<ol class="lesson-step-list">${titles.map((title,i)=>
    `<li>${btn(E(title),`data-jump-step="${i}" ${i===index?'aria-current="step"':''}`)}</li>`).join('')}</ol>`);
  dialog.querySelectorAll('[data-jump-step]').forEach(button=>button.onclick=()=>{
    dialog.close();
    goToLessonStep(Number(button.dataset.jumpStep));
  });
  dialog.querySelector('[aria-current="step"]').focus();
}
function learn() {
  if (learningView==='map') return learningMap();
  const lesson=current(), index=stepIndex(lesson), step=lesson.steps[index];
  const done=get('done:'+stage,false), next=D.stages[D.stages.indexOf(lesson)+1];
  return `<div class="lesson-top">
    ${header('Обучение','Универсальный')}
    ${btn('← К маршруту','data-mode="learn" aria-label="К маршруту обучения"')}
  </div>
  <div class="route-layout lesson-layout">
    ${stageNavigation(D.stages,stage)}
    <section class="route-panel lesson-card" aria-labelledby="lesson-title">
      <h2 id="lesson-title" tabindex="-1">${E(lesson.title)}</h2>
      <p class="task-meta">${E(stageTitle(lesson))}</p>
      <nav class="lesson-views" aria-label="Разделы этапа">
        ${[['brief','Условие и файлы'],['steps','Шаги'],['help','Справка']].map(([id,title])=>
          btn(title,`data-lesson-view="${id}" ${id===learningView?'aria-current="page"':''}`)).join('')}
      </nav>
      ${learningView==='brief' ? lessonBrief(lesson) : learningView==='help' ? lessonHelp(lesson) : `
        ${stage==='documents'?`<div class="button-row">${btn('Материалы задания','id="materials-open"')}</div>`:''}
        <article class="study-step" aria-labelledby="lesson-step-title">
          <header class="step-heading">
            <h3 id="lesson-step-title" tabindex="-1"><span class="lesson-step-number" aria-label="Шаг ${index+1} из ${lesson.steps.length+1}">${index+1}</span><span>${E(step?.title||lessonResultTitle)}</span></h3>
            ${btn('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>','id="lesson-steps" aria-label="Все шаги" title="Все шаги" aria-haspopup="dialog"')}
          </header>
          ${step?explain(step):`<div class="lesson-result">${stageResult(lesson)}</div>`}
          <div class="study-controls${step?'':' lesson-result-controls'}">
            ${index>0?stepArrow(index-1,true,'Предыдущий шаг'):''}
            ${step?stepArrow(index+1,false,index+1===lesson.steps.length?lessonResultTitle:'Следующий шаг'):`
              <label class="lesson-complete"><input type="checkbox" id="done" ${done?'checked':''}> Этап выполнен</label>
              ${done?(next?btn('Далее · '+E(next.title)+' →',`data-stage="${next.id}"`,true):btn('Перейти к тренировке →','data-mode="training"',true)):''}
            `}
          </div>
        </article>
      `}
    </section>
  </div>`;
}
const practiceIndex = () => Math.max(0,Math.min(D.tasks.length-1,get('task:'+scope(),0)));
const practiceDone = id => get('task-done:'+scope()+':'+id,false);
const taskClock = () => get('task-clock:'+scope()) || {anchor:0,spent:{},alerted:{}};
const taskSpent = (clock,id,used) => (clock.spent[id] || 0) + Math.max(0,used-clock.anchor);
let showVariantBrief = false;
let timerAudio;

function enableTimerSound() {
  if (!get('timer-sound',true) || !window.AudioContext) return;
  timerAudio ??= new AudioContext();
  timerAudio.resume().catch(()=>{});
}
function signalTimer() {
  if (!get('timer-sound',true) || timerAudio?.state!=='running') return;
  const tone=timerAudio.createOscillator(), volume=timerAudio.createGain();
  const now=timerAudio.currentTime;
  tone.frequency.value=660;
  volume.gain.setValueAtTime(.12,now);
  volume.gain.exponentialRampToValueAtTime(.001,now+.5);
  tone.connect(volume).connect(timerAudio.destination);
  tone.start(now);
  tone.stop(now+.5);
}
function timerBox(attempt,index,mock) {
  const {status} = attempt;
  const finished=status==='finished', running=status==='running', idle=status==='idle';
  const startLabel = mock?'Начать':idle?'Начать тренировку':'Продолжить тренировку';
  const main = finished?btn('Начать заново','data-timer="reset"',true)
    : running ? (mock?'':btn('Пауза','data-timer="pause"',true)) : btn(startLabel,'data-timer="start"',true);
  return `<section class="timer-card" aria-label="${mock?'Время пробного экзамена':'Время тренировки'}">
    <div class="training-timer-top">
      <span class="eyebrow">${mock?'Пробный экзамен':'Тренировка'}</span>
      <output class="training-clock" id="clock" aria-live="off">${C.format(C.timerView(attempt).left)}</output>
      <span id="timer-status" role="status"></span>
      <progress id="timer-progress" aria-label="Использованное время" max="1" value="0"></progress>
      ${mock?'':`<div class="timer-task"><span id="task-clock-label">Время на задание ${index+1}</span><output id="task-clock" aria-labelledby="task-clock-label" aria-live="off"></output></div>`}
    </div>
    <div class="training-timer-controls">${main}${!finished&&(!idle||mock)?btn('Завершить',`data-timer="finish" ${idle?'disabled':''}`):''}</div>
    ${mock?'':`<div class="attempt-actions">
      <label><input type="checkbox" id="timer-sound" ${get('timer-sound',true)?'checked':''}> Звук таймера</label>
      ${running||status==='paused'?btn('Сбросить тренировку','data-timer="reset"'):''}
    </div>`}
    ${mock&&!finished?'<p class="timer-hint">После начала время идёт непрерывно, даже при закрытой странице.</p>':''}
  </section>`;
}
function practiceMaterials() {
  return `<div class="button-row">${ticketsDownload(baseVariant)}
    ${link('КИМ · PDF',D.kim+'#page=31')}</div>`;
}
function trainingSample() {
  modal('Условие и исходные данные',`<div class="practice-condition"><p>«Универсальный» — учебный вариант по образцу КИМ.</p>
    ${fullCondition(baseVariant)}</div>`);
}
function variantBrief(entry,index) {
  return `<article class="training-task">
    <header class="mock-brief-heading">
      <div><h2>${E(entry.title)}</h2><p class="task-meta">Условие варианта</p></div>
      ${btn('К заданию '+(index+1),`data-task="${index}"`)}
    </header>
    <div class="practice-condition">${fullCondition(entry)}</div>
  </article>`;
}

function practice() {
  const attempt=timer(), {status}=attempt, mock=mode==='mock';
  const index=practiceIndex(), task=D.tasks[index], locked=status==='paused'||status==='finished';
  const entry=mock ? selectedVariant() : baseVariant;
  const checked=task.checks.map((_,i)=>get('check:'+scope()+':'+task.id+':'+i,false));
  const taskCard = `<article class="training-task">
    <h2>${E(task.title)}</h2>
    <p class="task-meta">Задание ${index+1} · ${task.minutes} мин${mock?' · '+E(entry.title):''}</p>
    <section class="practice-condition"><h3>Условие задания</h3>${taskCondition(task)}
      <h3>Исходные данные</h3>${taskInputs(task, entry)}</section>
    ${mock?'':`<div class="task-support">${practiceMaterials()}${locked?'':btn('Подсказка к заданию',`data-help="${task.id}"`)}</div>`}
    <section class="self-check training-checklist" aria-labelledby="training-check-title">
      <header><h3 id="training-check-title">Самопроверка</h3><span id="training-check-count" aria-live="polite">${checked.filter(Boolean).length} из ${checked.length}</span></header>
      ${task.checks.map((text,i)=>`<label><input type="checkbox" data-check="${task.id}:${i}" ${locked?'disabled':''} ${checked[i]?'checked':''}>${E(text)}</label>`).join('')}
      ${mock?'<p class="small">Отметки служат для самопроверки.</p>':`<label class="task-complete"><input type="checkbox" id="task-complete" ${locked?'disabled':''} ${practiceDone(task.id)?'checked':''}> Задание выполнено</label>`}
    </section>
  </article>`;
  return `<section class="training-page practice-page training-compact ${mock?'mock-exam':''}">
    <header class="workspace-intro">
      <div><h1>${mock?'Пробный экзамен':'Тренировка'}</h1><p>${E(entry.title)} · 3 задания · 75 баллов</p></div>
      ${!mock&&status!=='paused'?btn('Условие и исходные данные','id="training-sample" aria-haspopup="dialog"'):''}
    </header>
    <div class="attempt-layout">
      ${timerBox(attempt,index,mock)}
      <div class="attempt-content">
        ${mock?`<div class="mock-variant-bar">
          <div class="training-source"><label>Вариант<select id="variant" ${status==='running'?'disabled':''}>${D.variants.map(item=>`<option value="${item.id}" ${item.id===variant?'selected':''}>${E(item.title)}</option>`).join('')}</select></label></div>
          <div class="mock-variant-actions">${btn('Условие варианта',`id="mock-brief" aria-pressed="${showVariantBrief}"`)}
            ${ticketsDownload(entry)}</div>
        </div>`:''}
        ${status==='paused'?'<section class="pause-screen" tabindex="-1" aria-labelledby="pause-title"><h2 id="pause-title">Тренировка на паузе</h2><p>Отсчёт остановлен. Условия и отметки снова появятся после продолжения.</p></section>':
          status==='finished'?'<section class="attempt-result" tabindex="-1" role="status"><h2>Попытка завершена</h2><p>Отметки сохранены. Можно начать новую попытку.</p></section>':''}
        <div class="training-workspace" ${status==='paused'?'hidden':''}>
          ${stageNavigation(D.tasks,showVariantBrief&&mock?null:task.id,true)}
          ${mock&&showVariantBrief?variantBrief(entry,index):taskCard}
        </div>
      </div>
    </div>
  </section>`;
}

function examples() {
  return `<section class="training-page example-page">
    ${header('Готовое решение','Универсальный · разбор инвариантной части')}
    <div class="example-grid">
      <article class="route-panel">
        <h2>Готовый пример</h2>
        <p>Три комплекта для сверки. Контакты и результаты диагностики в примере учебные. В свою работу подставьте данные выданного варианта и результаты своего стенда.</p>
        <div class="example-actions"><a class="btn primary" href="examples/universal-solution.zip" download>Скачать решение · ZIP</a>
        ${btn('Открыть маршрут →','data-mode="learn"')}</div>
      </article>
      <article class="route-panel">
        <h2>Внутри комплекта</h2>
        <ol>${D.solutions.map(solution=>`<li><strong>${E(solution.title)}</strong><ul>${solution.files.map(([name,path])=>`<li><a href="${E(path)}">${E(name)}</a></li>`).join('')}</ul></li>`).join('')}</ol>
      </article>
    </div>
  </section>`;
}

function criteria() {
  const total = D.criteria.reduce((sum,[,points])=>sum+points,0);
  return `<section class="route-panel overview-criteria" id="criteria" aria-labelledby="criteria-title">
    <div class="criteria-heading"><h2 id="criteria-title">Критерии оценки инвариантной части</h2><span>${total} баллов</span></div>
    <p class="criteria-source">КИМ 09.01.05-1-2027 · таблица 8 · инвариантная часть</p>
    <div class="criteria-table-wrap"><table class="criteria-table" aria-labelledby="criteria-title">
      <thead><tr><th scope="col">Критерий</th><th scope="col">Баллы</th></tr></thead>
      <tbody>${D.criteria.map(([name,points])=>`<tr><th scope="row">${E(name)}</th><td>${points}</td></tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">Итого</th><td>${total}</td></tr></tfoot>
    </table></div>
    ${link('Открыть КИМ · PDF',D.kim)}
  </section>`;
}

function teacher() {
  return `<section class="training-page">
    ${header('Преподавателю','Разбор учебного варианта «Универсальный» для занятия.')}
    <article class="route-panel">
      <h2>Порядок разбора</h2>
      <ol>
        <li>Раздайте исходные заявки. Сравните классификацию, ответы и технологические карты после самостоятельной работы.</li>
        <li>Покажите вход под отдельными ролями PostgreSQL. Разберите различие между ролью в базе и учётной записью Windows.</li>
        <li>Сопоставьте журнал событий, сканирование и нагрузку с выводами отчёта. Попросите студентов указать доказательство для каждой рекомендации.</li>
      </ol>
      <div class="button-row">${btn('Открыть маршрут','data-mode="learn"',true)}${btn('Готовое решение','data-mode="examples"')}${btn('Материалы задания','id="materials-open"')}</div>
    </article>
  </section>`;
}

function modal(title,html='',extra=''){const d=document.createElement('dialog');d.className='course-dialog '+extra;d.setAttribute('aria-label',title);d.innerHTML=`<header class="modal-head"><h2>${E(title)}</h2>${btn('Закрыть','data-close')}</header><div class="modal-body">${html}</div>`;document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();return d;}

function materials() {
  modal('Материалы задания',`<div class="artifact-list">${D.originals.map(file=>link(file.name,file.path)).join('')}
    <a class="btn" href="examples/tickets-input.csv" download>Учебные заявки · CSV</a></div><p>Универсальный · инвариантная часть.</p>`);
}
function tour(kind) {
  const message = kind==='lesson'
    ? 'Откройте условие и файлы, пройдите шаги и проверьте результат. Текущий шаг сохраняется в браузере.'
    : 'В обучении есть маршрут по трём заданиям. В тренировке можно поставить таймер на паузу. В пробном экзамене время идёт непрерывно. Готовые файлы для сверки собраны в «Примерах».';
  modal('Гид по курсу','<p>'+E(message)+'</p>');
}

function navigate(next) {
  const previous = location.href;
  if(next.mode) mode=next.mode;
  if(next.stage) stage=next.stage;
  if(next.variant) variant=next.variant;
  if(next.view) learningView=next.view;
  render();
  const target = location.href;
  if (target!==previous) {
    history.replaceState(null,'',previous);
    history.pushState(null,'',target);
  }
  if (!next.preserveScroll) window.scrollTo(0,0);
}
function render() {
  set('mode',mode);set('stage',stage);set('variant',variant);
  document.body.classList.toggle('dark',dark);
  const url = new URLSearchParams({mode,module:stage,variant});
  if (mode==='learn') {
    url.set('view',learningView);
    if (learningView!=='map') set('opened-stage',stage);
    if (learningView==='steps' && get('step:'+stage)===null) set('step:'+stage,0);
  }
  if (location.protocol==='file:') {
    history.replaceState(null,'','#'+url);
  } else {
    const anchor = mode==='overview' && ['#variative','#criteria'].includes(location.hash) ? location.hash : '';
    history.replaceState(null,'','?'+url+anchor);
  }
  const views = {overview,learn,training:practice,mock:practice,examples,criteria,teacher};
  root.innerHTML = `<div class="shell">
    <header class="top">
      <a class="brand" href="?mode=overview"><span class="brand-emblem">ДЭ</span><span><strong>09.01.05 · Оператор технической поддержки</strong><small>Демонстрационный экзамен · 2027</small></span></a>
      <div class="top-tools">
        ${iconButton(dark?'Включить светлую тему':'Включить тёмную тему',dark?toolIcons.sun:toolIcons.moon,'id="theme"')}
        ${iconButton('Тур по сайту',toolIcons.tour,'data-guide="site" aria-haspopup="dialog"')}
      </div>
    </header>
    <nav class="site-nav" aria-label="Основные разделы">${modes.map(([id,title])=>iconButton(title,modeIcons[id],`data-mode="${id}" ${mode===id||(mode==='criteria'&&id==='overview')?'aria-current="page"':''}`)).join('')}</nav>
    <main id="main" tabindex="-1">
      ${storageOK?'':'<p class="notice">Хранилище браузера недоступно. Отметки и прогресс сохраняются до закрытия страницы.</p>'}
      ${views[mode]()}
    </main>
  </div>`;
  bind();tick();
}
function bind() {
  root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{
    const next = button.dataset.mode;
    const inNavigation = button.closest('.site-nav');
    navigate({mode:next,view:'map'});
    const focus = inNavigation
      ? root.querySelector(`.site-nav [data-mode="${next}"]`)
      : root.querySelector('.map-intro h1');
    focus?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-stage]').forEach(button=>button.onclick=()=>{
    const next = button.dataset.stage;
    navigate({stage:next,view:button.dataset.lessonView||resumeView(next)});
    root.querySelector('#lesson-title').focus({preventScroll:true});
  });
  root.querySelectorAll('[data-map-stage]').forEach(button=>button.onclick=()=>{
    const next = button.dataset.mapStage;
    navigate({stage:next,view:'map',preserveScroll:true});
    root.querySelector(`[data-map-stage="${next}"]`).focus({preventScroll:true});
  });
  root.querySelectorAll('[data-lesson-view]:not([data-stage])').forEach(button=>button.onclick=()=>{
    navigate({view:button.dataset.lessonView,preserveScroll:true});
    root.querySelector('.lesson-views [aria-current="page"]').focus();
  });
  root.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>goToLessonStep(Number(button.dataset.step)));
  root.querySelectorAll('[data-task]').forEach(button=>button.onclick=()=>{
    const index = Number(button.dataset.task);
    const previous=practiceIndex();
    if (mode==='training' && previous!==index) {
      const clock=taskClock(), attempt=timer(), used=Math.min(C.timerView(attempt).used,attempt.durationMs);
      const taskId=D.tasks[previous].id;
      clock.spent[taskId]=taskSpent(clock,taskId,used);
      clock.anchor=used;
      set('task-clock:'+scope(),clock);
    }
    showVariantBrief=false;
    set('task:'+scope(),index);
    render();
    root.querySelector(`.stage-nav [data-task="${index}"]`)?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-guide]').forEach(button=>button.onclick=()=>tour(button.dataset.guide));
  root.querySelectorAll('[data-check]').forEach(input=>input.onchange=()=>{
    set('check:'+scope()+':'+input.dataset.check,input.checked);
    root.querySelector('#training-check-count').textContent=root.querySelectorAll('[data-check]:checked').length+' из '+root.querySelectorAll('[data-check]').length;
  });
  root.querySelectorAll('[data-help]').forEach(button=>button.onclick=()=>{
    set('timer:'+scope(),C.transition(timer(),'assisted'));
    navigate({mode:'learn',stage:button.dataset.help,view:'steps'});
  });
  root.querySelectorAll('[data-timer]').forEach(button=>button.onclick=()=>{
    if (button.dataset.timer==='reset') {
      for (const task of D.tasks) {
        task.checks.forEach((_,i)=>set('check:'+scope()+':'+task.id+':'+i,false));
        set('task-done:'+scope()+':'+task.id,false);
      }
      set('task-clock:'+scope(),null);
      showVariantBrief=false;
      set('timer:'+scope(),C.freshTimer(180*60,mode));
      set('task:'+scope(),0);
    } else {
      if (mode==='training' && button.dataset.timer==='start') enableTimerSound();
      set('timer:'+scope(),C.transition(timer(),button.dataset.timer));
    }
    render();
    const focus=root.querySelector('.pause-screen, .attempt-result') || root.querySelector('[data-timer="start"], [data-timer="pause"], [data-timer="finish"]');
    focus?.focus({preventScroll:true});
  });
  const on = (id,fn,event='onclick') => {
    const element = document.getElementById(id);
    if (element) element[event]=fn;
  };
  on('theme',()=>{
    dark=!dark;
    set('dark',dark);
    render();
    document.getElementById('theme').focus({preventScroll:true});
  });
  on('materials-open',materials);
  on('lesson-steps',showLessonSteps);
  on('done',event=>{
    set('done:'+stage,event.target.checked);
    render();
    document.getElementById('done').focus({preventScroll:true});
  },'onchange');
  on('variant',event=>{
    navigate({variant:event.target.value,preserveScroll:true});
    document.getElementById('variant').focus({preventScroll:true});
  },'onchange');
  on('training-sample',trainingSample);
  on('mock-brief',()=>{showVariantBrief=!showVariantBrief;render();document.getElementById('mock-brief').focus();});
  on('timer-sound',event=>{set('timer-sound',event.target.checked);enableTimerSound();},'onchange');
  on('task-complete',event=>{
    set('task-done:'+scope()+':'+D.tasks[practiceIndex()].id,event.target.checked);
    render();
    document.getElementById('task-complete').focus({preventScroll:true});
  },'onchange');
}
function tick() {
  const clockNode=document.getElementById('clock');
  if(!clockNode)return;
  const attempt=timer(), view=C.timerView(attempt);
  if(view.expired&&attempt.status!=='finished') {
    if(mode==='training')signalTimer();
    set('timer:'+scope(),C.transition(attempt,'finish'));
    render();
    return;
  }
  clockNode.textContent=C.format(view.left);
  document.getElementById('timer-progress').value=view.progress;
  const status=({idle:'Готов к началу',running:'Идёт отсчёт',paused:'На паузе',finished:view.expired?'Время истекло':'Завершено'})[attempt.status];
  const statusNode=document.getElementById('timer-status');
  if(statusNode.textContent!==status)statusNode.textContent=status;
  if(mode==='training') {
    const task=D.tasks[practiceIndex()], clock=taskClock();
    const left=task.minutes*60000-taskSpent(clock,task.id,Math.min(view.used,attempt.durationMs));
    document.getElementById('task-clock').textContent=left<=0?'Время вышло':C.format(left);
    if(left<=0&&attempt.status==='running'&&!clock.alerted[task.id]) {
      clock.alerted[task.id]=true;
      set('task-clock:'+scope(),clock);
      signalTimer();
    }
  }
}
document.addEventListener('keydown',event=>{
  if (mode!=='learn'||learningView!=='steps'||!['ArrowLeft','ArrowRight'].includes(event.key)
      ||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||document.querySelector('dialog[open]')
      ||event.target.closest?.('input,select,textarea,[contenteditable],a,button:not([data-step]),pre')) return;
  const next=stepIndex()+(event.key==='ArrowLeft'?-1:1);
  if (next<0||next>current().steps.length) return;
  event.preventDefault();
  goToLessonStep(next);
});
window.addEventListener('popstate',()=>{
  ({mode,stage,variant,learningView}=readRoute());
  render();
});
document.querySelector('.skip-link').addEventListener('click',event=>{
  event.preventDefault();
  document.getElementById('main').focus();
});
render();setInterval(tick,500);
})();
