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
  const practiceMode = requestedMode==='mock' || requestedMode==='training';
  const requestedStage = (!practiceMode && query.get('module')) || (legacyTask ? 'M'+legacyTask[1] : null) ||
    ((restore || practiceMode) ? get('stage','documents') : 'documents');
  const requestedVariant = query.get('variant') || (restore ? get('variant') : null);
  const teacherMode = requestedMode==='teacher';
  const requestedDatabaseRoute = (teacherMode ? null : query.get('db')) || get(DATABASE_ROUTE_PREFERENCE);
  const requestedPresentationRoute = (teacherMode ? query.get('db') : null) || get(PRESENTATION_ROUTE_PREFERENCE);
  const view = query.get('view');
  return {
    mode: requestedMode==='criteria'||modes.some(([id])=>id===requestedMode) ? requestedMode : 'overview',
    stage: D.stages.some(item=>item.id===requestedStage) ? requestedStage : 'documents',
    variant: D.variants.some(item=>item.id===requestedVariant) ? requestedVariant : D.variants[0].id,
    databaseRouteId: databaseRouteFor(requestedDatabaseRoute).id,
    presentationRouteId: databaseRouteFor(requestedPresentationRoute).id,
    practiceTask: practiceMode ? D.tasks.findIndex(task=>task.id===query.get('module')) : -1,
    learningView: ['map','brief','steps','help'].includes(view) ? view : legacyTask ? 'brief' : query.has('module') ? 'steps' : 'map'
  };
}
const initialRoute = readRoute(true);
let {mode,stage,variant,learningView,databaseRouteId,presentationRouteId} = initialRoute;
let dark = get('dark',false);
const btn=(text,attrs='',primary=false)=>`<button class="btn${primary?' primary':''}" ${attrs}>${text}</button>`;
const previewButton=(name,path,preview=path)=>btn(E(name),
  `type="button" data-material-path="${E(path)}" data-material-preview="${E(preview)}" aria-haspopup="dialog"`);
const baseVariant = D.sample;
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
    return `<ol class="ticket-list">${entry.tickets.map(([number, source, contact, request]) =>
        `<li><strong>№ ${E(number)}</strong> · ${E(source)} · ${E(contact)}<br>${E(request)}</li>`
      ).join('')}</ol>`;
  }
  const stand = entry.stand;
  if (task.id === 'M2') {
    const role = `<code>${E(stand.dbRole)}</code>`;
    const record = `<code>${E(stand.dbRecord)}</code>`;
    return `<p>${E(task.inputs)}</p>${entry===baseVariant
      ? `<p>Для проверки можно выбрать любого из пяти пользователей. Например, в стороннем клиенте под ${role} прочитайте строки и добавьте пробную запись с адресом ${record}.</p>`
      : `<p>Проверьте в стороннем клиенте операции роли ${role} на тестовой записи с адресом ${record}. Для INSERT используйте этот адрес в новой записи. Для остальных операций заранее добавьте такую запись от администратора. Назначьте все права по общей матрице.</p>`}`;
  }
  return `<p>${E(task.inputs)}</p>
    <section class="diagnostic-sample" aria-label="Учебные данные для разбора без стенда">
      <strong>Учебные данные для разбора без стенда</strong>
      <p>Смоделированные записи для тренировки анализа и оформления отчёта. На экзамене соберите подтверждения на своём рабочем месте.</p>
      <dl class="diagnostic-inputs">
        <dt>Сведения о системе</dt><dd>${E(stand.system)}</dd>
        <dt>Журнал за 48 часов</dt><dd><ul>${stand.events.map(row=>'<li>'+row.map(E).join(' · ')+'</li>').join('')}</ul></dd>
        <dt>Автозагрузка</dt><dd><ul>${stand.startup.map(row=>'<li>'+E(row)+'</li>').join('')}</ul></dd>
        <dt>Проверка безопасности</dt><dd>${E(stand.scan)}</dd>
        <dt>Нагрузка и процессы</dt><dd>${E(stand.workload)}</dd>
      </dl>
    </section>`;
}

function fullCondition(entry) {
  return D.tasks.map((task, index) =>
    `<section><h3>Задание ${index + 1}. ${E(task.title)}</h3>
      ${taskCondition(task)}
      <h4>Исходные данные</h4>${taskInputs(task, entry)}
      ${previewButton('КИМ · задание ' + (index + 1), D.kim + '#page=' + task.page)}
    </section>`
  ).join('');
}
function lessonForStage(id) {
  const lesson = D.stages.find(item => item.id===id);
  if (id!=='M2') return lesson;
  const route = D.databaseRoutes.find(item => item.id===databaseRouteId);
  if (!route.steps) return {...lesson, route};
  return {...lesson, route, steps: [...route.steps, lesson.steps.at(-1)]};
}
const progressKey = lesson => lesson.route?.steps ? lesson.id+':'+lesson.route.id : lesson.id;
const lessonDoneKey = id => id==='M2' ? 'done:M2:'+databaseRouteId : 'done:'+id;
const lessonDone = id => get(lessonDoneKey(id),false);
const current=()=>lessonForStage(stage),scope=()=>mode+':'+(mode==='mock'?variant:'sample'),timer=()=>C.restoreTimer(JSON.stringify(get('timer:'+scope())),180*60,mode);
const header = (title, text) => `<div class="route-heading"><h1 tabindex="-1">${E(title)}</h1>${text?'<p>'+E(text)+'</p>':''}</div>`;
function iconButton(title, path, attributes) {
  return `<button type="button" class="btn" data-icon-button aria-label="${E(title)}" ${attributes}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="${path}"/></svg>
    <span class="icon-tooltip" aria-hidden="true">${E(title)}</span>
  </button>`;
}
function navigationButton(id, title) {
  const active = mode===id || (mode==='criteria' && id==='overview');
  return iconButton(title,modeIcons[id],`data-mode="${id}" ${active?'aria-current="page"':''}`);
}
function overview() {
  return `<section class="hero study-intro">
    <div class="banner-copy">
      <h1>Демонстрационный экзамен</h1>
      <ul class="banner-facts" aria-label="Параметры экзамена">
        <li>Профильный уровень</li><li><span>Рекомендуемое время</span> <time datetime="PT4H">4 часа</time></li><li>До 100 баллов</li>
      </ul>
      <p class="lead">Разберите обращения пользователей, разверните сервер баз данных и проведите диагностику компьютера.</p>
      <div class="button-row">${btn('Открыть маршрут обучения →','data-mode="learn"',true)}${materialsButton()}</div>
    </div>
    <div class="banner-mascot"><img src="mascot-exam.png" width="680" height="680" alt="Носорог-студент готовится к демоэкзамену"></div>
  </section><section class="route-panel" id="variative" aria-labelledby="variative-title"><h2 id="variative-title">Вариативная часть</h2><p>На профильном уровне КИМ включает инвариантную и вариативную части. Вариативное задание определяет образовательная организация, за него можно получить до 25 баллов. На сайте разобраны три задания инвариантной части.</p></section>${criteria()}`;
}
const shortStages = ['Старт', 'Заявки', 'Сервер', 'Диагностика'];
function stageNavigation(items, active, practice = false) {
  const completed = items.filter(item=>practice ? mode==='training' && practiceDone(item.id) : lessonDone(item.id));
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
  return get('step:'+progressKey(lessonForStage(id)))!==null || lessonDone(id) ? 'steps' : 'brief';
}
function stageResult(item) {
  return `<strong>Что сохранить</strong><ul class="result-files">${stageOutputs[item.id].map(([name,note])=>
    `<li>${name.includes('.')?`<code>${E(name)}</code>`:E(name)} · ${E(note)}</li>`).join('')}</ul>`;
}
function databaseRouteOptions(selected) {
  return D.databaseRoutes.map(route=>`<option value="${route.id}" ${route.id===selected?'selected':''}>${E(route.title)}</option>`).join('');
}
function databaseRoutePicker() {
  return `<label class="lesson-database-picker">СУБД и инструмент
    <select data-database-route>
      ${databaseRouteOptions(databaseRouteId)}
    </select>
  </label>`;
}
function learningMap() {
  const opened = get('opened-stage','documents');
  const completedRoutes = D.databaseRoutes.filter(route=>get('done:M2:'+route.id,false));
  return `<section class="map-panel">
    <div class="map-intro"><h1 tabindex="-1">Маршрут обучения</h1><p>Универсальный · подготовка и три задания инвариантной части.</p></div>
    <section class="map-stack" aria-labelledby="map-stack-title">
      <strong id="map-stack-title">Задание по СУБД</strong>
      ${databaseRoutePicker()}
      ${completedRoutes.length ? `<p>Пройденные маршруты: ${completedRoutes.map(route=>E(route.title)).join(', ')}.</p>`
        : get('done:M2',false) ? '<p>Ранее задание отмечено выполненным. Выберите пройденный стек и отметьте его в конце маршрута.</p>' : ''}
    </section>
    <div class="learning-map">
      <ol class="map-nodes" aria-label="Этапы обучения">${D.stages.map((item,index)=>{
        const done = lessonDone(item.id);
        const current = !done && item.id===opened;
        const status = done?' · Завершён':current?' · Текущий этап':'';
        return `<li><button type="button" class="map-node" data-map-stage="${item.id}" aria-pressed="${item.id===stage}"
          ${current?'aria-current="step"':''} ${done?'data-completed':''}>
          <span class="map-circle" aria-hidden="true">${done?'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>':index}</span>
          <span><strong>${E(item.title)}</strong><small>${E(stageTitle(item)+status)}</small></span>
        </button></li>`;
      }).join('')}</ol>
      <article class="map-detail" aria-label="Выбранный этап">
        ${D.stages.map(stageItem=>{
          const item = lessonForStage(stageItem.id);
          const saved = get('step:'+progressKey(item));
          const task = D.tasks.find(entry=>entry.id===item.id);
          const action = lessonDone(item.id) ? 'Открыть этап'
            : saved===item.steps.length ? 'Что сохранить'
            : saved!==null ? 'Продолжить с шага '+(saved+1)
            : task ? 'Прочитать условие' : 'Открыть подготовку';
          return `<div class="map-stage-preview" ${item.id===stage?'':'inert'}>
            <div class="map-stage-content">
              <p class="section-code">${E(stageTitle(item))}</p>
              <h2>${E(item.title)}</h2>
              ${task ? `<ol class="map-stage-tasks">${task.summary.map(point => `<li>${E(point)}</li>`).join('')}</ol>` : `<p>${E(preparation)}</p>`}
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
  const points = lesson.steps.flatMap(({example}) => example.points);
  const screenshots = screenshotsForRoute(lesson.route?.id,
    [...new Set(points.flatMap(point => [...(point.screenshots ?? []), ...(point.result?.screenshots ?? [])]))]);
  const resultFiles = new Map(points.flatMap(point => point.result?.files ?? []).map(file => [file[1], file]));
  return `<div class="lesson-brief">
    ${task ? '<h3>Условие задания</h3>' + taskCondition(task) : '<p>'+E(preparation)+'</p>'}
    ${lessonMaterials(lesson.id, screenshots, null, [...resultFiles.values()])}
    ${stageResult(lesson)}
    ${btn(get('step:'+progressKey(lesson))===null?'Перейти к шагам и примерам →':stepIndex(lesson)===lesson.steps.length?'Что сохранить →':'Продолжить с шага '+(stepIndex(lesson)+1)+' →','data-lesson-view="steps"',true)}
  </div>`;
}

function lessonHelp(lesson) {
  return `<div class="lesson-help">
    ${lesson.help.map(([heading, items])=>`<section>
      <h3>${E(heading)}</h3>
      <ul>${items.map(item=>`<li>${E(item)}</li>`).join('')}</ul>
    </section>`).join('')}
    ${stageResult(lesson)}
  </div>`;
}

function workedActions(actions) {
  return `<ol class="worked-actions" role="list">
    ${actions.map((action, index)=>`<li>
      <span class="worked-action-number" aria-hidden="true">${index + 1}</span>
      <span>${E(action)}</span>
    </li>`).join('')}
  </ol>`;
}

async function copyLessonCode(event) {
  const block = event.currentTarget.closest('.worked-code');
  const code = block.querySelector('code');
  const status = block.querySelector('[role="status"]');
  status.textContent = '';
  try {
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = 'Код скопирован';
  } catch {
    if (!block.isConnected) return;
    const range = document.createRange();
    range.selectNodeContents(code);
    code.parentElement.focus({preventScroll: true});
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = 'Код выделен. Скопируйте его через меню браузера или сочетанием клавиш.';
  }
}

function explain(step, part, route) {
  const example = step.example;
  const point = example.points[part];
  const lastPart = part === example.points.length - 1;
  return `<section class="lesson-explanation">
    <section class="worked-example" aria-labelledby="lesson-card-title">
      <p class="worked-position" id="lesson-card-position">Часть ${part+1} из ${example.points.length}</p>
      <h4 id="lesson-card-title" tabindex="-1" aria-describedby="lesson-card-position">${E(point.title)}</h4>
      ${part===0?`<p class="worked-context"><strong>${E(example.title)}</strong><br>${E(example.input)}</p>`:''}
      ${point.text?`<p>${E(point.text)}</p>`:''}
      ${point.actions ? workedActions(point.actions) : ''}
      ${point.groups?.map(([title, actions])=>`<div class="worked-action-group">
        <h5>${E(title)}</h5>
        ${workedActions(actions)}
      </div>`).join('') ?? ''}
      ${point.code?`<div class="worked-code">
        <div class="worked-code-actions">
          <span role="status"></span>
          ${btn('Копировать код','type="button" id="copy-lesson-code"')}
        </div>
        <pre tabindex="0"><code>${E(point.code)}</code></pre>
      </div>`:''}
      ${point.table?materialTable(point.table.columns, point.table.rows):''}
      ${lessonScreenshots(route, point.screenshots)}
      ${point.result ? `<section class="worked-result">
        <h5>${E(point.result.title || 'Что должно получиться')}</h5>
        ${point.result.text ? `<p>${E(point.result.text)}</p>` : ''}
        ${point.result.table ? materialTable(point.result.table.columns, point.result.table.rows) : ''}
        ${point.result.output ? `<pre tabindex="0"><code>${E(point.result.output)}</code></pre>` : ''}
        ${lessonScreenshots(route, point.result.screenshots)}
        ${point.result.files?.map(([label, path, preview]) => previewButton(label, path, preview)).join('') ?? ''}
      </section>` : ''}
      ${lastPart?`<p class="worked-result"><strong>Итог шага.</strong> ${E(example.result)}</p>`:''}
    </section>
  </section>`;
}

const lessonResultTitle = 'Что сохранить';
const stepIndex = (lesson=current()) => Math.max(0,Math.min(lesson.steps.length,get('step:'+progressKey(lesson),0)));
function lessonCards(lesson = current()) {
  const cards = lesson.steps.flatMap(({example}, step) => example.points.map((_, part) => ({step, part})));
  cards.push({step: lesson.steps.length, part: 0});
  return cards;
}
function lessonCardIndex(lesson, cards) {
  const step = stepIndex(lesson);
  const part = get('lesson-part:'+progressKey(lesson),0);
  const saved = cards.findIndex(card => card.step===step && card.part===part);
  return saved>=0 ? saved : cards.findIndex(card => card.step===step);
}
function stepArrow(index,previous,label) {
  const path=previous?'M20 12H4m7-7-7 7 7 7':'M4 12h16m-7-7 7 7-7 7';
  return btn(`<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`,
    `data-step="${index}" aria-label="${label}" title="${label}" aria-keyshortcuts="${previous?'ArrowLeft':'ArrowRight'}"`,!previous);
}
function goToLessonCard(index) {
  const lesson = current();
  const {step, part} = lessonCards(lesson)[index];
  const key = progressKey(lesson);
  set('step:'+key,step);
  set('lesson-part:'+key,part);
  render();
  const heading = index===0 ? 'lesson-step-title' : 'lesson-card-title';
  (document.getElementById(heading) || document.getElementById('lesson-step-title')).focus();
}
function showLessonSteps() {
  const lesson=current(), index=stepIndex(lesson);
  const titles=[...lesson.steps.map(step=>step.title),lessonResultTitle];
  const dialog=modal('Шаги этапа · '+lesson.title,`<ol class="lesson-step-list">${titles.map((title,i)=>
    `<li>${btn(E(title),`data-jump-step="${i}" ${i===index?'aria-current="step"':''}`)}</li>`).join('')}</ol>`);
  dialog.querySelectorAll('[data-jump-step]').forEach(button=>button.onclick=()=>{
    dialog.close();
    const step = Number(button.dataset.jumpStep);
    goToLessonCard(lessonCards(lesson).findIndex(card => card.step===step));
  });
  dialog.querySelector('[aria-current="step"]').focus();
}
function learn() {
  if (learningView==='map') return learningMap();
  const lesson=current(), cards=lessonCards(lesson), index=lessonCardIndex(lesson,cards);
  const {step: stepNumber, part} = cards[index];
  const step = lesson.steps[stepNumber];
  const point = step?.example.points[part];
  const done=lessonDone(stage), next=D.stages[D.stages.findIndex(item=>item.id===lesson.id)+1];
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
        ${[['brief','Условие и файлы'],['steps','Шаги и примеры'],['help','Справка']].map(([id,title])=>
          btn(title,`data-lesson-view="${id}" ${id===learningView?'aria-current="page"':''}`)).join('')}
      </nav>
      ${learningView==='brief' ? lessonBrief(lesson) : learningView==='help' ? lessonHelp(lesson) : `
        <article class="study-step" aria-labelledby="lesson-step-title">
          <header class="step-heading">
            <h3 id="lesson-step-title" tabindex="-1"><span class="lesson-step-number" aria-label="Шаг ${stepNumber+1} из ${lesson.steps.length+1}">${stepNumber+1}</span><span>${E(step?.title||lessonResultTitle)}</span></h3>
            ${btn('<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>','id="lesson-steps" aria-label="Все шаги" title="Все шаги" aria-haspopup="dialog"')}
          </header>
          ${lessonMaterials(lesson.id, [], point?.materials ?? [])}
          ${step?explain(step,part,lesson.route?.id):`<div class="lesson-result">${stageResult(lesson)}</div>`}
          <div class="study-controls${step?'':' lesson-result-controls'}">
            ${index>0?stepArrow(index-1,true,'Предыдущая карточка'):''}
            ${step?stepArrow(index+1,false,index+1===cards.length-1?lessonResultTitle:'Следующая карточка'):`
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
function selectPracticeTask(index) {
  const previous = practiceIndex();
  if (mode==='training' && previous!==index) {
    const clock = taskClock();
    const attempt = timer();
    const used = Math.min(C.timerView(attempt).used,attempt.durationMs);
    const taskId = D.tasks[previous].id;
    clock.spent[taskId] = taskSpent(clock,taskId,used);
    clock.anchor = used;
    set('task-clock:'+scope(),clock);
  }
  showVariantData = false;
  set('task:'+scope(),index);
}
let showVariantData = false;
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
function trainingSample() {
  modal('Условие и исходные данные',`<div class="practice-condition"><p>«Универсальный» — учебный вариант по образцу КИМ.</p>
    ${fullCondition(baseVariant)}</div>`);
}
function variantData(entry) {
  return `<article class="training-task">
    <header class="mock-brief-heading">
      <div><h2>Данные варианта</h2><p class="task-meta">${E(entry.title)}</p></div>
    </header>
    <div class="practice-condition variant-data">
      ${D.tasks.map((task, index)=>`<section>
        <h3>Задание ${index + 1}. ${E(task.title)}</h3>
        ${btn('Открыть задание '+(index+1),`data-task="${index}"`)}
        ${taskInputs(task, entry)}
      </section>`).join('')}
    </div>
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
      ${mock?'':'<h3>Исходные данные</h3>' + (task.id==='M1'?ticketsDownload(entry):'') + taskInputs(task, entry)}</section>
    <div class="task-support">
      ${previewButton('КИМ · PDF',D.kim+'#page='+task.page)}
      ${mock||locked?'':btn('Подсказка к заданию',`data-help="${task.id}"`)}
    </div>
    <section class="self-check training-checklist" aria-labelledby="training-check-title">
      <header><h3 id="training-check-title">Самопроверка</h3><span id="training-check-count" aria-live="polite">${checked.filter(Boolean).length} из ${checked.length}</span></header>
      ${task.checks.map((text,i)=>`<label><input type="checkbox" data-check="${task.id}:${i}" ${locked?'disabled':''} ${checked[i]?'checked':''}>${E(text)}</label>`).join('')}
      ${mock?'<p class="small">Отметки служат для самопроверки.</p>':`<label class="task-complete"><input type="checkbox" id="task-complete" ${locked?'disabled':''} ${practiceDone(task.id)?'checked':''}> Задание выполнено</label>`}
    </section>
  </article>`;
  return `<section class="training-page practice-page training-compact ${mock?'mock-exam':''}">
    <header class="workspace-intro">
      <div><h1>${mock?'Пробный экзамен':'Тренировка'}</h1><p>${E(entry.title)} · Инвариантная часть · 3 задания · 180 минут · 75 баллов</p></div>
      ${!mock&&status!=='paused'?btn('Условие и исходные данные','id="training-sample" aria-haspopup="dialog"'):''}
    </header>
    <div class="attempt-layout">
      ${timerBox(attempt,index,mock)}
      <div class="attempt-content">
        ${mock?`<div class="mock-variant-bar">
          <div class="training-source"><label>Вариант<select id="variant" ${status==='running'?'disabled':''}>${D.variants.map(item=>`<option value="${item.id}" ${item.id===variant?'selected':''}>${E(item.title)}</option>`).join('')}</select></label></div>
          <div class="mock-variant-actions">${btn('Данные варианта',`id="mock-data" aria-pressed="${showVariantData}"`)}
            ${btn('Условие задания',`id="mock-condition" aria-pressed="${!showVariantData}"`)}
            ${ticketsDownload(entry)}</div>
        </div>`:''}
        ${status==='paused'?'<section class="pause-screen" tabindex="-1" aria-labelledby="pause-title"><h2 id="pause-title">Тренировка на паузе</h2><p>Отсчёт остановлен. Условия и отметки снова появятся после продолжения.</p></section>':
          status==='finished'?'<section class="attempt-result" tabindex="-1" role="status"><h2>Попытка завершена</h2><p>Отметки сохранены. Можно начать новую попытку.</p></section>':''}
        <div class="training-workspace" ${status==='paused'?'hidden':''}>
          ${stageNavigation(D.tasks,showVariantData&&mock?null:task.id,true)}
          ${mock&&showVariantData?variantData(entry):taskCard}
        </div>
      </div>
    </div>
  </section>`;
}

function examples() {
  return `<section class="training-page example-page">
    ${header('Примеры выполнения','Универсальный · разбор инвариантной части')}
    <div class="example-grid">
      <article class="route-panel">
        <h2>Комплект для сверки</h2>
        <p>Реестр, ответы и карты даны в форматах сдачи. Отчёты показывают, как описать настройку и диагностику. Снимки экрана, EVTX и подтверждение антивирусной проверки соберите на своём стенде.</p>
        <div class="example-actions"><a class="btn primary" href="examples/universal-solution.zip" download>Скачать примеры · ZIP</a>
        ${btn('Открыть маршрут →','data-mode="learn"')}</div>
      </article>
      <article class="route-panel">
        <h2>Внутри комплекта</h2>
        <p>Выберите материал для просмотра. Файлы для работы входят в ZIP.</p>
        <ol>${D.solutions.map(solution=>`<li><strong>${E(solution.title)}</strong><ul>${solution.files.map(([name,preview,path=''])=>`<li>${previewButton(name,path,preview)}</li>`).join('')}</ul></li>`).join('')}</ol>
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
    ${previewButton('Открыть КИМ · PDF',D.kim)}
  </section>`;
}

function teacher() {
  return `<section class="training-page">
    ${header('Преподавателю','Разбор учебного варианта «Универсальный» для занятия.')}
    <article class="route-panel">
      <h2>Порядок разбора</h2>
      <ol>
        <li>Раздайте исходные заявки. Сравните классификацию, ответы и технологические карты после самостоятельной работы.</li>
        <li>Разберите подключение под учебным пользователем, проверку операций и выгрузку таблицы.</li>
        <li>Сопоставьте журнал событий, сканирование и нагрузку с выводами отчёта. Попросите студентов указать доказательство для каждой рекомендации.</li>
      </ol>
      <div class="lesson-database-picker teacher-stack-picker">
        <label for="presentation-stack">Стек для презентации</label>
        <select id="presentation-stack">${databaseRouteOptions(presentationRouteId)}</select>
      </div>
      <div class="button-row">
        <a class="btn primary" href="presentation.html?stack=${presentationRouteId}">Открыть презентацию</a>
        ${btn('Примеры выполнения','data-mode="examples"')}${materialsButton()}
      </div>
    </article>
  </section>`;
}

function modal(title,html='',extra=''){const d=document.createElement('dialog');d.className='course-dialog '+extra;d.setAttribute('aria-label',title);d.innerHTML=`<header class="modal-head"><h2>${E(title)}</h2>${btn('Закрыть','data-close')}</header><div class="modal-body">${html}</div>`;document.body.append(d);d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('close',()=>d.remove(),{once:true});bindMaterialPreviews(d);d.showModal();return d;}

function materialsButton() {
  return btn('Материалы задания','type="button" data-all-materials aria-haspopup="dialog"');
}

function stageMaterials(stageId) {
  const task = D.tasks.find(item=>item.id===stageId);
  const page = task?.page ?? (stageId==='documents' ? 31 : null);
  const files = D.originals.filter(file=>!task || file.path===D.kim)
    .map(file=>file.path===D.kim && page ? {...file,path:file.path+'#page='+page} : file);
  if (!task || task.id==='M1') files.push({
    id:'inputs', name:'Исходные заявки · CSV', path:'examples/tickets-input.csv', html:taskInputs(D.tasks[0],baseVariant)
  });
  if (task && task.id!=='M1') files.push({id:'inputs',name:'Исходные данные',html:taskInputs(task,baseVariant)});
  return files;
}

function lessonMaterials(stageId, screenshots = [], materialIds = null, resultFiles = []) {
  if (materialIds?.length === 0 && !screenshots.length && !resultFiles.length) return '';
  const files = stageMaterials(stageId).filter(file=>materialIds===null || materialIds.includes(file.id));
  if (!files.length && !screenshots.length && !resultFiles.length) return '';
  return `<section class="lesson-files" data-lesson-materials="${E(stageId)}" aria-labelledby="lesson-materials">
    <h4 id="lesson-materials">Материалы задания</h4>
    <ul>
      ${files.map(file=>`<li>
        <a href="${E(file.path || '#lesson-materials')}" data-lesson-material="${E(file.id)}" aria-haspopup="dialog">${E(file.name)}</a>
      </li>`).join('')}
      ${resultFiles.map(([label, path, preview = path])=>`<li>
        <a href="${E(path)}" data-material-path="${E(path)}" data-material-preview="${E(preview)}" aria-haspopup="dialog">${E(label)}</a>
      </li>`).join('')}
      ${screenshots.map(key=>{
        const shot = D.screenshots[key];
        return `<li><a href="${E(shot.path)}" data-lesson-screenshot="${E(key)}" aria-haspopup="dialog">${E(shot.title)} · скриншот</a></li>`;
      }).join('')}
    </ul>
  </section>`;
}

function screenshotsForRoute(route, keys = []) {
  return keys.filter(key=>screenshotMatchesRoute(D.screenshots[key],route));
}

function lessonScreenshots(route, screenshots) {
  const keys = screenshotsForRoute(route, screenshots);
  if (!keys.length) return '';
  return `<div class="lesson-screenshots">${keys.map(key => {
    const shot = D.screenshots[key];
    return `<figure>
      <a href="${E(shot.path)}" data-lesson-screenshot="${E(key)}" aria-haspopup="dialog"
         aria-label="Увеличить снимок · ${E(shot.title)}">
        <img src="${E(shot.path)}" alt="${E(shot.title)}" loading="lazy">
      </a>
      <figcaption><strong>${E(shot.title)}</strong> ${E(shot.hint)}
        ${shot.source ? `<a href="${E(shot.source)}" target="_blank" rel="noopener">${E(shot.credit)}</a>` : ''}
      </figcaption>
    </figure>`;
  }).join('')}</div>`;
}

function previewCsv(value) {
  const rows = [];
  let row = [];
  const csv = value.replace(/^\uFEFF/,'');
  const lines = csv.endsWith('\n') ? csv : csv+'\n';
  for (const [,quoted,plain,separator] of lines.matchAll(/(?:"((?:[^"]|"")*)"|([^,\r\n]*))(,|\r?\n)/g)) {
    row.push(quoted===undefined ? plain : quoted.replaceAll('""','"'));
    if (separator===',') continue;
    rows.push(row);
    row = [];
  }
  const [columns,...records] = rows;
  return materialTable(columns, records);
}

function materialTable(columns, records) {
  return `<div class="material-table" tabindex="0" role="region" aria-label="Таблица">
    <table><thead><tr>${columns.map(column=>`<th scope="col">${E(column)}</th>`).join('')}</tr></thead>
      <tbody>${records.map(record=>`<tr>${record.map(cell=>`<td>${E(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`;
}

function materialViewer(title, files) {
  const options = files.length>1 ? `<div class="material-options" role="group" aria-label="Выбрать материал">
    ${files.map((file,index)=>btn(E(file.name),`type="button" data-material-index="${index}" aria-pressed="false"`)).join('')}
  </div>` : '';
  const dialog = modal(title,`${options}<div class="material-preview"></div>`,'material-viewer');
  const buttons = [...dialog.querySelectorAll('[data-material-index]')];
  const preview = dialog.querySelector('.material-preview');
  function show(index) {
    const file = files[index];
    buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(index===i)));
    const download = file.path ? `<a class="btn" href="${E(file.path.split('#')[0])}" download>Скачать файл</a>` : '';
    preview.innerHTML = `<div class="material-preview-heading"><h3>${E(file.name)}</h3>${download}</div><div class="material-preview-body"></div>`;
    const body = preview.querySelector('.material-preview-body');
    if (file.html) {
      body.innerHTML = file.html;
      return;
    }
    const source = file.preview || file.path;
    const exampleDocument = !file.path && source.endsWith('.html');
    if (!exampleDocument && /\.(pdf|html)(?:#|$)/i.test(source)) {
      body.innerHTML = `<iframe class="material-frame" title="${E(file.name)}" src="${E(source)}"></iframe>`;
      return;
    }
    const text = document.createElement('pre');
    text.className = 'material-text';
    text.tabIndex = 0;
    text.textContent = 'Загрузка материала…';
    body.append(text);
    fetch(source).then(response=>{
      if (!response.ok) throw new Error('Material unavailable');
      return response.text();
    }).then(value=>{
      if (exampleDocument) {
        const example = new DOMParser().parseFromString(value,'text/html').querySelector('.solution-document');
        if (!example) throw new Error('Example unavailable');
        example.classList.remove('route-panel');
        const documentUrl = new URL(source,location.href);
        example.querySelectorAll('a[href]').forEach(link=>{
          const url = new URL(link.getAttribute('href'),documentUrl);
          if (url.protocol!=='http:' && url.protocol!=='https:') {
            link.replaceWith(link.textContent);
            return;
          }
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener';
        });
        body.replaceChildren(example);
      } else if (source.endsWith('.csv')) {
        body.innerHTML = previewCsv(value);
      } else {
        text.textContent = value;
      }
    }).catch(()=>{
      text.textContent = file.path
        ? 'Не удалось показать содержимое. Воспользуйтесь кнопкой «Скачать файл».'
        : 'Не удалось открыть предпросмотр. Материал доступен в ZIP на странице примеров.';
    });
  }
  buttons.forEach((button,index)=>button.onclick=()=>show(index));
  show(0);
}

function bindMaterialPreviews(container) {
  container.querySelectorAll('[data-all-materials]').forEach(button=>button.onclick=()=>materialViewer('Материалы задания',stageMaterials()));
  container.querySelectorAll('[data-lesson-material]').forEach(link=>link.onclick=event=>{
    event.preventDefault();
    const {lessonMaterials:stageId} = link.closest('[data-lesson-materials]').dataset;
    const file = stageMaterials(stageId).find(item=>item.id===link.dataset.lessonMaterial);
    materialViewer('Просмотр материала',[file]);
  });
  container.querySelectorAll('[data-material-path]').forEach(button=>button.onclick=event=>{
    event.preventDefault();
    const {materialPath:path,materialPreview:preview} = button.dataset;
    const name = button.textContent;
    materialViewer('Просмотр материала',[{name,path,preview}]);
  });
}

function tour() {
  const message = 'В обучении есть маршрут по трём заданиям. В тренировке можно поставить таймер на паузу. В пробном экзамене время идёт непрерывно. Готовые файлы для сверки собраны в «Примерах».';
  modal('Гид по курсу','<p>'+E(message)+'</p>');
}

function navigate(next) {
  const previous = location.href;
  if(next.mode) mode=next.mode;
  if(next.stage) stage=next.stage;
  if(next.variant) variant=next.variant;
  if(next.view) learningView=next.view;
  if(next.databaseRoute) {
    databaseRouteId=next.databaseRoute;
    set(DATABASE_ROUTE_PREFERENCE,databaseRouteId);
  }
  if(next.presentationRoute) {
    presentationRouteId=next.presentationRoute;
    set(PRESENTATION_ROUTE_PREFERENCE,presentationRouteId);
  }
  if(Number.isInteger(next.practiceTask)) selectPracticeTask(next.practiceTask);
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
  const activeModule = mode==='mock'||mode==='training' ? D.tasks[practiceIndex()].id : stage;
  const url = new URLSearchParams({mode,module:activeModule,variant});
  if (mode==='teacher') url.set('db',presentationRouteId);
  if (mode==='learn' && stage==='M2') url.set('db',databaseRouteId);
  if (mode==='learn') {
    url.set('view',learningView);
    if (learningView!=='map') set('opened-stage',stage);
    if (learningView==='steps') {
      const key = 'step:'+progressKey(current());
      if (get(key)===null) set(key,0);
    }
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
    <nav class="site-nav" aria-label="Основные разделы">${modes.map(([id,title])=>navigationButton(id,title)).join('')}</nav>
    <main id="main" tabindex="-1">
      ${storageOK?'':'<p class="notice">Хранилище браузера недоступно. Отметки и прогресс сохраняются до закрытия страницы.</p>'}
      ${views[mode]()}
    </main>
  </div>`;
  bind();tick();
}
function bind() {
  bindMaterialPreviews(root);
  root.querySelectorAll('[data-lesson-screenshot]').forEach(link=>link.onclick=event=>{
    event.preventDefault();
    const shot = D.screenshots[link.dataset.lessonScreenshot];
    modal(shot.title,`<figure class="lesson-screenshot-full">
      <figcaption>${E(shot.hint)} ${shot.source ? `<a href="${E(shot.source)}" target="_blank" rel="noopener">${E(shot.credit)}</a>` : ''}</figcaption>
      <div class="lesson-screenshot-scroll" tabindex="0" role="region" aria-label="Скриншот в исходном размере">
        <img src="${E(shot.path)}" alt="${E(shot.title)}">
      </div>
    </figure>`, 'lesson-screenshot-dialog');
  });
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
  const databasePicker = root.querySelector('[data-database-route]');
  if (databasePicker) databasePicker.onchange=()=>{
    navigate({databaseRoute:databasePicker.value,preserveScroll:true});
    root.querySelector('[data-database-route]').focus({preventScroll:true});
  };
  root.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>goToLessonCard(Number(button.dataset.step)));
  root.querySelectorAll('[data-task]').forEach(button=>button.onclick=()=>{
    const index = Number(button.dataset.task);
    navigate({practiceTask:index,preserveScroll:true});
    root.querySelector(`.stage-nav [data-task="${index}"]`)?.focus({preventScroll:true});
  });
  root.querySelector('[data-guide]').onclick=tour;
  root.querySelectorAll('[data-check]').forEach(input=>input.onchange=()=>{
    if (['paused','finished'].includes(timer().status)) { render(); return; }
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
      showVariantData=false;
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
  on('lesson-steps',showLessonSteps);
  on('copy-lesson-code',copyLessonCode);
  on('presentation-stack',event=>{
    navigate({presentationRoute:event.target.value,preserveScroll:true});
    document.getElementById('presentation-stack').focus({preventScroll:true});
  },'onchange');
  on('done',event=>{
    set(lessonDoneKey(stage),event.target.checked);
    render();
    document.getElementById('done').focus({preventScroll:true});
  },'onchange');
  on('variant',event=>{
    if (timer().status==='running') { render(); return; }
    navigate({variant:event.target.value,preserveScroll:true});
    document.getElementById('variant').focus({preventScroll:true});
  },'onchange');
  on('training-sample',trainingSample);
  for (const [id, show] of [['mock-data', true], ['mock-condition', false]]) on(id,()=>{
    showVariantData = show;
    render();
    document.getElementById(id).focus();
  });
  on('timer-sound',event=>{set('timer-sound',event.target.checked);enableTimerSound();},'onchange');
  on('task-complete',event=>{
    if (['paused','finished'].includes(timer().status)) { render(); return; }
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
      ||event.target.closest?.('input,select,textarea,[contenteditable],a,button:not([data-step]),pre,.material-table')) return;
  const lesson=current(), cards=lessonCards(lesson);
  const next=lessonCardIndex(lesson,cards)+(event.key==='ArrowLeft'?-1:1);
  if (next<0||next>=cards.length) return;
  event.preventDefault();
  goToLessonCard(next);
});
window.addEventListener('popstate',()=>{
  const route = readRoute();
  ({mode,stage,variant,learningView,databaseRouteId,presentationRouteId}=route);
  if(route.practiceTask>=0) selectPracticeTask(route.practiceTask);
  render();
});
window.addEventListener('storage',event=>{
  if (event.storageArea!==localStorage || !['training','mock'].includes(mode)) return;
  const key=event.key, attempt=scope();
  if (key===null || key===prefix+'timer:'+attempt || key===prefix+'task:'+attempt ||
      key.startsWith(prefix+'check:'+attempt+':') || key.startsWith(prefix+'task-done:'+attempt+':')) render();
});
document.querySelector('.skip-link').addEventListener('click',event=>{
  event.preventDefault();
  document.getElementById('main').focus();
});
if(initialRoute.practiceTask>=0) selectPracticeTask(initialRoute.practiceTask);
render();setInterval(tick,500);
})();
