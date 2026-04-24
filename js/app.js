// ── THEME ─────────────────────────────────────────────
const themeBtn = document.getElementById('themeBtn');
let theme = localStorage.getItem('theme') || 'dark';
setTheme(theme);

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', t);
  theme = t;
}
themeBtn.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));


// ── CLOCK & GREETING ──────────────────────────────────
function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const h12  = h % 12 || 12;
  const min  = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';

  document.getElementById('clock').textContent = `${h12}:${min} ${ampm}`;

  const greet = h < 5  ? 'Burning the midnight oil 🌙'
              : h < 12 ? 'Good morning ☀️'
              : h < 17 ? 'Good afternoon 👋'
              : h < 21 ? 'Good evening 🌆'
              :           'Good night 🌙';

  document.getElementById('greeting').innerHTML = `<span>${greet}</span>, dear`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
  document.getElementById('date').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}
updateClock();
setInterval(updateClock, 1000);


// ── FOCUS TIMER ───────────────────────────────────────
const CIRC = 2 * Math.PI * 82; // 515.22

let pomMins  = parseInt(localStorage.getItem('pomoDuration')) || 25;
let total    = pomMins * 60;
let left     = total;
let running  = false;
let interval = null;
let sessions = 0;

const dispEl   = document.getElementById('timerDisplay');
const arcEl    = document.getElementById('arc');
const pomInput = document.getElementById('pomInput');
const startBtn = document.getElementById('startBtn');
const dotsEl   = document.getElementById('dots');

pomInput.value = pomMins;

function fmt(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function drawTimer() {
  dispEl.textContent = fmt(left);
  arcEl.style.strokeDashoffset = CIRC * (1 - left / total);
}
function updateDots() {
  dotsEl.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('on', i < (sessions % 4) || (sessions > 0 && sessions % 4 === 0));
  });
}

startBtn.addEventListener('click', () => {
  if (running) return;
  running = true;
  startBtn.textContent = 'Running…';
  interval = setInterval(() => {
    if (left <= 0) {
      clearInterval(interval);
      running = false;
      startBtn.textContent = 'Start';
      sessions++;
      updateDots();
      showToast(`🎉 Session #${sessions} done! Take a break.`);
      left = total;
      drawTimer();
      return;
    }
    left--;
    drawTimer();
  }, 1000);
});

document.getElementById('pauseBtn').addEventListener('click', () => {
  clearInterval(interval);
  running = false;
  startBtn.textContent = 'Resume';
});

document.getElementById('resetBtn').addEventListener('click', () => {
  clearInterval(interval);
  running = false;
  startBtn.textContent = 'Start';
  left = total;
  drawTimer();
});

document.getElementById('setBtn').addEventListener('click', () => {
  const v = parseInt(pomInput.value);
  if (!v || v < 1 || v > 120) { showToast('⚠️ Enter 1–120 minutes.'); return; }
  clearInterval(interval);
  running = false;
  startBtn.textContent = 'Start';
  pomMins = v; total = v * 60; left = total;
  localStorage.setItem('pomoDuration', v);
  drawTimer();
  showToast(`⏱ Timer set to ${v} min.`);
});

drawTimer();


// ── TO-DO LIST ────────────────────────────────────────
let todos = JSON.parse(localStorage.getItem('todos')) || [];

const taskInput = document.getElementById('taskInput');
const taskError = document.getElementById('taskError');
const taskList  = document.getElementById('taskList');
const taskSum   = document.getElementById('taskSummary');

function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }

function renderTodos() {
  taskList.innerHTML = '';
  todos.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = 'task' + (t.done ? ' done' : '');

    const check = document.createElement('button');
    check.className = 'check';
    check.textContent = t.done ? '✓' : '';
    check.title = t.done ? 'Mark undone' : 'Mark done';
    check.addEventListener('click', () => { todos[i].done = !todos[i].done; saveTodos(); renderTodos(); });

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = t.text;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit';
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => {
      const editing = span.contentEditable === 'true';
      if (editing) {
        const val = span.textContent.trim();
        if (!val) { span.textContent = t.text; }
        else if (todos.some((tt, ii) => ii !== i && tt.text.toLowerCase() === val.toLowerCase())) {
          showToast('⚠️ Duplicate task!'); span.textContent = t.text;
        } else {
          todos[i].text = val; saveTodos();
        }
        span.contentEditable = 'false';
        editBtn.textContent = '✏️';
        renderTodos();
      } else {
        span.contentEditable = 'true';
        span.focus();
        editBtn.textContent = '💾';
        const r = document.createRange();
        r.selectNodeContents(span); r.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(r);
      }
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn del';
    delBtn.title = 'Delete';
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', () => { todos.splice(i, 1); saveTodos(); renderTodos(); });

    actions.append(editBtn, delBtn);
    li.append(check, span, actions);
    taskList.appendChild(li);
  });

  const done = todos.filter(t => t.done).length;
  taskSum.innerHTML = todos.length === 0
    ? 'No tasks yet.'
    : `<b>${done}</b> of <b>${todos.length}</b> tasks completed.`;
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) { taskError.textContent = 'Please enter a task.'; return; }
  if (todos.some(t => t.text.toLowerCase() === text.toLowerCase())) {
    taskError.textContent = `"${text}" already exists!`; return;
  }
  taskError.textContent = '';
  todos.unshift({ text, done: false });
  saveTodos(); renderTodos();
  taskInput.value = '';
  taskInput.focus();
}

document.getElementById('addTaskBtn').addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
taskInput.addEventListener('input',   () => { taskError.textContent = ''; });

renderTodos();


// ── QUICK LINKS ───────────────────────────────────────
let links = JSON.parse(localStorage.getItem('quickLinks')) || [
  { label: 'Google',  url: 'https://google.com' },
  { label: 'YouTube', url: 'https://youtube.com' },
  { label: 'GitHub',  url: 'https://github.com' },
];

const linksGrid = document.getElementById('linksGrid');
const linkLabel = document.getElementById('linkLabel');
const linkUrl   = document.getElementById('linkUrl');

function saveLinks() { localStorage.setItem('quickLinks', JSON.stringify(links)); }

function renderLinks() {
  linksGrid.innerHTML = '';
  if (!links.length) {
    linksGrid.innerHTML = '<p class="empty">No links yet. Add some above!</p>';
    return;
  }
  links.forEach((l, i) => {
    let domain = '';
    try { domain = new URL(l.url).hostname; } catch(e) {}

    const chip = document.createElement('div');
    chip.className = 'chip';

    const img = document.createElement('img');
    img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    img.onerror = () => img.remove();

    const a = document.createElement('a');
    a.href = l.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = l.label;

    const del = document.createElement('button');
    del.className = 'chip-del'; del.title = 'Remove'; del.textContent = '×';
    del.addEventListener('click', () => { links.splice(i, 1); saveLinks(); renderLinks(); });

    chip.append(img, a, del);
    linksGrid.appendChild(chip);
  });
}

document.getElementById('addLinkBtn').addEventListener('click', () => {
  const label = linkLabel.value.trim();
  let url = linkUrl.value.trim();
  if (!label || !url) { showToast('⚠️ Fill in both label and URL.'); return; }
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ label, url });
  saveLinks(); renderLinks();
  linkLabel.value = ''; linkUrl.value = '';
});

[linkLabel, linkUrl].forEach(el => el.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addLinkBtn').click();
}));

renderLinks();


// ── TOAST ─────────────────────────────────────────────
const toastEl = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}