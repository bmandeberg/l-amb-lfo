'use client'

import { useMemo, useRef, useCallback, useEffect } from 'react'
import { useGesture } from '@use-gesture/react'
import { gray } from '@/app/globals'
import { constrain, polar, snapToStep } from '@/util/math'
import styles from './index.module.css'

const GLOW_OPACITY = 0.8

interface LinearKnobProps {
  min: number
  max: number
  value: number
  taper?: 'linear' | 'log' | number
  step?: number
  modVal?: number // –0.5 … +0.5 modulation input
  strokeColor?: string
  glow?: boolean
  glowAmount?: number
  glowIndex?: number
  onChange?: (value: number) => void
  setModdedValue?: (value: number) => void
  onStart?: () => void
  onEnd?: () => void
  defaultValue?: number
  disableReset?: boolean
  label?: string
  coloredIndicator?: boolean
}

const SIZE = 70
const RADIUS = 25
const CX = SIZE / 2
const CY = SIZE / 2
const START_ANGLE = 225
const RANGE = 270
const DRAG_SCALAR = 150 // drag sensitivity

export default function LinearKnob({
  min,
  max,
  value,
  taper = 'linear',
  step = 0,
  modVal = 0,
  glow,
  glowAmount,
  glowIndex,
  strokeColor,
  onChange,
  setModdedValue,
  onStart,
  onEnd,
  defaultValue,
  disableReset,
  label,
  coloredIndicator,
}: LinearKnobProps) {
  // Always snap the incoming value for consistency
  const snappedValue = useMemo(() => snapToStep(value, step), [value, step])
  const valueRef = useRef(snappedValue)
  const initialValue = useRef(defaultValue ?? snappedValue)

  const modValRef = useRef(modVal)
  useEffect(() => {
    modValRef.current = modVal
  }, [modVal])

  // Convert ratio ↔ value (taper + step)
  const ratioToValue = useCallback(
    (r: number) => {
      r = constrain(r, 0, 1)
      let v: number
      if (taper === 'log') {
        if (min <= 0) throw new Error('Log taper requires min > 0')
        v = Math.exp(Math.log(min) + r * (Math.log(max) - Math.log(min)))
      } else if (typeof taper === 'number') {
        v = min + (max - min) * Math.pow(r, taper)
      } else {
        v = min + (max - min) * r
      }
      return constrain(snapToStep(v, step), min, max)
    },
    [min, max, taper, step]
  )

  const valueToRatio = useCallback(
    (v: number) => {
      const clamped = constrain(v, min, max)
      const linearR = (clamped - min) / (max - min)
      if (taper === 'log') {
        if (min <= 0) throw new Error('Log taper requires min > 0')
        return (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))
      }
      if (typeof taper === 'number') {
        return Math.pow(linearR, 1 / taper)
      }
      return linearR
    },
    [min, max, taper]
  )

  // Base ratio from the snappedValue
  const baseRatio = useMemo(() => valueToRatio(value), [value, valueToRatio])

  // Clamp modulation input to –0.5…+0.5, then shift the display ratio
  const displayRatio = useMemo(() => constrain(baseRatio + modVal, 0, 1), [baseRatio, modVal])

  // Drag logic remains based on baseRatio/value only
  const drag = useGesture({
    onDrag: ({ movement: [dx, dy] }) => {
      const delta = (dx - dy) / DRAG_SCALAR
      const startRatio = valueToRatio(valueRef.current)
      const newRatio = constrain(startRatio + delta, 0, 1)

      // update actual value that includes modulation
      setModdedValue?.(ratioToValue(newRatio + modVal))

      const newValue = ratioToValue(newRatio)
      onChange?.(newValue)
    },
    onDragStart: () => {
      valueRef.current = snappedValue
      onStart?.()
    },
    onDragEnd: () => onEnd?.(),
  })

  const handleDoubleClick = useCallback(() => {
    if (disableReset) return
    // Reset to initial value on double-click
    const resetValue = initialValue.current ?? snappedValue
    const newRatio = valueToRatio(resetValue)
    setModdedValue?.(ratioToValue(newRatio + modValRef.current))
    onChange?.(resetValue)
  }, [onChange, ratioToValue, setModdedValue, snappedValue, valueToRatio, disableReset])

  // update actual value that includes modulation
  useEffect(() => {
    setModdedValue?.(ratioToValue(baseRatio + modVal))
  }, [modVal, ratioToValue, setModdedValue, baseRatio])

  // Build SVG paths & rotation using displayRatio
  const filledArcD = useMemo(() => {
    if (displayRatio <= 0) return ''
    const endAng = START_ANGLE - displayRatio * RANGE
    const { x: x0, y: y0 } = polar(START_ANGLE, RADIUS, CX, CY)
    const { x: x1, y: y1 } = polar(endAng, RADIUS, CX, CY)
    const largeArc = displayRatio * RANGE > 180 ? 1 : 0
    return `M ${x0} ${y0} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1} ${y1}`
  }, [displayRatio])

  const svgFilterId = useMemo(() => `knobArcGlow-${glowIndex}`, [glowIndex])

  const content = useMemo(
    () => (
      <div
        className={styles.knobContainer}
        style={{ width: SIZE, height: SIZE }}
        draggable="false"
        {...drag()}
        onDoubleClick={handleDoubleClick}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <defs>
            <filter id={svgFilterId} x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feFlood floodColor="white" floodOpacity={(glowAmount ?? 1) * GLOW_OPACITY} result="tint" />
              <feComposite in="tint" in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* grey track */}
          <path d="M 17.32 52.68 A 25 25 0 1 1 52.68 52.68" fill="none" stroke={gray} strokeWidth="3" />

          {/* pointer */}
          <path
            d="M 17.32 52.68 L 35 35"
            fill="none"
            stroke={coloredIndicator ? strokeColor ?? gray : gray}
            strokeWidth="3"
            transform={`rotate(${displayRatio * RANGE} ${CX} ${CY})`}
          />

          {/* filled arc */}
          {filledArcD && (
            <path
              d={filledArcD}
              fill="none"
              stroke={strokeColor || gray}
              strokeWidth="3"
              strokeLinecap="round"
              filter={glow ? `url(#${svgFilterId})` : undefined}
            />
          )}
        </svg>

        {label && <div className={styles.knobLabel}>{label}</div>}
      </div>
    ),
    [
      drag,
      filledArcD,
      strokeColor,
      glow,
      displayRatio,
      handleDoubleClick,
      glowAmount,
      svgFilterId,
      label,
      coloredIndicator,
    ]
  )

  return content
}
