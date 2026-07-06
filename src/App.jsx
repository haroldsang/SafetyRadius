import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Copy,
  Download,
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

const CITY_SOURCES = {
  chicago: {
    label: 'Chicago, IL',
    source: 'Chicago Data Portal: Crimes - 2001 to Present',
    api: 'https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=120&$order=date DESC&$where=latitude IS NOT NULL AND longitude IS NOT NULL',
  },
  losAngeles: {
    label: 'Los Angeles, CA',
    source: 'Los Angeles Open Data: Crime Data from 2020 to Present',
    api: 'https://data.lacity.org/resource/2nrs-mtv8.json?$limit=120&$order=date_occ DESC&$where=lat > 0 AND lon < 0',
  },
  newYork: {
    label: 'New York, NY',
    source: 'NYC Open Data: NYPD Complaint Data Current Year To Date',
    api: 'https://data.cityofnewyork.us/resource/5uac-w243.json?$limit=120&$order=cmplnt_fr_dt DESC&$where=latitude IS NOT NULL AND longitude IS NOT NULL',
  },
  sanFrancisco: {
    label: 'San Francisco, CA',
    source: 'DataSF: Police Department Incident Reports',
    api: 'https://data.sfgov.org/resource/wg3w-h783.json?$limit=120&$order=incident_datetime DESC&$where=latitude IS NOT NULL AND longitude IS NOT NULL',
  },
}

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

const DATE_WINDOWS = [
  { key: 'all', label: 'All dates' },
  { key: '7', label: '7 days' },
  { key: '30', label: '30 days' },
  { key: '90', label: '90 days' },
]

const WATCH_PROFILES_KEY = 'saferadius_watch_profiles_v1'
const REVIEWED_INCIDENTS_KEY = 'saferadius_reviewed_incidents_v1'
const INCIDENT_NOTES_KEY = 'saferadius_incident_notes_v1'

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
  const normalized = type.toUpperCase()
  if (violentTypes.has(normalized) || ['ASSAULT', 'BATTERY', 'ROBBERY', 'HOMICIDE', 'WEAPON'].some((term) => normalized.includes(term))) return 'violent'
  if (propertyTypes.has(normalized) || ['THEFT', 'BURGLARY', 'STOLEN', 'VANDALISM', 'ARSON', 'VEHICLE'].some((term) => normalized.includes(term))) return 'property'
  return 'quality'
}

function getIncidentSeverity(type = '') {
  const normalized = type.toUpperCase()
  if (['HOMICIDE', 'ROBBERY', 'CRIMINAL SEXUAL ASSAULT', 'WEAPONS VIOLATION'].some((term) => normalized.includes(term))) return 'high'
  if (['ASSAULT', 'BATTERY', 'BURGLARY', 'MOTOR VEHICLE THEFT', 'ARSON', 'VEHICLE'].some((term) => normalized.includes(term))) return 'medium'
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
    occurredAt: record.date,
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

function normalizeLosAngelesIncident(record) {
  const type = record.crm_cd_desc || 'Public safety report'
  const latitude = Number(record.lat)
  const longitude = Number(record.lon)

  return {
    id: `la-${record.dr_no}`,
    type: type
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    severity: getIncidentSeverity(type),
    category: getIncidentCategory(type),
    time: formatTimeAgo(record.date_occ),
    hour: formatHour(record.date_occ),
    timeBucket: getTimeBucket(record.date_occ),
    occurredAt: record.date_occ,
    distance: 'Los Angeles',
    area: record.area_name || record.location || 'Los Angeles',
    address: record.location || record.premis_desc || 'Public record location',
    status: record.status_desc || record.status || 'reported',
    summary: `${type} reported in ${record.area_name || 'Los Angeles'}${record.premis_desc ? ` near ${record.premis_desc.toLowerCase()}` : ''}.`,
    latitude,
    longitude,
    sourceId: record.dr_no,
    updatedOn: record.date_rptd,
  }
}

function normalizeNewYorkIncident(record) {
  const type = record.ofns_desc || record.pd_desc || 'Public safety report'
  const latitude = Number(record.latitude)
  const longitude = Number(record.longitude)

  return {
    id: `nyc-${record.cmplnt_num}`,
    type: type
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    severity: getIncidentSeverity(`${type} ${record.law_cat_cd || ''}`),
    category: getIncidentCategory(type),
    time: formatTimeAgo(record.cmplnt_fr_dt),
    hour: record.cmplnt_fr_tm || formatHour(record.cmplnt_fr_dt),
    timeBucket: getTimeBucket(`${record.cmplnt_fr_dt || ''}T${record.cmplnt_fr_tm || '00:00:00'}`),
    occurredAt: record.cmplnt_fr_dt,
    distance: 'New York',
    area: record.boro_nm || record.patrol_boro || 'New York',
    address: record.prem_typ_desc || record.loc_of_occur_desc || 'Public record location',
    status: record.crm_atpt_cptd_cd || record.law_cat_cd || 'reported',
    summary: `${type} reported in ${record.boro_nm || 'New York'}${record.prem_typ_desc ? ` near ${record.prem_typ_desc.toLowerCase()}` : ''}.`,
    latitude,
    longitude,
    sourceId: record.cmplnt_num,
    updatedOn: record.rpt_dt,
  }
}

function normalizeSanFranciscoIncident(record) {
  const type = record.incident_category || record.incident_description || 'Public safety report'
  const latitude = Number(record.latitude)
  const longitude = Number(record.longitude)

  return {
    id: `sf-${record.row_id || record.incident_id}`,
    type: type
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    severity: getIncidentSeverity(`${type} ${record.incident_description || ''}`),
    category: getIncidentCategory(type),
    time: formatTimeAgo(record.incident_datetime),
    hour: record.incident_time || formatHour(record.incident_datetime),
    timeBucket: getTimeBucket(record.incident_datetime),
    occurredAt: record.incident_datetime,
    distance: 'San Francisco',
    area: record.analysis_neighborhood || record.police_district || 'San Francisco',
    address: record.intersection || record.incident_subcategory || 'Public record location',
    status: record.resolution || record.report_type_description || 'reported',
    summary: `${record.incident_description || type} reported in ${record.analysis_neighborhood || record.police_district || 'San Francisco'}.`,
    latitude,
    longitude,
    sourceId: record.incident_number || record.incident_id,
    updatedOn: record.data_as_of || record.report_datetime,
  }
}

function normalizeIncident(record, cityKey) {
  if (cityKey === 'losAngeles') return normalizeLosAngelesIncident(record)
  if (cityKey === 'newYork') return normalizeNewYorkIncident(record)
  if (cityKey === 'sanFrancisco') return normalizeSanFranciscoIncident(record)
  return normalizeChicagoIncident(record)
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
  const [cityKey, setCityKey] = useState('chicago')
  const [query, setQuery] = useState('Chicago, IL')
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [dateWindow, setDateWindow] = useState('all')
  const [quickView, setQuickView] = useState('all')
  const [radius, setRadius] = useState(2)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [reportQuery, setReportQuery] = useState('')
  const [reportSort, setReportSort] = useState('recent')
  const [watchProfiles, setWatchProfiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WATCH_PROFILES_KEY) || '[]')
    } catch {
      return []
    }
  })
  const [reviewedIncidents, setReviewedIncidents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(REVIEWED_INCIDENTS_KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [copyMessage, setCopyMessage] = useState('')
  const [incidentNotes, setIncidentNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(INCIDENT_NOTES_KEY) || '{}')
    } catch {
      return {}
    }
  })
  const [noteDraft, setNoteDraft] = useState('')
  const [incidents, setIncidents] = useState(addMapPositions(FALLBACK_INCIDENTS))
  const [dataState, setDataState] = useState({
    label: 'Loading public crime data',
    source: CITY_SOURCES.chicago.source,
    updatedAt: '',
  })
  const [selectedId, setSelectedId] = useState(FALLBACK_INCIDENTS[0].id)

  useEffect(() => {
    let isMounted = true

    async function loadCrimeData() {
      const city = CITY_SOURCES[cityKey]
      try {
        setDataState({
          label: `Loading ${city.label} public reports`,
          source: city.source,
          updatedAt: '',
        })
        const response = await fetch(city.api)
        if (!response.ok) throw new Error(`${city.label} API returned ${response.status}`)
        const records = await response.json()
        const normalized = addMapPositions(records.map((record) => normalizeIncident(record, cityKey)))

        if (!isMounted || !normalized.length) return
        setIncidents(normalized)
        setSelectedId(normalized[0].id)
        setDataState({
          label: `${normalized.length} recent public reports imported`,
          source: city.source,
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

    loadCrimeData()
    return () => {
      isMounted = false
    }
  }, [cityKey])

  const importedAreaCounts = useMemo(() => incidents.reduce((counts, incident) => {
    counts[incident.area] = (counts[incident.area] || 0) + 1
    return counts
  }, {}), [incidents])

  const visibleIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const categoryMatch = category === 'all' || incident.category === category
      const severityMatch = severity === 'all' || incident.severity === severity
      const occurredAt = incident.occurredAt ? new Date(incident.occurredAt) : null
      const dateMatch = dateWindow === 'all'
        || (occurredAt && !Number.isNaN(occurredAt.getTime()) && (Date.now() - occurredAt.getTime()) <= Number(dateWindow) * 24 * 60 * 60 * 1000)
      const quickMatch = quickView === 'all'
        || (quickView === 'major' && incident.severity === 'high')
        || (quickView === 'repeat' && importedAreaCounts[incident.area] > 1)
        || (quickView === 'property' && incident.category === 'property')
      return categoryMatch && severityMatch && dateMatch && quickMatch
    })
  }, [category, dateWindow, importedAreaCounts, incidents, quickView, severity])

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
  const coordinateCoverage = visibleIncidents.length
    ? Math.round((visibleIncidents.filter((incident) => Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude)).length / visibleIncidents.length) * 100)
    : 0
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
  const dominantOffense = topIncidentTypes[0]?.[0] || 'No reports'
  const peakBucket = [...timeBuckets].sort((a, b) => b.count - a.count)[0]?.label || 'Unknown'
  const maxTypeCount = Math.max(1, ...topIncidentTypes.map(([, count]) => count))
  const dailyRows = Object.entries(
    visibleIncidents.reduce((counts, incident) => {
      const key = incident.occurredAt ? new Date(incident.occurredAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : incident.time
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {}),
  )
    .slice(0, 7)
  const maxDailyCount = Math.max(1, ...dailyRows.map(([, count]) => count))
  const mappedIncidents = visibleIncidents.filter((incident) => Number.isFinite(incident.latitude) && Number.isFinite(incident.longitude))
  const repeatAreaCount = hotspotRows.filter(([, count]) => count > 1).length
  const reportRows = visibleIncidents
    .filter((incident) => {
      const haystack = `${incident.type} ${incident.area} ${incident.status} ${incident.sourceId || ''}`.toLowerCase()
      return haystack.includes(reportQuery.trim().toLowerCase())
    })
    .sort((a, b) => {
      if (reportSort === 'severity') {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.severity] - order[b.severity]
      }
      if (reportSort === 'area') return a.area.localeCompare(b.area)
      return 0
    })
  const densityCells = Array.from({ length: 16 }, (_, index) => {
    const col = index % 4
    const row = Math.floor(index / 4)
    const count = mappedIncidents.filter((incident) => {
      const cellX = Math.min(3, Math.floor((incident.x || 0) / 25))
      const cellY = Math.min(3, Math.floor((incident.y || 0) / 25))
      return cellX === col && cellY === row
    }).length
    return { index, count }
  })
  const maxDensity = Math.max(1, ...densityCells.map((cell) => cell.count))
  const selectedSimilarCount = selectedIncident
    ? visibleIncidents.filter((incident) => incident.type === selectedIncident.type).length
    : 0
  const selectedAreaCount = selectedIncident
    ? visibleIncidents.filter((incident) => incident.area === selectedIncident.area).length
    : 0
  const selectedTimeline = selectedIncident
    ? visibleIncidents
      .filter((incident) => incident.area === selectedIncident.area || incident.type === selectedIncident.type)
      .slice(0, 5)
    : []
  const reviewedCount = visibleIncidents.filter((incident) => reviewedIncidents[incident.id]).length
  const unreviewedHighCount = visibleIncidents.filter((incident) => incident.severity === 'high' && !reviewedIncidents[incident.id]).length
  const baselineHighCount = incidents.filter((incident) => incident.severity === 'high').length
  const baselinePropertyCount = incidents.filter((incident) => incident.category === 'property').length
  const filterCaptureRate = incidents.length ? Math.round((visibleIncidents.length / incidents.length) * 100) : 0
  const highCaptureRate = baselineHighCount ? Math.round((highCount / baselineHighCount) * 100) : 0
  const propertyCaptureRate = baselinePropertyCount
    ? Math.round((visibleIncidents.filter((incident) => incident.category === 'property').length / baselinePropertyCount) * 100)
    : 0
  const selectedUpdates = selectedIncident ? [
    { label: 'Imported', text: `${selectedIncident.type} entered from ${dataState.source}.` },
    { label: 'Mapped', text: `Location resolved to ${selectedIncident.area}.` },
    { label: 'Context', text: `${selectedSimilarCount} similar reports and ${selectedAreaCount} reports in this area match current filters.` },
  ] : []
  const selectedNotes = selectedIncident ? incidentNotes[selectedIncident.id] || [] : []

  function exportReportsCsv() {
    const headers = ['case', 'type', 'severity', 'category', 'area', 'status', 'time', 'source']
    const rows = reportRows.map((incident) => [
      incident.sourceId || incident.id,
      incident.type,
      incident.severity,
      incident.category,
      incident.area,
      incident.status,
      incident.time,
      dataState.source,
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `saferadius-${cityKey}-reports.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function saveWatchProfile() {
    const profile = {
      id: Date.now(),
      cityKey,
      query,
      radius,
      category,
      severity,
      dateWindow,
      quickView,
      createdAt: new Date().toLocaleString(),
    }
    const nextProfiles = [profile, ...watchProfiles].slice(0, 5)
    setWatchProfiles(nextProfiles)
    localStorage.setItem(WATCH_PROFILES_KEY, JSON.stringify(nextProfiles))
  }

  function loadWatchProfile(profile) {
    setCityKey(profile.cityKey)
    setQuery(profile.query)
    setRadius(profile.radius)
    setCategory(profile.category)
    setSeverity(profile.severity)
    setDateWindow(profile.dateWindow)
    setQuickView(profile.quickView)
  }

  function markSelectedReviewed() {
    if (!selectedIncident) return
    const nextReviewed = { ...reviewedIncidents, [selectedIncident.id]: true }
    setReviewedIncidents(nextReviewed)
    localStorage.setItem(REVIEWED_INCIDENTS_KEY, JSON.stringify(nextReviewed))
  }

  function saveIncidentNote() {
    if (!selectedIncident || !noteDraft.trim()) return
    const note = {
      id: Date.now(),
      text: noteDraft.trim(),
      createdAt: new Date().toLocaleString(),
    }
    const nextNotes = {
      ...incidentNotes,
      [selectedIncident.id]: [note, ...(incidentNotes[selectedIncident.id] || [])].slice(0, 4),
    }
    setIncidentNotes(nextNotes)
    setNoteDraft('')
    localStorage.setItem(INCIDENT_NOTES_KEY, JSON.stringify(nextNotes))
  }

  async function copySelectedIncidentLink() {
    if (!selectedIncident) return
    const text = `${selectedIncident.type} near ${selectedIncident.area} (${selectedIncident.time})\n${selectedIncident.summary}\n${getGoogleMapsSearchUrl(getIncidentLocationQuery(selectedIncident))}`
    try {
      await navigator.clipboard.writeText(text)
      setCopyMessage('Copied incident summary')
    } catch {
      setCopyMessage('Copy unavailable in this browser')
    }
  }

  async function copyAreaBrief() {
    const brief = [
      `SafeRadius brief for ${query}`,
      `Source: ${dataState.source}`,
      `Records: ${visibleIncidents.length}/${incidents.length}`,
      `Safety score: ${safetyScore}`,
      `Dominant offense: ${dominantOffense}`,
      `Peak time band: ${peakBucket}`,
      `Hotspots: ${hotspotRows.map(([area, count]) => `${area} (${count})`).join('; ')}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(brief)
      setCopyMessage('Copied area brief')
    } catch {
      setCopyMessage('Copy unavailable in this browser')
    }
  }

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
            <select
              className="city-select"
              value={cityKey}
              onChange={(event) => {
                const nextCityKey = event.target.value
                setCityKey(nextCityKey)
                setQuery(CITY_SOURCES[nextCityKey].label)
                setCategory('all')
                setSeverity('all')
                setReportQuery('')
              }}
              aria-label="Select city data source"
            >
              {Object.entries(CITY_SOURCES).map(([key, city]) => (
                <option key={key} value={key}>{city.label}</option>
              ))}
            </select>
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
            <div className="date-filter" aria-label="Date range filter">
              {DATE_WINDOWS.map((item) => (
                <button
                  className={dateWindow === item.key ? 'active' : ''}
                  key={item.key}
                  type="button"
                  onClick={() => setDateWindow(item.key)}
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

          <div className="quick-views" aria-label="Quick map views">
            {[
              ['all', 'All'],
              ['major', 'Major alerts'],
              ['repeat', 'Repeat areas'],
              ['property', 'Property risk'],
            ].map(([key, label]) => (
              <button
                className={quickView === key ? 'active' : ''}
                key={key}
                type="button"
                onClick={() => setQuickView(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="map-legend" aria-label="Map legend">
            <span><i className="severity-high" /> High</span>
            <span><i className="severity-medium" /> Medium</span>
            <span><i className="severity-low" /> Low</span>
            <span><Layers size={14} /> {showHeatmap ? 'Density layer active' : 'Density layer hidden'}</span>
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
                <div><dt>Similar</dt><dd>{selectedSimilarCount}</dd></div>
                <div><dt>Area repeat</dt><dd>{selectedAreaCount}</dd></div>
              </dl>
              <div className="drawer-actions">
                <a href={selectedMapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> View location</a>
                <a href={selectedDirectionsUrl} target="_blank" rel="noreferrer"><Navigation size={16} /> Directions</a>
                <button type="button" onClick={copySelectedIncidentLink}><Copy size={16} /> Share summary</button>
                <button type="button" onClick={markSelectedReviewed}><CheckCircle2 size={16} /> Mark reviewed</button>
              </div>
              {copyMessage && <p className="copy-message">{copyMessage}</p>}
              <div className="incident-updates">
                {selectedUpdates.map((update) => (
                  <span key={update.label}>
                    <strong>{update.label}</strong>
                    <small>{update.text}</small>
                  </span>
                ))}
              </div>
              <div className="incident-notes">
                <div className="note-compose">
                  <input
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add a private observation note"
                  />
                  <button type="button" onClick={saveIncidentNote}>Save note</button>
                </div>
                {selectedNotes.map((note) => (
                  <span key={note.id}>
                    <strong>{note.createdAt}</strong>
                    <small>{note.text}</small>
                  </span>
                ))}
              </div>
            </article>
          )}
        </section>
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
            <span><TrendingUp size={17} /> Offense ranking</span>
            <small>Top 5</small>
          </div>
          <div className="ranking-bars">
            {topIncidentTypes.map(([type, count]) => (
              <button key={type} type="button" onClick={() => setReportQuery(type)}>
                <span>{type}</span>
                <i style={{ width: `${Math.max(8, (count / maxTypeCount) * 100)}%` }} />
                <strong>{count}</strong>
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
            <span><CalendarClock size={17} /> Daily volume</span>
            <small>Recent import</small>
          </div>
          <div className="daily-volume">
            {dailyRows.map(([day, count]) => (
              <button key={day} type="button" onClick={() => setReportQuery(day)}>
                <i style={{ height: `${Math.max(10, (count / maxDailyCount) * 100)}%` }} />
                <span>{day}</span>
                <strong>{count}</strong>
              </button>
            ))}
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

        <article className="analysis-card">
          <div className="panel-heading">
            <span><Layers size={17} /> Data quality</span>
            <small>Import health</small>
          </div>
          <div className="signal-grid">
            <span><strong>{coordinateCoverage}%</strong><small>mapped</small></span>
            <span><strong>{hotspotRows.length}</strong><small>top areas</small></span>
            <span><strong>{visibleIncidents.length}</strong><small>records</small></span>
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><ShieldCheck size={17} /> Source coverage</span>
            <small>{Object.keys(CITY_SOURCES).length} cities</small>
          </div>
          <div className="source-grid">
            {Object.entries(CITY_SOURCES).map(([key, city]) => (
              <button
                className={cityKey === key ? 'active' : ''}
                key={key}
                type="button"
                onClick={() => {
                  setCityKey(key)
                  setQuery(city.label)
                  setCategory('all')
                  setSeverity('all')
                  setDateWindow('all')
                  setQuickView('all')
                  setReportQuery('')
                }}
              >
                <strong>{city.label.split(',')[0]}</strong>
                <small>{cityKey === key ? 'active' : 'available'}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><Route size={17} /> Density grid</span>
            <small>Map cells</small>
          </div>
          <div className="density-grid" aria-label="Incident density grid">
            {densityCells.map((cell) => (
              <button
                key={cell.index}
                style={{ '--density': cell.count / maxDensity }}
                type="button"
                onClick={() => setSeverity('all')}
                aria-label={`${cell.count} reports in grid cell ${cell.index + 1}`}
              >
                <span>{cell.count}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="analysis-card summary-panel">
          <div className="panel-heading">
            <span><Sparkles size={17} /> Pattern summary</span>
            <button className="panel-action" type="button" onClick={copyAreaBrief}><Copy size={14} /> Copy</button>
          </div>
          <div className="summary-stack">
            <span><strong>{dominantOffense}</strong><small>dominant offense</small></span>
            <span><strong>{peakBucket}</strong><small>peak time band</small></span>
            <span><strong>{selectedIncident?.area || 'No selection'}</strong><small>selected report area</small></span>
          </div>
        </article>

        <article className="analysis-card timeline-card">
          <div className="panel-heading">
            <span><Clock3 size={17} /> Related timeline</span>
            <small>Selected report</small>
          </div>
          <div className="related-timeline">
            {selectedTimeline.map((incident) => (
              <button key={incident.id} type="button" onClick={() => setSelectedId(incident.id)}>
                <i className={severityClass[incident.severity]} />
                <span>
                  <strong>{incident.type}</strong>
                  <small>{incident.area} · {incident.time}</small>
                </span>
              </button>
            ))}
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><Bell size={17} /> Alert logic</span>
            <small>Citizen-style</small>
          </div>
          <div className="alert-logic">
            <span><strong>{highCount ? 'Major only' : 'All clear'}</strong><small>priority mode</small></span>
            <span><strong>{repeatAreaCount}</strong><small>repeat areas</small></span>
            <span><strong>{radius} mi</strong><small>notification radius</small></span>
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><CheckCircle2 size={17} /> Review queue</span>
            <small>Local workflow</small>
          </div>
          <div className="signal-grid">
            <span><strong>{unreviewedHighCount}</strong><small>unreviewed high</small></span>
            <span><strong>{reviewedCount}</strong><small>reviewed</small></span>
            <span><strong>{visibleIncidents.length - reviewedCount}</strong><small>remaining</small></span>
          </div>
        </article>

        <article className="analysis-card">
          <div className="panel-heading">
            <span><TrendingUp size={17} /> Filter impact</span>
            <small>vs import</small>
          </div>
          <div className="impact-metrics">
            <span><strong>{filterCaptureRate}%</strong><small>records captured</small></span>
            <span><strong>{highCaptureRate}%</strong><small>high captured</small></span>
            <span><strong>{propertyCaptureRate}%</strong><small>property captured</small></span>
          </div>
        </article>

        <article id="alerts" className="analysis-card alert-panel">
          <span className="section-kicker"><Bell size={16} /> Alert setup</span>
          <h2>Watch this area</h2>
          <p>Subscribe to verified reports within {radius} miles of {query || 'your selected location'}.</p>
          <div className="alert-actions">
            <button type="button" onClick={saveWatchProfile}><Home size={17} /> Save watch</button>
            <a href={mapSearchUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Google address</a>
          </div>
          {!!watchProfiles.length && (
            <div className="watch-profiles">
              {watchProfiles.map((profile) => (
                <button key={profile.id} type="button" onClick={() => loadWatchProfile(profile)}>
                  <strong>{CITY_SOURCES[profile.cityKey]?.label || profile.query}</strong>
                  <small>{profile.radius} mi · {profile.category} · {profile.severity}</small>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>

      <section id="feed" className="reports-section" aria-label="Incident reports">
        <div className="reports-header">
          <div>
            <span className="section-kicker"><CalendarClock size={17} /> Incident reports</span>
            <h2>Filtered public reports</h2>
            <p>{reportRows.length} reports match current filters</p>
          </div>
          <div className="reports-tools">
            <div className="search-input">
              <Search size={17} />
              <input
                value={reportQuery}
                onChange={(event) => setReportQuery(event.target.value)}
                placeholder="Search type, block, case, status"
              />
            </div>
            <select value={reportSort} onChange={(event) => setReportSort(event.target.value)} aria-label="Sort reports">
              <option value="recent">Recent import</option>
              <option value="severity">Severity</option>
              <option value="area">Area</option>
            </select>
            <button type="button" onClick={exportReportsCsv}>
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="source-note">
            <strong>{dataState.source}</strong>
            <span>{dataState.updatedAt ? `Latest update: ${dataState.updatedAt}` : 'Live public-data import'}</span>
          </div>
        </div>
        <div className="incident-list reports-list">
          {reportRows.map((incident) => (
            <button
              className={`${selectedIncident?.id === incident.id ? 'incident-item selected' : 'incident-item'} ${reviewedIncidents[incident.id] ? 'reviewed' : ''}`}
              key={incident.id}
              type="button"
              onClick={() => setSelectedId(incident.id)}
            >
              <span className={`item-icon ${severityClass[incident.severity]}`}>
                {incident.category === 'property' ? <Car size={18} /> : incident.category === 'violent' ? <AlertTriangle size={18} /> : <MapPin size={18} />}
              </span>
              <span>
                <strong>{incident.type}</strong>
                <small>{incident.area} · {incident.distance} · {incident.status}</small>
              </span>
              <em>{incident.time}</em>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
