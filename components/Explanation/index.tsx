import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import styles from './index.module.css'

export default function Explanation() {
  return (
    <div className={styles.explanation}>
      <h3>ABOUT</h3>

      <span>
        This demo represents one &quot;LFO&quot; (low-frequency oscillator), which includes the <b>FREQ</b> (frequency),{' '}
        <b>DUTY</b> (duty cycle), <b>SHAPE</b> and <b>RANGE</b> controls. There will be 3 of these LFOs on the
        synthesizer, each coming out of one channel of a MCP4728. Also, the LFOs can sync their frequency to an external
        clock signal.
      </span>

      <h3>CONTROLS</h3>

      <span>
        The <b>FREQ</b> control sets the frequency of the LFO. When the <b>RANGE</b> is set to &quot;LO&quot; (low), the{' '}
        <b>FREQ</b> can be adjusted freely from 0.05 Hz - 10 Hz. When the <b>RANGE</b> is set to &quot;HI&quot; (high),
        the <b>FREQ</b> can be adjusted freely from 10 Hz - 2000 Hz.
      </span>

      <span>
        The <b>DUTY</b> control sets the duty cycle (symmetry) of the LFO waveform. When <b>SHAPE</b> is set to square,{' '}
        <b>DUTY</b> controls typical pulse-width modulation. When <b>SHAPE</b> is set to triangle, <b>DUTY</b> adjusts
        the symmetry of the triangle wave so that it can become a ramp or sawtooth wave.
      </span>

      <span>
        The <b>SHAPE</b> control selects between a square wave and a triangle wave for the LFO waveform.
      </span>

      <span>
        The <b>RANGE</b> control selects between low and high ranges for the <b>FREQ</b> control. See the <b>FREQ</b>{' '}
        description for exact frequency ranges.
      </span>

      <span>
        When <b>USE EXTERNAL CLOCK</b> is selected, the <b>FREQ</b> control selects a clock division or multiplication,
        so that the frequency of the LFO can be set from ÷9 to ×9 of the external clock frequency.
      </span>

      <h3>IMPLEMENTATION</h3>

      <span>You can implement this any way you&apos;d like, but I can offer some notes on how I implemented it.</span>

      <span>
        For the <b>FREQ</b> control, don&apos;t forget to use a logarithmic scale. However, when we turn on{' '}
        <b>USE EXTERNAL CLOCK</b>, we need to use a linear scale for <b>FREQ</b> because it will just be selecting a
        clock division/multiplication option.
      </span>

      <h4>Implementing the LFO</h4>

      <span>
        I would recommend computing the LFO value in real time, instead of based on a lookup table. For this demo, here
        is the function that continuously computes the normalized LFO value:
      </span>

      <div className={styles.codeBlock}>
        <SyntaxHighlighter language="javascript" style={a11yLight}>
          {`
process(_inputs, outputs, parameters) {
  const output = outputs[0][0] // mono
  const freq = parameters.frequency[0]
  const duty = parameters.dutyCycle[0]
  const shape = parameters.shape[0] | 0 // coerce to int 0/1
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

    output[i] = v // this is the final output, between 0 and 1
  }
  return true
}
            `}
        </SyntaxHighlighter>
      </div>

      <span>
        For a different example of how I implemented the realtime LFO in my Arduino prototype, you can view the code{' '}
        <a target="_blank" href="https://github.com/bmandeberg/L-AMB/blob/i2c-quad-dac/LFO.cpp#L30">
          here on GitHub
        </a>
        .
      </span>

      <h4>Using External Clock</h4>

      <span>
        There is one external clock input that all 3 LFOs can sync to. Even though this demo uses a knob to set the
        external clock frequency, on the actual hardware there won&apos;t be a knob, there will just be one digital
        input pin for the clock input where we can plug in a signal. In my Arduino prototype I used an interrupt input.
        I simply keep track of the time between input pulses, and that is my external clock frequency. If the time
        between pulses is more than 20 seconds (0.05 Hz), I don&apos;t sync the LFOs to the external clock. You can see
        this implemented in my Arduino prototype{' '}
        <a target="_blank" href="https://github.com/bmandeberg/L-AMB/blob/i2c-quad-dac/L-AMB.ino#L105">
          here on GitHub
        </a>
        .
      </span>

      <span>
        When we <b>USE EXTERNAL CLOCK</b>, the LFO <b>FREQ</b> control selects between 17 discrete clock div/mult
        options across the range of the potentiometer. The options are: ÷9, ÷8, ÷7, ÷6, ÷5, ÷4, ÷3, ÷2, ×1, ×2, ×3, ×4,
        ×5, ×6, ×7, ×8, ×9. So for example, if the external clock frequency is 1 Hz, and the <b>FREQ</b> control is set
        to ×2, then the LFO frequency will be 2 Hz.
      </span>

      <h3>PINS</h3>

      <span>
        • LFO A <b>FREQ</b> control is at Pin Header 1 (PH1) pin 5 (analog input)
        <br />• LFO A <b>DUTY</b> control is at PH1 pin 7 (analog input)
        <br />• LFO A <b>SHAPE</b> control is at PH1 pin 3 (digital input)
        <br />• LFO A <b>RANGE</b> control is at PH1 pin 1 (digital input)
        <br />
        <br />• LFO B <b>FREQ</b> control is at PH1 pin 6 (analog input)
        <br />• LFO B <b>DUTY</b> control is at PH1 pin 4 (analog input)
        <br />• LFO B <b>SHAPE</b> control is at PH1 pin 12 (digital input)
        <br />• LFO B <b>RANGE</b> control is at PH1 pin 16 (digital input)
        <br />
        <br />• LFO C <b>FREQ</b> control is at PH1 pin 13 (analog input)
        <br />• LFO C <b>DUTY</b> control is at PH1 pin 15 (analog input)
        <br />• LFO C <b>SHAPE</b> control is at PH1 pin 9 (digital input)
        <br />• LFO C <b>RANGE</b> control is at PH1 pin 11 (digital input)
        <br />
        <br />• External clock input is at PH3 pin 1 (digital input, interrupt?).
      </span>

      <h3>GITHUB</h3>

      <a target="_blank" href="https://github.com/bmandeberg/l-amb-lfo">
        https://github.com/bmandeberg/l-amb-lfo
      </a>

      <span>
        This example website is a NextJS project, so the main code to check would be at{' '}
        <a target="_blank" href="https://github.com/bmandeberg/l-amb-lfo/blob/main/app/page.tsx">
          /app/page.tsx
        </a>{' '}
        and{' '}
        <a target="_blank" href="https://github.com/bmandeberg/l-amb-lfo/blob/main/components/LFOControls/index.tsx">
          /components/LFOControls/index.tsx
        </a>
      </span>
    </div>
  )
}
