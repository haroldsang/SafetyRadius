import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Car,
  ChevronDown,
  CircleDot,
  Clock3,
  Filter,
  Home,
  Layers,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const INCIDENTS = [
  {
    id: 'sr-1042',
    type: 'Vehicle break-in',
    severity: 'medium',
    category: 'property',
    time: '18 min ago',
    hour: '9:42 PM',
    distance: '0.3 mi',
    area: 'Harbor Point Garage',
    address: 'Pier 4 & Atlantic Ave',
    x: 64,
    y: 33,
    status: 'verified',
    summary: 'Multiple parked vehicles reported with broken passenger windows near the south garage entrance.',
  },
  {
    id: 'sr-1037',
    type: 'Suspicious activity',
    severity: 'low',
    category: 'quality',
    time: '41 min ago',
    hour: '9:19 PM',
    distance: '0.7 mi',
    area: 'Civic Center',
    address: 'Market St & 8th',
    x: 42,
    y: 47,
    status: 'monitoring',
    summary: 'Several calls described people checking door handles along the retail corridor.',
  },
  {
    id: 'sr-1029',
    type: 'Assault',
    severity: 'high',
    category: 'violent',
    time: '1 hr ago',
    hour: '8:55 PM',
    distance: '1.1 mi',
    area: 'Union Square',
    address: 'Grant Ave & Geary St',
    x: 51,
    y: 55,
    status: 'active',
    summary: 'Responders were dispatched after a reported fight outside a transit stop.',
  },
  {
    id: 'sr-1018',
    type: 'Package theft',
    severity: 'medium',
    category: 'property',
    time: '2 hr ago',
    hour: '7:36 PM',
    distance: '0.5 mi',
    area: 'Mission Bay',
    address: 'Berry St & 4th',
    x: 58,
    y: 70,
    status: 'verified',
    summary: 'Residential lobby camera captured a package removal from the mail area.',
  },
  {
    id: 'sr-1004',
    type: 'Robbery',
    severity: 'high',
    category: 'violent',
    time: 'Yesterday',
    hour: '11:08 PM',
    distance: '1.8 mi',
    area: 'SoMa',
    address: 'Folsom St & 6th',
    x: 37,
    y: 68,
    status: 'closed',
    summary: 'Victim reported property taken near a late-night food pickup zone.',
  },
  {
    id: 'sr-0986',
    type: 'Bike theft',
    severity: 'low',
    category: 'property',
    time: 'Yesterday',
    hour: '4:14 PM',
    distance: '1.4 mi',
    area: 'North Waterfront',
    address: 'Embarcadero & Broadway',
    x: 71,
    y: 44,
    status: 'verified',
    summary: 'Locked bicycle removed from a sidewalk rack near the ferry path.',
  },
]

const NEIGHBORHOODS = [
  { name: 'Harbor Point', score: 78, trend: '+4', risk: 'Moderate', incidents: 18 },
  { name: 'Mission Bay', score: 72, trend: '-3', risk: 'Moderate', incidents: 24 },
  { name: 'Union Square', score: 61, trend: '-8', risk: 'Elevated', incidents: 37 },
  { name: 'North Waterfront', score: 84, trend: '+2', risk: 'Lower', incidents: 11 },
]

const CATEGORIES = [
  { key: 'all', label: 'All incidents' },
  { key: 'property', label: 'Property' },
  { key: 'violent', label: 'Violent' },
  { key: 'quality', label: 'Quality of life' },
]

const severityClass = {
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
}

function App() {
  const [query, setQuery] = useState('San Francisco, CA')
  const [category, setCategory] = useState('all')
  const [radius, setRadius] = useState(2)
  const [selectedId, setSelectedId] = useState(INCIDENTS[0].id)

  const visibleIncidents = useMemo(() => {
    return INCIDENTS.filter((incident) => category === 'all' || incident.category === category)
  }, [category])

  const selectedIncident = visibleIncidents.find((incident) => incident.id === selectedId) || visibleIncidents[0]
  const highCount = visibleIncidents.filter((incident) => incident.severity === 'high').length
  const safetyScore = Math.max(48, 86 - visibleIncidents.length * 3 - highCount * 5)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#overview" aria-label="SafeRadius home">
          <span><ShieldCheck size={22} /></span>
          <strong>SafeRadius</strong>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#map">Map</a>
          <a href="#feed">Feed</a>
          <a href="#score">Safety score</a>
          <a href="#alerts">Alerts</a>
        </nav>
        <button className="icon-button" type="button" aria-label="Notification settings">
          <Bell size={19} />
        </button>
      </header>

      <section id="overview" className="workspace">
        <aside className="control-panel" aria-label="Search and filters">
          <div className="search-card">
            <label htmlFor="location-search">Location</label>
            <div className="search-input">
              <Search size={18} />
              <input
                id="location-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="City, address, or ZIP"
              />
            </div>
          </div>

          <div className="filter-group">
            <div className="panel-heading">
              <span><Filter size={17} /> Filters</span>
              <button type="button" aria-label="Advanced filters"><SlidersHorizontal size={17} /></button>
            </div>
            <div className="category-grid">
              {CATEGORIES.map((item) => (
                <button
                  className={category === item.key ? 'active' : ''}
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setCategory(item.key)
                    setSelectedId(INCIDENTS.find((incident) => item.key === 'all' || incident.category === item.key)?.id)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="radius-control">
              <span>Radius <strong>{radius} mi</strong></span>
              <input
                min="1"
                max="5"
                step="1"
                type="range"
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
              />
            </label>
          </div>

          <section id="score" className="score-card">
            <div>
              <span className="section-kicker"><ShieldCheck size={16} /> Neighborhood score</span>
              <strong>{safetyScore}</strong>
              <p>Moderate risk, mostly property crime after evening commute hours.</p>
            </div>
            <div className="score-ring" style={{ '--score': `${safetyScore}%` }} aria-label={`Safety score ${safetyScore} out of 100`}>
              <span>{safetyScore}</span>
            </div>
          </section>

          <div className="insight-card">
            <span className="section-kicker"><Sparkles size={16} /> AI brief</span>
            <p>
              Recent reports cluster around garages, transit exits, and package rooms. The current pattern suggests
              property risk is highest from 7 PM to midnight within the selected radius.
            </p>
          </div>
        </aside>

        <section id="map" className="map-stage" aria-label="Incident map">
          <div className="map-toolbar">
            <div>
              <span>Live area overview</span>
              <strong>{query || 'Selected area'}</strong>
            </div>
            <button type="button">
              <Layers size={17} />
              Heatmap
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="map-canvas">
            <span className="street street-a" />
            <span className="street street-b" />
            <span className="street street-c" />
            <span className="street street-d" />
            <span className="route-line"><Route size={16} /> Market corridor</span>
            <span className="heat heat-one" />
            <span className="heat heat-two" />
            <span className="heat heat-three" />

            {visibleIncidents.map((incident) => (
              <button
                className={`map-pin ${severityClass[incident.severity]} ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
                key={incident.id}
                style={{ left: `${incident.x}%`, top: `${incident.y}%` }}
                type="button"
                onClick={() => setSelectedId(incident.id)}
                aria-label={`${incident.type} near ${incident.area}`}
              >
                {incident.category === 'property' ? <Car size={16} /> : incident.category === 'violent' ? <Siren size={16} /> : <CircleDot size={16} />}
              </button>
            ))}
          </div>

          {selectedIncident && (
            <article className="incident-drawer">
              <div>
                <span className={`severity-pill ${severityClass[selectedIncident.severity]}`}>{selectedIncident.severity}</span>
                <h2>{selectedIncident.type}</h2>
                <p>{selectedIncident.summary}</p>
              </div>
              <dl>
                <div><dt>Area</dt><dd>{selectedIncident.area}</dd></div>
                <div><dt>When</dt><dd>{selectedIncident.time}</dd></div>
                <div><dt>Status</dt><dd>{selectedIncident.status}</dd></div>
              </dl>
            </article>
          )}
        </section>

        <aside id="feed" className="feed-panel" aria-label="Incident feed">
          <div className="panel-heading feed-heading">
            <span><CalendarClock size={17} /> Nearby incident feed</span>
            <small>{visibleIncidents.length} reports</small>
          </div>
          <div className="incident-list">
            {visibleIncidents.map((incident) => (
              <button
                className={selectedIncident?.id === incident.id ? 'incident-item selected' : 'incident-item'}
                key={incident.id}
                type="button"
                onClick={() => setSelectedId(incident.id)}
              >
                <span className={`item-icon ${severityClass[incident.severity]}`}>
                  {incident.category === 'property' ? <Car size={18} /> : incident.category === 'violent' ? <AlertTriangle size={18} /> : <MapPin size={18} />}
                </span>
                <span>
                  <strong>{incident.type}</strong>
                  <small>{incident.area} · {incident.distance}</small>
                </span>
                <em>{incident.time}</em>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section className="lower-grid">
        <article className="trend-panel">
          <div className="panel-heading">
            <span><TrendingUp size={17} /> Community comparison</span>
            <small>Last 30 days</small>
          </div>
          <div className="neighborhood-table">
            {NEIGHBORHOODS.map((item) => (
              <div className="neighborhood-row" key={item.name}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.incidents} incidents · {item.risk}</small>
                </span>
                <meter min="0" max="100" value={item.score} />
                <em className={item.trend.startsWith('+') ? 'positive' : 'negative'}>{item.trend}</em>
              </div>
            ))}
          </div>
        </article>

        <article id="alerts" className="alert-panel">
          <span className="section-kicker"><Bell size={16} /> Alert setup</span>
          <h2>Watch this area</h2>
          <p>Subscribe to verified reports within {radius} miles of {query || 'your selected location'}.</p>
          <div className="alert-actions">
            <button type="button"><Home size={17} /> Save address</button>
            <button type="button"><Clock3 size={17} /> Quiet hours</button>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
