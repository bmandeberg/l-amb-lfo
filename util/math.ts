export function expoMap(t: number, k: number = 4) {
  // keep input in bounds
  const x = Math.min(Math.max(t, 0), 1)

  // k = 0 falls back to identity
  if (k === 0) return x

  const a = Math.exp(k) - 1 // normalising constant
  return (Math.exp(k * x) - 1) / a // (e^{kx} - 1) / (e^{k} - 1)
}

export function constrain(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max)
}

export function scaleToRange(num: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

export function scaleToRangeLog(num: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (num <= 0 || inMin <= 0 || inMax <= 0) {
    throw new Error('Logarithmic scaling requires positive, non-zero values.')
  }

  // Convert input values to log space
  const logInMin = Math.log(inMin)
  const logInMax = Math.log(inMax)
  const logNum = Math.log(num)

  // Find the percentage along the log-scaled input range
  const t = (logNum - logInMin) / (logInMax - logInMin)

  // Apply that percentage linearly to the output range
  return outMin + t * (outMax - outMin)
}

export function scaleToRangeOutLog(num: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (outMin <= 0 || outMax <= 0) {
    throw new Error('Logarithmic scaling requires positive, non-zero output range.')
  }

  // Find linear percentage along input range
  const t = (num - inMin) / (inMax - inMin)

  // Map to logarithmic output range
  const logOutMin = Math.log(outMin)
  const logOutMax = Math.log(outMax)
  const logValue = logOutMin + t * (logOutMax - logOutMin)

  return Math.exp(logValue)
}

export function polar(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad),
  }
}

// linear interpolate between two hex colors
export function lerpHex(colorA: string, colorB: string, t: number) {
  const [r1, g1, b1] = hexToRgb(colorA)
  const [r2, g2, b2] = hexToRgb(colorB)
  const r = Math.round(lerp(r1, r2, t))
  const g = Math.round(lerp(g1, g2, t))
  const b = Math.round(lerp(b1, b2, t))
  return rgbToHex(r, g, b)
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hexToRgb(hex: string): [number, number, number] {
  const bigint = parseInt(hex.slice(1), 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return [r, g, b]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function snapToStep(value: number, step: number): number {
  return step > 0 ? Math.round(value / step) * step : value
}

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min
}
