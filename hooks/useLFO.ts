'use client'

import { useEffect, useState, useRef } from 'react'
import { createLFO, LFOParameters } from '@/tone/createLFO'

export default function useLFO(initialized: boolean, lfoParams: LFOParameters) {
  const [value, setValue] = useState(0)
  const setFrequency = useRef<null | ((hz: number) => void)>(null)
  const setDuty = useRef<null | ((d: number) => void)>(null)
  const setShape = useRef<null | ((s: 0 | 1) => void)>(null)
  const setPhase = useRef<null | ((phase: number) => void)>(null)
  const phase = useRef<null | number>(null)
  const [node, setNode] = useState<null | AudioWorkletNode>(null)

  useEffect(() => {
    if (!initialized) return
    let isMounted = true
    let lfoObj: Awaited<ReturnType<typeof createLFO>>
    ;(async () => {
      lfoObj = await createLFO(lfoParams)
      // Forward worklet messages into React state
      lfoObj.node.port.onmessage = (e) => {
        if (isMounted && e.data.type === 'tick') {
          phase.current = e.data.phase
          setValue(e.data.value)
        }
      }
      setFrequency.current = lfoObj.setFrequency
      setDuty.current = lfoObj.setDuty
      setShape.current = lfoObj.setShape
      setPhase.current = lfoObj.setPhase
      setNode(lfoObj.node)
    })()

    return () => {
      isMounted = false
      if (lfoObj) lfoObj.node.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized])

  return { value, setFrequency, setDuty, setShape, phase, setPhase, node }
}
