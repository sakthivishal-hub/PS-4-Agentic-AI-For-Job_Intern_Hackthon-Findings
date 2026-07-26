const jobsEl = document.querySelector('#jobs');
const template = document.querySelector('#jobTemplate');
const emptyTemplate = document.querySelector('#emptyTemplate');
const chips = [...document.querySelectorAll('.chip')];
const form = document.querySelector('#searchForm');
const countEl = document.querySelector('#resultCount');
const summaryEl = document.querySelector('#summaryText');
const liveStatusEl = document.querySelector('#liveStatus');
const sourceStatusEl = document.querySelector('#sourceStatus');
const sortEl = document.querySelector('#sort');
let latestJobs = [];
let debounceId;

function selectedSources() {
  return chips.filter(chip => chip.classList.contains('active')).map(chip => chip.dataset.source);
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

function formatDate(value) {
  if (!value) return 'Recently posted';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  return days === 0 ? 'Posted today' : `${days}d ago`;
}

function sortedJobs() {
  const jobs = [...latestJobs];
  if (sortEl.value === 'Highest salary') return jobs.sort((a, b) => b.salary.localeCompare(a.salary));
  if (sortEl.value === 'Newest first') return jobs.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  return jobs;
}

function renderJobs(jobs) {
  jobsEl.innerHTML = '';
  if (!jobs.length) {
    jobsEl.appendChild(emptyTemplate.content.cloneNode(true));
    return;
  }
  jobs.forEach(job => {
    const node = template.content.cloneNode(true);
    node.querySelector('.logo').textContent = (job.company || '?')[0].toUpperCase();
    node.querySelector('.source').textContent = job.source;
    node.querySelector('h2').textContent = job.title;
    node.querySelector('.company').textContent = job.company || 'Company not listed';
    node.querySelector('.meta').textContent = `${job.location || 'Remote'} � ${formatDate(job.publishedAt)}`;
    node.querySelector('.description').textContent = job.description || 'Open the listing for more details.';
    node.querySelector('.salary').textContent = job.salary || 'Salary not listed';
    node.querySelector('.tags').innerHTML = (job.tags || []).slice(0, 4).map(tag => `<span>${escapeHtml(tag)}</span>`).join('');
    const link = node.querySelector('a');
    link.href = job.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    jobsEl.appendChild(node);
  });
}

async function search() {
  const query = document.querySelector('#query').value.trim() || 'remote jobs';
  const city = document.querySelector('#city').value.trim();
  const region = document.querySelector('#region').value.trim();
  const activeSources = selectedSources();
  if (!activeSources.length) {
    latestJobs = [];
    countEl.textContent = 'Select a platform';
    renderJobs([]);
    return;
  }
  liveStatusEl.textContent = 'Searching live';
  sourceStatusEl.textContent = `Checking ${activeSources.length} platform${activeSources.length === 1 ? '' : 's'}�`;
  countEl.textContent = 'Fetching current jobs�';
  jobsEl.setAttribute('aria-busy', 'true');
  try {
    const params = new URLSearchParams({ q: query, city, region, sources: activeSources.join(',') });
    const response = await fetch(`${API_BASE}/jobs?${params}`);
    if (!response.ok) throw new Error('Search service unavailable');
    const payload = await response.json();
    latestJobs = payload.jobs || [];
    renderJobs(sortedJobs());
    countEl.textContent = `${latestJobs.length} live job${latestJobs.length === 1 ? '' : 's'} found`;
    summaryEl.textContent = `for ${query}${city || region ? ` in ${[city, region].filter(Boolean).join(', ')}` : ''}`;
    const unavailable = payload.failedSources?.length;
    liveStatusEl.textContent = unavailable ? 'Partially live' : 'Live results';
    sourceStatusEl.textContent = unavailable ? `${unavailable} platform${unavailable === 1 ? '' : 's'} unavailable` : `Updated ${new Date(payload.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    latestJobs = [];
    renderJobs([]);
    countEl.textContent = 'Unable to fetch live jobs';
    liveStatusEl.textContent = 'Connection issue';
    sourceStatusEl.textContent = 'Check the local server and try again';
  } finally {
    jobsEl.removeAttribute('aria-busy');
  }
}

chips.forEach(chip => chip.addEventListener('click', () => {
  chip.classList.toggle('active');
  search();
}));
form.addEventListener('submit', event => { event.preventDefault(); search(); });
document.querySelector('#query').addEventListener('input', () => {
  clearTimeout(debounceId);
  debounceId = setTimeout(search, 650);
});
sortEl.addEventListener('change', () => renderJobs(sortedJobs()));
search();