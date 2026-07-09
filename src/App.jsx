import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Car,
  CheckCircle2,
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
  Sparkles,
  TrendingUp,
} from 'lucide-react'

const CITY_SOURCES = {
  chicago: {
    label: 'Chicago, IL',
    region: 'Midwest',
    timeline: 'Long history',
    coverage: '2001-present',
    source: 'Chicago Data Portal: Crimes - 2001 to Present',
    portal: 'https://data.cityofchicago.org/Public-Safety/Crimes-2001-to-Present/ijzp-q8t2',
    api: 'https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=120&$order=date DESC&$where=latitude IS NOT NULL AND longitude IS NOT NULL',
  },
  losAngeles: {
    label: 'Los Angeles, CA',
    region: 'West Coast',
    timeline: 'Recent multi-year',
    coverage: '2020-present',
    source: 'Los Angeles Open Data: Crime Data from 2020 to Present',
    portal: 'https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8',
    api: 'https://data.lacity.org/resource/2nrs-mtv8.json?$limit=120&$order=date_occ DESC&$where=lat > 0 AND lon < 0',
  },
  newYork: {
    label: 'New York, NY',
    region: 'East Coast',
    timeline: 'Current year',
    coverage: 'current year-to-date',
    source: 'NYC Open Data: NYPD Complaint Data Current Year To Date',
    portal: 'https://data.cityofnewyork.us/Public-Safety/NYPD-Complaint-Data-Current-Year-To-Date/5uac-w243',
    api: 'https://data.cityofnewyork.us/resource/5uac-w243.json?$limit=120&$order=cmplnt_fr_dt DESC&$where=latitude IS NOT NULL AND longitude IS NOT NULL',
  },
  sanFrancisco: {
    label: 'San Francisco, CA',
    region: 'West Coast',
    timeline: 'Recent incident feed',
    coverage: 'active incident reports',
    source: 'DataSF: Police Department Incident Reports',
    portal: 'https://data.sfgov.org/Public-Safety/Police-Department-Incident-Reports-2018-to-Present/wg3w-h783',
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

const TREND_WINDOWS = [
  { key: '7', label: '7D', days: 7, grain: 'day' },
  { key: '28', label: '28D', days: 28, grain: 'week' },
  { key: '90', label: '3M', days: 90, grain: 'month' },
  { key: '180', label: '6M', days: 180, grain: 'month' },
  { key: '365', label: '1Y', days: 365, grain: 'month' },
]

const SOURCE_REGIONS = ['All regions', 'East Coast', 'Midwest', 'West Coast']
const SOURCE_TIMELINES = ['All timelines', 'Current year', 'Recent incident feed', 'Recent multi-year', 'Long history']

const CRIME_TERMS = [
  {
    term: 'Incident',
    note: 'An event recorded in a public safety dataset. In incident-based reporting, an incident is a source record and should not be treated as a conviction or final legal finding.',
  },
  {
    term: 'Felony',
    note: 'A serious crime category commonly distinguished from misdemeanors. Exact definitions and penalties depend on the jurisdiction.',
  },
  {
    term: 'Misdemeanor',
    note: 'A criminal offense generally considered less serious than a felony. Classification and consequences vary by jurisdiction.',
  },
  {
    term: 'Arrest noted',
    note: 'A source field or resolution value indicating that an arrest was associated with the record. It is not the same as a conviction.',
  },
  {
    term: 'Hotspot',
    note: 'An area with high crime intensity or repeated incident concentration. Hotspots are commonly visualized with maps for spatial analysis.',
  },
  {
    term: 'Field completeness',
    note: 'A data quality measure showing how many important source fields are present in a normalized record.',
  },
  {
    term: 'Violent offense',
    note: 'A broad analytical grouping for offenses involving force, threat, or harm, such as homicide, robbery, assault, and related categories.',
  },
  {
    term: 'Property offense',
    note: 'A broad analytical grouping for offenses involving property, such as burglary, larceny-theft, motor vehicle theft, and arson.',
  },
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

function withSourceMetadata(incident, cityKey, record, sourceFields) {
  const populatedFields = sourceFields.filter((field) => {
    const value = record[field]
    return value !== undefined && value !== null && value !== '' && value !== '(null)'
  }).length

  return {
    ...incident,
    sourceCity: CITY_SOURCES[cityKey]?.label || cityKey,
    sourceName: CITY_SOURCES[cityKey]?.source || 'Public data source',
    sourceFields,
    fieldCompleteness: Math.round((populatedFields / sourceFields.length) * 100),
    rawUpdatedAt: incident.updatedOn || incident.occurredAt || 'Not provided',
  }
}

function normalizeChicagoIncident(record) {
  const type = record.primary_type || 'Public safety report'
  const category = getIncidentCategory(type)
  const severity = getIncidentSeverity(type)
  const latitude = Number(record.latitude)
  const longitude = Number(record.longitude)

  return withSourceMetadata({
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
  }, 'chicago', record, ['id', 'case_number', 'date', 'primary_type', 'description', 'location_description', 'latitude', 'longitude', 'updated_on'])
}

function normalizeLosAngelesIncident(record) {
  const type = record.crm_cd_desc || 'Public safety report'
  const latitude = Number(record.lat)
  const longitude = Number(record.lon)

  return withSourceMetadata({
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
  }, 'losAngeles', record, ['dr_no', 'date_occ', 'crm_cd_desc', 'area_name', 'premis_desc', 'status_desc', 'lat', 'lon'])
}

function normalizeNewYorkIncident(record) {
  const type = record.ofns_desc || record.pd_desc || 'Public safety report'
  const latitude = Number(record.latitude)
  const longitude = Number(record.longitude)

  return withSourceMetadata({
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
  }, 'newYork', record, ['cmplnt_num', 'cmplnt_fr_dt', 'ofns_desc', 'law_cat_cd', 'boro_nm', 'prem_typ_desc', 'latitude', 'longitude'])
}

function normalizeSanFranciscoIncident(record) {
  const type = record.incident_category || record.incident_description || 'Public safety report'
  const latitude = Number(record.latitude)
  const longitude = Number(record.longitude)

  return withSourceMetadata({
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
  }, 'sanFrancisco', record, ['row_id', 'incident_datetime', 'incident_category', 'incident_description', 'resolution', 'intersection', 'analysis_neighborhood', 'latitude', 'longitude', 'data_as_of'])
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
  const [activePage, setActivePage] = useState('analysis')
  const [cityKey, setCityKey] = useState('chicago')
  const [query, setQuery] = useState('Chicago, IL')
  const [category, setCategory] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [dateWindow, setDateWindow] = useState('all')
  const [trendWindow, setTrendWindow] = useState('28')
  const [quickView, setQuickView] = useState('all')
  const [radius, setRadius] = useState(2)
  const [reportQuery, setReportQuery] = useState('')
  const [reportSort, setReportSort] = useState('recent')
  const [sourceRegionFilter, setSourceRegionFilter] = useState('All regions')
  const [sourceTimelineFilter, setSourceTimelineFilter] = useState('All timelines')
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

  useEffect(() => {
    const incidentFromHash = window.location.hash.replace('#incident=', '')
    if (incidentFromHash && incidents.some((incident) => incident.id === incidentFromHash)) {
      setSelectedId(incidentFromHash)
    }
  }, [incidents])

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

  const trendBaseIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const categoryMatch = category === 'all' || incident.category === category
      const severityMatch = severity === 'all' || incident.severity === severity
      const quickMatch = quickView === 'all'
        || (quickView === 'major' && incident.severity === 'high')
        || (quickView === 'repeat' && importedAreaCounts[incident.area] > 1)
        || (quickView === 'property' && incident.category === 'property')
      return categoryMatch && severityMatch && quickMatch
    })
  }, [category, importedAreaCounts, incidents, quickView, severity])

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
  const averageFieldCompleteness = visibleIncidents.length
    ? Math.round(visibleIncidents.reduce((sum, incident) => sum + (incident.fieldCompleteness || 0), 0) / visibleIncidents.length)
    : 0
  const sourceCityCount = new Set(visibleIncidents.map((incident) => incident.sourceCity)).size
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
  const selectedTrendWindow = TREND_WINDOWS.find((item) => item.key === trendWindow) || TREND_WINDOWS[1]
  const trendCutoffMs = Date.now() - selectedTrendWindow.days * 24 * 60 * 60 * 1000
  const trendIncidents = trendBaseIncidents.filter((incident) => {
    if (!incident.occurredAt) return false
    const occurredAt = new Date(incident.occurredAt)
    return !Number.isNaN(occurredAt.getTime()) && occurredAt.getTime() >= trendCutoffMs
  })
  const sortedTrendIncidents = [...trendIncidents].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
  const trendRows = Object.entries(
    sortedTrendIncidents.reduce((counts, incident) => {
      const occurredAt = new Date(incident.occurredAt)
      const key = selectedTrendWindow.grain === 'day'
        ? occurredAt.toLocaleDateString([], { month: 'short', day: 'numeric' })
        : selectedTrendWindow.grain === 'week'
          ? `W${Math.ceil(occurredAt.getDate() / 7)} ${occurredAt.toLocaleDateString([], { month: 'short' })}`
          : occurredAt.toLocaleDateString([], { month: 'short', year: '2-digit' })
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {}),
  ).slice(-(selectedTrendWindow.grain === 'day' ? 7 : selectedTrendWindow.grain === 'week' ? 4 : 6))
  const dailyRows = trendRows.length ? trendRows : Object.entries(
    visibleIncidents.reduce((counts, incident) => {
      const key = incident.occurredAt ? new Date(incident.occurredAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : incident.time
      counts[key] = (counts[key] || 0) + 1
      return counts
    }, {}),
  ).slice(0, 7)
  const maxDailyCount = Math.max(1, ...dailyRows.map(([, count]) => count))
  const previousTrendCount = trendBaseIncidents.filter((incident) => {
    if (!incident.occurredAt) return false
    const occurredAt = new Date(incident.occurredAt)
    if (Number.isNaN(occurredAt.getTime())) return false
    const timestamp = occurredAt.getTime()
    return timestamp < trendCutoffMs && timestamp >= trendCutoffMs - selectedTrendWindow.days * 24 * 60 * 60 * 1000
  }).length
  const trendDelta = previousTrendCount
    ? Math.round(((trendIncidents.length - previousTrendCount) / previousTrendCount) * 100)
    : trendIncidents.length ? 100 : 0
  const trendVerdict = trendDelta > 10 ? 'Rising' : trendDelta < -10 ? 'Cooling' : 'Stable'
  const trendPoints = dailyRows.map(([, count], index) => {
    const x = dailyRows.length <= 1 ? 50 : (index / (dailyRows.length - 1)) * 100
    const y = 100 - ((count / maxDailyCount) * 86 + 7)
    return `${x},${y}`
  }).join(' ')
  const dayOfWeekRows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, index) => ({
    label,
    count: visibleIncidents.filter((incident) => {
      if (!incident.occurredAt) return false
      const occurredAt = new Date(incident.occurredAt)
      return !Number.isNaN(occurredAt.getTime()) && occurredAt.getDay() === index
    }).length,
  }))
  const maxWeekdayCount = Math.max(1, ...dayOfWeekRows.map((item) => item.count))
  const categoryTotal = Math.max(1, categoryCounts.reduce((sum, item) => sum + item.count, 0))
  const sourceCatalogRows = Object.entries(CITY_SOURCES)
    .map(([key, source]) => ({
      key,
      ...source,
      active: key === cityKey,
      imported: key === cityKey ? incidents.length : 0,
    }))
    .filter((source) => sourceRegionFilter === 'All regions' || source.region === sourceRegionFilter)
    .filter((source) => sourceTimelineFilter === 'All timelines' || source.timeline === sourceTimelineFilter)
  const sourceRegionRows = SOURCE_REGIONS.filter((region) => region !== 'All regions').map((region) => ({
    region,
    sources: Object.values(CITY_SOURCES).filter((source) => source.region === region).length,
    active: CITY_SOURCES[cityKey].region === region,
  }))
  const timelineSegments = [
    { label: 'Today', days: 1 },
    { label: '7 days', days: 7 },
    { label: '28 days', days: 28 },
    { label: '3 months', days: 90 },
    { label: '6 months', days: 180 },
    { label: '1 year', days: 365 },
  ].map((segment) => ({
    ...segment,
    count: countWithinDays(segment.days),
    high: countWithinDays(segment.days, visibleIncidents.filter((incident) => incident.severity === 'high')),
    property: countWithinDays(segment.days, visibleIncidents.filter((incident) => incident.category === 'property')),
    violent: countWithinDays(segment.days, visibleIncidents.filter((incident) => incident.category === 'violent')),
  }))
  const maxTimelineSegmentCount = Math.max(1, ...timelineSegments.map((segment) => segment.count))
  const areaClassificationRows = hotspotRows.slice(0, 4).map(([area, count]) => {
    const areaRows = visibleIncidents.filter((incident) => incident.area === area)
    const recentCount = countWithinDays(28, areaRows)
    const topCategory = [...CATEGORIES].filter((item) => item.key !== 'all').sort((a, b) => (
      areaRows.filter((incident) => incident.category === b.key).length
      - areaRows.filter((incident) => incident.category === a.key).length
    ))[0]
    return {
      area,
      count,
      recentCount,
      topCategory: topCategory?.label || 'Mixed',
      high: areaRows.filter((incident) => incident.severity === 'high').length,
    }
  })
  function countWithinDays(days, source = visibleIncidents) {
    return source.filter((incident) => {
    if (!incident.occurredAt) return false
    const occurredAt = new Date(incident.occurredAt)
    if (Number.isNaN(occurredAt.getTime())) return false
    return (Date.now() - occurredAt.getTime()) <= days * 24 * 60 * 60 * 1000
    }).length
  }
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
  const riskLevel = safetyScore >= 78 ? 'Lower' : safetyScore >= 62 ? 'Moderate' : 'Elevated'
  const primaryHotspot = hotspotRows[0]
  const rtccReadiness = Math.min(100, Math.round((coordinateCoverage * 0.38) + (averageFieldCompleteness * 0.32) + (Math.min(visibleIncidents.length, 80) * 0.18) + (reviewedCount ? 12 : 0)))
  const exceptionFlags = [
    {
      label: 'Trend exception',
      value: trendVerdict,
      level: trendDelta > 10 ? 'High' : trendDelta < -10 ? 'Watch' : 'Normal',
      text: `${selectedTrendWindow.label} is ${trendDelta >= 0 ? `${trendDelta}% above` : `${Math.abs(trendDelta)}% below`} the prior window.`,
    },
    {
      label: 'Hotspot exception',
      value: primaryHotspot?.[0] || 'No repeat zone',
      level: repeatAreaCount > 2 ? 'High' : repeatAreaCount ? 'Watch' : 'Normal',
      text: repeatAreaCount ? `${repeatAreaCount} repeated areas are visible in current filters.` : 'No repeated area cluster is visible.',
    },
    {
      label: 'Review exception',
      value: `${unreviewedHighCount} high`,
      level: unreviewedHighCount ? 'High' : 'Normal',
      text: unreviewedHighCount ? 'High-severity records remain unreviewed.' : 'No high-severity records are waiting in the local queue.',
    },
    {
      label: 'Data exception',
      value: `${rtccReadiness}% ready`,
      level: rtccReadiness < 70 ? 'Watch' : 'Normal',
      text: rtccReadiness < 70 ? 'Improve geocoding, field completeness, or review coverage before operational briefing.' : 'Current source quality is suitable for a command-level brief.',
    },
  ]
  const activeExceptionCount = exceptionFlags.filter((item) => item.level !== 'Normal').length
  function exportReportsCsv() {
    const headers = ['case', 'type', 'severity', 'category', 'area', 'status', 'time', 'source', 'field_completeness', 'updated_on']
    const rows = reportRows.map((incident) => [
      incident.sourceId || incident.id,
      incident.type,
      incident.severity,
      incident.category,
      incident.area,
      incident.status,
      incident.time,
      dataState.source,
      incident.fieldCompleteness,
      incident.rawUpdatedAt,
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

  function changeAreaSource(nextCityKey) {
    setCityKey(nextCityKey)
    setQuery(CITY_SOURCES[nextCityKey].label)
    setCategory('all')
    setSeverity('all')
    setDateWindow('all')
    setQuickView('all')
    setReportQuery('')
  }

  function resetFilters() {
    setCategory('all')
    setSeverity('all')
    setDateWindow('all')
    setQuickView('all')
    setReportQuery('')
    setReportSort('recent')
  }

  function selectIncident(id) {
    if (!id) return
    setSelectedId(id)
    window.history.replaceState(null, '', `#incident=${id}`)
  }

  function clearLocalWorkflow() {
    setReviewedIncidents({})
    setIncidentNotes({})
    setWatchProfiles([])
    localStorage.removeItem(REVIEWED_INCIDENTS_KEY)
    localStorage.removeItem(INCIDENT_NOTES_KEY)
    localStorage.removeItem(WATCH_PROFILES_KEY)
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
    const permalink = `${window.location.origin}${window.location.pathname}#incident=${selectedIncident.id}`
    const text = `${selectedIncident.type} near ${selectedIncident.area} (${selectedIncident.time})\n${selectedIncident.summary}\n${permalink}\n${getGoogleMapsSearchUrl(getIncidentLocationQuery(selectedIncident))}`
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

  const todayPriorityItems = [
    {
      label: 'Review now',
      value: unreviewedHighCount ? `${unreviewedHighCount} high-priority` : 'No high backlog',
      text: unreviewedHighCount ? 'Open the high-severity queue before routine mapping work.' : 'Continue standard monitoring and source refresh checks.',
      action: () => {
        setQuickView('major')
        setActivePage('data')
      },
      icon: <Siren size={18} />,
    },
    {
      label: 'Deploy attention',
      value: primaryHotspot?.[0] || 'No repeat zone',
      text: primaryHotspot ? `Focus the next watch window around ${primaryHotspot[0]}.` : 'No hotspot requires special deployment from current filters.',
      action: () => setReportQuery(primaryHotspot?.[0] || ''),
      icon: <MapPin size={18} />,
    },
    {
      label: 'Watch window',
      value: peakBucket,
      text: `${peakBucket} has the strongest time signal in the current area.`,
      action: () => setReportQuery(peakBucket),
      icon: <Clock3 size={18} />,
    },
    {
      label: 'Exception count',
      value: `${activeExceptionCount} active`,
      text: activeExceptionCount ? 'Review exception flags before approving the shift brief.' : 'No exception flag is above normal threshold.',
      action: () => setActivePage('data'),
      icon: <AlertTriangle size={18} />,
    },
  ]

  const dailyWorkflowSteps = [
    { step: '1', title: 'Triage', text: 'Check high-severity and unreviewed records first.', status: unreviewedHighCount ? 'Action needed' : 'Clear' },
    { step: '2', title: 'Assign', text: 'Send attention to the strongest hotspot and watch window.', status: primaryHotspot ? primaryHotspot[0] : 'No hotspot' },
    { step: '3', title: 'Verify', text: 'Confirm source quality before using sensor-style alerts operationally.', status: `${rtccReadiness}% ready` },
    { step: '4', title: 'Brief', text: 'Copy a concise shift brief or open the analysis workspace.', status: trendVerdict },
  ]

  const commandLenses = [
    {
      label: 'Risk',
      value: riskLevel,
      metric: `${highCount} high`,
      text: highCount ? 'Prioritize high-severity records before routine review.' : 'No high-severity queue is visible in current filters.',
      icon: <ShieldCheck size={17} />,
    },
    {
      label: 'Place',
      value: primaryHotspot?.[0] || 'No hotspot',
      metric: primaryHotspot ? `${primaryHotspot[1]} reports` : '0 repeats',
      text: primaryHotspot ? 'Primary deployment attention should start with this repeated area.' : 'No single place is dominating the current view.',
      icon: <MapPin size={17} />,
    },
    {
      label: 'Time',
      value: peakBucket,
      metric: `${timeBuckets.find((bucket) => bucket.label === peakBucket)?.count || 0} records`,
      text: 'Use the strongest time band to plan watch-window coverage.',
      icon: <Clock3 size={17} />,
    },
    {
      label: 'Offense',
      value: dominantOffense,
      metric: `${topIncidentTypes[0]?.[1] || 0} matches`,
      text: 'This offense type is currently driving the operational pattern.',
      icon: <Siren size={17} />,
    },
    {
      label: 'Trend',
      value: trendVerdict,
      metric: trendDelta >= 0 ? `+${trendDelta}%` : `${trendDelta}%`,
      text: `${selectedTrendWindow.label} trend compared with the prior equivalent window.`,
      icon: <TrendingUp size={17} />,
    },
    {
      label: 'Confidence',
      value: `${rtccReadiness}%`,
      metric: `${coordinateCoverage}% mapped`,
      text: 'Use this as a readiness signal before escalating the brief.',
      icon: <Layers size={17} />,
    },
  ]

  const crossPressureItems = [
    {
      label: 'Where x When',
      value: primaryHotspot ? `${primaryHotspot[0]} / ${peakBucket}` : `No hotspot / ${peakBucket}`,
      text: 'Best first deployment cue from current public reports.',
    },
    {
      label: 'What x Severity',
      value: `${dominantOffense} / ${highCount} high`,
      text: 'Offense pattern plus urgency level for triage.',
    },
    {
      label: 'Data x Action',
      value: `${rtccReadiness}% ready / ${activeExceptionCount} exceptions`,
      text: 'Source quality gate before command decisions.',
    },
  ]

  const officerActionItems = [
    {
      label: 'Patrol focus',
      value: primaryHotspot?.[0] || 'Routine coverage',
      text: primaryHotspot ? `Send visibility to ${primaryHotspot[0]} during ${peakBucket.toLowerCase()}.` : 'No repeated area requires reassignment.',
      action: () => setReportQuery(primaryHotspot?.[0] || ''),
      icon: <Route size={17} />,
    },
    {
      label: 'Verify queue',
      value: unreviewedHighCount ? `${unreviewedHighCount} high` : 'No high queue',
      text: unreviewedHighCount ? 'Confirm high-priority records before public or patrol escalation.' : 'Keep standard source checks active.',
      action: () => {
        setQuickView('major')
        setActivePage('data')
      },
      icon: <CheckCircle2 size={17} />,
    },
    {
      label: 'Shift alert',
      value: activeExceptionCount ? `${activeExceptionCount} flags` : 'Normal',
      text: activeExceptionCount ? 'Notify supervisor that exception flags exist in the analysis workspace.' : 'No exception flag requires supervisory escalation.',
      action: () => setActivePage('data'),
      icon: <Bell size={17} />,
    },
    {
      label: 'Area monitor',
      value: peakBucket,
      text: `Keep a watch posture during the ${peakBucket.toLowerCase()} activity window.`,
      action: () => setReportQuery(peakBucket),
      icon: <Clock3 size={17} />,
    },
    {
      label: 'Brief note',
      value: trendVerdict,
      text: 'Copy the shift brief after confirming source readiness and priority area.',
      action: copyAreaBrief,
      icon: <Copy size={17} />,
    },
    {
      label: 'Map handoff',
      value: CITY_SOURCES[cityKey].label,
      text: 'Open the selected area in Google Maps for route or field context.',
      action: () => window.open(mapSearchUrl, '_blank', 'noreferrer'),
      icon: <ExternalLink size={17} />,
    },
  ]

  const todayStatusItems = [
    { label: 'Shift status', value: activeExceptionCount ? 'Attention' : 'Normal', text: activeExceptionCount ? `${activeExceptionCount} exception flags` : 'No active exception flag' },
    { label: 'Next move', value: primaryHotspot?.[0] || 'Monitor area', text: primaryHotspot ? `Go visible near ${primaryHotspot[0]}` : 'Keep normal area watch' },
    { label: 'Watch window', value: peakBucket, text: `${timeBuckets.find((bucket) => bucket.label === peakBucket)?.count || 0} records` },
    { label: 'Data status', value: `${rtccReadiness}% ready`, text: `${coordinateCoverage}% mapped` },
  ]

  const commandDecisionItems = [
    {
      label: 'Command conclusion',
      value: highCount || activeExceptionCount ? 'Escalate review' : 'Routine watch',
      text: highCount || activeExceptionCount
        ? 'Brief supervisor before routine patrol handoff.'
        : 'Current signal supports normal patrol posture.',
    },
    {
      label: 'Field action',
      value: primaryHotspot ? 'Visible patrol' : 'Area scan',
      text: primaryHotspot
        ? `Start with visibility near ${primaryHotspot[0]} during ${peakBucket.toLowerCase()}.`
        : `Keep a rolling scan during the ${peakBucket.toLowerCase()} window.`,
    },
    {
      label: 'Analyst handoff',
      value: trendVerdict,
      text: `${selectedTrendWindow.label} trend, ${averageFieldCompleteness}% field quality, ${coordinateCoverage}% mapped.`,
    },
  ]

  const shiftTimelineItems = [
    {
      label: 'Start of shift',
      value: unreviewedHighCount ? 'Open high queue' : 'Confirm source feed',
      text: unreviewedHighCount
        ? `${unreviewedHighCount} high-priority records need review before routine calls.`
        : `Verify ${CITY_SOURCES[cityKey].label} feed status and current area filter.`,
    },
    {
      label: 'Active watch',
      value: peakBucket,
      text: primaryHotspot
        ? `Use ${peakBucket.toLowerCase()} visibility near ${primaryHotspot[0]}.`
        : `Keep standard area coverage during the ${peakBucket.toLowerCase()} signal.`,
    },
    {
      label: 'Supervisor check',
      value: activeExceptionCount ? 'Review flags' : 'No flag',
      text: activeExceptionCount
        ? `${activeExceptionCount} exception flags should be resolved before final brief.`
        : 'No exception flag is blocking the current operational summary.',
    },
    {
      label: 'End of shift',
      value: 'Handoff brief',
      text: `Copy brief with ${trendVerdict.toLowerCase()} trend and ${rtccReadiness}% readiness.`,
    },
  ]

  const operationalRiskScore = Math.min(100, Math.round(
    (highCount * 10)
    + (activeExceptionCount * 12)
    + (repeatAreaCount * 8)
    + Math.max(0, trendDelta) * 0.45
    + (100 - rtccReadiness) * 0.25,
  ))
  const operationalResponseLevel = operationalRiskScore >= 70
    ? 'Level 3'
    : operationalRiskScore >= 42
      ? 'Level 2'
      : 'Level 1'
  const operationalRiskItems = [
    {
      label: 'Likelihood',
      value: operationalRiskScore >= 70 ? 'High' : operationalRiskScore >= 42 ? 'Medium' : 'Low',
      meter: operationalRiskScore,
      text: `${repeatAreaCount} repeat areas, ${trendDelta >= 0 ? `+${trendDelta}%` : `${trendDelta}%`} trend pressure.`,
    },
    {
      label: 'Impact',
      value: highCount ? 'Priority' : 'Managed',
      meter: Math.min(100, highCount * 22 + activeExceptionCount * 18 + 20),
      text: highCount ? `${highCount} high-severity records can affect shift posture.` : 'No high-severity queue is driving impact.',
    },
    {
      label: 'Confidence',
      value: rtccReadiness >= 80 ? 'Strong' : rtccReadiness >= 65 ? 'Usable' : 'Review',
      meter: rtccReadiness,
      text: `${coordinateCoverage}% mapped, ${averageFieldCompleteness}% field completeness.`,
    },
    {
      label: 'Response level',
      value: operationalResponseLevel,
      meter: operationalRiskScore,
      text: operationalResponseLevel === 'Level 3'
        ? 'Supervisor review and directed patrol are recommended.'
        : operationalResponseLevel === 'Level 2'
          ? 'Directed checks and analyst handoff are recommended.'
          : 'Routine monitoring is appropriate with normal source checks.',
    },
  ]

  const accountabilityItems = [
    {
      label: 'Use status',
      value: rtccReadiness >= 80 ? 'Brief-ready' : rtccReadiness >= 65 ? 'Use with caution' : 'Analyst review',
      text: rtccReadiness >= 80
        ? 'Suitable for shift briefing after source review.'
        : 'Treat findings as leads until source quality is reviewed.',
    },
    {
      label: 'Human check',
      value: reviewedCount ? 'Started' : 'Required',
      text: reviewedCount
        ? `${reviewedCount} records have local review marks.`
        : 'No local review marks yet; do not escalate without human confirmation.',
    },
    {
      label: 'Policy guardrail',
      value: 'Place-based only',
      text: 'This view supports area and resource planning, not individual prediction or enforcement decisions.',
    },
    {
      label: 'Audit trail',
      value: dataState.updatedAt || 'Live source',
      text: `${CITY_SOURCES[cityKey].source}. Keep source record IDs for case-level follow-up.`,
    },
  ]

  const resourceAllocationItems = [
    {
      label: 'Patrol',
      value: operationalResponseLevel === 'Level 3' ? 'Directed visibility' : operationalResponseLevel === 'Level 2' ? 'Directed checks' : 'Routine patrol',
      load: operationalRiskScore,
      text: primaryHotspot ? `${primaryHotspot[0]} / ${peakBucket}` : `${CITY_SOURCES[cityKey].label} / ${peakBucket}`,
    },
    {
      label: 'Analyst',
      value: activeExceptionCount ? 'Exception review' : 'Pattern watch',
      load: Math.min(100, activeExceptionCount * 28 + Math.abs(trendDelta) + repeatAreaCount * 14),
      text: `${trendVerdict} trend / ${repeatAreaCount} repeat areas`,
    },
    {
      label: 'Supervisor',
      value: highCount || activeExceptionCount ? 'Brief required' : 'No escalation',
      load: Math.min(100, highCount * 24 + activeExceptionCount * 26),
      text: highCount ? `${highCount} high-severity records` : 'No high-severity queue',
    },
    {
      label: 'Data QA',
      value: rtccReadiness >= 80 ? 'Standard audit' : 'Quality review',
      load: Math.max(10, 100 - rtccReadiness),
      text: `${coordinateCoverage}% mapped / ${averageFieldCompleteness}% complete`,
    },
  ]

  const analystMethodCards = [
    { label: 'Hotspot / density', value: primaryHotspot?.[0] || 'No hotspot', text: 'Prioritize repeated places and density cells before broad area conclusions.' },
    { label: 'Cyclical report', value: peakBucket, text: 'Compare repeat time bands for shift planning and recurring watch windows.' },
    { label: 'Exception report', value: `${activeExceptionCount} active`, text: 'Flag changes, quality issues, and review backlogs before command briefings.' },
    { label: 'Repeat location', value: `${repeatAreaCount} areas`, text: 'Separate persistent places from one-time events for problem-oriented follow-up.' },
    { label: 'Spatial confidence', value: `${coordinateCoverage}% mapped`, text: 'Use geocoding coverage as a reliability gate for map-based conclusions.' },
    { label: 'Source audit', value: `${averageFieldCompleteness}%`, text: 'Check field completeness before treating normalized categories as final findings.' },
  ]

  const analystChecklist = [
    { label: 'Area selected', value: CITY_SOURCES[cityKey].label, status: 'Ready' },
    { label: 'Time window checked', value: selectedTrendWindow.label, status: trendVerdict },
    { label: 'Hotspot reviewed', value: primaryHotspot?.[0] || 'None', status: primaryHotspot ? 'Ready' : 'Watch' },
    { label: 'Source quality', value: `${averageFieldCompleteness}%`, status: averageFieldCompleteness >= 80 ? 'Ready' : 'Review' },
    { label: 'Mapped records', value: `${coordinateCoverage}%`, status: coordinateCoverage >= 80 ? 'Ready' : 'Review' },
    { label: 'Exception flags', value: `${activeExceptionCount}`, status: activeExceptionCount ? 'Review' : 'Clear' },
  ]

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="SafeRadius home">
          <span><ShieldCheck size={22} /></span>
          <strong>SafeRadius</strong>
        </a>
        <nav className="nav-links page-tabs" aria-label="Primary navigation">
          <button className={activePage === 'analysis' ? 'active' : ''} type="button" onClick={() => setActivePage('analysis')}>Today</button>
          <button className={activePage === 'data' ? 'active' : ''} type="button" onClick={() => setActivePage('data')}>Analysis & Data</button>
          <button className={activePage === 'terms' ? 'active' : ''} type="button" onClick={() => setActivePage('terms')}>Terms</button>
        </nav>
        <button className="icon-button" type="button" aria-label="Notification settings">
          <Bell size={19} />
        </button>
      </header>

      {activePage === 'analysis' && (
      <>
      <section className="crime-map-heading" aria-label="Crime map query summary">
        <div>
          <span>Global Area Filter</span>
          <h1>{CITY_SOURCES[cityKey].label} daily command brief</h1>
          <p>Set the operational area once; today's workflow and the second-page analysis workspace both follow it.</p>
          <div className="global-area-filter">
            <select
              value={cityKey}
              onChange={(event) => changeAreaSource(event.target.value)}
              aria-label="Select global area data source"
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
                placeholder="Global city, address, or ZIP"
              />
            </div>
            <a href={mapSearchUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} /> Google Maps
            </a>
          </div>
          <small className="global-source-note">{dataState.source}</small>
        </div>
        <div className="crime-map-metrics">
          <span><strong>{visibleIncidents.length}</strong><small>filtered reports</small></span>
          <span><strong>{riskLevel}</strong><small>risk level</small></span>
          <span><strong>{averageFieldCompleteness}%</strong><small>source quality</small></span>
        </div>
      </section>

      <section className="daily-command-section" aria-label="Today police workflow">
        <div className="daily-command-header">
          <div>
            <span className="section-kicker"><ShieldCheck size={17} /> Today command flow</span>
            <h2>Most important actions for today</h2>
            <p>Modeled after RTCC and dispatch workflows: triage the queue, assign attention, verify source quality, then brief the shift.</p>
          </div>
          <button type="button" onClick={() => setActivePage('data')}>
            <Layers size={16} /> Open analysis workspace
          </button>
        </div>
        <div className="module-title">
          <span><Bell size={16} /> Current shift status</span>
          <h3>At-a-glance operational state</h3>
        </div>
        <div className="today-status-rail" aria-label="Current shift status">
          {todayStatusItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.text}</small>
            </article>
          ))}
        </div>
        <div className="module-title compact">
          <span><ShieldCheck size={16} /> Command decision</span>
          <h3>Conclusion and immediate posture</h3>
        </div>
        <div className="command-decision-strip" aria-label="Today command decision summary">
          {commandDecisionItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="module-title compact">
          <span><AlertTriangle size={16} /> Operational risk matrix</span>
          <h3>Likelihood, impact, confidence, and response level</h3>
        </div>
        <div className="operational-risk-matrix" aria-label="Operational risk matrix">
          {operationalRiskItems.map((item) => (
            <article key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <i style={{ '--meter': `${item.meter}%` }} />
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="module-title compact">
          <span><CheckCircle2 size={16} /> Accountability guardrails</span>
          <h3>Use limits, human review, and audit posture</h3>
        </div>
        <div className="accountability-grid" aria-label="Accountability and policy guardrails">
          {accountabilityItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="module-title compact">
          <span><Route size={16} /> Resource allocation</span>
          <h3>Who should act and how much attention is needed</h3>
        </div>
        <div className="resource-allocation-board" aria-label="Resource allocation board">
          {resourceAllocationItems.map((item) => (
            <article key={item.label}>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <i style={{ '--load': `${item.load}%` }} />
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="module-title compact">
          <span><CalendarClock size={16} /> Shift timeline</span>
          <h3>What to check during the shift</h3>
        </div>
        <div className="shift-timeline-strip" aria-label="Shift timeline checklist">
          {shiftTimelineItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
        <div className="module-title">
          <span><AlertTriangle size={16} /> Priority board</span>
          <h3>Today's most important items</h3>
        </div>
        <div className="today-priority-grid">
          {todayPriorityItems.map((item) => (
            <button key={item.label} type="button" onClick={item.action}>
              <span>{item.icon}{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.text}</small>
            </button>
          ))}
        </div>
        <div className="module-title compact">
          <span><CheckCircle2 size={16} /> Action queue</span>
          <h3>Actions for field and command staff</h3>
        </div>
        <div className="officer-action-grid" aria-label="Today officer action queue">
          {officerActionItems.map((item) => (
            <button key={item.label} type="button" onClick={item.action}>
              <span>{item.icon}{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.text}</small>
            </button>
          ))}
        </div>
        <div className="module-title compact">
          <span><Route size={16} /> Shift workflow</span>
          <h3>Recommended order of work</h3>
        </div>
        <div className="workflow-strip">
          {dailyWorkflowSteps.map((item) => (
            <article key={item.step}>
              <strong>{item.step}</strong>
              <span>{item.title}</span>
              <p>{item.text}</p>
              <small>{item.status}</small>
            </article>
          ))}
        </div>
        <div className="daily-command-footer">
          <button type="button" onClick={copyAreaBrief}><Copy size={16} /> Copy shift brief</button>
          <button type="button" onClick={() => setActivePage('data')}><TrendingUp size={16} /> Send to analyst view</button>
          <a href={mapSearchUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open Google area</a>
        </div>
      </section>

      </>
      )}

      {activePage === 'data' && (
      <>
      <button className="back-to-today" type="button" onClick={() => setActivePage('analysis')}>
        <ShieldCheck size={16} /> Back to Today brief
      </button>
      <section className="data-page-heading" aria-label="Data page summary">
        <div>
          <span className="section-kicker"><Layers size={17} /> Analysis & data workspace</span>
          <h1>Deep analysis, source records, diagnostics, and incident reports</h1>
          <p>The command page stays focused on today's actions. This second page holds the full analytical workspace and underlying records.</p>
        </div>
      </section>

      <div className="module-title page-module-title">
        <span><Sparkles size={16} /> Analyst overview</span>
        <h3>Current-area analytical summary</h3>
      </div>
      <section className="data-analysis-summary" aria-label="Second page analysis summary">
        <article>
          <span><TrendingUp size={17} /> Trend</span>
          <strong>{trendVerdict}</strong>
          <p>{selectedTrendWindow.label} volume is {trendDelta >= 0 ? `${trendDelta}% above` : `${Math.abs(trendDelta)}% below`} the prior comparable window.</p>
        </article>
        <article>
          <span><Layers size={17} /> RTCC readiness</span>
          <strong>{rtccReadiness}%</strong>
          <p>{coordinateCoverage}% mapped / {averageFieldCompleteness}% field completeness.</p>
        </article>
        <article>
          <span><AlertTriangle size={17} /> Exceptions</span>
          <strong>{activeExceptionCount}</strong>
          <p>{activeExceptionCount ? 'Open exception report modules below before finalizing a brief.' : 'No exception flag is above normal threshold.'}</p>
        </article>
        <article>
          <span><MapPin size={17} /> Priority area</span>
          <strong>{primaryHotspot?.[0] || 'No hotspot'}</strong>
          <p>{primaryHotspot ? `${primaryHotspot[1]} reports in the current filter.` : 'No repeated location pattern is visible.'}</p>
        </article>
      </section>

      <section className="analyst-lens-section" aria-label="Multidimensional crime analysis lenses">
        <div className="analyst-lens-header">
          <div>
            <span className="section-kicker"><Filter size={17} /> Multidimensional analysis</span>
            <h2>Current-area crime pattern by risk, place, time, offense, trend, and confidence</h2>
          </div>
        </div>
        <div className="command-lens-grid analyst-lens-grid">
          {commandLenses.map((lens) => (
            <button key={lens.label} type="button" onClick={() => setReportQuery(lens.value)}>
              <span>{lens.icon}{lens.label}</span>
              <strong>{lens.value}</strong>
              <em>{lens.metric}</em>
              <small>{lens.text}</small>
            </button>
          ))}
        </div>
        <div className="cross-pressure-strip analyst-pressure-strip" aria-label="Cross-dimensional analysis pressure">
          {crossPressureItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="analyst-method-section" aria-label="Open source crime analysis methods">
        <div className="analyst-method-header">
          <div>
            <span className="section-kicker"><Sparkles size={17} /> Analysis method matrix</span>
            <h2>Methods inspired by crime mapping, CrimeStat, CrimeAnalyst, and CompStat workflows</h2>
          </div>
        </div>
        <div className="analyst-method-grid">
          {analystMethodCards.map((method) => (
            <article key={method.label}>
              <span>{method.label}</span>
              <strong>{method.value}</strong>
              <p>{method.text}</p>
            </article>
          ))}
        </div>
        <div className="analyst-checklist" aria-label="Analyst evidence checklist">
          {analystChecklist.map((item) => (
            <span key={item.label}>
              <strong>{item.label}</strong>
              <em>{item.value}</em>
              <small>{item.status}</small>
            </span>
          ))}
        </div>
      </section>

      <section className="public-data-section" aria-label="Public crime data source catalog">
        <div className="public-data-header">
          <div>
            <span className="section-kicker"><Layers size={17} /> Public data import catalog</span>
            <h2>Official open crime sources by region and timeline</h2>
            <p>Sources are normalized into the same SafeRadius incident format, then classified by region, reporting window, category, severity, and local area.</p>
          </div>
          <div className="source-filters">
            <select value={sourceRegionFilter} onChange={(event) => setSourceRegionFilter(event.target.value)} aria-label="Filter sources by region">
              {SOURCE_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
            <select value={sourceTimelineFilter} onChange={(event) => setSourceTimelineFilter(event.target.value)} aria-label="Filter sources by timeline">
              {SOURCE_TIMELINES.map((timeline) => <option key={timeline} value={timeline}>{timeline}</option>)}
            </select>
          </div>
        </div>
        <div className="source-catalog-grid">
          {sourceCatalogRows.map((source) => (
            <article className={source.active ? 'active' : ''} key={source.key}>
              <span>{source.region} / {source.timeline}</span>
              <strong>{source.label}</strong>
              <p>{source.source}</p>
              <div>
                <small>{source.coverage}</small>
                <small>{source.imported ? `${source.imported} imported` : 'ready to load'}</small>
              </div>
              <button type="button" onClick={() => changeAreaSource(source.key)}>
                {source.active ? 'Active source' : 'Load source'}
              </button>
              <a href={source.portal} target="_blank" rel="noreferrer">Official portal</a>
            </article>
          ))}
        </div>
      </section>

      <section className="classification-section" aria-label="Region and timeline classification">
        <div className="classification-header">
          <div>
            <span className="section-kicker"><CalendarClock size={17} /> Region and timeline classification</span>
            <h2>Classify the current area by geography, time window, and local concentration</h2>
          </div>
        </div>
        <div className="classification-grid">
          <article className="classification-card">
            <div className="panel-heading">
              <span><MapPin size={17} /> Region coverage</span>
              <small>{Object.keys(CITY_SOURCES).length} official feeds</small>
            </div>
            <div className="region-classification">
              {sourceRegionRows.map((row) => (
                <button className={row.active ? 'active' : ''} key={row.region} type="button" onClick={() => setSourceRegionFilter(row.region)}>
                  <strong>{row.region}</strong>
                  <span>{row.sources} sources</span>
                </button>
              ))}
            </div>
          </article>

          <article className="classification-card timeline-classification-card">
            <div className="panel-heading">
              <span><CalendarClock size={17} /> Timeline classification</span>
              <small>{CITY_SOURCES[cityKey].label}</small>
            </div>
            <div className="timeline-classification">
              {timelineSegments.map((segment) => (
                <button key={segment.label} type="button" onClick={() => setDateWindow(segment.days === 365 ? 'all' : String(segment.days))}>
                  <span>{segment.label}</span>
                  <i style={{ width: `${Math.max(5, (segment.count / maxTimelineSegmentCount) * 100)}%` }} />
                  <strong>{segment.count}</strong>
                  <small>{segment.high} high / {segment.property} property / {segment.violent} violent</small>
                </button>
              ))}
            </div>
          </article>

          <article className="classification-card">
            <div className="panel-heading">
              <span><Filter size={17} /> Area classification</span>
              <small>top local areas</small>
            </div>
            <div className="area-classification">
              {areaClassificationRows.map((row) => (
                <button key={row.area} type="button" onClick={() => setReportQuery(row.area)}>
                  <strong>{row.area}</strong>
                  <span>{row.topCategory}</span>
                  <small>{row.count} total / {row.recentCount} in 28D / {row.high} high</small>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="supporting-section" aria-label="Supporting diagnostics">
        <div className="supporting-header">
          <span className="section-kicker"><Layers size={17} /> Records workflow diagnostics</span>
          <h2>Record-level workflow tools that do not repeat the analytical summary above</h2>
        </div>
        <div className="analytics-grid">
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
                  <small>{item.incidents} incidents / {item.risk}</small>
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
              <button key={area} type="button" onClick={() => selectIncident(visibleIncidents.find((incident) => incident.area === area)?.id)}>
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
          <div className="quality-footnotes">
            <span>{averageFieldCompleteness}% average field completeness</span>
            <span>{sourceCityCount} active source city</span>
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
                onClick={() => changeAreaSource(key)}
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
              <button
                key={incident.id}
                type="button"
                onClick={() => {
                  selectIncident(incident.id)
                }}
              >
                <i className={severityClass[incident.severity]} />
                <span>
                  <strong>{incident.type}</strong>
                  <small>{incident.area} / {incident.time}</small>
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
            <button className="panel-action" type="button" onClick={clearLocalWorkflow}>Clear</button>
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
                  <small>{profile.radius} mi / {profile.category} / {profile.severity}</small>
                </button>
              ))}
            </div>
          )}
        </article>
        </div>
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
              onClick={() => {
                selectIncident(incident.id)
              }}
            >
              <span className={`item-icon ${severityClass[incident.severity]}`}>
                {incident.category === 'property' ? <Car size={18} /> : incident.category === 'violent' ? <AlertTriangle size={18} /> : <MapPin size={18} />}
              </span>
              <span>
                <strong>{incident.type}</strong>
                <small>{incident.area} / {incident.distance} / {incident.status}</small>
              </span>
              <em>{incident.time}</em>
            </button>
          ))}
        </div>
      </section>
      </>
      )}

      {activePage === 'terms' && (
      <>
      <button className="back-to-today" type="button" onClick={() => setActivePage('analysis')}>
        <ShieldCheck size={16} /> Back to Today brief
      </button>
      <section id="terms" className="terms-section" aria-label="Crime terms glossary">
        <div className="terms-header">
          <div>
            <span className="section-kicker"><ShieldCheck size={17} /> Crime terms</span>
            <h2>Glossary for beginners and professionals</h2>
          </div>
          <p>Terms are normalized for analysis. Always use the official source record for legal interpretation.</p>
        </div>
        <div className="terms-grid">
          {CRIME_TERMS.map((item) => (
            <article className="term-card" key={item.term}>
              <h3>{item.term}</h3>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>
      </>
      )}
    </main>
  )
}

export default App
