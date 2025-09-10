import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import ReactSwitch from 'react-switch'
import { LFOParameters } from '@/tone/createLFO'
import LinearKnob from '@/components/LinearKnob'
import { gray, secondaryColor } from '@/app/globals'
import { scaleToRange, scaleToRangeLog, scaleToRangeOutLog } from '@/util/math'
import { clockDivMultOptions, numClockOptions } from '@/util/clock'
import styles from './index.module.css'

export const MIN_LOW_FREQ = 0.05
export const MAX_LOW_FREQ = 10
export const MIN_HIGH_FREQ = 10
export const MAX_HIGH_FREQ = 2000

interface LFOControlsProps {
  init: LFOParameters
  frequency: number
  setLocalFrequency: React.Dispatch<React.SetStateAction<number>>
  setFrequency: React.RefObject<null | ((hz: number) => void)>
  setDutyCycle: React.RefObject<null | ((d: number) => void)>
  setShape: React.RefObject<null | ((s: 0 | 1) => void)>
  extFreq: number
  sync?: boolean
}

export default function LFOControls({
  init,
  frequency,
  setLocalFrequency,
  setFrequency,
  setDutyCycle,
  setShape,
  extFreq,
  sync,
}: LFOControlsProps) {
  const frequencyRef = useRef<number>(frequency)
  const [moddedFreq, setModdedFreq] = useState<number>(frequency)
  const [clockDivMultIndex, setClockDivMultIndex] = useState<number>(Math.floor(numClockOptions / 2))
  const clockDivMultRef = useRef<number>(clockDivMultIndex)
  const [divMultFreq, setDivMultFreq] = useState<number>(frequency)
  const [dutyCycle, setLocalDutyCycle] = useState<number>(init.dutyCycle)
  const [moddedDutyCycle, setModdedDutyCycle] = useState<number>(dutyCycle)
  const [shape, setLocalShape] = useState<boolean>(!!init.shape)
  const [rangeHigh, setRangeHigh] = useState(false)

  useEffect(() => {
    frequencyRef.current = frequency
  }, [frequency])
  useEffect(() => {
    clockDivMultRef.current = clockDivMultIndex
  }, [clockDivMultIndex])

  const syncRef = useRef(sync)
  useEffect(() => {
    syncRef.current = sync
  }, [sync])

  const rangeHighRef = useRef(rangeHigh)
  useEffect(() => {
    rangeHighRef.current = rangeHigh
  }, [rangeHigh])

  const updateFrequency = useCallback(
    (hzOrClockIndex: number) => {
      if (sync) {
        const clockDivMult = clockDivMultOptions[hzOrClockIndex]
        const divMult = hzOrClockIndex < numClockOptions / 2 ? extFreq / clockDivMult : extFreq * clockDivMult
        setFrequency?.current?.(divMult)
        setDivMultFreq(divMult)
      } else {
        setFrequency?.current?.(hzOrClockIndex)
      }
      setModdedFreq(hzOrClockIndex)
    },
    [setFrequency, sync, extFreq]
  )

  // sync lfo to external freq when selected
  const lfosPreviouslySunk = useRef(false)
  useEffect(() => {
    if (sync) {
      // if switching to sync mode, make clockDivMult position match frequency position as close as possible
      const approxClockDivMultIndex = Math.round(
        scaleToRangeLog(
          frequencyRef.current,
          rangeHighRef.current ? MIN_HIGH_FREQ : MIN_LOW_FREQ,
          rangeHighRef.current ? MAX_HIGH_FREQ : MAX_LOW_FREQ,
          0,
          numClockOptions - 1
        )
      )
      setClockDivMultIndex(approxClockDivMultIndex)
      clockDivMultRef.current = approxClockDivMultIndex

      lfosPreviouslySunk.current = true
      const clockDivMult = clockDivMultOptions[clockDivMultRef.current]
      const divMult = clockDivMultRef.current < numClockOptions / 2 ? extFreq / clockDivMult : extFreq * clockDivMult
      setFrequency?.current?.(divMult)
      setDivMultFreq(divMult)
    } else if (lfosPreviouslySunk.current) {
      // if switching off sync mode, make frequency position match clockDivMult position as close as possible
      const approxFreq = scaleToRangeOutLog(
        clockDivMultRef.current,
        0,
        numClockOptions - 1,
        rangeHighRef.current ? MIN_HIGH_FREQ : MIN_LOW_FREQ,
        rangeHighRef.current ? MAX_HIGH_FREQ : MAX_LOW_FREQ
      )
      setLocalFrequency(approxFreq)
      frequencyRef.current = approxFreq

      setFrequency?.current?.(frequencyRef.current)
      lfosPreviouslySunk.current = false
    }
  }, [extFreq, sync, setFrequency, setLocalFrequency])

  const updateDutyCycle = useCallback(
    (d: number) => {
      setDutyCycle?.current?.(d)
      setModdedDutyCycle(d)
    },
    [setDutyCycle]
  )

  const updateShape = useCallback(
    (s: boolean) => {
      setLocalShape(s)
      setShape?.current?.(s ? 1 : 0)
    },
    [setShape]
  )

  const minFreq = useMemo(() => (rangeHigh ? MIN_HIGH_FREQ : MIN_LOW_FREQ), [rangeHigh])
  const maxFreq = useMemo(() => (rangeHigh ? MAX_HIGH_FREQ : MAX_LOW_FREQ), [rangeHigh])

  // update frequency when range changes
  const lastRangeHigh = useRef<boolean | null>(null)
  useEffect(() => {
    if (!syncRef.current && lastRangeHigh.current !== null && lastRangeHigh.current !== rangeHigh) {
      setLocalFrequency((freq) => {
        const newFreq = scaleToRange(
          freq,
          rangeHigh ? MIN_LOW_FREQ : MIN_HIGH_FREQ,
          rangeHigh ? MAX_LOW_FREQ : MAX_HIGH_FREQ,
          rangeHigh ? MIN_HIGH_FREQ : MIN_LOW_FREQ,
          rangeHigh ? MAX_HIGH_FREQ : MAX_LOW_FREQ
        )
        setFrequency?.current?.(newFreq)
        return newFreq
      })
    }

    lastRangeHigh.current = rangeHigh
  }, [rangeHigh, setFrequency, setLocalFrequency])

  const content = useMemo(
    () => (
      <div className={styles.lfoControls}>
        <div className={styles.lfoControl}>
          <LinearKnob
            min={sync ? 0 : minFreq}
            max={sync ? numClockOptions - 1 : maxFreq}
            step={sync ? 1 : undefined}
            value={sync ? clockDivMultIndex : frequency}
            onChange={
              sync
                ? (clockDivMultIndex) => {
                    setClockDivMultIndex(clockDivMultIndex)
                  }
                : (localFrequency) => {
                    setLocalFrequency(localFrequency)
                  }
            }
            setModdedValue={updateFrequency}
            strokeColor={secondaryColor}
            taper={sync ? undefined : 'log'}
          />
          <p className={styles.lfoControlValue}>
            {sync
              ? (clockDivMultIndex < numClockOptions / 2 - 1 ? '÷' : '×') +
                clockDivMultOptions[moddedFreq] +
                ` (${divMultFreq.toFixed(2)} Hz)`
              : moddedFreq.toFixed(2) + ' Hz'}
          </p>
          <p className={styles.lfoControlLabel}>FREQ</p>
        </div>
        <div className={styles.lfoControl} style={{ marginLeft: -20 }}>
          <LinearKnob
            min={0}
            max={1}
            value={dutyCycle}
            onChange={setLocalDutyCycle}
            setModdedValue={updateDutyCycle}
            strokeColor={secondaryColor}
            defaultValue={0.5}
          />
          <p className={styles.lfoControlValue}>{(moddedDutyCycle * 100).toFixed(0) + '%'}</p>
          <p className={styles.lfoControlLabel}>DUTY</p>
        </div>
        <div className={styles.shapeControl}>
          <svg width={14} height={14} viewBox="0 0 14 14">
            <rect
              x={0}
              y={0}
              width={14}
              height={14}
              stroke={shape ? gray : secondaryColor}
              strokeWidth={4}
              fill="none"
            />
          </svg>
          <ReactSwitch
            onChange={updateShape}
            checked={shape}
            uncheckedIcon={false}
            checkedIcon={false}
            width={48}
            height={24}
          />
          <svg width={14} height={14} viewBox="0 0 14 14">
            <polygon points="7,1 13,13 1,13" stroke={shape ? secondaryColor : gray} strokeWidth={2} fill="none" />
          </svg>
          <p className={styles.switchControlLabel}>SHAPE</p>
        </div>
        <div className={styles.rangeControl}>
          <p className={styles.rangeControlLabel} style={{ color: rangeHigh ? gray : secondaryColor }}>
            LO
          </p>
          <ReactSwitch
            onChange={setRangeHigh}
            checked={rangeHigh}
            uncheckedIcon={false}
            checkedIcon={false}
            width={48}
            height={24}
          />
          <p className={styles.rangeControlLabel} style={{ color: rangeHigh ? secondaryColor : gray }}>
            HI
          </p>
          <p className={styles.switchControlLabel}>RANGE</p>
        </div>
      </div>
    ),
    [
      dutyCycle,
      frequency,
      shape,
      updateDutyCycle,
      updateFrequency,
      updateShape,
      sync,
      clockDivMultIndex,
      moddedFreq,
      moddedDutyCycle,
      rangeHigh,
      minFreq,
      maxFreq,
      setLocalFrequency,
      divMultFreq,
    ]
  )

  return content
}
