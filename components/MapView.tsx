'use client'

import { useEffect, useRef, useState } from 'react'
import type { Point } from '../lib/store'

export function MapView({ points }: { points: Point[] }) {
  const container = useRef<HTMLDivElement>(null)
  const [state, setState] = useState('harita yükleniyor')

  useEffect(() => {
    let cancelled = false
    let map: import('maplibre-gl').Map | undefined

    ;(async () => {
      const [maplibre, { Protocol }] = await Promise.all([
        import('maplibre-gl'),
        import('pmtiles'),
      ])
      if (cancelled || !container.current) return

      // Worker kendi origin'imizden gelir; ADR-002 ve CSP buna göre kuruludur.
      maplibre.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
      maplibre.addProtocol('pmtiles', new Protocol().tile)

      map = new maplibre.Map({
        container: container.current,
        center: [35, 39],
        zoom: 4.6,
        style: {
          version: 8,
          sources: {
            turkiye: {
              type: 'vector',
              url: `pmtiles://${location.origin}/tiles/turkiye-fixture.pmtiles`,
            },
            points: {
              type: 'geojson',
              cluster: true,
              clusterRadius: 40,
              data: {
                type: 'FeatureCollection',
                features: points.map((p) => ({
                  type: 'Feature',
                  properties: { name: p.name },
                  geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
                })),
              },
            },
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#0b1220' } },
            {
              id: 'turkiye-fill',
              type: 'fill',
              source: 'turkiye',
              'source-layer': 'turkiye',
              paint: { 'fill-color': '#1d2c47', 'fill-outline-color': '#5ee0d0' },
            },
            {
              id: 'point-dots',
              type: 'circle',
              source: 'points',
              paint: {
                'circle-radius': ['case', ['has', 'point_count'], 14, 7],
                'circle-color': ['case', ['has', 'point_count'], '#f2c230', '#5ee0d0'],
              },
            },
          ],
        },
      })

      map.on('error', (e) => setState(`harita hatası: ${e.error?.message ?? 'bilinmiyor'}`))
      map.once('idle', () => {
        const tile = map!.queryRenderedFeatures({ layers: ['turkiye-fill'] }).length
        const dots = map!.queryRenderedFeatures({ layers: ['point-dots'] }).length
        setState(`harita hazır · PMTiles nesnesi=${tile} · nokta=${dots}`)
      })
    })().catch((e) => setState(`harita başlatılamadı: ${e.message}`))

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [points])

  return (
    <>
      <p id="map-state">{state}</p>
      <div ref={container} className="map" />
    </>
  )
}
