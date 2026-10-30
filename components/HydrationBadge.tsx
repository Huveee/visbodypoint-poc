'use client'

import { useEffect, useState } from 'react'

// CSP tarayıcı JS'ini engellerse rozet "çalışmıyor" kalır ve sayaç artmaz.
export function HydrationBadge() {
  const [alive, setAlive] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => setAlive(true), [])

  return (
    <p className="badge">
      <span id="hydration">{alive ? 'JS çalışıyor' : 'JS çalışmıyor'}</span>
      <button id="counter" onClick={() => setCount(count + 1)}>
        Tıkla: {count}
      </button>
    </p>
  )
}
