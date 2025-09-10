'use client'

import { useState, useCallback, useEffect, CSSProperties as CSS } from 'react'
import Image from 'next/image'
import * as Tone from 'tone'
import Explanation from '@/components/Explanation'
import LinearKnob from '@/components/LinearKnob'
import LFOControls, { MIN_HIGH_FREQ, MIN_LOW_FREQ, MAX_LOW_FREQ } from '@/components/LFOControls'
import LFOScope from '@/components/LFOScope'
import useLFO from '@/hooks/useLFO'
import { LFOParameters } from '@/tone/createLFO'
import { secondaryColor, gray } from './globals'
import getNativeContext from '@/util/getNativeContext'
import styles from './page.module.css'

const lfoDefault: LFOParameters = {
  frequency: 0.39,
  dutyCycle: 0.3,
  shape: 1,
}

export default function LAMBVoice() {
  const [initialized, setInitialized] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [extFreq, setExtFreq] = useState(0.5) // freq for sync
  const [frequency, setLocalFrequency] = useState<number>(lfoDefault.frequency)
  const [sync, setSync] = useState(false)

  const {
    value: lfo1,
    setFrequency: setLfo1Frequency,
    setDuty: setLfo1Duty,
    setShape: setLfo1Shape,
  } = useLFO(initialized, lfoDefault)

  const playStop = useCallback(async () => {
    if (!initialized) {
      await Tone.start()
      setInitialized(true)
    }

    setPlaying((playing) => {
      const ctx = getNativeContext()
      if (!playing) {
        ctx.resume()
      } else {
        ctx.suspend()
      }

      return !playing
    })
  }, [initialized])

  // play/stop on spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault() // prevent scrolling
        playStop()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [playStop])

  return (
    <div className={styles.page} style={{ '--secondary-color': secondaryColor, '--gray': gray } as CSS}>
      <div className={styles.content}>
        <Image
          className={styles.playStopButton}
          src={!playing ? '/play.svg' : '/stop.svg'}
          alt="Play/Stop Button"
          width={40}
          height={40}
          onClick={playStop}
        />

        {frequency < MIN_HIGH_FREQ ? (
          <LFOScope value={lfo1} />
        ) : (
          <p className={styles.frequencyWarning}>
            Frequency too high for LFO scope 🥲
            <br />
            {frequency.toFixed(2)} Hz
          </p>
        )}

        <LFOControls
          init={lfoDefault}
          setFrequency={setLfo1Frequency}
          setLocalFrequency={setLocalFrequency}
          frequency={frequency}
          setDutyCycle={setLfo1Duty}
          setShape={setLfo1Shape}
          extFreq={extFreq}
          sync={sync}
        />

        <div className={styles.syncControls}>
          <div>
            <input type="checkbox" id="sync" checked={sync} onChange={() => setSync(!sync)} />
            <label htmlFor="sync">USE EXTERNAL CLOCK</label>
          </div>

          <div className={styles.syncKnob}>
            <LinearKnob
              min={MIN_LOW_FREQ}
              max={MAX_LOW_FREQ}
              value={extFreq}
              onChange={setExtFreq}
              strokeColor={sync ? secondaryColor : gray}
              taper="log"
            />
          </div>

          <p className={styles.syncFreqValue} style={{ color: sync ? secondaryColor : gray }}>
            {extFreq.toFixed(2)} Hz
          </p>
        </div>
      </div>

      <Explanation />
    </div>
  )
}
