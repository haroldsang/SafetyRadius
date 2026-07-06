import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Car,
  ChevronDown,
  CircleDot,
  Clock3,
  ExternalLink,
  Filter,
  Home,
  Layers,
  MapPin,
  Navigation,
  Route,
  Search,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const CHICAGO_CRIME_API =
  'https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=120&$order=date DESC&$where=latitude IS NOT NULL AND longitude IS NOT NULL'

const FALLBACK_INCIDENTS = [
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

const SEVERITIES = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
]

const severityClass = {
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
}

const violentTypes = new Set([
  'ASSAULT',
  'BATTERY',
  'CRIMINAL SEXUAL ASSAULT',
  'HOMICIDE',
  'KIDNAPPING',
  'ROBBERY',
  'WEAPONS VIOLATION',
])

const propertyTypes = new Set([
  'ARSON',
  'BURGLARY',
  'CRIMINAL DAMAGE',
  'MOTOR VEHICLE THEFT',
  'THEFT',
])

function getIncidentCategory(type = '') {
  if (violentTypes.has(type)) return 'violent'
  if (propertyTypes.has(type)) return 'property'
  return 'quality'
}

function getIncidentSeverity(type = '') {
  if (['HOMICIDE', 'ROBBERY', 'CRIMINAL SEXUAL ASSAULT', 'WEAPONS VIOLATION'].includes(type)) return 'high'
  if (['ASSAULT', 'BATTERY', 'BURGLARY', 'MOTOR VEHICLE THEFT', 'ARSON'].includes(type)) return 'medium'
  return 'low'
}

function formatTimeAgo(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function formatHour(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function getTimeBucket(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 22) return 'Evening'
  return 'Overnight'
}

function normalizeChicagoIncident(record) {
  const type = record.primary_type || 'Public safety report'
  const category = getIncidentCategory(type)
  const severity = getIncidentSeverity(type)
  const latitude = Number(record.latitude)
  const longitude = Number(record.longitude)

  return {
    id: `chi-${record.id}`,
    type: type
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    severity,
    category,
    time: formatTimeAgo(record.date),
    hour: formatHour(record.date),
    timeBucket: getTimeBucket(record.date),
    distance: 'Chicago',
    area: record.block || record.location_description || 'Chicago',
    address: record.location_description || 'Public right of way',
    status: record.arrest === true || record.arrest === 'true' ? 'arrest reported' : 'reported',
    summary: `${record.description || type} reported at ${record.block || 'a Chicago location'}${record.location_description ? ` near ${record.location_description.toLowerCase()}` : ''}.`,
    latitude,
    longitude,
    sourceId: record.case_number,
    updatedOn: record.updated_on,
  }
}

function getGoogleMapsSearchUrl(value) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value || 'Chicago, IL')}`
}

function getIncidentLocationQuery(incident) {
  if (!incident) return 'Chicago, IL'
  if (Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude)) {
    return `${incident.latitude},${incident.longitude}`
  }
  return `${incident.area || incident.address || 'Chicago'}, Chicago, IL`
}

function getGoogleMapsDirectionsUrl(origin, incident) {
  const destination = getIncidentLocationQuery(incident)
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin || 'Chicago, IL')}&destination=${encodeURIComponent(destination)}`
}

function addMapPositions(incidents) {
  const geocoded = incidents.filter((incident) => Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude))
  if (!geocoded.length) return incidents

  const latitudes = geocoded.map((incident) => incident.latitude)
  const longitudes = geocoded.map((incident) => incident.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const latRange = maxLat - minLat || 1
  const lngRange = maxLng - minLng || 1

  return incidents.map((incident) => {
    if (!Number.isFinite(incident.latitude) || !Number.isFinite(incident.longitude)) return incident
    return {
      ...incident,
      x: 10 + ((incident.longitude - minLng) / lngRange) * 80,
      y: 10 + ((maxLat - incident.latitude) / latRange) * 80,
    }
  })
}

function App() {
  const [query, setQuery] = useState('Chicago, IL')
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [radius, setRadius] = useState(2)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [incidents, setIncidents] = useState(addMapPositions(FALLBACK_INCIDENTS))
  const [dataState, setDataState] = useState({
    label: 'Loading Chicago open crime data',
    source: 'Chicago Data Portal',
    updatedAt: '',
  })
  const [selectedId, setSelectedId] = useState(FALLBACK_INCIDENTS[0].id)

  useEffect(() => {
    let isMounted = true

    async function loadChicagoCrimeData() {
      try {
        const response = await fetch(CHICAGO_CRIME_API)
        if (!response.ok) throw new Error(`Chicago API returned ${response.status}`)
        const records = await response.json()
        const normalized = addMapPositions(records.map(normalizeChicagoIncident))

        if (!isMounted || !normalized.length) return
        setIncidents(normalized)
        setSelectedId(normalized[0].id)
        setDataState({
          label: `${normalized.length} recent public reports imported`,
          source: 'Chicago Data Portal: Crimes - 2001 to Present',
          updatedAt: normalized[0].updatedOn || normalized[0].hour,
        })
      } catch (error) {
        if (!isMounted) return
        setDataState({
          label: 'Using local sample because the live API is unavailable',
          source: 'Local SafeRadius fallback',
          updatedAt: error.message,
        })
      }
    }

    loadChicagoCrimeData()
    return () => {
      isMounted = false
    }
  }, [])

  const visibleIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const categoryMatch = category === 'all' || incident.category === category
      const severityMatch = severity === 'all' || incident.severity === severity
      return categoryMatch && severityMatch
    })
  }, [category, incidents, severity])

  const selectedIncident = visibleIncidents.find((incident) => incident.id === selectedId) || visibleIncidents[0]
  const highCount = visibleIncidents.filter((incident) => incident.severity === 'high').length
  const safetyScore = Math.max(48, 86 - visibleIncidents.length * 3 - highCount * 5)
  const mapSearchUrl = getGoogleMapsSearchUrl(query)
  const selectedMapsUrl = getGoogleMapsSearchUrl(getIncidentLocationQuery(selectedIncident))
  const selectedDirectionsUrl = getGoogleMapsDirectionsUrl(query, selectedIncident)
  const severityCounts = SEVERITIES.filter((item) => item.key !== 'all').map((item) => ({
    ...item,
    count: visibleIncidents.filter((incident) => incident.severity === item.key).length,
  }))
  const timeBuckets = ['Morning', 'Afternoon', 'Evening', 'Overnight'].map((bucket) => ({
    label: bucket,
    count: visibleIncidents.filter((incident) => incident.timeBucket === bucket).length,
  }))
  const maxBucketCount = Math.max(1, ...timeBuckets.map((bucket) => bucket.count))
  const categoryCounts = CATEGORIES.filter((item) => item.key !== 'all').map((item) => ({
    ...item,
    count: visibleIncidents.filter((incident) => incident.category === item.key).length,
  }))
  const arrestCount = visibleIncidents.filter((incident) => incident.status === 'arrest reported').length
  const arrestRate = visibleIncidents.length ? Math.round((arrestCount / visibleIncidents.length) * 100) : 0
  const hotspotRows = Object.entries(
    visibleIncidents.reduce((counts, incident) => {
      counts[incident.area] = (counts[incident.area] || 0) + 1
      return counts
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const topIncidentTypes = Object.entries(
    visibleIncidents.reduce((counts, incident) => {
      counts[incident.type] = (counts[incident.type] || 0) + 1
      return counts
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

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
            <div className="address-actions">
              <a href={mapSearchUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={16} /> Open in Google Maps
              </a>
              <a href={selectedDirectionsUrl} target="_blank" rel="noreferrer">
                <Navigation size={16} /> Route to selected report
              </a>
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
                    setSelectedId(incidents.find((incident) => item.key === 'all' || incident.category === item.key)?.id)
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
            <div className="severity-filter" aria-label="Severity filter">
              {SEVERITIES.map((item) => (
                <button
                  className={severity === item.key ? 'active' : ''}
                  key={item.key}
                  type="button"
                  onClick={() => setSeverity(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <section id="score" className="score-card">
            <div>
              <span className="section-kicker"><ShieldCheck size={16} /> Neighborhood score</span>
              <strong>{safetyScore}</strong>
              <p>{visibleIncidents.length} filtered reports · {highCount} high priority</p>
            </div>
            <div className="score-ring" style={{ '--score': `${safetyScore}%` }} aria-label={`Safety score ${safetyScore} out of 100`}>
              <span>{safetyScore}</span>
            </div>
          </section>

          <div className="mini-analytics">
            <span className="section-kicker"><TrendingUp size={16} /> Live pattern</span>
            <div className="type-cloud">
              {topIncidentTypes.map(([type, count]) => (
                <button key={type} type="button" onClick={() => setCategory('all')}>
                  {type}<strong>{count}</strong>
                </button>
              ))}
            </div>
          </div>

          <div className="compact-brief">
            <span className="section-kicker"><Sparkles size={16} /> Brief</span>
            <p>Property and public-order reports dominate the current import. Use severity and time filters to narrow the map before opening Google routing.</p>
          </div>
        </aside>

        <section id="map" className="map-stage" aria-label="Incident map">
          <div className="map-toolbar">
            <div>
              <span>Live area overview</span>
              <strong>{query || 'Selected area'}</strong>
              <small>{dataState.label}</small>
            </div>
            <button type="button" onClick={() => setShowHeatmap((value) => !value)} aria-pressed={showHeatmap}>
              <Layers size={17} />
              {showHeatmap ? 'Heatmap on' : 'Heatmap off'}
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="map-stats" aria-label="Current map statistics">
            {severityCounts.map((item) => (
              <button key={item.key} type="button" onClick={() => setSeverity(item.key)}>
                <span className={`stat-dot ${severityClass[item.key]}`} />
                <strong>{item.count}</strong>
                <small>{item.label}</small>
              </button>
            ))}
          </div>

          <div className="map-canvas">
            <span className="street street-a" />
            <span className="street street-b" />
            <span className="street street-c" />
            <span className="street street-d" />
            <span className="route-line"><Route size={16} /> Market corridor</span>
            {showHeatmap && (
              <>
                <span className="heat heat-one" />
                <span className="heat heat-two" />
                <span className="heat heat-three" />
              </>
            )}

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
                {selectedIncident.sourceId && <div><dt>Case</dt><dd>{selectedIncident.sourceId}</dd></div>}
              </dl>
              <div className="drawer-actions">
                <a href={selectedMapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> View location</a>
                <a href={selectedDirectionsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> Directions</a>
              </div>
            </article>
          )}
        </section>

        <aside id="feed" className="feed-panel" aria-label="Incident feed">
          <div className="panel-heading feed-heading">
            <span><CalendarClock size={17} /> Nearby incident feed</span>
            <small>{visibleIncidents.length} reports</small>
          </div>
          <div className="source-note">
            <strong>{dataState.source}</strong>
            <span>{dataState.updatedAt ? `Latest update: ${dataState.updatedAt}` : 'Live public-data import'}</span>
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

      <section className="analytics-grid" aria-label="Data analysis modules">
        <article className="analysis-card trend-panel">
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

        <article className="analysis-card risk-panel">
          <div className="panel-heading">
            <span><Clock3 size={17} /> Time risk</span>
            <small>Selected filters</small>
          </div>
          <div className="risk-bars">
            {timeBuckets.map((bucket) => (
              <button key={bucket.label} type="button" onClick={() => setSeverity('all')}>
                <span>{bucket.label}</span>
                <i style={{ width: `${Math.max(8, (bucket.count / maxBucketCount) * 100)}%` }} />
                <strong>{bucket.count}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><Filter size={17} /> Offense mix</span>
            <small>{visibleIncidents.length} reports</small>
          </div>
          <div className="mix-list">
            {categoryCounts.map((item) => (
              <button key={item.key} type="button" onClick={() => setCategory(item.key)}>
                <span>{item.label}</span>
                <i style={{ width: `${Math.max(6, (item.count / Math.max(1, visibleIncidents.length)) * 100)}%` }} />
                <strong>{item.count}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><Siren size={17} /> Response signal</span>
            <small>Public records</small>
          </div>
          <div className="signal-grid">
            <span><strong>{arrestRate}%</strong><small>arrest noted</small></span>
            <span><strong>{highCount}</strong><small>high severity</small></span>
            <span><strong>{radius} mi</strong><small>watch radius</small></span>
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><MapPin size={17} /> Hotspots</span>
            <small>Top blocks</small>
          </div>
          <div className="hotspot-list">
            {hotspotRows.map(([area, count], index) => (
              <button key={area} type="button" onClick={() => setSelectedId(visibleIncidents.find((incident) => incident.area === area)?.id)}>
                <strong>{index + 1}</strong>
                <span>{area}</span>
                <em>{count}</em>
              </button>
            ))}
          </div>
        </article>

        <article id="alerts" className="analysis-card alert-panel">
          <span className="section-kicker"><Bell size={16} /> Alert setup</span>
          <h2>Watch this area</h2>
          <p>Subscribe to verified reports within {radius} miles of {query || 'your selected location'}.</p>
          <div className="alert-actions">
            <button type="button"><Home size={17} /> Save address</button>
            <a href={mapSearchUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Google address</a>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
