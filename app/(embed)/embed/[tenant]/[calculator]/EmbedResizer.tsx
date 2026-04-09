'use client'

import { useEffect, useRef } from 'react'

/**
 * Sender postMessage til parent med aktuel højde.
 * Bruges i embed/iframe for auto-resize.
 */
export default function EmbedResizer() {
  const lastHeight = useRef(0)

  useEffect(() => {
    function sendHeight() {
      const height = document.documentElement.scrollHeight
      if (height !== lastHeight.current) {
        lastHeight.current = height
        window.parent.postMessage(
          { source: 'bergn', type: 'resize', height },
          '*'
        )
      }
    }

    // Send initial height
    sendHeight()

    // Observe DOM changes
    const observer = new MutationObserver(sendHeight)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })

    // Also check on resize
    window.addEventListener('resize', sendHeight)

    // Poll every 500ms as fallback
    const interval = setInterval(sendHeight, 500)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sendHeight)
      clearInterval(interval)
    }
  }, [])

  return null
}
