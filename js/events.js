// 開催予定を名簿スプレッドシートの「HP用」タブから読み込んで、
// トップの日付ボタン・「次回の開催」カード・下のNEXT PARTYバーを自動で書きかえる。
// 終わった回（開催日の翌日以降）は自動で消える。
// 読み込めなかったときは、下の FALLBACK_EVENTS で表示する。

// 「HP用」タブを「ウェブに公開（CSV）」したURL。空のままなら FALLBACK_EVENTS だけで表示する
const EVENTS_CSV_URL = '';

const FALLBACK_EVENTS = [
  { date: '2026-10-16', city: '名古屋', adv: 2700, door: 3000, theme: '' },
  { date: '2026-10-30', city: '京都', adv: 2700, door: 3000, theme: '' },
];

const LINE_URL = 'https://lin.ee/zvk4EsY';
const DEFAULT_ADV = 2700;
const DEFAULT_DOOR = 3000;
const MAX_EVENTS = 3;

const CITY_EN = { 名古屋: 'NAGOYA', 京都: 'KYOTO', 大阪: 'OSAKA', 東京: 'TOKYO', 福岡: 'FUKUOKA', 神戸: 'KOBE', 横浜: 'YOKOHAMA' };
const CITY_AREA = { 東京: '東京都内' };
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const WEEK_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const WEEK_JP = ['日', '月', '火', '水', '木', '金', '土'];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function toEvents(rows) {
  const head = rows[0].map((h) => h.trim());
  const at = (name) => head.indexOf(name);
  return rows.slice(1).map((r) => ({
    date: (r[at('date')] || '').trim(),
    city: (r[at('city')] || '').trim(),
    adv: Number(r[at('adv')]) || 0,
    door: Number(r[at('door')]) || 0,
    theme: (r[at('theme')] || '').trim(),
  })).filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.city);
}

function upcoming(events) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return events
    .map((e) => {
      const [y, m, d] = e.date.split('-').map(Number);
      return { ...e, day: new Date(y, m - 1, d) };
    })
    .filter((e) => e.day >= today)
    .sort((a, b) => a.day - b.day)
    .slice(0, MAX_EVENTS);
}

const yen = (n) => '¥' + n.toLocaleString('ja-JP');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function render(events) {
  const chips = document.getElementById('heroDates');
  const list = document.getElementById('eventList');
  const barText = document.getElementById('nextEventText');
  if (!chips || !list || !barText) return;

  if (events.length === 0) {
    chips.innerHTML = '<a href="#next" class="date-chip"><b>NEXT</b> COMING SOON</a>';
    list.innerHTML = `
      <article class="event-card event-card-empty reveal is-visible">
        <div class="event-body">
          <p class="event-city">COMING SOON</p>
          <h3>次回の開催は近日発表！</h3>
          <p>日程が決まったら、公式LINEとInstagramでお知らせします。</p>
          <a href="${LINE_URL}" class="btn btn-primary btn-sm" target="_blank" rel="noopener" data-line>公式LINEを友だち追加</a>
        </div>
      </article>`;
    barText.textContent = 'COMING SOON';
    return;
  }

  chips.innerHTML = events.slice(0, 2).map((e) =>
    `<a href="#next" class="date-chip"><b>${e.day.getMonth() + 1}.${e.day.getDate()}</b> ${WEEK_EN[e.day.getDay()]} ${esc(CITY_EN[e.city] || e.city)}</a>`
  ).join('');

  list.innerHTML = events.map((e, i) => {
    const d = e.day;
    const area = CITY_AREA[e.city] || `${e.city}市内`;
    const theme = e.theme
      ? `テーマカラー：${esc(e.theme)}（ゆるめ）`
      : 'テーマカラーあり（ゆるめ・SNSでお知らせ）';
    return `
      <article class="event-card reveal is-visible">
        <div class="event-date${i % 2 ? ' event-date-alt' : ''}">
          <span class="event-month">${MONTHS[d.getMonth()]}</span>
          <span class="event-day">${d.getDate()}</span>
          <span class="event-week">${WEEK_EN[d.getDay()]}</span>
        </div>
        <div class="event-body">
          <p class="event-city">${esc(CITY_EN[e.city] || e.city)}</p>
          <h3>polish ${esc(e.city)}</h3>
          <ul class="event-meta">
            <li><span>DATE</span>${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEK_JP[d.getDay()]}）</li>
            <li><span>PLACE</span>${esc(area)}（詳細は予約後にご案内）</li>
            <li><span>PRICE</span>前売り ${yen(e.adv || DEFAULT_ADV)}<br>当日 ${yen(e.door || DEFAULT_DOOR)}</li>
            <li><span>ENTRY</span>女性限定</li>
            <li><span>DRESS</span>${theme}</li>
          </ul>
          <a href="${LINE_URL}" class="btn btn-primary btn-sm" target="_blank" rel="noopener" data-line>LINEで予約する</a>
        </div>
      </article>`;
  }).join('');

  barText.textContent = events.slice(0, 2)
    .map((e) => `${e.day.getMonth() + 1}/${e.day.getDate()} ${e.city}`).join('・');
}

async function loadEvents() {
  if (!EVENTS_CSV_URL) return FALLBACK_EVENTS;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(EVENTS_CSV_URL + (EVENTS_CSV_URL.includes('?') ? '&' : '?') + 't=' + Date.now(), { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(res.status);
    const events = toEvents(parseCsv(await res.text()));
    return events.length ? events : FALLBACK_EVENTS;
  } catch (err) {
    return FALLBACK_EVENTS;
  }
}

// まず手元のデータですぐ表示し（終わった回は消える）、スプレッドシートが読めたら差しかえる
render(upcoming(FALLBACK_EVENTS));
loadEvents().then((events) => render(upcoming(events)));
