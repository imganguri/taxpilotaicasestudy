function getSavedRole() {
  try { return localStorage.getItem('taxpilot-role') || 'preparer'; } catch { return 'preparer'; }
}

function saveRole(role) {
  try { localStorage.setItem('taxpilot-role', role); } catch { /* Storage may be unavailable in embedded previews. */ }
}

const state = {
  role: getSavedRole(),
  view: location.hash.replace('#/', '').split('/')[0] || 'dashboard',
  selectedReturnId: 'RET-1042',
  selectedFieldId: 'wages',
  selectedThreadId: 'thread-1',
  dashboardFilter: 'priority',
  docsQuery: '',
  docsStatus: 'all',
  docsPage: 1,
  onboardingCompleted: new Set(['profile']),
  correctionHistory: [],
  messages: [],
};

const roles = {
  preparer: { name: 'Jordan Lee', initials: 'JL', label: 'Preparer', workspace: 'Firm workspace · Northstar Tax' },
  reviewer: { name: 'Alex Morgan', initials: 'AM', label: 'Reviewer', workspace: 'Firm workspace · Northstar Tax' },
  client: { name: 'Maya Patel', initials: 'MP', label: 'Client', workspace: 'Personal tax workspace · 2026 return' },
};

const navConfig = {
  preparer: [
    ['dashboard', '⌂', 'Work queue', '12'],
    ['return', '▤', 'Return review', '3'],
    ['documents', '▱', 'Documents', ''],
    ['collaboration', '◫', 'Collaboration', '4'],
    ['status', '◷', 'Return status', ''],
    ['affordances', '◇', 'UI states', ''],
  ],
  reviewer: [
    ['dashboard', '⌂', 'Review queue', '8'],
    ['return', '▤', 'Return review', '5'],
    ['documents', '▱', 'Evidence library', ''],
    ['collaboration', '◫', 'Issues & notes', '6'],
    ['status', '◷', 'Portfolio status', ''],
    ['affordances', '◇', 'UI states', ''],
  ],
  client: [
    ['dashboard', '⌂', 'Home', ''],
    ['onboarding', '✓', 'My checklist', '3'],
    ['documents', '▱', 'My documents', '2'],
    ['collaboration', '◫', 'Messages', '1'],
    ['status', '◷', 'Return status', ''],
  ],
};

const returns = [
  { id: 'RET-1042', client: 'Maya Patel', type: 'Individual · 1040', stage: 'Waiting on client', blocker: 'Missing brokerage statement', due: 'Aug 10', owner: 'Jordan Lee', initials: 'JL', risk: 96, urgency: 'urgent' },
  { id: 'RET-1027', client: 'Marcus Chen', type: 'Individual · 1040', stage: 'Ready for review', blocker: 'AI variance flagged', due: 'Aug 16', owner: 'Jordan Lee', initials: 'JL', risk: 91, urgency: 'urgent' },
  { id: 'RET-1098', client: 'Aurora Labs LLC', type: 'Business · 1120-S', stage: 'In preparation', blocker: 'Payroll reconciliation', due: 'Aug 22', owner: 'Nina Shah', initials: 'NS', risk: 84, urgency: 'warning' },
  { id: 'RET-1011', client: 'Olivia Brooks', type: 'Individual · 1040', stage: 'Client review', blocker: 'Awaiting e-signature', due: 'Aug 17', owner: 'Jordan Lee', initials: 'JL', risk: 78, urgency: 'warning' },
  { id: 'RET-1112', client: 'Harbor Design Co.', type: 'Business · 1065', stage: 'In preparation', blocker: 'None', due: 'Aug 29', owner: 'Nina Shah', initials: 'NS', risk: 63, urgency: 'info' },
  { id: 'RET-1004', client: 'Daniel Ruiz', type: 'Individual · 1040', stage: 'Ready to file', blocker: 'Payment choice', due: 'Sep 02', owner: 'Jordan Lee', initials: 'JL', risk: 55, urgency: 'info' },
  { id: 'RET-1134', client: 'Greenline Dental', type: 'Business · 1120-S', stage: 'Data gathering', blocker: '4 open requests', due: 'Aug  30', owner: 'Priya Rao', initials: 'PR', risk: 72, urgency: 'warning' },
  { id: 'RET-1076', client: 'Sofia Reyes', type: 'Individual · 1040', stage: 'Filed', blocker: 'None', due: 'Filed Aug 05', owner: 'Jordan Lee', initials: 'JL', risk: 18, urgency: 'success' },
];

const returnFields = [
  {
    id: 'wages', name: 'Form 1040 · Line 1a', label: 'Wages, salaries, tips', value: 128450.00, display: '$128,450.00', source: 'W-2_Northstar_2025.pdf', page: 1, section: 'Box 1 — Wages, tips, other compensation', sourceValue: '$128,450.00', confidence: 98,
    formula: 'W-2 Box 1 → Form 1040 Line 1a', status: 'verified', note: 'Direct mapping. No adjustment applied.',
  },
  {
    id: 'interest', name: 'Schedule B · Line 1', label: 'Taxable interest', value: 1284.19, display: '$1,284.19', source: '1099-INT_CommunityBank.pdf', page: 1, section: 'Box 1 — Interest income', sourceValue: '$1,284.19', confidence: 96,
    formula: '1099-INT Box 1 → Schedule B Line 1', status: 'verified', note: 'Single interest statement.',
  },
  {
    id: 'dividends', name: 'Form 1040 · Line 3b', label: 'Ordinary dividends', value: 3842.77, display: '$3,842.77', source: '1099-DIV_Vanguard.pdf', page: 2, section: 'Box 1a — Total ordinary dividends', sourceValue: '$3,842.77', confidence: 91,
    formula: '1099-DIV Box 1a → Form 1040 Line 3b', status: 'ai', note: 'AI matched payer and tax year. Reviewer confirmation recommended.',
  },
  {
    id: 'capitalGain', name: 'Schedule D · Line 16', label: 'Net long-term capital gain', value: 6930.44, display: '$6,930.44', source: '1099-B_Vanguard.pdf', page: 7, section: 'Covered long-term transactions', sourceValue: '$8,410.44 proceeds less $1,480.00 basis adjustment', confidence: 82,
    formula: 'Σ Proceeds − Σ Basis − Wash-sale adjustment = $6,930.44', status: 'review', note: 'Two transactions include an AI-inferred wash-sale adjustment.',
  },
  {
    id: 'mortgage', name: 'Schedule A · Line 8a', label: 'Home mortgage interest', value: 18320.00, display: '$18,320.00', source: '1098_HomeFirst.pdf', page: 1, section: 'Box 1 — Mortgage interest received', sourceValue: '$18,320.00', confidence: 99,
    formula: 'Form 1098 Box 1 → Schedule A Line 8a', status: 'verified', note: 'Direct mapping. Loan balance is below applicable limit in demo data.',
  },
  {
    id: 'charity', name: 'Schedule A · Line 12', label: 'Charitable contributions', value: 2500.00, display: '$2,500.00', source: 'Donation_Receipts_2025.pdf', page: 3, section: 'Receipt total — Hope Foundation', sourceValue: '$1,500 + $1,000', confidence: 76,
    formula: '$1,500 receipt + $1,000 receipt = $2,500', status: 'review', note: 'Second receipt lacks a tax ID. Client confirmation requested.',
  },
];

const baseMessages = [
  { id: 1, threadId: 'thread-1', author: 'Jordan Lee', initials: 'JL', role: 'Preparer', visibility: 'client', time: 'Today, 9:14 AM', text: 'Hi Maya — the brokerage statement appears to be missing page 7, which contains the cost-basis details. Please upload the complete PDF so I can finish Schedule D.' },
  { id: 2, threadId: 'thread-1', author: 'Maya Patel', initials: 'MP', role: 'Client', visibility: 'client', time: 'Today, 10:02 AM', text: 'Thanks. I downloaded a new copy from Vanguard and will upload it this afternoon.' },
  { id: 3, threadId: 'thread-1', author: 'Alex Morgan', initials: 'AM', role: 'Reviewer', visibility: 'internal', time: 'Today, 10:18 AM', text: 'Internal note: verify the wash-sale adjustment after the replacement statement arrives. Current AI confidence is 82%.' },
  { id: 4, threadId: 'thread-2', author: 'Jordan Lee', initials: 'JL', role: 'Preparer', visibility: 'client', time: 'Yesterday, 3:20 PM', text: 'Can you confirm whether the $1,000 Hope Foundation contribution was cash or non-cash?' },
  { id: 5, threadId: 'thread-3', author: 'Alex Morgan', initials: 'AM', role: 'Reviewer', visibility: 'internal', time: 'Aug 10, 4:08 PM', text: 'The W-2 wage amount is verified. No manual adjustment is needed.' },
];

const threads = [
  { id: 'thread-1', title: 'Missing brokerage statement page', context: '1099-B_Vanguard.pdf · Schedule D', preview: 'I downloaded a new copy from Vanguard…', owner: 'Maya Patel', due: 'Today', status: 'open', visibility: 'mixed' },
  { id: 'thread-2', title: 'Confirm charitable contribution type', context: 'Donation_Receipts_2025.pdf · Schedule A', preview: 'Can you confirm whether the $1,000…', owner: 'Maya Patel', due: 'Aug 15', status: 'open', visibility: 'client' },
  { id: 'thread-3', title: 'W-2 amount review', context: 'W-2_Northstar_2025.pdf · Form 1040', preview: 'The W-2 wage amount is verified…', owner: 'Alex Morgan', due: 'Done', status: 'resolved', visibility: 'internal' },
  { id: 'thread-4', title: 'Estimated tax payment evidence', context: 'Questionnaire · Payments', preview: 'Please attach the state confirmation…', owner: 'Jordan Lee', due: 'Aug 17', status: 'open', visibility: 'client' },
];

const documentTypes = ['W-2', '1099-INT', '1099-DIV', '1099-B', '1098', 'Receipt', 'K-1', 'Statement'];
const documentStatuses = ['Verified', 'Needs review', 'Missing page', 'Client uploaded', 'AI processed'];
const documentOwners = ['Maya Patel', 'Jordan Lee', 'Alex Morgan'];
const documents = Array.from({ length: 240 }, (_, i) => {
  const type = documentTypes[i % documentTypes.length];
  const status = i === 3 ? 'Missing page' : documentStatuses[(i * 3) % documentStatuses.length];
  const year = i < 210 ? 2026 : 2025;
  return {
    id: `DOC-${String(i + 1).padStart(4, '0')}`,
    name: `${type}_${['Northstar','Vanguard','CommunityBank','HopeFoundation','HomeFirst','Acme'][i % 6]}_${year}_${String(i + 1).padStart(2, '0')}.pdf`,
    type,
    taxYear: year,
    status,
    pages: (i % 12) + 1,
    confidence: Math.max(61, 99 - (i * 7) % 39),
    owner: documentOwners[i % documentOwners.length],
    uploaded: `Aug ${String((i % 12) + 1).padStart(2, '0')}`,
  };
});

const statusSteps = [
  ['Data gathering', 'Documents and questionnaire collected'],
  ['Preparation', 'Return calculations and forms prepared'],
  ['Review', 'A second professional checks the return'],
  ['Client approval', 'Client reviews and signs'],
  ['Filed', 'Return transmitted and accepted'],
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const escapeHTML = (value = '') => value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2400);
}

function navigate(view, params = '') {
  state.view = view;
  const hash = `#/${view}${params ? `/${params}` : ''}`;
  if (location.hash !== hash) history.pushState({}, '', hash);
  render();
  $('#app')?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderNav() {
  const nav = navConfig[state.role];
  $('#primaryNav').innerHTML = nav.map(([view, icon, label, badge]) => `
    <button class="nav-item ${state.view === view ? 'active' : ''}" data-action="navigate" data-view="${view}">
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
      ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
    </button>
  `).join('');
  const role = roles[state.role];
  $('#workspaceHint').textContent = role.workspace;
  $('#avatar').textContent = role.initials;
  $('#roleSelect').value = state.role;
}

function renderBreadcrumbs(parts = []) {
  const defaultParts = [{ label: navConfig[state.role].find(n => n[0] === state.view)?.[2] || 'Home' }];
  const crumbs = parts.length ? parts : defaultParts;
  $('#breadcrumbs').innerHTML = crumbs.map((crumb, index) => {
    const last = index === crumbs.length - 1;
    return `${index ? '<span>›</span>' : ''}${last ? `<span class="current">${escapeHTML(crumb.label)}</span>` : `<button data-action="navigate" data-view="${crumb.view || 'dashboard'}">${escapeHTML(crumb.label)}</button>`}`;
  }).join('');
}

function pageHeader(eyebrow, title, description, actions = '') {
  return `
    <div class="page-header">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </div>
  `;
}

function renderDashboard() {
  if (state.role === 'client') return renderClientDashboard();
  const isReviewer = state.role === 'reviewer';
  renderBreadcrumbs([{ label: isReviewer ? 'Review queue' : 'Work queue' }]);
  const filtered = [...returns]
    .filter(r => state.dashboardFilter === 'mine' ? (isReviewer ? ['Ready for review','Client review'].includes(r.stage) : r.owner === roles[state.role].name) : true)
    .filter(r => state.dashboardFilter === 'blocked' ? r.blocker !== 'None' : true)
    .sort((a, b) => b.risk - a.risk);

  $('#app').innerHTML = `
    ${pageHeader(
      isReviewer ? 'Reviewer workspace' : 'Preparer workspace',
      isReviewer ? 'What needs review right now' : 'Your highest-impact work',
      'Priority is calculated from filing deadline, blocker severity, client wait time, return risk, and workflow stage.',
      `<button class="secondary-button" data-action="show-priority-logic">How priority works</button><button class="primary-button" data-action="navigate" data-view="return">Open current return</button>`
    )}

    <div class="grid grid-4" style="margin-bottom:16px">
      <article class="card metric-card"><div class="metric-label"><span>${isReviewer ? 'Awaiting review' : 'Assigned returns'}</span><span>▤</span></div><strong>${isReviewer ? 8 : 24}</strong><small>${isReviewer ? '3 due in 48 hours' : '6 need action today'}</small></article>
      <article class="card metric-card"><div class="metric-label"><span>Blocked</span><span>!</span></div><strong>7</strong><small>4 waiting on clients</small></article>
      <article class="card metric-card"><div class="metric-label"><span>Due this week</span><span>◷</span></div><strong>12</strong><small>2 high-risk returns</small></article>
      <article class="card metric-card"><div class="metric-label"><span>Completed</span><span class="metric-change">+18%</span></div><strong>41</strong><small>Compared with last week</small></article>
    </div>

    <div class="grid dashboard-grid">
      <section class="card">
        <div class="card-header">
          <div><h2>Prioritized work queue</h2><p>Ordered by the next decision or action—not by client name.</p></div>
          <div class="segmented" aria-label="Queue filters">
            <button data-action="dashboard-filter" data-filter="priority" class="${state.dashboardFilter === 'priority' ? 'active' : ''}">Priority</button>
            <button data-action="dashboard-filter" data-filter="mine" class="${state.dashboardFilter === 'mine' ? 'active' : ''}">${isReviewer ? 'Reviewable' : 'Mine'}</button>
            <button data-action="dashboard-filter" data-filter="blocked" class="${state.dashboardFilter === 'blocked' ? 'active' : ''}">Blocked</button>
          </div>
        </div>
        <div class="work-list">
          ${filtered.map((r, i) => `
            <div class="work-row clickable-row" data-action="open-return" data-return-id="${r.id}">
              <div class="priority-rank">${i + 1}</div>
              <div><div class="row-title">${escapeHTML(r.client)}</div><div class="row-subtitle">${r.id} · ${r.type}</div></div>
              <div class="work-stage-col"><span class="badge ${r.urgency}">${r.stage}</span><div class="row-subtitle">${r.blocker}</div></div>
              <div class="owner work-owner-col"><span class="mini-avatar">${r.initials}</span><div><div class="row-title" style="font-size:12px">${r.owner}</div><div class="row-subtitle">Next owner</div></div></div>
              <div class="work-due-col"><div class="row-title" style="font-size:12px">${r.due}</div><div class="row-subtitle">Due</div></div>
              <div><div class="row-title" style="font-size:12px">${r.risk}/100</div><div class="score-bar"><span style="width:${r.risk}%"></span></div></div>
            </div>
          `).join('')}
        </div>
      </section>

      <div class="grid">
        <section class="card">
          <div class="card-header"><div><h2>Portfolio flow</h2><p>Where work is accumulating.</p></div></div>
          <div class="card-body">
            <div class="progress-row">
              <div class="progress-ring" style="--progress:72"><strong>72%</strong></div>
              <div class="progress-copy"><h3>On track</h3><p>86 of 119 active returns have no critical blockers.</p></div>
            </div>
            <div style="height:16px"></div>
            <div class="timeline">
              <div class="timeline-step done"><div class="timeline-dot">18</div><div class="timeline-copy"><h4>Data gathering</h4><p>4 client-owned blockers</p></div></div>
              <div class="timeline-step current"><div class="timeline-dot">42</div><div class="timeline-copy"><h4>Preparation</h4><p>Largest queue · 8 due this week</p></div></div>
              <div class="timeline-step"><div class="timeline-dot">21</div><div class="timeline-copy"><h4>Review</h4><p>Median wait: 9 hours</p></div></div>
              <div class="timeline-step"><div class="timeline-dot">12</div><div class="timeline-copy"><h4>Client approval</h4><p>3 signatures overdue</p></div></div>
            </div>
          </div>
        </section>

        <section class="ai-card">
          <div class="ai-card-header"><strong>✦ AI queue insight</strong><span class="badge ai">Recommendation</span></div>
          <div class="ai-card-body">
            <p class="ai-recommendation">Resolve Maya Patel’s missing statement before starting another return.</p>
            <p class="ai-explanation">It is due in 3 days, blocks Schedule D, and the client has already replied.</p>
            <div class="ai-actions"><button class="primary-button small-button" data-action="open-thread" data-thread-id="thread-1">Open issue</button><button class="secondary-button small-button" data-action="explain-ai">Why this?</button></div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderClientDashboard() {
  renderBreadcrumbs([{ label: 'Home' }]);
  const completed = state.onboardingCompleted.size;
  $('#app').innerHTML = `
    <section class="next-action-hero">
      <p class="eyebrow">Your next action</p>
      <h1>Upload the complete Vanguard brokerage statement</h1>
      <p>Your current file is missing page 7. That page contains cost-basis details needed to finish your investment section.</p>
      <button class="primary-button" data-action="complete-upload">Upload replacement PDF</button>
      <div class="hero-meta"><span>Estimated time: 2 minutes</span><span>Due today</span><span>Owned by you</span></div>
    </section>

    <div class="grid onboarding-grid">
      <section class="card">
        <div class="card-header"><div><h2>Your 2026 return checklist</h2><p>Only tasks that currently need your attention are shown.</p></div><span class="badge info">${completed} of 4 done</span></div>
        <div class="card-body onboarding-list">
          ${clientChecklist(false)}
        </div>
        <div class="card-footer"><button class="secondary-button" data-action="navigate" data-view="onboarding">See full checklist and completed items</button></div>
      </section>
      <div class="grid">
        <section class="card">
          <div class="card-header"><div><h2>Return progress</h2><p>Plain-language status shared with your tax team.</p></div></div>
          <div class="card-body">
            <div class="progress-row"><div class="progress-ring" style="--progress:48"><strong>48%</strong></div><div class="progress-copy"><h3>Waiting on one document</h3><p>Preparation continues after your upload.</p></div></div>
            <div style="height:17px"></div>
            <button class="secondary-button full-width" data-action="navigate" data-view="status">See what happens next</button>
          </div>
        </section>
        <section class="card">
          <div class="card-header"><div><h2>Latest message</h2><p>Connected to the affected document.</p></div></div>
          <div class="card-body">
            <span class="badge client">Client-visible</span>
            <p style="font-size:13px;margin:10px 0 6px">“The brokerage statement appears to be missing page 7…”</p>
            <small style="color:var(--muted)">Jordan Lee · Today, 9:14 AM</small>
          </div>
          <div class="card-footer"><button class="secondary-button" data-action="open-thread" data-thread-id="thread-1">Open conversation</button></div>
        </section>
      </div>
    </div>
  `;
}

function clientChecklist(showAll) {
  const items = [
    { id: 'profile', title: 'Confirm personal information', description: 'Address, filing status, and dependents', done: true },
    { id: 'brokerage', title: 'Replace incomplete brokerage statement', description: 'Vanguard 1099-B · missing page 7', current: true },
    { id: 'charity', title: 'Answer contribution question', description: 'Confirm cash versus non-cash donation' },
    { id: 'signature', title: 'Review and e-sign', description: 'Available after preparation and review', locked: true },
  ];
  return items.filter(item => showAll || !item.done).map((item, idx) => {
    const done = state.onboardingCompleted.has(item.id) || item.done;
    return `
      <div class="onboarding-step ${done ? 'done' : item.current ? 'current' : ''}">
        <div class="step-number">${done ? '✓' : idx + 1}</div>
        <div><h3>${item.title}</h3><p>${item.description}</p></div>
        ${item.locked ? '<span class="badge locked">Not ready yet</span>' : done ? '<span class="badge success">Complete</span>' : `<button class="${item.current ? 'primary-button' : 'secondary-button'} small-button" data-action="complete-checklist" data-item="${item.id}">${item.current ? 'Start' : 'Open'}</button>`}
      </div>
    `;
  }).join('');
}

function renderOnboarding() {
  renderBreadcrumbs([{ label: 'Home', view: 'dashboard' }, { label: 'My checklist' }]);
  $('#app').innerHTML = `
    ${pageHeader('First-run experience', 'A clear path from login to first action', 'The interface prioritizes one next step, defers irrelevant complexity, and gradually reveals the full tax workflow.')}
    <div class="grid onboarding-grid">
      <section class="card">
        <div class="card-header"><div><h2>Setup and tax checklist</h2><p>Progress persists as tasks are completed.</p></div><span class="badge info">2026 individual return</span></div>
        <div class="card-body onboarding-list">${clientChecklist(true)}</div>
      </section>
      <div class="grid">
        <section class="card">
          <div class="card-header"><h2>What is hidden for now</h2></div>
          <div class="card-body">
            <div class="callout neutral">Tax forms, calculation details, and filing controls stay out of the client navigation until they become relevant.</div>
            <div style="height:12px"></div>
            <div class="timeline">
              <div class="timeline-step current"><div class="timeline-dot">1</div><div class="timeline-copy"><h4>Gather information</h4><p>Current client experience</p></div></div>
              <div class="timeline-step"><div class="timeline-dot">2</div><div class="timeline-copy"><h4>Review summary</h4><p>Appears when the return is ready</p></div></div>
              <div class="timeline-step"><div class="timeline-dot">3</div><div class="timeline-copy"><h4>Sign and file</h4><p>Appears only after review</p></div></div>
            </div>
          </div>
        </section>
        <section class="ai-card">
          <div class="ai-card-header"><strong>✦ Guided assistance</strong><span class="badge ai">AI</span></div>
          <div class="ai-card-body"><p class="ai-recommendation">Why do we need page 7?</p><p class="ai-explanation">It contains the purchase price of investments. Without it, the system cannot correctly calculate capital gain or loss.</p><div class="ai-actions"><button class="secondary-button small-button" data-action="show-toast" data-message="Help article opened in demo">Learn more</button></div></div>
        </section>
      </div>
    </div>
  `;
}

function renderReturnReview() {
  const field = returnFields.find(f => f.id === state.selectedFieldId) || returnFields[0];
  renderBreadcrumbs([{ label: 'Work queue', view: 'dashboard' }, { label: 'Maya Patel · 2025' }, { label: field.name }]);
  $('#app').innerHTML = `
    ${pageHeader('Return review · RET-1042', 'Maya Patel — 2026 Individual Return', 'Select a return field to see its source evidence, exact document location, transformation, confidence, and audit history.', `<button class="secondary-button" data-action="open-thread" data-thread-id="thread-1">Open linked issue</button><button class="primary-button" data-action="verify-field">Verify selected field</button>`)}
    <div class="review-layout">
      <section class="card review-pane">
        <div class="card-header"><div><h2>Return fields</h2><p>Form 1040 and schedules</p></div><span class="badge warning">2 need review</span></div>
        <div class="field-list">
          ${returnFields.map(f => `
            <button class="field-item ${f.id === field.id ? 'active' : ''}" data-action="select-field" data-field-id="${f.id}">
              <div class="field-line"><span class="field-name">${f.name}</span><span class="field-value">${f.display}</span></div>
              <div class="field-meta"><span>${f.label}</span><span>·</span>${statusBadge(f.status)}</div>
            </button>
          `).join('')}
        </div>
      </section>

      <section class="card review-pane">
        <div class="viewer-controls"><div><div class="file-name">${field.source}</div><div class="row-subtitle">Page ${field.page} · ${field.section}</div></div><div class="page-actions"><button class="secondary-button small-button" data-action="show-toast" data-message="Opened full document in demo">Open full PDF</button><button class="secondary-button small-button" data-action="show-toast" data-message="Copied deep link to source region">Copy source link</button></div></div>
        <div class="document-viewer">${documentPreview(field)}</div>
      </section>

      <aside class="card review-pane">
        <div class="card-header"><div><h2>Evidence & reasoning</h2><p>Why this value appears on the return</p></div><span class="badge ai">AI-assisted</span></div>
        <div class="trace-panel">
          <div class="trace-value"><div><div class="stage-label">Extracted return value</div><strong>${field.display}</strong></div>${statusBadge(field.status)}</div>
          <div class="trace-section"><h4>Source</h4><div class="evidence-card"><strong>${field.source}</strong><p>Page ${field.page} · ${field.section}</p><p>Detected value: ${field.sourceValue}</p></div></div>
          <div class="trace-section"><h4>Transformation</h4><div class="formula">${field.formula}</div><p style="font-size:11px;color:var(--muted);margin:8px 0 0">${field.note}</p></div>
          <div class="trace-section"><h4>AI confidence</h4><div class="confidence"><div class="confidence-line"><span>Extraction and mapping</span><strong>${field.confidence}%</strong></div><div class="confidence-meter"><span style="width:${field.confidence}%"></span></div><p style="font-size:11px;color:var(--muted);margin:0">${confidenceCopy(field.confidence)}</p></div></div>
          <div class="trace-section"><h4>Recommended action</h4>${aiRecommendation(field)}</div>
          <div class="trace-section"><h4>Audit history</h4><div class="audit-list">${auditHistory(field)}</div></div>
        </div>
      </aside>
    </div>
  `;
}

function statusBadge(status) {
  const map = {
    verified: '<span class="badge success">Verified</span>',
    ai: '<span class="badge ai">AI-generated</span>',
    review: '<span class="badge warning">Needs review</span>',
  };
  return map[status] || `<span class="badge neutral">${status}</span>`;
}

function confidenceCopy(confidence) {
  if (confidence >= 95) return 'High confidence. Evidence is direct and the mapping is standard.';
  if (confidence >= 85) return 'Good confidence. A professional should confirm the highlighted source.';
  return 'Moderate confidence. The system found uncertainty that requires review.';
}

function documentPreview(field) {
  const highlight = (id) => field.id === id ? 'doc-highlight' : '';
  if (field.id === 'wages') return `
    <div class="document-page"><span class="doc-stamp">AI EXTRACTED</span><h3>2026 WAGE AND TAX STATEMENT</h3>
      <div class="doc-row ${highlight('wages')}"><span>1. Wages, tips, other compensation</span><span>$128,450.00</span></div>
      <div class="doc-row"><span>2. Federal income tax withheld</span><span>$24,881.00</span></div>
      <div class="doc-row"><span>3. Social security wages</span><span>$128,450.00</span></div>
      <div class="doc-row"><span>4. Social security tax withheld</span><span>$7,963.90</span></div>
      <div class="doc-row"><span>Employer: Northstar Analytics, Inc.</span><span>EIN 12-3456789</span></div>
      <div class="doc-row"><span>Employee: Maya Patel</span><span>Tax year 2025</span></div>
    </div>`;
  if (field.id === 'capitalGain') return `
    <div class="document-page"><span class="doc-stamp">PAGE 7 OF 12</span><h3>2026 CONSOLIDATED 1099 — TRANSACTION DETAIL</h3>
      <div class="doc-row"><span>Description</span><span>Gain / (Loss)</span></div>
      <div class="doc-row ${highlight('capitalGain')}"><span>150 shares Aster Robotics — proceeds $18,240.44; basis $10,310.00</span><span>$7,930.44</span></div>
      <div class="doc-row ${highlight('capitalGain')}"><span>Wash-sale adjustment carried forward</span><span>($1,000.00)</span></div>
      <div class="doc-row"><span>Net long-term result</span><span>$6,930.44</span></div>
      <div style="margin-top:60px;border:2px dashed #bdc7ce;padding:20px;text-align:center;color:#74808a">Source region highlighted by the traceability link</div>
    </div>`;
  const labelMap = {
    interest: ['FORM 1099-INT', '1. Interest income', '$1,284.19'],
    dividends: ['FORM 1099-DIV', '1a. Total ordinary dividends', '$3,842.77'],
    mortgage: ['FORM 1098', '1. Mortgage interest received', '$18,320.00'],
    charity: ['CHARITABLE CONTRIBUTION RECEIPTS', 'Hope Foundation receipts', '$1,500.00 + $1,000.00'],
  };
  const [title, label, value] = labelMap[field.id];
  return `<div class="document-page"><span class="doc-stamp">SOURCE FOUND</span><h3>${title}</h3><div class="doc-row ${highlight(field.id)}"><span>${label}</span><span>${value}</span></div><div class="doc-row"><span>Recipient</span><span>Maya Patel</span></div><div class="doc-row"><span>Tax year</span><span>2025</span></div><div style="margin-top:80px;color:#74808a;font-size:12px">The selected source is highlighted while the return field and reasoning remain visible.</div></div>`;
}

function aiRecommendation(field) {
  if (field.status === 'verified') return `<div class="callout success"><strong>No action required.</strong><br>The value has direct source evidence and was verified by a professional.</div>`;
  return `
    <div class="ai-card" style="border-radius:10px">
      <div class="ai-card-body">
        <p class="ai-recommendation">${field.confidence < 80 ? 'Confirm the source before approval.' : 'Review the highlighted source and transformation.'}</p>
        <p class="ai-explanation">The AI identified ${field.confidence < 80 ? 'missing or ambiguous evidence' : 'a plausible mapping with some uncertainty'}.</p>
        <div class="ai-actions"><button class="primary-button small-button" data-action="verify-field">Accept and verify</button><button class="secondary-button small-button" data-action="open-correction">Correct value</button></div>
      </div>
    </div>`;
}

function auditHistory(field) {
  const corrections = state.correctionHistory.filter(c => c.fieldId === field.id).map(c => `
    <div class="audit-item"><div class="audit-icon">✎</div><div><strong>Value corrected to ${formatMoney(c.value)}</strong><p>${c.reason} · ${c.by} · just now</p></div></div>`).join('');
  return `
    ${corrections}
    <div class="audit-item"><div class="audit-icon">✦</div><div><strong>AI extracted ${field.display}</strong><p>${field.source}, page ${field.page} · Aug 12, 9:03 AM</p></div></div>
    <div class="audit-item"><div class="audit-icon">↗</div><div><strong>Mapped to ${field.name}</strong><p>Rule set: Individual Federal 2026 · Aug 12, 9:03 AM</p></div></div>
    ${field.status === 'verified' ? '<div class="audit-item"><div class="audit-icon">✓</div><div><strong>Verified by Jordan Lee</strong><p>Evidence accepted · Aug 12, 11:26 AM</p></div></div>' : ''}
  `;
}

function renderDocuments() {
  renderBreadcrumbs([{ label: state.role === 'client' ? 'Home' : 'Work queue', view: 'dashboard' }, { label: state.role === 'reviewer' ? 'Evidence library' : state.role === 'client' ? 'My documents' : 'Documents' }]);
  const pageSize = 15;
  const filtered = documents.filter(d => {
    const query = state.docsQuery.toLowerCase();
    const matchesQuery = !query || [d.name, d.type, d.status, d.owner, d.id].some(v => String(v).toLowerCase().includes(query));
    const matchesStatus = state.docsStatus === 'all' || d.status === state.docsStatus;
    return matchesQuery && matchesStatus;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  state.docsPage = Math.min(state.docsPage, pages);
  const pageDocs = filtered.slice((state.docsPage - 1) * pageSize, state.docsPage * pageSize);
  const clientMode = state.role === 'client';

  $('#app').innerHTML = `
    ${pageHeader('Complexity made navigable', clientMode ? 'Your tax documents' : 'Evidence library', clientMode ? 'Upload status and requests are shown without exposing internal processing complexity.' : 'Search, filter, and move from a portfolio-level list to source-level evidence across 240 mock documents.', `<button class="primary-button" data-action="show-toast" data-message="Upload flow opened in demo">Upload documents</button>`)}
    <section class="card">
      <div class="card-header"><div><h2>${filtered.length} documents</h2><p>Persistent filters keep your place as you move into detail and back.</p></div><span class="badge info">240-item dataset</span></div>
      <div class="card-body" style="padding-bottom:8px">
        <div class="toolbar">
          <input id="documentSearch" type="search" value="${escapeHTML(state.docsQuery)}" placeholder="Search file name, type, owner, or ID" aria-label="Search documents" />
          <select id="documentStatusFilter" aria-label="Filter by status">
            <option value="all">All statuses</option>
            ${documentStatuses.map(s => `<option value="${s}" ${state.docsStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <button class="secondary-button" data-action="clear-doc-filters">Clear</button>
        </div>
      </div>
      <div class="table-wrap" style="max-height:650px">
        <table>
          <thead><tr><th>Document</th><th>Type</th><th>Status</th>${clientMode ? '' : '<th>AI confidence</th><th>Owner</th>'}<th>Uploaded</th><th></th></tr></thead>
          <tbody>
            ${pageDocs.map(d => `
              <tr class="clickable-row" data-action="open-document" data-doc-id="${d.id}">
                <td class="doc-name">${escapeHTML(d.name)}<small>${d.id} · ${d.pages} page${d.pages === 1 ? '' : 's'}</small></td>
                <td>${d.type}</td>
                <td>${documentStatusBadge(d.status, clientMode)}</td>
                ${clientMode ? '' : `<td><div class="confidence-line"><span>${d.confidence}%</span></div><div class="score-bar"><span style="width:${d.confidence}%;background:${d.confidence > 85 ? 'var(--success)' : 'var(--accent)'}"></span></div></td><td>${d.owner}</td>`}
                <td>${d.uploaded}</td>
                <td><button class="secondary-button small-button" data-action="open-document" data-doc-id="${d.id}">Open</button></td>
              </tr>
            `).join('') || `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">⌕</div><h3>No matching documents</h3><p>Try a broader search or clear the status filter.</p></div></td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="pagination"><p>Showing ${filtered.length ? (state.docsPage - 1) * pageSize + 1 : 0}–${Math.min(state.docsPage * pageSize, filtered.length)} of ${filtered.length}</p><div class="pagination-actions"><button class="secondary-button small-button" data-action="docs-page" data-page="${state.docsPage - 1}" ${state.docsPage === 1 ? 'disabled' : ''}>Previous</button><button class="secondary-button small-button" data-action="docs-page" data-page="${state.docsPage + 1}" ${state.docsPage === pages ? 'disabled' : ''}>Next</button></div></div>
    </section>
  `;
}

function documentStatusBadge(status, clientMode) {
  if (clientMode && status === 'AI processed') return '<span class="badge info">Received</span>';
  const map = {
    'Verified': 'success', 'Needs review': 'warning', 'Missing page': 'urgent', 'Client uploaded': 'info', 'AI processed': 'ai'
  };
  return `<span class="badge ${map[status] || 'neutral'}">${status}</span>`;
}

function renderDocumentDetail(docId) {
  const doc = documents.find(d => d.id === docId) || documents[0];
  renderBreadcrumbs([{ label: state.role === 'client' ? 'My documents' : 'Documents', view: 'documents' }, { label: doc.name }]);
  $('#app').innerHTML = `
    ${pageHeader('Document detail', doc.name, `${doc.id} · ${doc.pages} pages · Uploaded ${doc.uploaded}`, `<button class="secondary-button" data-action="navigate" data-view="documents">Back to filtered list</button><button class="primary-button" data-action="show-toast" data-message="Document downloaded in demo">Download</button>`)}
    <div class="grid grid-2">
      <section class="card"><div class="viewer-controls"><div><div class="file-name">${doc.name}</div><div class="row-subtitle">Page 1 of ${doc.pages}</div></div><div class="page-actions"><button class="secondary-button small-button">−</button><button class="secondary-button small-button">100%</button><button class="secondary-button small-button">+</button></div></div><div class="document-viewer">${documentPreview(returnFields[(parseInt(doc.id.slice(-2), 10) || 1) % returnFields.length])}</div></section>
      <div class="grid">
        <section class="card"><div class="card-header"><div><h2>Document summary</h2><p>Progressive disclosure keeps the default view concise.</p></div>${documentStatusBadge(doc.status, state.role === 'client')}</div><div class="card-body"><div class="grid grid-2"><div><div class="stage-label">Document type</div><strong>${doc.type}</strong></div><div><div class="stage-label">Tax year</div><strong>${doc.taxYear}</strong></div><div><div class="stage-label">Pages</div><strong>${doc.pages}</strong></div><div><div class="stage-label">Owner</div><strong>${doc.owner}</strong></div></div></div></section>
        ${state.role === 'client' ? `<section class="card"><div class="card-header"><h2>What you need to know</h2></div><div class="card-body"><div class="callout ${doc.status === 'Missing page' ? 'warning' : 'success'}">${doc.status === 'Missing page' ? 'This file is incomplete. Please upload the full statement so your tax team can continue.' : 'Your tax team received this document. No action is needed right now.'}</div></div></section>` : `<section class="ai-card"><div class="ai-card-header"><strong>✦ AI extraction summary</strong><span class="badge ai">${doc.confidence}% confidence</span></div><div class="ai-card-body"><p class="ai-recommendation">${doc.status === 'Missing page' ? 'Possible incomplete statement detected.' : 'Key tax fields were extracted and mapped.'}</p><p class="ai-explanation">Evidence is retained at page and source-region level. Open a mapped field to inspect the transformation.</p><div class="evidence-list"><div class="evidence-row"><span>▤</span><p><strong>Taxpayer match:</strong> Maya Patel</p></div><div class="evidence-row"><span>◷</span><p><strong>Tax year match:</strong> ${doc.taxYear}</p></div><div class="evidence-row"><span>↗</span><p><strong>Mapped fields:</strong> 3 return fields</p></div></div><div class="ai-actions"><button class="primary-button small-button" data-action="navigate" data-view="return">Review mapped fields</button><button class="secondary-button small-button" data-action="show-toast" data-message="Marked as duplicate in demo">Mark duplicate</button></div></div></section>`}
      </div>
    </div>
  `;
}

function renderCollaboration() {
  const thread = threads.find(t => t.id === state.selectedThreadId) || threads[0];
  const visibleMessages = [...baseMessages, ...state.messages].filter(m => m.threadId === thread.id && (state.role !== 'client' || m.visibility !== 'internal'));
  renderBreadcrumbs([{ label: state.role === 'client' ? 'Home' : 'Work queue', view: 'dashboard' }, { label: state.role === 'reviewer' ? 'Issues & notes' : state.role === 'client' ? 'Messages' : 'Collaboration' }, { label: thread.title }]);
  $('#app').innerHTML = `
    ${pageHeader('Contextual collaboration', state.role === 'client' ? 'Messages with your tax team' : 'Issues, requests, and decisions', 'Each conversation is attached to a document, return field, questionnaire item, or task—and always shows who owns the next action.', `<button class="primary-button" data-action="open-message">New message</button>`)}
    <div class="split-layout">
      <section class="card">
        <div class="card-header"><div><h2>Open conversations</h2><p>Not a generic inbox: every thread has tax context.</p></div><span class="badge warning">${threads.filter(t => t.status === 'open').length} open</span></div>
        <div class="thread-list">
          ${threads.filter(t => state.role !== 'client' || t.visibility !== 'internal').map(t => `
            <button class="thread-item ${t.id === thread.id ? 'active' : ''}" data-action="select-thread" data-thread-id="${t.id}">
              <h4>${t.title}</h4><p>${t.context}</p><div class="thread-item-meta"><span class="badge ${t.status === 'resolved' ? 'success' : t.due === 'Today' ? 'urgent' : 'warning'}">${t.status === 'resolved' ? 'Resolved' : `Due ${t.due}`}</span><span class="row-subtitle">Next: ${t.owner}</span></div>
            </button>
          `).join('')}
        </div>
      </section>
      <section class="card">
        <div class="card-header"><div><h2>${thread.title}</h2><p>${thread.context}</p></div><span class="badge ${thread.status === 'resolved' ? 'success' : 'warning'}">${thread.status}</span></div>
        <div class="context-strip"><p><strong>Linked context:</strong> <span>${thread.context}</span></p><button class="secondary-button small-button" data-action="navigate" data-view="return">Open source</button></div>
        <div class="messages">
          ${visibleMessages.map(m => `
            <div class="message ${m.visibility}"><div class="mini-avatar">${m.initials}</div><div class="bubble"><div class="message-header"><div><strong>${m.author}</strong> <span class="badge ${m.visibility === 'internal' ? 'internal' : 'client'}">${m.visibility === 'internal' ? 'Internal note' : 'Client-visible'}</span></div><time>${m.time}</time></div><p>${escapeHTML(m.text)}</p></div></div>
          `).join('') || `<div class="empty-state"><div class="empty-icon">◫</div><h3>No messages yet</h3><p>Start a conversation tied to this tax item.</p></div>`}
        </div>
        ${thread.status === 'open' ? `<div class="request-box"><div><h4>Next action: ${thread.owner}</h4><p>${thread.owner === 'Maya Patel' ? 'Upload or reply to unblock preparation.' : 'Review and resolve this tax issue.'}</p></div><button class="${state.role === 'client' && thread.owner === 'Maya Patel' ? 'primary-button' : 'secondary-button'} small-button" data-action="${state.role === 'client' ? 'complete-upload' : 'resolve-thread'}">${state.role === 'client' ? 'Complete request' : 'Mark resolved'}</button></div>` : ''}
        <div class="card-footer"><button class="primary-button" data-action="open-message">Reply in context</button></div>
      </section>
    </div>
  `;
}

function renderStatus() {
  const clientMode = state.role === 'client';
  const currentIndex = 1;
  renderBreadcrumbs([{ label: clientMode ? 'Home' : 'Work queue', view: 'dashboard' }, { label: clientMode ? 'Return status' : 'Maya Patel · Status' }]);
  $('#app').innerHTML = `
    ${pageHeader('Shared status model', clientMode ? 'Your return is in preparation' : 'Maya Patel — return status', clientMode ? 'One document is blocking the investment section. Your tax team can continue after it is uploaded.' : 'The same five-stage model is used across client and firm views, with audience-appropriate detail.')}
    <div class="status-hero" style="margin-bottom:16px">
      <section class="card stage-card">
        <div class="stage-label">Current stage · 2 of 5</div>
        <h2>Preparation</h2>
        <p>${clientMode ? 'Your tax professional is entering and checking information.' : 'Core income forms are mapped. Schedule D is blocked by an incomplete 1099-B.'}</p>
        <div class="stage-progress">${statusSteps.map((_, i) => `<div class="stage-segment ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}"></div>`).join('')}</div>
      </section>
      <section class="card owner-card">
        <p>Who owns the next action</p><strong>Maya Patel</strong><p>Replace the incomplete Vanguard statement.</p><button class="secondary-button" data-action="open-thread" data-thread-id="thread-1">Open linked request</button>
      </section>
    </div>
    <div class="grid grid-2">
      <section class="card">
        <div class="card-header"><div><h2>What has happened and what is next</h2><p>Stage names, ownership, blockers, and completion criteria are explicit.</p></div></div>
        <div class="card-body timeline">
          ${statusSteps.map((step, i) => `
            <div class="timeline-step ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}">
              <div class="timeline-dot">${i < currentIndex ? '✓' : i + 1}</div>
              <div class="timeline-copy"><h4>${step[0]}</h4><p>${i < currentIndex ? 'Completed Aug 09' : i === currentIndex ? (clientMode ? 'In progress · waiting on one document' : '18 of 24 fields verified · 1 critical blocker') : step[1]}</p></div>
            </div>
          `).join('')}
        </div>
      </section>
      <div class="grid">
        <section class="card"><div class="card-header"><div><h2>Blocking item</h2><p>The status explains impact, owner, and resolution.</p></div><span class="badge urgent">Critical</span></div><div class="card-body"><h3 style="margin:0 0 6px">Incomplete brokerage statement</h3><p style="color:var(--muted);font-size:12px">Page 7 contains cost-basis details needed to calculate capital gains. Schedule D cannot be completed until a replacement is uploaded.</p><div class="callout warning"><strong>Owner:</strong> Maya Patel · <strong>Due:</strong> Today</div></div></section>
        <section class="card"><div class="card-header"><div><h2>${clientMode ? 'What happens next' : 'Internal readiness'}</h2></div></div><div class="card-body">${clientMode ? `<div class="timeline"><div class="timeline-step current"><div class="timeline-dot">1</div><div class="timeline-copy"><h4>You upload the replacement</h4><p>The request clears automatically.</p></div></div><div class="timeline-step"><div class="timeline-dot">2</div><div class="timeline-copy"><h4>Jordan completes preparation</h4><p>You do not need to do anything.</p></div></div><div class="timeline-step"><div class="timeline-dot">3</div><div class="timeline-copy"><h4>You review and sign</h4><p>We notify you when it is ready.</p></div></div></div>` : `<div class="grid grid-2"><div><div class="stage-label">Fields verified</div><strong style="font-size:24px">18 / 24</strong></div><div><div class="stage-label">Open issues</div><strong style="font-size:24px">2</strong></div><div><div class="stage-label">Reviewer</div><strong>Alex Morgan</strong></div><div><div class="stage-label">Target review</div><strong>Aug 16</strong></div></div>`}</div></section>
      </div>
    </div>
  `;
}

function renderAffordances() {
  renderBreadcrumbs([{ label: 'UI states' }]);
  $('#app').innerHTML = `
    ${pageHeader('Interaction system', 'Clickable, editable, generated, verified, and locked', 'A consistent visual language is demonstrated across fields, tables, AI recommendations, approvals, and read-only records.')}
    <div class="affordance-grid">
      <section class="card affordance-card"><h3>Editable</h3><p>Input border and edit icon indicate direct manipulation.</p><div class="demo-field editable"><span>$2,500.00</span><span>✎</span></div><div class="legend"><span><i style="border:2px solid #9fcac5"></i>Editable now</span></div></section>
      <section class="card affordance-card"><h3>Clickable</h3><p>Hover response and directional cue open a related object.</p><div class="demo-field clickable" data-action="navigate" data-view="return"><span>1099-B_Vanguard.pdf</span><span>→</span></div><div class="legend"><span><i style="background:var(--primary-soft)"></i>Opens detail</span></div></section>
      <section class="card affordance-card"><h3>AI-generated</h3><p>Purple treatment indicates machine output, not authority.</p><div class="demo-field ai-generated"><span>$6,930.44</span><span class="badge ai">AI</span></div><div class="legend"><span><i style="background:var(--purple-soft);border-color:#d7ccef"></i>Needs judgment</span></div></section>
      <section class="card affordance-card"><h3>Verified</h3><p>Verification is a distinct human action with an audit trail.</p><div class="demo-field"><span>$128,450.00</span><span class="badge success">Verified</span></div><div class="legend"><span><i style="background:var(--success-soft)"></i>Human accepted</span></div></section>
      <section class="card affordance-card"><h3>Requires approval</h3><p>Left accent and owner identify a workflow gate.</p><div class="demo-field approval"><span>Override wash-sale adjustment</span><span class="badge warning">Reviewer</span></div><div class="legend"><span><i style="border-left:4px solid var(--accent)"></i>Approval gate</span></div></section>
      <section class="card affordance-card"><h3>Read-only / locked</h3><p>Muted surface plus a reason prevents dead-end confusion.</p><div class="demo-field readonly"><span>Filed return amount</span><span>🔒</span></div><div class="legend"><span><i style="background:#f3f5f6"></i>Locked after filing</span></div></section>
    </div>
    <section class="card" style="margin-top:16px"><div class="card-header"><div><h2>Same system across contexts</h2><p>These states also appear in return review, document tables, collaboration, and status workflows.</p></div></div><div class="card-body"><div class="grid grid-3"><div class="callout neutral"><strong>Do not rely on color alone.</strong><br>Every state includes text, iconography, or both.</div><div class="callout neutral"><strong>Explain why an action is unavailable.</strong><br>Locked states include the condition that unlocks them.</div><div class="callout neutral"><strong>Separate AI from verification.</strong><br>Confidence never substitutes for professional approval.</div></div></div></section>
  `;
}

function renderNotFound() {
  renderBreadcrumbs([{ label: 'Not found' }]);
  $('#app').innerHTML = `<div class="empty-state"><div class="empty-icon">?</div><h3>That page is not part of this prototype</h3><p>Use the navigation to return to a supported workflow.</p><div style="height:14px"></div><button class="primary-button" data-action="navigate" data-view="dashboard">Go to dashboard</button></div>`;
}

function render() {
  renderNav();
  document.body.dataset.role = state.role;
  const allowed = navConfig[state.role].map(n => n[0]);
  if (!allowed.includes(state.view) && !['document'].includes(state.view)) state.view = 'dashboard';

  switch (state.view) {
    case 'dashboard': renderDashboard(); break;
    case 'onboarding': renderOnboarding(); break;
    case 'return': renderReturnReview(); break;
    case 'documents': renderDocuments(); break;
    case 'document': renderDocumentDetail(location.hash.split('/')[2]); break;
    case 'collaboration': renderCollaboration(); break;
    case 'status': renderStatus(); break;
    case 'affordances': renderAffordances(); break;
    default: renderNotFound();
  }
}

function openCommand() {
  const dialog = $('#commandDialog');
  $('#commandInput').value = '';
  renderCommandResults('');
  dialog.showModal();
  setTimeout(() => $('#commandInput').focus(), 0);
}

function renderCommandResults(query) {
  const items = [
    ...returns.map(r => ({ icon: '▤', title: r.client, subtitle: `${r.id} · ${r.stage}`, action: 'return', id: r.id })),
    ...documents.slice(0, 30).map(d => ({ icon: '▱', title: d.name, subtitle: `${d.id} · ${d.status}`, action: 'document', id: d.id })),
    ...threads.map(t => ({ icon: '◫', title: t.title, subtitle: t.context, action: 'thread', id: t.id })),
  ].filter(item => !query || `${item.title} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  $('#commandResults').innerHTML = items.map((item, i) => `<button class="command-result" data-action="command-select" data-kind="${item.action}" data-id="${item.id}"><span class="command-result-icon">${item.icon}</span><span><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.subtitle)}</p></span><kbd>${i + 1}</kbd></button>`).join('') || `<div class="empty-state"><div class="empty-icon">⌕</div><h3>No results</h3><p>Try a client name, document type, return ID, or issue.</p></div>`;
}

function openMessageDialog() {
  $('#messageVisibility').value = state.role === 'client' ? 'client' : 'client';
  $('#messageVisibility').disabled = state.role === 'client';
  $('#messageText').value = '';
  $('#messageDialog').showModal();
}

function openCorrectionDialog() {
  const field = returnFields.find(f => f.id === state.selectedFieldId);
  $('#correctionValue').value = field.value;
  $('#correctionNote').value = '';
  $('#correctionDialog').showModal();
}

function handleAction(target) {
  const action = target.closest('[data-action]')?.dataset.action;
  const el = target.closest('[data-action]');
  if (!action || !el) return;

  switch (action) {
    case 'navigate': navigate(el.dataset.view); break;
    case 'open-return': state.selectedReturnId = el.dataset.returnId; navigate('return'); break;
    case 'select-field': state.selectedFieldId = el.dataset.fieldId; renderReturnReview(); break;
    case 'dashboard-filter': state.dashboardFilter = el.dataset.filter; renderDashboard(); break;
    case 'show-priority-logic': showToast('Priority = deadline + blocker + wait time + risk + stage weight'); break;
    case 'explain-ai': showToast('The recommendation uses the same visible priority factors shown in the queue.'); break;
    case 'verify-field': {
      const field = returnFields.find(f => f.id === state.selectedFieldId);
      field.status = 'verified';
      showToast(`${field.label} verified with audit history`);
      renderReturnReview();
      break;
    }
    case 'open-correction': openCorrectionDialog(); break;
    case 'open-command': openCommand(); break;
    case 'close-command': $('#commandDialog').close(); break;
    case 'command-select': {
      $('#commandDialog').close();
      if (el.dataset.kind === 'document') navigate('document', el.dataset.id);
      else if (el.dataset.kind === 'thread') { state.selectedThreadId = el.dataset.id; navigate('collaboration'); }
      else navigate('return');
      break;
    }
    case 'open-document': navigate('document', el.dataset.docId); break;
    case 'docs-page': state.docsPage = Math.max(1, Number(el.dataset.page)); renderDocuments(); break;
    case 'clear-doc-filters': state.docsQuery = ''; state.docsStatus = 'all'; state.docsPage = 1; renderDocuments(); break;
    case 'select-thread': state.selectedThreadId = el.dataset.threadId; renderCollaboration(); break;
    case 'open-thread': state.selectedThreadId = el.dataset.threadId; navigate('collaboration'); break;
    case 'open-message': openMessageDialog(); break;
    case 'resolve-thread': {
      const thread = threads.find(t => t.id === state.selectedThreadId); thread.status = 'resolved'; showToast('Issue resolved and ownership cleared'); renderCollaboration(); break;
    }
    case 'complete-upload': state.onboardingCompleted.add('brokerage'); showToast('Replacement file uploaded; request marked complete'); render(); break;
    case 'complete-checklist': state.onboardingCompleted.add(el.dataset.item); showToast('Checklist item completed'); render(); break;
    case 'show-toast': showToast(el.dataset.message || 'Action completed in demo'); break;
    case 'toggle-sidebar': $('.sidebar').classList.toggle('open'); break;
  }
}

document.addEventListener('click', e => handleAction(e.target));

document.addEventListener('input', e => {
  if (e.target.id === 'commandInput') renderCommandResults(e.target.value);
  if (e.target.id === 'documentSearch') {
    state.docsQuery = e.target.value;
    state.docsPage = 1;
    clearTimeout(document.searchTimeout);
    document.searchTimeout = setTimeout(renderDocuments, 180);
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'roleSelect') {
    state.role = e.target.value;
    saveRole(state.role);
    state.view = 'dashboard';
    history.pushState({}, '', '#/dashboard');
    render();
    showToast(`Switched to ${roles[state.role].label} workspace`);
  }
  if (e.target.id === 'documentStatusFilter') {
    state.docsStatus = e.target.value;
    state.docsPage = 1;
    renderDocuments();
  }
});

$('#messageForm').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('#messageText').value.trim();
  if (!text) return;
  const role = roles[state.role];
  state.messages.push({ id: Date.now(), threadId: state.selectedThreadId, author: role.name, initials: role.initials, role: role.label, visibility: $('#messageVisibility').value, time: 'Just now', text });
  $('#messageDialog').close();
  showToast($('#messageVisibility').value === 'internal' ? 'Internal note added' : 'Client-visible message sent');
  renderCollaboration();
});

$('#correctionForm').addEventListener('submit', e => {
  e.preventDefault();
  const value = Number($('#correctionValue').value);
  const field = returnFields.find(f => f.id === state.selectedFieldId);
  state.correctionHistory.unshift({ fieldId: field.id, value, reason: $('#correctionReason').value, note: $('#correctionNote').value, by: roles[state.role].name });
  field.value = value;
  field.display = formatMoney(value);
  field.status = 'review';
  field.note = `Corrected by ${roles[state.role].name}. Original AI value retained in audit history.`;
  $('#correctionDialog').close();
  showToast('Correction saved without losing the original AI evidence');
  renderReturnReview();
});

window.addEventListener('hashchange', () => {
  const parts = location.hash.replace('#/', '').split('/');
  state.view = parts[0] || 'dashboard';
  render();
});

window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommand(); }
  if (e.key === 'Escape') $('.sidebar').classList.remove('open');
});

if (!location.hash) history.replaceState({}, '', '#/dashboard');
render();
