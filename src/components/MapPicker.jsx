import React, { useState, useEffect } from 'react'

export default function MapPicker({ label = 'Location', value, onChange, height = 250 }) {
  const [fallback, setFallback] = useState(false)
  const [internal, setInternal] = useState(value || { lat: 28.6139, lng: 77.2090 }) // Default: New Delhi
  const [rlLib, setRlLib] = useState(null) // react-leaflet module once loaded

  const setPos = (pos) => {
    setInternal(pos)
    onChange?.(pos)
  }

  // Load react-leaflet dynamically on client-side and also import leaflet CSS
  const loadLib = async () => {
    try {
      const rl = await import('react-leaflet')
      // import leaflet and CSS
      await import('leaflet/dist/leaflet.css')
      const L = await import('leaflet')

      // Fix marker icons path for many bundlers (Vite/Webpack)
      try {
        // Use import.meta.url to build correct paths for asset URLs
        const iconRetina = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href
        const icon = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href
        const shadow = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: iconRetina,
          iconUrl: icon,
          shadowUrl: shadow
        })
      } catch (err) {
        // ignore icon setup errors
      }

      setRlLib(rl)
    } catch (err) {
      // could not load map libs — keep using fallback
      setRlLib(null)
    }
  }

  useEffect(() => {
    let mounted = true
    // only run in browser
    if (typeof window !== 'undefined') {
      loadLib()
    }
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If library not loaded or user forced fallback, show manual inputs
  if (!rlLib || fallback) {
    return (
      <div className="form-field">
        <label>{label} (Lat / Lng)</label>
        <div className="inline-fields">
          <input
            type="number"
            step="0.0001"
            value={internal.lat}
            onChange={(e) => setPos({ ...internal, lat: parseFloat(e.target.value) })}
            placeholder="Latitude"
          />
          <input
            type="number"
            step="0.0001"
            value={internal.lng}
            onChange={(e) => setPos({ ...internal, lng: parseFloat(e.target.value) })}
            placeholder="Longitude"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
                  () => {},
                  { enableHighAccuracy: true }
                )
              }
            }}
          >Use Current Location</button>

          <button
            type="button"
            className="btn outline"
            onClick={async () => {
              // retry loading map libraries without restarting dev server
              await loadLib()
              if (!rlLib) {
                // still not loaded
                setFallback(false)
              }
            }}
          >Try load map</button>
          <button type="button" className="btn outline" onClick={() => setFallback(true)}>Force manual</button>
        </div>
        {!rlLib && !fallback && (
          <p className="hint" style={{ marginTop: 8 }}>Map library not loaded yet. Using manual input. Install <code>react-leaflet</code> & <code>leaflet</code> and restart dev server if needed.</p>
        )}
      </div>
    )
  }

  const { MapContainer: LeafletMap, TileLayer, Marker, useMapEvents } = rlLib

  function ClickHandler() {
    useMapEvents({
      click(e) {
        setPos({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    })
    return null
  }

  return (
    <div className="form-field">
      <label>{label}</label>
      <div className="map-picker" style={{ height }}>
        <LeafletMap center={[internal.lat, internal.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[internal.lat, internal.lng]} />
          <ClickHandler />
        </LeafletMap>
      </div>
      <small className="coords-display">Lat: {internal.lat.toFixed(4)}, Lng: {internal.lng.toFixed(4)}</small>
      <div className="inline-fields" style={{ marginTop: '0.5rem' }}>
        <input
            type="number"
            step="0.0001"
            value={internal.lat}
            onChange={(e) => setPos({ ...internal, lat: parseFloat(e.target.value) })}
            placeholder="Latitude"
          />
          <input
            type="number"
            step="0.0001"
            value={internal.lng}
            onChange={(e) => setPos({ ...internal, lng: parseFloat(e.target.value) })}
            placeholder="Longitude"
          />
      </div>
    </div>
  )
}
