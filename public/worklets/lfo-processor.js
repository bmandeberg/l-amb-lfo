// AudioWorkletGlobalScope
class CustomLFOProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1, minValue: 0.05, maxValue: 10, automationRate: 'k-rate' },
      { name: 'dutyCycle', defaultValue: 0.5, minValue: 0.0, maxValue: 1.0, automationRate: 'k-rate' },
      // 0 = square, 1 = triangle family (saw-tri-ramp)
      { name: 'shape', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'latch', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, // 0 = false, 1 = true
    ]
  }

  constructor() {
    super()
    this.phase = 0
    this.framesSincePost = 0

    this.port.onmessage = (e) => {
      const { type, value } = e.data || {}
      if (type === 'setPhase') {
        this.phase = ((value % 1) + 1) % 1 // force 0–1 wrap
      }
    }
  }

  process(_inputs, outputs, parameters) {
    const output = outputs[0][0] // mono
    const freq = parameters.frequency[0]
    const duty = parameters.dutyCycle[0]
    const shape = parameters.shape[0] | 0 // coerce to int 0/1
    const latch = parameters.latch[0] | 0 // coerce to int 0/1
    const inc = freq / sampleRate

    for (let i = 0; i < output.length; i++) {
      this.phase += inc
      if (this.phase >= 1) this.phase -= 1

      let v
      if (shape === 0) {
        // Square / PWM
        v = this.phase < duty ? 1 : 0
      } else {
        // Triangle family
        if (this.phase < duty) {
          // Rising section: 0 → 1 over [0, duty)
          v = this.phase / Math.max(duty, 1e-6)
        } else {
          // Falling section: 1 → 0 over [duty, 1)
          v = 1 - (this.phase - duty) / Math.max(1 - duty, 1e-6)
        }
      }

      const value = latch ? 0 : v

      output[i] = value // between 0 and 1

      // throttle visual updates to ~60 fps
      // 44100/60 ≈ 735
      if (++this.framesSincePost >= 735) {
        this.port.postMessage({ type: 'tick', value, phase: this.phase })
        this.framesSincePost = 0
      }
    }
    return true
  }
}

registerProcessor('custom-lfo', CustomLFOProcessor)
