/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  address: string
  apiKey: string
}

export function StreetViewPanorama({ address, apiKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)
  const [noStreetView, setNoStreetView] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    // Step 1: geocode via REST API (avoids JS API key restrictions)
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    )
      .then(r => r.json())
      .then(geo => {
        if (geo.status !== 'OK' || !geo.results?.[0]) {
          setFallback(true)
          return
        }

        const { lat, lng } = geo.results[0].geometry.location

        // Step 2: load Maps JS API then create interactive panorama
        const existingScript = document.getElementById('gmaps-script')
        const initPanorama = () => {
          const svService = new window.google.maps.StreetViewService()
          svService.getPanorama({ location: { lat, lng }, radius: 100 }, (data: google.maps.StreetViewPanoramaData | null, status: google.maps.StreetViewStatus) => {
            if (status !== window.google.maps.StreetViewStatus.OK || !data?.location?.latLng || !containerRef.current) {
              setNoStreetView(true)
              return
            }
            new window.google.maps.StreetViewPanorama(containerRef.current!, {
              position: data.location.latLng,
              pov: { heading: 0, pitch: 0 },
              zoom: 1,
              addressControl: false,
              showRoadLabels: false,
              motionTracking: false,
              motionTrackingControl: false,
            })
          })
        }

        if (existingScript && window.google?.maps) {
          initPanorama()
        } else if (!existingScript) {
          const callbackName = '_svReady_' + Date.now()
          ;(window as Record<string, unknown>)[callbackName] = () => {
            initPanorama()
            delete (window as Record<string, unknown>)[callbackName]
          }
          const script = document.createElement('script')
          script.id = 'gmaps-script'
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`
          script.async = true
          script.onerror = () => setFallback(true)
          document.head.appendChild(script)
        }
      })
      .catch(() => setFallback(true))
  }, [address, apiKey])

  if (noStreetView) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span style={{ fontSize: '0.78rem' }}>No Street View for this address</span>
      </div>
    )
  }

  if (fallback) {
    return (
      <img
        src={`https://maps.googleapis.com/maps/api/streetview?size=800x450&location=${encodeURIComponent(address)}&key=${apiKey}`}
        alt="Property street view"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
