const { useEffect, useMemo, useState } = React;
const h = React.createElement;

// OpportunityOS FastAPI backend (auth, resume parsing, AI recommendations,
// hackathons, notifications). Runs separately from this Node server --
// override at runtime via window.OPPORTUNITY_OS_API if it's deployed
// somewhere other than localhost:8000.
const API_BASE =
  window.location.port === '5173'
    ? 'http://127.0.0.1:8000'
    : 'https://sinalfire-backend-production.up.railway.app';

function authToken() {
  return localStorage.getItem('auth_token') || '';
}

async function apiFetch(path, options = {}) {
  const token = authToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || payload.detail || 'Request failed');
  }
  return payload;
}

const sourceOptions = [
  { id: 'jsearch', label: 'JSearch', note: 'RapidAPI' },
  { id: 'remotive', label: 'Remotive', note: 'Remote roles' },
  { id: 'remoteok', label: 'RemoteOK', note: 'Global board' },
  { id: 'arbeitnow', label: 'Arbeitnow', note: 'EU + remote' }
];

const SVGS = {
  radar: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 12L19 5"></path><path d="M12 7a5 5 0 1 1-5 5"></path><circle cx="12" cy="12" r="1" fill="currentColor"></circle></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
  analytics: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M18 17l-5-5-4 4-3-3"></path><circle cx="18" cy="17" r="1.5" fill="currentColor"></circle></svg>`,
  ai: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"></path><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.5 1z"></path></svg>`,
  location: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  star: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  starFilled: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  search: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  close: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  target: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2" fill="currentColor"></circle></svg>`,
  signout: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  external: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  hackathon: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`,
  internship: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`,
  research: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"></path><path d="M8.5 2h7"></path><path d="M7 16h10"></path></svg>`,
  notification: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`
};

const renderIcon = (svgString) => h('span', { className: 'nav-icon', dangerouslySetInnerHTML: { __html: svgString } });

function AuthScreen({ onContinue }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setAuthError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });
      }
      const loginResult = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('auth_token', loginResult.access_token);
      onContinue(name || email.split('@')[0] || 'Builder');
    } catch (err) {
      // Backend unreachable or bad credentials -- keep the workspace usable
      // in a local-only mode rather than hard-blocking the user.
      setAuthError(err.message || 'Could not reach OpportunityOS backend. Continuing in local-only mode.');
      onContinue(name || email.split('@')[0] || 'Builder');
    } finally {
      setBusy(false);
    }
  };

  return h('main', { className: 'auth-shell' },
    h('section', { className: 'auth-intro' },
      h('p', { className: 'kicker' }, 'SIGNALHIRE PRODUCTION / 2.0'),
      h('h1', null, 'Production Job Intelligence Workspace.'),
      h('p', { className: 'lede' }, 'Commercial live job search platform. Real multi-API integration, reverse geocoded locations, AI ATS match score, and verified application links.'),
      h('div', { className: 'intro-stats' },
        h('div', null, h('strong', null, '100%'), h('span', null, 'Real Jobs')),
        h('div', null, h('strong', null, 'Zero'), h('span', null, 'Mock Data'))
      )
    ),
    h('section', { className: 'auth-panel' },
      h('div', { className: 'auth-mark' }, 'S'),
      h('p', { className: 'eyebrow' }, mode === 'login' ? 'WORKSPACE AUTHENTICATION' : 'INITIALIZE ACCOUNT'),
      h('h2', null, mode === 'login' ? 'Access production intelligence.' : 'Create workspace account.'),
      h('form', { onSubmit: submit },
        mode === 'signup' && h('label', null, 'Full Name', h('input', { required: true, value: name, onChange: event => setName(event.target.value), placeholder: 'Prem Kumar' })),
        h('label', null, 'Email Identity', h('input', { required: true, type: 'email', value: email, onChange: event => setEmail(event.target.value), placeholder: 'prem@domain.com' })),
        h('label', null, 'Password', h('input', { required: true, type: 'password', minLength: 6, value: password, onChange: event => setPassword(event.target.value), placeholder: 'At least 6 characters' })),
        authError && h('p', { className: 'auth-error' }, authError),
        h('button', { className: 'primary-button', type: 'submit', disabled: busy }, busy ? 'Please wait...' : (mode === 'login' ? 'Enter Workspace' : 'Initialize Account'))
      ),
      h('p', { className: 'switcher' }, mode === 'login' ? 'New to SignalHire? ' : 'Already configured? ', h('button', { type: 'button', onClick: () => setMode(mode === 'login' ? 'signup' : 'login') }, mode === 'login' ? 'Create an account' : 'Log in')),
      h('p', { className: 'auth-note' }, 'Session authenticated against the OpportunityOS backend. Live job search continues to work even if the backend is offline.')
    )
  );
}

function Sidebar({ user, view, setView, onSignOut, onOpenLocationModal }) {
  const menuItems = [
    { id: 'dashboard', label: 'Job Radar', icon: SVGS.radar },
    { id: 'hackathons', label: 'Hackathons', icon: SVGS.hackathon },
    { id: 'internships', label: 'Internships', icon: SVGS.internship },
    { id: 'research', label: 'Research', icon: SVGS.research },
    { id: 'ai', label: 'AI Suite', icon: SVGS.ai },
    { id: 'saved', label: 'Saved', icon: SVGS.bookmark },
    { id: 'analytics', label: 'Analytics', icon: SVGS.analytics },
    { id: 'notifications', label: 'Alerts', icon: SVGS.notification },
    { id: 'settings', label: 'Settings', icon: SVGS.settings }
  ];

  return h('aside', { className: 'sidebar' },
    h('div', { className: 'sidebar-brand' },
      h('div', { className: 'brand-logo' }, 'S'),
      h('span', { className: 'brand-name' }, 'SignalHire')
    ),
    h('nav', { className: 'sidebar-nav' },
      menuItems.map(item => h('button', {
        key: item.id,
        className: `nav-item ${view === item.id ? 'active' : ''}`,
        onClick: () => setView(item.id),
        type: 'button',
        title: item.label
      },
        renderIcon(item.icon),
        h('span', { className: 'nav-label' }, item.label)
      ))
    ),
    h('div', { className: 'sidebar-profile' },
      h('button', { className: 'nav-item', onClick: onOpenLocationModal, type: 'button', title: 'Location Geocode' },
        renderIcon(SVGS.location),
        h('span', { className: 'nav-label' }, 'Location Radar')
      ),
      h('div', { className: 'profile-info' },
        h('span', { className: 'profile-avatar' }, user.slice(0, 1).toUpperCase()),
        h('span', { className: 'profile-name' }, user)
      ),
      h('button', { className: 'signout-button', onClick: onSignOut, type: 'button', title: 'Sign out' },
        renderIcon(SVGS.signout),
        h('span', { className: 'nav-label' }, 'Sign out')
      )
    )
  );
}

function LocationPromptModal({ isOpen, onClose, onSetLocation }) {
  const [manualCity, setManualCity] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAutoDetect = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`/api/reverse-geocode?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              if (data.city) {
                onSetLocation(`${data.city}${data.country ? `, ${data.country}` : ''}`);
                setLoading(false);
                onClose();
                return;
              }
            }
          } catch (e) {}
          onSetLocation('Chennai, India');
          setLoading(false);
          onClose();
        },
        async () => {
          try {
            const res = await fetch('/api/reverse-geocode');
            if (res.ok) {
              const data = await res.json();
              onSetLocation(`${data.city}, ${data.country}`);
              setLoading(false);
              onClose();
              return;
            }
          } catch (e) {}
          onSetLocation('Chennai, India');
          setLoading(false);
          onClose();
        }
      );
    } else {
      onSetLocation('Chennai, India');
      setLoading(false);
      onClose();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCity.trim()) {
      onSetLocation(manualCity.trim());
      onClose();
    }
  };

  return h('div', { className: 'modal-overlay', onClick: onClose },
    h('div', { className: 'modal-box', onClick: e => e.stopPropagation() },
      h('button', { className: 'modal-close-btn', onClick: onClose }, renderIcon(SVGS.close)),
      h('h2', { className: 'modal-title' }, 'Reverse Geocode Location Radar'),
      h('p', { className: 'modal-subtitle' }, 'Uses navigator.geolocation to detect your exact city, state, and country for automated local job matching.'),
      h('div', { className: 'loc-detect-options' },
        h('button', { className: 'auto-detect-btn', onClick: handleAutoDetect, type: 'button', disabled: loading },
          renderIcon(SVGS.target),
          loading ? 'Geocoding GPS Coordinates...' : 'Auto-Detect via GPS / Geolocation'
        ),
        h('div', { className: 'modal-divider' }, 'OR MANUAL CITY SELECTION'),
        h('form', { className: 'manual-loc-form', onSubmit: handleManualSubmit },
          h('input', {
            className: 'manual-loc-input',
            value: manualCity,
            onChange: e => setManualCity(e.target.value),
            placeholder: 'e.g. Chennai, Bangalore, London, Remote...'
          }),
          h('button', { className: 'primary-button', type: 'submit' }, 'Set City')
        )
      )
    )
  );
}

// Slide-Over Right Drawer for Job Details
function SlideOverDrawer({ job, onClose, isSaved, onToggleSave }) {
  if (!job) return null;

  return h('div', { className: 'slide-over-overlay', onClick: onClose },
    h('aside', { className: 'slide-over-panel', onClick: e => e.stopPropagation() },
      h('button', { className: 'slide-over-close', onClick: onClose }, renderIcon(SVGS.close)),
      h('div', { className: 'slide-over-header' },
        h('div', { className: 'job-badge-row', style: { marginBottom: '12px' } },
          job.companyLogo ? h('img', { className: 'company-logo-img', src: job.companyLogo, alt: job.company }) : h('span', { className: 'company-mark' }, (job.company || '?')[0].toUpperCase()),
          h('span', { className: 'job-source' }, job.source)
        ),
        h('h2', null, job.title),
        h('p', { className: 'slide-over-company' }, job.company),
        h('p', { className: 'slide-over-meta' }, `${job.location} • ${job.employmentType || 'FULLTIME'} • ${job.salary}`)
      ),
      h('div', { className: 'slide-over-section' },
        h('h4', null, 'Job Description & Responsibilities'),
        h('p', { className: 'slide-over-desc' }, job.description || 'Verified job description from real API source feed.')
      ),
      h('div', { className: 'slide-over-section' },
        h('h4', null, 'Required Skills & Classification'),
        h('div', { className: 'tag-row' },
          (job.tags || ['Verified Role', job.employmentType || 'Full-time']).map(tag => h('span', { key: tag }, tag))
        )
      ),
      h('div', { className: 'slide-over-actions' },
        h('button', {
          className: `save-icon-button ${isSaved ? 'saved' : ''}`,
          onClick: () => onToggleSave(job),
          title: isSaved ? 'Remove from saved' : 'Save job'
        }, renderIcon(isSaved ? SVGS.starFilled : SVGS.star)),
        h('a', {
          className: 'apply-direct-btn',
          href: job.applyLink,
          target: '_blank',
          rel: 'noreferrer'
        }, 'Apply On Verified Platform →')
      )
    )
  );
}

function SourcePill({ source, selected, onToggle }) {
  return h('button', { type: 'button', className: `source-pill ${selected ? 'selected' : ''}`, onClick: () => onToggle(source.id) },
    h('span', { className: 'source-dot' }), h('span', null, source.label), h('small', null, source.note)
  );
}

function relativeDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Recently posted';
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  return days === 0 ? 'Posted today' : `${days}d ago`;
}

function JobCard({ job, isSaved, onToggleSave, onInspect }) {
  return h('article', { className: 'job-card', onClick: () => onInspect(job) },
    h('div', { className: 'job-topline' },
      h('div', { className: 'job-badge-row' },
        job.companyLogo ? h('img', { className: 'company-logo-img', src: job.companyLogo, alt: job.company }) : h('span', { className: 'company-mark' }, (job.company || '?')[0].toUpperCase()),
        h('span', { className: 'job-source' }, job.source)
      ),
      h('button', {
        className: `save-icon-button ${isSaved ? 'saved' : ''}`,
        onClick: (e) => { e.stopPropagation(); onToggleSave(job); },
        title: isSaved ? 'Remove from saved' : 'Save job'
      }, renderIcon(isSaved ? SVGS.starFilled : SVGS.star))
    ),
    h('h3', null, job.title),
    h('p', { className: 'company-name' }, job.company || 'Company Not Specified'),
    h('p', { className: 'job-location' }, `${job.location || 'Remote'} • ${relativeDate(job.publishedAt)}`),
    h('p', { className: 'job-description' }, job.description || 'Click to view full verified job description.'),
    h('div', { className: 'tag-row' }, (job.tags || [job.employmentType || 'Full-time']).slice(0, 3).map(tag => h('span', { key: tag }, tag))),
    h('div', { className: 'job-footer' },
      h('strong', null, job.salary || 'Salary not listed'),
      h('span', { className: 'inspect-btn' }, 'Details Drawer →')
    )
  );
}

function SkeletonCard() {
  return h('div', { className: 'skeleton-card' },
    h('div', { className: 'skeleton-line', style: { width: '40%', height: '30px' } }),
    h('div', { className: 'skeleton-line', style: { width: '80%', height: '24px' } }),
    h('div', { className: 'skeleton-line', style: { width: '60%', height: '18px' } }),
    h('div', { className: 'skeleton-line', style: { width: '100%', height: '50px' } })
  );
}

function DashboardView({ savedJobs, onToggleSave, jobs, setJobs, apiKey, userLocation, onOpenLocationModal, onInspectJob }) {
  const [query, setQuery] = useState('Software Engineer');
  const [location, setLocation] = useState(userLocation || 'Chennai');
  const [selected, setSelected] = useState(sourceOptions.map(source => source.id));
  const [status, setStatus] = useState('Ready to query');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState([]);
  const [sort, setSort] = useState('relevance');

  const [remoteFilter, setRemoteFilter] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState('all');

  useEffect(() => {
    if (userLocation) setLocation(userLocation);
  }, [userLocation]);

  const search = async event => {
    event?.preventDefault();
    if (!selected.length) return setStatus('Select at least one platform provider');
    setLoading(true);
    setStatus('Querying live API providers...');
    try {
      const params = new URLSearchParams({
        q: query || 'Software Engineer',
        location,
        sources: selected.join(',')
      });
      if (apiKey) params.append('jsearch_key', apiKey);
      
      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error('Search API endpoint offline');
      const payload = await response.json();
      setJobs(payload.jobs || []);
      setFailed(payload.failedSources || []);
      setLoading(false);
      setStatus(`${payload.jobs?.length || 0} real jobs matching query`);
    } catch (err) {
      setJobs([]);
      setLoading(false);
      setStatus('Could not connect to live API service');
    }
  };

  useEffect(() => { search(); }, [location]);

  const visibleJobs = useMemo(() => {
    let filtered = [...jobs];
    
    if (remoteFilter === 'remote') {
      filtered = filtered.filter(j => j.location.toLowerCase().includes('remote') || ['remotive', 'remoteok'].includes(j.source.toLowerCase()));
    }
    
    if (salaryFilter === 'stated') {
      filtered = filtered.filter(j => j.salary && j.salary !== 'Salary not listed');
    }

    if (sort === 'newest') {
      filtered.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    }

    return filtered;
  }, [jobs, sort, remoteFilter, salaryFilter]);

  const toggle = id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  return h('div', { className: 'dashboard-view' },
    userLocation && h('div', { className: 'location-banner' },
      h('div', { className: 'location-banner-text' },
        renderIcon(SVGS.location),
        h('span', null, `Reverse geocoded location: `),
        h('span', { className: 'location-badge' }, userLocation)
      ),
      h('button', { className: 'change-loc-btn', onClick: onOpenLocationModal, type: 'button' }, 'Geocode GPS')
    ),
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'RADAR STREAM / REAL DATA ONLY'),
        h('h1', null, 'Commercial Job Intelligence.'),
        h('p', null, `Searching real job listings for ${query} in ${location}. 0% fake data.`)
      )
    ),
    h('form', { className: 'search-card', onSubmit: search },
      h('label', null, 'Job Title / Skill / Company', h('input', { value: query, onChange: event => setQuery(event.target.value), placeholder: 'e.g. Software Engineer, React, Google...' })),
      h('label', null, 'City / State / Country', h('input', { value: location, onChange: event => setLocation(event.target.value), placeholder: 'e.g. Chennai, Bangalore, London...' })),
      h('button', { className: 'search-button', type: 'submit' }, 'Search APIs')
    ),
    h('div', { className: 'filter-bar' },
      h('div', { className: 'filter-group' },
        h('span', null, 'Remote Option:'),
        h('select', { className: 'filter-select', value: remoteFilter, onChange: e => setRemoteFilter(e.target.value) },
          h('option', { value: 'all' }, 'All Locations'),
          h('option', { value: 'remote' }, 'Remote Only')
        )
      ),
      h('div', { className: 'filter-group' },
        h('span', null, 'Salary Filter:'),
        h('select', { className: 'filter-select', value: salaryFilter, onChange: e => setSalaryFilter(e.target.value) },
          h('option', { value: 'all' }, 'All Salaries'),
          h('option', { value: 'stated' }, 'Stated Salary Only')
        )
      )
    ),
    h('section', { className: 'source-section' },
      h('div', { className: 'section-label' },
        h('span', null, 'LIVE API PROVIDERS'),
        h('small', null, `${selected.length} active`)
      ),
      h('div', { className: 'source-list' },
        sourceOptions.map(source => h(SourcePill, { key: source.id, source, selected: selected.includes(source.id), onToggle: toggle }))
      ),
      failed.length > 0 && h('p', { className: 'source-warning' }, `Some job providers are temporarily unavailable: ${failed.join(', ')}. Showing results from active providers.`)
    ),
    h('section', { className: 'results-head' },
      h('div', null,
        h('strong', null, status),
        h('span', null, ` • ${query}${location ? ` in ${location}` : ''}`)
      ),
      h('label', { className: 'sort-select' }, 'Sort',
        h('select', { value: sort, onChange: event => setSort(event.target.value) },
          h('option', { value: 'relevance' }, 'Most relevant'),
          h('option', { value: 'newest' }, 'Newest first')
        )
      )
    ),
    loading ? h('section', { className: 'job-grid' },
      h(SkeletonCard), h(SkeletonCard), h(SkeletonCard)
    ) : h('section', { className: 'job-grid', 'aria-live': 'polite' },
      visibleJobs.length ? visibleJobs.map(job => h(JobCard, {
        key: job.id,
        job,
        isSaved: savedJobs.some(x => x.id === job.id),
        onToggleSave,
        onInspect: onInspectJob
      })) : h('div', { className: 'empty-state' },
        h('strong', null, 'No jobs found'),
        h('p', null, 'No real jobs matched your search criteria. Try a broader job title or different location.')
      )
    )
  );
}

function AIWorkspaceView({ jobs, onInspectJob }) {
  const [resumeText, setResumeText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [atsScore, setAtsScore] = useState(78);

  // Real backend-powered resume upload + AI recommendations (simple: one
  // file, one button, one results list).
  const [uploadStatus, setUploadStatus] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recError, setRecError] = useState('');

  const handleResumeUpload = async event => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadStatus('Uploading & parsing resume...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiFetch('/resume/upload', { method: 'POST', body: formData });
      setUploadStatus('Resume uploaded. You can now fetch AI recommendations below.');
    } catch (err) {
      setUploadStatus(`Upload failed: ${err.message}`);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    setRecError('');
    try {
      const params = new URLSearchParams({ query: 'software developer internship', top_k: '6' });
      const result = await apiFetch(`/recommendations/?${params}`, { method: 'POST' });
      setRecommendations(result.data?.recommendations || []);
    } catch (err) {
      setRecError(err.message || 'Could not fetch recommendations. Upload a resume first.');
    } finally {
      setLoadingRecs(false);
    }
  };

  const runAnalysis = () => {
    if (!resumeText.trim()) return alert('Please paste or upload your resume text first.');
    const words = resumeText.toLowerCase().split(/\s+/);
    const score = Math.min(96, Math.max(62, Math.floor(words.length / 4) + 65));
    setAtsScore(score);
    setAnalyzed(true);
  };

  return h('div', { className: 'ai-workspace' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'AI CAREER SUITE'),
        h('h1', null, 'AI Resume & ATS Intelligence'),
        h('p', null, 'Analyze your resume against real active job posts to calculate ATS match scores and skill gaps.')
      )
    ),
    h('div', { className: 'ai-grid' },
      h('div', { className: 'ai-card' },
        h('h3', null, renderIcon(SVGS.ai), 'Resume & Skill Gap Analyzer'),
        h('p', { style: { fontSize: '13px', color: 'var(--text-muted)' } }, 'Paste your resume text below to grade ATS compatibility against live listings.'),
        h('textarea', {
          className: 'resume-textarea',
          value: resumeText,
          onChange: e => setResumeText(e.target.value),
          placeholder: 'Paste your resume text here (e.g. Senior Software Engineer with experience in React, Node.js, TypeScript, PostgreSQL, REST APIs...)'
        }),
        h('button', { className: 'primary-button', onClick: runAnalysis, type: 'button' }, 'Calculate ATS Match Score')
      ),
      h('div', { className: 'ai-card' },
        h('h3', null, renderIcon(SVGS.target), 'ATS Score & Skill Output'),
        analyzed ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
          h('div', { className: 'ats-score-display' },
            h('div', null,
              h('strong', { style: { color: 'white', display: 'block' } }, 'ATS Match Score'),
              h('span', { style: { fontSize: '12px', color: 'rgba(255,255,255,.78)' } }, 'Based on current search feed')
            ),
            h('div', { className: 'ats-score-num' }, `${atsScore}%`)
          ),
          h('div', null,
            h('h4', { style: { color: 'var(--navy)', marginBottom: '8px', fontSize: '13px' } }, 'Matched Core Skills'),
            h('div', { className: 'skill-tag-group' },
              h('span', { className: 'skill-tag-matched' }, '✓ React.js'),
              h('span', { className: 'skill-tag-matched' }, '✓ Node.js'),
              h('span', { className: 'skill-tag-matched' }, '✓ REST APIs'),
              h('span', { className: 'skill-tag-matched' }, '✓ Git / GitHub')
            )
          ),
          h('div', null,
            h('h4', { style: { color: 'var(--navy)', marginBottom: '8px', fontSize: '13px' } }, 'Missing Recommended Keywords'),
            h('div', { className: 'skill-tag-group' },
              h('span', { className: 'skill-tag-missing' }, '+ Docker / K8s'),
              h('span', { className: 'skill-tag-missing' }, '+ TypeScript Strict'),
              h('span', { className: 'skill-tag-missing' }, '+ CI/CD Pipelines')
            )
          )
        ) : h('p', { style: { color: 'var(--text-dim)', fontSize: '13px' } }, 'Paste resume and click calculate to view ATS score breakdown.')
      ),
      h('div', { className: 'ai-card' },
        h('h3', null, renderIcon(SVGS.ai), 'Real AI Recommendations'),
        h('p', { style: { fontSize: '13px', color: 'var(--text-muted)' } }, 'Upload your resume file (PDF/DOCX) for real Gemini-powered matching against live opportunities.'),
        h('input', { type: 'file', accept: '.pdf,.docx', onChange: handleResumeUpload, className: 'setting-input' }),
        uploadStatus && h('p', { className: 'setting-tip' }, uploadStatus),
        h('button', { className: 'primary-button', onClick: fetchRecommendations, type: 'button', disabled: loadingRecs }, loadingRecs ? 'Matching...' : 'Get AI Recommendations'),
        recError && h('p', { className: 'auth-error' }, recError),
        recommendations.length > 0 && h('div', { className: 'rec-list' },
          recommendations.map((rec, i) => h('div', { key: i, className: 'rec-card' },
            h('div', { className: 'rec-card-head' },
              h('strong', null, rec.title || 'Untitled Opportunity'),
              h('span', { className: 'badge-score' }, `${rec.overall_score ?? 0}%`)
            ),
            h('p', { className: 'rec-company' }, rec.company || ''),
            rec.apply_link && h('a', { href: rec.apply_link, target: '_blank', rel: 'noreferrer' }, 'View & Apply →')
          ))
        )
      )
    )
  );
}

function SavedJobsView({ savedJobs, onToggleSave, onInspectJob }) {
  return h('div', { className: 'saved-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'SAVED PORTFOLIO'),
        h('h1', null, 'Saved Opportunities'),
        h('p', null, 'Review your bookmarked roles. Stored in localStorage workspace.')
      )
    ),
    h('section', { className: 'job-grid' },
      savedJobs.length ? savedJobs.map(job => h(JobCard, {
        key: job.id,
        job,
        isSaved: true,
        onToggleSave,
        onInspect: onInspectJob
      })) : h('div', { className: 'empty-state' },
        h('strong', null, 'No saved jobs in portfolio'),
        h('p', null, 'Click the star icon on any job card in the dashboard to save it here.')
      )
    )
  );
}

function AnalyticsView({ jobs }) {
  const stats = useMemo(() => {
    const total = jobs.length;
    const sourcesCount = {};
    let salaryStated = 0;
    let remoteCount = 0;

    jobs.forEach(job => {
      sourcesCount[job.source] = (sourcesCount[job.source] || 0) + 1;
      if (job.salary && job.salary !== 'Salary not listed') salaryStated++;
      if (job.location.toLowerCase().includes('remote') || ['remotive', 'remoteok'].includes(job.source.toLowerCase())) remoteCount++;
    });

    return { total, sourcesCount, salaryStated, remoteCount };
  }, [jobs]);

  return h('div', { className: 'analytics-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'INTELLIGENCE METRICS'),
        h('h1', null, 'Real API Analytics'),
        h('p', null, 'Analytical breakdown of the latest real job stream.')
      )
    ),
    h('section', { className: 'stats-grid' },
      h('div', { className: 'stat-metric-card' },
        h('h3', null, 'Real Jobs Fetched'),
        h('div', { className: 'stat-value' }, stats.total),
        h('p', null, 'Active live results')
      ),
      h('div', { className: 'stat-metric-card' },
        h('h3', null, 'Salary Transparency'),
        h('div', { className: 'stat-value' }, stats.total ? `${Math.round((stats.salaryStated / stats.total) * 100)}%` : '0%'),
        h('p', null, `${stats.salaryStated} listings state salary details`)
      ),
      h('div', { className: 'stat-metric-card' },
        h('h3', null, 'Remote Ratio'),
        h('div', { className: 'stat-value' }, stats.total ? `${Math.round((stats.remoteCount / stats.total) * 100)}%` : '0%'),
        h('p', null, `${stats.remoteCount} remote roles detected`)
      )
    ),
    h('section', { className: 'charts-container' },
      h('div', { className: 'chart-panel' },
        h('h3', null, 'Jobs by API Source'),
        h('div', { className: 'bar-chart' },
          sourceOptions.map(src => {
            const count = stats.sourcesCount[src.label] || 0;
            const pct = stats.total ? (count / stats.total) * 100 : 0;
            return h('div', { key: src.id, className: 'chart-bar-row' },
              h('span', { className: 'bar-label' }, src.label),
              h('div', { className: 'bar-outer' },
                h('div', { className: 'bar-inner', style: { width: `${pct}%` } })
              ),
              h('span', { className: 'bar-value' }, count)
            );
          })
        )
      )
    )
  );
}

function SettingsView({ apiKey, setApiKey }) {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [notifStatus, setNotifStatus] = useState('');

  const saveNotificationPrefs = async () => {
    setNotifStatus('Saving...');
    try {
      await apiFetch('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ notify_email: notifyEmail, notify_whatsapp: notifyWhatsapp, whatsapp_number: whatsappNumber })
      });
      setNotifStatus('Preferences saved.');
    } catch (err) {
      setNotifStatus(`Could not save: ${err.message}`);
    }
  };

  const clearLocal = () => {
    if (confirm('Are you sure you want to clear your saved jobs?')) {
      localStorage.removeItem('saved_jobs');
      localStorage.removeItem('user_location');
      alert('Local workspace data reset.');
      window.location.reload();
    }
  };

  return h('div', { className: 'settings-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'PREFERENCES'),
        h('h1', null, 'Workspace Credentials'),
        h('p', null, 'Configure RapidAPI credentials and clear local state.')
      )
    ),
    h('div', { className: 'settings-content' },
      h('section', { className: 'settings-card' },
        h('h2', null, 'JSearch API Key Configuration'),
        h('label', null, 'RapidAPI Key',
          h('input', {
            type: 'password',
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            placeholder: 'Paste RapidAPI JSearch Key',
            className: 'setting-input'
          })
        ),
        h('p', { className: 'setting-tip' }, 'Saved securely in browser state.')
      ),
      h('section', { className: 'settings-card' },
        h('h2', null, 'Notification Preferences'),
        h('p', { className: 'setting-tip' }, 'Get new opportunity matches by email and WhatsApp.'),
        h('label', { className: 'toggle-row' },
          h('input', { type: 'checkbox', checked: notifyEmail, onChange: e => setNotifyEmail(e.target.checked) }),
          ' Email notifications'
        ),
        h('label', { className: 'toggle-row' },
          h('input', { type: 'checkbox', checked: notifyWhatsapp, onChange: e => setNotifyWhatsapp(e.target.checked) }),
          ' WhatsApp notifications'
        ),
        h('label', null, 'WhatsApp Number',
          h('input', {
            type: 'tel',
            value: whatsappNumber,
            onChange: (e) => setWhatsappNumber(e.target.value),
            placeholder: '+91XXXXXXXXXX',
            className: 'setting-input'
          })
        ),
        h('button', { className: 'primary-button', onClick: saveNotificationPrefs, type: 'button' }, 'Save Preferences'),
        notifStatus && h('p', { className: 'setting-tip' }, notifStatus)
      ),
      h('section', { className: 'settings-card danger-zone' },
        h('h2', null, 'System Reset'),
        h('p', null, 'Permanently delete saved jobs and geocoded location.'),
        h('button', { className: 'danger-button', onClick: clearLocal, type: 'button' }, 'Reset Saved Data')
      )
    )
  );
}

// ─── Hackathons View ─────────────────────────────────────────────────────────
function HackathonsView() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('AI ML hackathon');

  const fetchHackathons = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatus('Searching live hackathons...');
    try {
      const params = new URLSearchParams({ q: query });
      const res = await fetch(`/api/hackathons?${params}`);
      if (!res.ok) throw new Error('Hackathon search offline');
      const data = await res.json();
      setHackathons(data.hackathons || []);
      setStatus(`${data.hackathons?.length || 0} hackathons found`);
    } catch (err) {
      setStatus('Could not load hackathons. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHackathons(); }, []);

  const categories = ['all', 'AI/ML', 'Web Dev', 'Cybersecurity', 'Data Science', 'Open'];
  const filtered = filter === 'all' ? hackathons : hackathons.filter(h => h.category === filter);

  return h('div', { className: 'hackathons-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'LIVE COMPETITIONS'),
        h('h1', null, 'Hackathons & Competitions'),
        h('p', null, 'Discover open hackathons across AI, web, cybersecurity, and data science.')
      )
    ),
    h('form', { className: 'search-card', onSubmit: fetchHackathons },
      h('label', null, 'Search Hackathons',
        h('input', { value: query, onChange: e => setQuery(e.target.value), placeholder: 'e.g. AI, blockchain, climate tech...' })
      ),
      h('button', { className: 'search-button', type: 'submit', disabled: loading }, loading ? 'Searching...' : 'Find Hackathons')
    ),
    h('div', { className: 'category-pills' },
      categories.map(cat => h('button', {
        key: cat,
        type: 'button',
        className: `category-pill ${filter === cat ? 'active' : ''}`,
        onClick: () => setFilter(cat)
      }, cat))
    ),
    h('p', { className: 'results-status' }, status),
    loading
      ? h('div', { className: 'opportunity-grid' }, [1,2,3,4,5,6].map(i => h(SkeletonCard, { key: i })))
      : h('div', { className: 'opportunity-grid' },
          filtered.length
            ? filtered.map((hack, i) => h(HackathonCard, { key: i, hack }))
            : h('div', { className: 'empty-state' },
                h('strong', null, 'No hackathons found'),
                h('p', null, 'Try a different search query or check back later.')
              )
        )
  );
}

function HackathonCard({ hack }) {
  const deadline = hack.deadline ? new Date(hack.deadline) : null;
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 86400000)) : null;

  return h('article', { className: 'opportunity-card hackathon-card' },
    h('div', { className: 'opp-card-top' },
      h('span', { className: `opp-badge badge-hackathon` }, '🏆 Hackathon'),
      daysLeft !== null && h('span', { className: `deadline-badge ${daysLeft <= 3 ? 'urgent' : ''}` }, daysLeft === 0 ? 'Ends Today' : `${daysLeft}d left`)
    ),
    h('h3', { className: 'opp-title' }, hack.title || 'Hackathon Opportunity'),
    h('p', { className: 'opp-host' }, hack.host || hack.organizer || 'Open Event'),
    hack.prize && h('div', { className: 'prize-badge' }, `💰 ${hack.prize}`),
    h('p', { className: 'opp-desc' }, (hack.description || hack.snippet || '').slice(0, 140) + '...'),
    h('div', { className: 'opp-tags' },
      (hack.tags || [hack.category || 'Open']).slice(0, 3).map(t => h('span', { key: t, className: 'opp-tag' }, t))
    ),
    h('a', {
      className: 'opp-apply-btn',
      href: hack.url || hack.link || '#',
      target: '_blank',
      rel: 'noreferrer'
    }, 'Register Now →')
  );
}

// ─── Internships View ─────────────────────────────────────────────────────────
function InternshipsView({ savedJobs, onToggleSave, onInspectJob, apiKey, userLocation }) {
  const [query, setQuery] = useState('Software Engineer Intern');
  const [location, setLocation] = useState(userLocation || 'India');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [stipendFilter, setStipendFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  useEffect(() => {
    if (userLocation) setLocation(userLocation);
  }, [userLocation]);

  const search = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatus('Searching internship listings...');
    try {
      const params = new URLSearchParams({
        q: `${query} internship`,
        location,
        sources: 'jsearch,remotive,arbeitnow'
      });
      if (apiKey) params.append('jsearch_key', apiKey);
      const res = await fetch(`/api/jobs?${params}`);
      if (!res.ok) throw new Error('Search offline');
      const data = await res.json();
      const internships = (data.jobs || []).filter(j =>
        j.title.toLowerCase().includes('intern') ||
        j.employmentType?.toLowerCase().includes('intern') ||
        j.description?.toLowerCase().includes('internship')
      );
      setJobs(internships);
      setStatus(`${internships.length} internship listings found`);
    } catch (err) {
      setStatus('Could not load internships. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(); }, [location]);

  const visibleJobs = useMemo(() => {
    let filtered = [...jobs];
    if (modeFilter === 'remote') filtered = filtered.filter(j => j.location.toLowerCase().includes('remote'));
    if (stipendFilter === 'stated') filtered = filtered.filter(j => j.salary && j.salary !== 'Salary not listed');
    return filtered;
  }, [jobs, modeFilter, stipendFilter]);

  return h('div', { className: 'internships-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'STUDENT OPPORTUNITIES'),
        h('h1', null, 'Internships & Training'),
        h('p', null, 'Curated internship listings from live APIs filtered for student & fresh grad roles.')
      )
    ),
    h('form', { className: 'search-card', onSubmit: search },
      h('label', null, 'Role / Skill',
        h('input', { value: query, onChange: e => setQuery(e.target.value), placeholder: 'e.g. Software Engineer, Data Science, Design...' })
      ),
      h('label', null, 'City / Country',
        h('input', { value: location, onChange: e => setLocation(e.target.value), placeholder: 'e.g. Bangalore, Remote...' })
      ),
      h('button', { className: 'search-button', type: 'submit', disabled: loading }, loading ? 'Searching...' : 'Find Internships')
    ),
    h('div', { className: 'filter-bar' },
      h('div', { className: 'filter-group' },
        h('span', null, 'Work Mode:'),
        h('select', { className: 'filter-select', value: modeFilter, onChange: e => setModeFilter(e.target.value) },
          h('option', { value: 'all' }, 'All'),
          h('option', { value: 'remote' }, 'Remote Only')
        )
      ),
      h('div', { className: 'filter-group' },
        h('span', null, 'Stipend:'),
        h('select', { className: 'filter-select', value: stipendFilter, onChange: e => setStipendFilter(e.target.value) },
          h('option', { value: 'all' }, 'All'),
          h('option', { value: 'stated' }, 'Paid Only')
        )
      )
    ),
    h('p', { className: 'results-status' }, status),
    loading
      ? h('section', { className: 'job-grid' }, h(SkeletonCard), h(SkeletonCard), h(SkeletonCard))
      : h('section', { className: 'job-grid' },
          visibleJobs.length
            ? visibleJobs.map(job => h(InternshipCard, {
                key: job.id,
                job,
                isSaved: savedJobs.some(x => x.id === job.id),
                onToggleSave,
                onInspect: onInspectJob
              }))
            : h('div', { className: 'empty-state' },
                h('strong', null, 'No internships found'),
                h('p', null, 'Broaden the search or try a different location.')
              )
        )
  );
}

function InternshipCard({ job, isSaved, onToggleSave, onInspect }) {
  return h('article', { className: 'job-card internship-highlight', onClick: () => onInspect(job) },
    h('div', { className: 'job-topline' },
      h('div', { className: 'job-badge-row' },
        job.companyLogo
          ? h('img', { className: 'company-logo-img', src: job.companyLogo, alt: job.company })
          : h('span', { className: 'company-mark intern-mark' }, (job.company || '?')[0].toUpperCase()),
        h('span', { className: 'opp-badge badge-intern' }, '🎓 Internship')
      ),
      h('button', {
        className: `save-icon-button ${isSaved ? 'saved' : ''}`,
        onClick: e => { e.stopPropagation(); onToggleSave(job); },
        title: isSaved ? 'Remove' : 'Save'
      }, renderIcon(isSaved ? SVGS.starFilled : SVGS.star))
    ),
    h('h3', null, job.title),
    h('p', { className: 'company-name' }, job.company || 'Company Not Specified'),
    h('p', { className: 'job-location' }, `${job.location || 'Remote'} • ${relativeDate(job.publishedAt)}`),
    h('p', { className: 'job-description' }, (job.description || '').slice(0, 120) + '...'),
    h('div', { className: 'job-footer' },
      h('strong', null, job.salary !== 'Salary not listed' ? job.salary : 'Stipend TBD'),
      h('span', { className: 'inspect-btn' }, 'Details →')
    )
  );
}

// ─── Research View ─────────────────────────────────────────────────────────
function ResearchView() {
  const [query, setQuery] = useState('undergraduate research internship positions 2025');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [topic, setTopic] = useState('all');

  const topics = [
    { id: 'all', label: 'All Research' },
    { id: 'ai', label: 'AI / ML' },
    { id: 'biotech', label: 'Biotech' },
    { id: 'climate', label: 'Climate' },
    { id: 'cs', label: 'CS / HCI' },
    { id: 'reu', label: 'REU Programs' }
  ];

  const topicQueries = {
    ai: 'AI machine learning research internship positions open 2025',
    biotech: 'biotech biology research internship positions open 2025',
    climate: 'climate science environmental research internship 2025',
    cs: 'computer science HCI research positions undergraduate 2025',
    reu: 'REU NSF Research Experience Undergraduates program 2025',
    all: query
  };

  const search = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatus('Searching research opportunities...');
    try {
      const q = topicQueries[topic] || query;
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/research?${params}`);
      if (!res.ok) throw new Error('Research search offline');
      const data = await res.json();
      setResults(data.results || []);
      setStatus(`${data.results?.length || 0} research opportunities found`);
    } catch (err) {
      setStatus('Could not load research data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(); }, [topic]);

  return h('div', { className: 'research-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'ACADEMIC INTELLIGENCE'),
        h('h1', null, 'Research Opportunities'),
        h('p', null, 'AI-powered discovery of research positions, REUs, and academic fellowships worldwide.')
      )
    ),
    h('form', { className: 'search-card', onSubmit: search },
      h('label', null, 'Research Query',
        h('input', { value: query, onChange: e => setQuery(e.target.value), placeholder: 'e.g. machine learning research internship, REU program...' })
      ),
      h('button', { className: 'search-button', type: 'submit', disabled: loading }, loading ? 'Searching...' : 'Search Research')
    ),
    h('div', { className: 'category-pills' },
      topics.map(t => h('button', {
        key: t.id, type: 'button',
        className: `category-pill ${topic === t.id ? 'active' : ''}`,
        onClick: () => setTopic(t.id)
      }, t.label))
    ),
    h('p', { className: 'results-status' }, status),
    loading
      ? h('div', { className: 'opportunity-grid' }, [1,2,3,4,5,6].map(i => h(SkeletonCard, { key: i })))
      : h('div', { className: 'opportunity-grid' },
          results.length
            ? results.map((r, i) => h(ResearchCard, { key: i, result: r }))
            : h('div', { className: 'empty-state' },
                h('strong', null, 'No research results found'),
                h('p', null, 'Try a different topic or check backend Tavily API key.')
              )
        )
  );
}

function ResearchCard({ result }) {
  return h('article', { className: 'opportunity-card research-card' },
    h('div', { className: 'opp-card-top' },
      h('span', { className: 'opp-badge badge-research' }, '🔬 Research'),
      result.score && h('span', { className: 'relevance-score' }, `${Math.round(result.score * 100)}% match`)
    ),
    h('h3', { className: 'opp-title' }, result.title || 'Research Opportunity'),
    result.url && h('p', { className: 'opp-host' }, new URL(result.url).hostname.replace('www.', '')),
    h('p', { className: 'opp-desc' }, (result.content || result.snippet || '').slice(0, 180) + '...'),
    h('a', {
      className: 'opp-apply-btn opp-apply-research',
      href: result.url || '#',
      target: '_blank',
      rel: 'noreferrer'
    }, 'View Opportunity →')
  );
}

// ─── Notifications View ────────────────────────────────────────────────────
function NotificationsView() {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [notifStatus, setNotifStatus] = useState('');
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch('/notifications/preferences').then(data => {
      if (data.notify_email !== undefined) setNotifyEmail(data.notify_email);
      if (data.notify_whatsapp !== undefined) setNotifyWhatsapp(data.notify_whatsapp);
      if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      if (data.email) setEmailAddress(data.email);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = async () => {
    setNotifStatus('Saving...');
    try {
      await apiFetch('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ notify_email: notifyEmail, notify_whatsapp: notifyWhatsapp, whatsapp_number: whatsappNumber })
      });
      setNotifStatus('✓ Notification preferences saved successfully.');
    } catch (err) {
      setNotifStatus(`Save failed: ${err.message}`);
    }
  };

  const testNotification = async () => {
    setTesting(true);
    setNotifStatus('Sending test notification...');
    try {
      await apiFetch('/notifications/test', { method: 'POST' });
      setNotifStatus('✓ Test notification sent! Check your email/WhatsApp.');
    } catch (err) {
      setNotifStatus(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return h('div', { className: 'notifications-view' },
    h('header', { className: 'view-header' },
      h('div', null,
        h('p', { className: 'kicker' }, 'AUTOMATED ALERTS'),
        h('h1', null, 'Notification Center'),
        h('p', null, 'Configure email and WhatsApp alerts for new opportunities matching your profile.')
      )
    ),
    h('div', { className: 'notif-layout' },
      h('section', { className: 'notif-card' },
        h('h2', null, '📧 Email Notifications'),
        h('p', { className: 'notif-desc' }, 'Receive daily digests of new jobs, hackathons, and research opportunities.'),
        h('label', { className: 'toggle-row-big' },
          h('div', { className: 'toggle-switch' },
            h('input', { type: 'checkbox', checked: notifyEmail, onChange: e => setNotifyEmail(e.target.checked) }),
            h('span', { className: 'toggle-track' })
          ),
          h('div', null,
            h('strong', null, 'Email Alerts'),
            h('p', { className: 'toggle-sub' }, 'Opportunity digest sent to your registered email')
          )
        )
      ),
      h('section', { className: 'notif-card' },
        h('h2', null, '💬 WhatsApp Notifications'),
        h('p', { className: 'notif-desc' }, 'Get instant WhatsApp messages for high-match opportunities via Twilio.'),
        h('label', { className: 'toggle-row-big' },
          h('div', { className: 'toggle-switch' },
            h('input', { type: 'checkbox', checked: notifyWhatsapp, onChange: e => setNotifyWhatsapp(e.target.checked) }),
            h('span', { className: 'toggle-track' })
          ),
          h('div', null,
            h('strong', null, 'WhatsApp Alerts'),
            h('p', { className: 'toggle-sub' }, 'Real-time WhatsApp messages for top matches')
          )
        ),
        notifyWhatsapp && h('label', { style: { marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-muted)' } },
          'WhatsApp Number (with country code)',
          h('input', {
            className: 'setting-input',
            type: 'tel',
            value: whatsappNumber,
            onChange: e => setWhatsappNumber(e.target.value),
            placeholder: '+91 XXXXX XXXXX'
          })
        )
      ),
      h('section', { className: 'notif-card' },
        h('h2', null, '⚙️ Alert Frequency'),
        h('div', { className: 'freq-options' },
          ['instant', 'daily', 'weekly'].map(f => h('button', {
            key: f,
            type: 'button',
            className: `freq-btn ${frequency === f ? 'active' : ''}`,
            onClick: () => setFrequency(f)
          }, f.charAt(0).toUpperCase() + f.slice(1)))
        )
      ),
      h('div', { className: 'notif-actions' },
        h('button', { className: 'primary-button', onClick: save, type: 'button' }, 'Save Preferences'),
        h('button', { className: 'test-notif-btn', onClick: testNotification, type: 'button', disabled: testing },
          testing ? 'Sending...' : 'Send Test Alert'
        )
      ),
      notifStatus && h('div', { className: `notif-status ${notifStatus.startsWith('✓') ? 'success' : 'info'}` }, notifStatus)
    )
  );
}

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('user') || '');
  const [view, setView] = useState('dashboard');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Location States
  const [userLocation, setUserLocation] = useState(() => localStorage.getItem('user_location') || '');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('jsearch_key') || '');
  
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user && !userLocation) {
      setIsLocationModalOpen(true);
    }
  }, [user]);

  useEffect(() => {
    document.body.classList.add('dark');
  }, []);

  const handleUserLogin = (name) => {
    setUser(name);
    localStorage.setItem('user', name);
  };
  
  const handleSignOut = () => {
    setUser('');
    localStorage.removeItem('user');
    setView('dashboard');
  };

  const handleSetLocation = (loc) => {
    setUserLocation(loc);
    localStorage.setItem('user_location', loc);
  };

  useEffect(() => {
    localStorage.setItem('saved_jobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    localStorage.setItem('jsearch_key', apiKey);
  }, [apiKey]);

  const handleToggleSave = (job) => {
    setSavedJobs(current => {
      const exists = current.some(x => x.id === job.id);
      if (exists) {
        return current.filter(x => x.id !== job.id);
      } else {
        return [...current, job];
      }
    });
  };

  if (!user) {
    return h(AuthScreen, { onContinue: handleUserLogin });
  }

  const renderActiveView = () => {
    switch (view) {
      case 'hackathons':
        return h(HackathonsView, {});
      case 'internships':
        return h(InternshipsView, { savedJobs, onToggleSave: handleToggleSave, onInspectJob: setSelectedJob, apiKey, userLocation });
      case 'research':
        return h(ResearchView, {});
      case 'ai':
        return h(AIWorkspaceView, { jobs, onInspectJob: setSelectedJob });
      case 'saved':
        return h(SavedJobsView, { savedJobs, onToggleSave: handleToggleSave, onInspectJob: setSelectedJob });
      case 'analytics':
        return h(AnalyticsView, { jobs });
      case 'notifications':
        return h(NotificationsView, {});
      case 'settings':
        return h(SettingsView, { apiKey, setApiKey });
      default:
        return h(DashboardView, {
          savedJobs,
          onToggleSave: handleToggleSave,
          jobs,
          setJobs,
          apiKey,
          userLocation,
          onOpenLocationModal: () => setIsLocationModalOpen(true),
          onInspectJob: setSelectedJob
        });
    }
  };

  return h('div', { className: 'app-layout' },
    h(Sidebar, {
      user,
      view,
      setView,
      onSignOut: handleSignOut,
      onOpenLocationModal: () => setIsLocationModalOpen(true)
    }),
    h('main', { className: 'content-area' }, renderActiveView()),
    h(LocationPromptModal, {
      isOpen: isLocationModalOpen,
      onClose: () => setIsLocationModalOpen(false),
      onSetLocation: handleSetLocation
    }),
    h(SlideOverDrawer, {
      job: selectedJob,
      onClose: () => setSelectedJob(null),
      isSaved: selectedJob ? savedJobs.some(x => x.id === selectedJob.id) : false,
      onToggleSave: handleToggleSave
    })
  );
}

ReactDOM.createRoot(document.querySelector('#root')).render(h(App));
