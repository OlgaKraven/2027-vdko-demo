(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  let savedRoute;
  try { savedRoute = JSON.parse(localStorage.getItem(PRESENTATION_ROUTE_KEY)); }
  catch { /* The default route is available without local storage. */ }
  const route = databaseRouteFor(params.get('stack') ?? savedRoute);
  const slides = demoSlides(route);
  const audienceMode = params.has('audience');
  const presenter = audienceMode ? window.opener : null;
  const targetOrigin = location.protocol === 'file:' ? '*' : location.origin;
  const messageOrigin = location.protocol === 'file:' ? 'null' : location.origin;
  const byId = id => document.getElementById(id);
  const slideArea = byId('show-slide');
  const canvas = slideArea.parentElement;
  const laser = byId('show-laser');
  const E = ExamCore.escape;
  let index = 0;
  let dark = false;
  let answerVisible = false;
  let pointerEnabled = false;
  let audience = null;
  let audienceMonitor;

  if (!audienceMode) {
    try { dark = localStorage.getItem('2027-vdko-demo:v1:dark') === 'true'; }
    catch { /* The presentation theme still works for the current session. */ }
  }

  function renderTable(rows) {
    const [head, ...body] = rows;
    return `<table><thead><tr>${head.map(value => `<th scope="col">${E(value)}</th>`).join('')}</tr></thead>
      <tbody>${body.map(row => `<tr>${row.map(value => `<td>${E(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function renderSlide() {
    const slide = slides[index];
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    canvas.dataset.type = slide.type || 'content';
    const titleSlide = slide.type === 'title';
    slideArea.innerHTML = `
      <header class="show-slide-brand">
        <span class="show-emblem" aria-label="Демонстрационный экзамен">ДЭ</span>
        <span>${E(slide.module || '09.01.05 · ДЭ 2027')}</span>
      </header>
      <div class="show-slide-body">
        <h1 id="show-slide-title" tabindex="-1">${E(slide.title)}</h1>
        ${slide.screenshot ? `<figure class="show-db-screen">
          <img src="${E(slide.screenshot.path)}" alt="${E(slide.screenshot.title)}">
          <figcaption>${E(slide.screenshot.hint)} ${slide.screenshot.source ? `<a href="${E(slide.screenshot.source)}" target="_blank" rel="noopener">${E(slide.screenshot.credit)}</a>` : ''}</figcaption>
        </figure>` : ''}
        ${slide.text ? `<p>${E(slide.text)}</p>` : ''}
        ${slide.items ? `<ul>${slide.items.map(item => `<li>${E(item)}</li>`).join('')}</ul>` : ''}
        ${slide.table ? renderTable(slide.table) : ''}
        ${slide.code ? `<pre class="show-code" tabindex="0"><code>${E(slide.code)}</code></pre>` : ''}
        ${slide.write ? `<div class="show-write"><strong>Запишите</strong><p>${E(slide.write)}</p></div>` : ''}
        ${answerVisible && slide.answer ? `<div class="show-write show-revealed" role="status"><strong>Ответ</strong><p>${E(slide.answer)}</p></div>` : ''}
      </div>
      ${titleSlide ? '<img class="show-mascot" src="mascot-scientist.png" alt="">' : ''}
      <span class="show-slide-number" aria-label="Слайд ${index + 1}">${index + 1}</span>`;
    if (audienceMode) return;
    byId('show-script').textContent = slide.notes;
    byId('show-answer-notes').textContent = slide.answer ? 'Ответ для преподавателя. ' + slide.answer : '';
    byId('show-answer-notes').hidden = !slide.answer;
    byId('show-answer').hidden = !slide.answer;
    byId('show-answer').textContent = answerVisible ? 'Скрыть ответ' : 'Показать ответ';
    byId('show-answer').setAttribute('aria-pressed', String(answerVisible));
    byId('show-progress').max = slides.length;
    byId('show-progress').value = index + 1;
    byId('show-counter').textContent = (index + 1) + ' / ' + slides.length;
    byId('show-prev').disabled = index === 0;
    byId('show-next').disabled = index === slides.length - 1;
    byId('show-theme').textContent = dark ? 'Светлая тема' : 'Тёмная тема';
    byId('show-theme').setAttribute('aria-pressed', String(dark));
  }

  function sendToAudience(message) {
    if (!audience || audience.closed) return;
    audience.postMessage(message, targetOrigin);
  }

  function showPointer(position) {
    laser.hidden = !position;
    if (!position) return;
    laser.style.left = position.x * 100 + '%';
    laser.style.top = position.y * 100 + '%';
  }

  function setPointer(position) {
    showPointer(position);
    sendToAudience({type: 'vdko-pointer', position});
  }

  function syncSlide() {
    sendToAudience({type: 'vdko-slide', index, dark, answerVisible});
  }

  function navigateSlide(next, focusTitle = false) {
    if (!Number.isInteger(next) || next < 0 || next >= slides.length || next === index) return;
    index = next;
    answerVisible = false;
    renderSlide();
    setPointer(null);
    syncSlide();
    if (focusTitle) byId('show-slide-title').focus({preventScroll: true});
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await canvas.requestFullscreen();
    } catch {
      if (!audienceMode) byId('show-status').textContent = 'Браузер не включил полноэкранный режим.';
    }
  }

  function updatePresentationMode() {
    const showing = Boolean(audience && !audience.closed);
    if (showing !== document.body.classList.contains('show-presenting')) {
      document.body.classList.toggle('show-presenting', showing);
      byId('show-notes').hidden = !showing;
      byId('show-audience').textContent = showing ? 'Завершить показ' : 'Режим показа';
      byId('show-status').textContent = showing ? 'Открываем окно аудитории…' : '';
    }
    if (!showing) {
      window.clearInterval(audienceMonitor);
      audienceMonitor = undefined;
      audience = null;
    }
  }

  function toggleAudience() {
    byId('show-status').textContent = '';
    if (audience && !audience.closed) {
      audience.close();
      updatePresentationMode();
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set('audience', '1');
    url.searchParams.set('stack', route.id);
    audience = window.open(url.href, '_blank', 'popup,width=1120,height=700');
    if (!audience) {
      byId('show-status').textContent = 'Разрешите всплывающие окна для показа аудитории.';
      return;
    }
    updatePresentationMode();
    audienceMonitor = window.setInterval(updatePresentationMode, 500);
  }

  window.addEventListener('message', event => {
    if (event.origin !== messageOrigin || !event.data) return;
    const message = event.data;
    if (audienceMode && event.source === presenter) {
      if (message.type === 'vdko-slide' && Number.isInteger(message.index) && slides[message.index]) {
        index = message.index;
        dark = message.dark === true;
        answerVisible = message.answerVisible === true;
        showPointer(null);
        renderSlide();
      }
      if (message.type === 'vdko-pointer') showPointer(message.position);
    }
    if (!audienceMode && audience && event.source === audience && message.type === 'vdko-ready') {
      byId('show-status').textContent = 'Окно аудитории подключено.';
      syncSlide();
    }
  });

  if (audienceMode) {
    document.body.classList.add('show-audience-only');
    for (const id of ['show-bar', 'show-progress', 'show-notes', 'show-nav', 'show-index']) byId(id).remove();
    canvas.addEventListener('dblclick', toggleFullscreen);
    renderSlide();
    presenter?.postMessage({type: 'vdko-ready'}, targetOrigin);
    return;
  }

  byId('show-return').href = 'index.html?mode=teacher&db=' + route.id;
  byId('show-prev').onclick = () => navigateSlide(index - 1, true);
  byId('show-next').onclick = () => navigateSlide(index + 1, true);
  byId('show-fullscreen').onclick = toggleFullscreen;
  document.addEventListener('fullscreenchange', () => {
    byId('show-fullscreen').textContent = document.fullscreenElement ? 'Выйти из полноэкранного режима' : 'Во весь экран';
  });
  byId('show-audience').onclick = toggleAudience;
  window.addEventListener('focus', updatePresentationMode);
  window.addEventListener('pagehide', () => audience?.close());
  byId('show-theme').onclick = () => {
    dark = !dark;
    renderSlide();
    syncSlide();
  };
  byId('show-pointer').onclick = () => {
    pointerEnabled = !pointerEnabled;
    byId('show-pointer').setAttribute('aria-pressed', String(pointerEnabled));
    if (!pointerEnabled) setPointer(null);
  };
  byId('show-answer').onclick = () => {
    answerVisible = !answerVisible;
    renderSlide();
    syncSlide();
  };
  canvas.addEventListener('pointermove', event => {
    if (!pointerEnabled) return;
    const rect = canvas.getBoundingClientRect();
    setPointer({x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height});
  });
  canvas.addEventListener('pointerleave', () => {
    if (pointerEnabled) setPointer(null);
  });

  const contents = byId('show-index');
  const chapters = [
    [undefined, 'Подготовка'],
    ['Задание 1', 'Обращения пользователей'],
    ['Задание 2', 'Сервер баз данных и ОС'],
    ['Задание 3', 'Диагностика компьютера']
  ];
  byId('show-index-list').innerHTML = chapters.map(([module, title]) => {
    const chapter = slides.flatMap((slide, number) => slide.module===module ? [{slide, number}] : []);
    return `<section><h3>${E(title)}</h3><ol start="${chapter[0].number+1}">${chapter.map(({slide, number}) =>
      `<li><button type="button" data-show-slide="${number}">${E(slide.title)}</button></li>`).join('')}</ol></section>`;
  }).join('');
  byId('show-contents').onclick = () => {
    contents.querySelector('[aria-current]')?.removeAttribute('aria-current');
    const selected = contents.querySelector(`[data-show-slide="${index}"]`);
    selected.setAttribute('aria-current', 'page');
    contents.showModal();
    selected.focus();
  };
  byId('show-index-list').onclick = event => {
    const button = event.target.closest('[data-show-slide]');
    if (!button) return;
    contents.close();
    navigateSlide(Number(button.dataset.showSlide), true);
  };
  document.addEventListener('keydown', event => {
    if (contents.open || event.target.closest?.('pre') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    navigateSlide(index + (event.key === 'ArrowLeft' ? -1 : 1), true);
  });
  renderSlide();
})();
