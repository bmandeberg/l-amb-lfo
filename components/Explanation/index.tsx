import SyntaxHighlighter from 'react-syntax-highlighter'
import { a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import styles from './index.module.css'

export default function Explanation() {
  return (
    <div className={styles.explanation}>
      <h3>ABOUT</h3>

      <span>
        This demo represents one &quot;voice&quot; (audio oscillator), which includes the <b>PITCH</b>, <b>WAVE</b>, and{' '}
        <b>SUB</b> controls. There will be 4 of these voices on the synthesizer, each coming out of one channel of a
        TAD5142. There are also two global controls that will affect all of the 4 voices - <b>root</b> and <b>scale</b>.
      </span>

      <h3>CONTROLS</h3>

      <span>
        The <b>PITCH</b> control sets the frequency of the voice. When the <b>scale</b> is set to &quot;free&quot;, the
        pitch can be adjusted freely from 32.7 Hz (musical note C1) - 1046.5 Hz (musical note C6). When the <b>scale</b>{' '}
        is set to a specific musical scale, the pitch will snap to the nearest note in that scale (still between C1 and
        C6).
      </span>

      <span>
        The <b>root</b> control &quot;transposes&quot; the pitch of all voices, which means it shifts the pitch by up to
        11 <a href="https://en.wikipedia.org/wiki/Semitone">musical semitones</a> (half-steps). When <b>scale</b> is set
        to free, the root is also adjusted freely, but when a specific <b>scale</b> is selected, the root will snap to
        semitones.
      </span>

      <span>
        The <b>WAVE</b> control selects the wavetable that the oscillator uses. This control should interpolate between
        different wavetables, so for example we could have a sawtooth on the left of the knob, and a square wave on the
        right, and the position of the knob would determine the position of the interpolation between the two. We could
        also interpolate between more than two wavetables across the range of the knob.
      </span>

      <span>
        The <b>SUB</b> control adjusts the level of the sub-oscillator which is mixed into the main oscillator. This
        sub-oscillator should be a copy of the main oscillator (always the same <b>WAVE</b>), but it will always be one
        octave lower in <b>PITCH</b>.
      </span>

      <h3>IMPLEMENTATION</h3>

      <span>
        You can implement this any way you&apos;d like, but I can offer some notes based on my JavaScript implementation
        here.
      </span>

      <span>
        When <b>scale</b> is set to free, the <b>PITCH</b> control can sweep freely between 32.7 Hz (C1) and 1046.5 Hz
        (C6). In this case, be sure to use a logarithmic range for your <b>PITCH</b> knob, it&apos;s pretty easy to
        project your knob position logarithmically, let me know if you need any help. In this case, the <b>root</b>{' '}
        freely transposes the pitch by up to 11 semitones. Here is a function to add this transposition to the frequency
        that is selected by the <b>PITCH</b> control:
      </span>

      <div className={styles.codeBlock}>
        <SyntaxHighlighter language="javascript" style={a11yLight}>
          {`
function transposeFrequency(frequency, semitones) {
  return frequency * Math.pow(2, semitones / 12);
}

const selectedPitch = 440 // frequency (Hz)
const root = 4.75 // semitones
const actualPitch = transposeFrequency(selectedPitch, root) // frequency (Hz)
            `}
        </SyntaxHighlighter>
      </div>

      <span>
        When <b>scale</b> is set to a specific musical scale, I&apos;m using MIDI note numbers (just integers) to track
        what pitch I&apos;m playing. For each scale, I construct an array with all the pitches in that scale between C1
        and C6. The <b>PITCH</b> selects the index of this array. Here is how I populate that array of pitches for each
        scale:
      </span>

      <span>
        First, I define the scales each as an array of numbers, and each number represents the number of semitones above
        the previous note in the scale:
      </span>

      <div className={styles.codeBlock}>
        <SyntaxHighlighter language="javascript" style={a11yLight}>
          {`
const scales = {
  chromatic: [1],
  ionian: [2, 2, 1, 2, 2, 2, 1],
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  aeolian: [2, 1, 2, 2, 1, 2, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2],
  pentatonic: [2, 2, 3, 2, 3],
  diminished: [2, 1, 2, 1, 2, 1, 2, 1],
  insen: [1, 2, 2, 1, 2, 2],
}
          `}
        </SyntaxHighlighter>
      </div>

      <span>So, in order to construct the array of pitches for a specific scale, I use this function:</span>

      <div className={styles.codeBlock}>
        <SyntaxHighlighter language="javascript" style={a11yLight}>
          {`
const minPitch = 24 // MIDI note number for C1
const maxPitch = 84 // MIDI note number for C6

function availablePitches(scale) {
  let currentPitch = minPitch
  const scaleIntervals = scales[scale]
  const pitches = [currentPitch]
  let scaleIndex = 0

  while (currentPitch < maxPitch) {
    const nextInterval = scaleIntervals[scaleIndex % scaleIntervals.length]
    currentPitch += nextInterval
    if (currentPitch <= maxPitch) {
      pitches.push(currentPitch)
    }
    scaleIndex++
  }

  return pitches
}
          `}
        </SyntaxHighlighter>
      </div>

      <span>
        Then, to determine the actual pitch to play, you can add the <b>root</b> control value (in semitones) to the
        selected pitch number from the available pitches array.
      </span>

      <div className={styles.codeBlock}>
        <SyntaxHighlighter language="javascript" style={a11yLight}>
          {`
const root = 4 // Root control value in semitones
const selectedPitch = availablePitches(scale)[pitchIndex]
const actualPitch = selectedPitch + root // MIDI note number
const subOscillatorPitch = actualPitch - 12 // MIDI note number
            `}
        </SyntaxHighlighter>
      </div>

      <span>
        To get the pitch of the sub-oscillator, you can just subtract 12 from the actual pitch number. This is because
        there are 12 semitones in an octave.
      </span>

      <span>
        Then, you&apos;d have to convert the MIDI note numbers to frequencies in Hz to set the oscillator frequencies.
      </span>

      <div className={styles.codeBlock}>
        <SyntaxHighlighter language="javascript" style={a11yLight}>
          {`
function midiNoteNumberToFrequency(noteNumber) {
  return 440 * Math.pow(2, (noteNumber - 69) / 12)
}
            `}
        </SyntaxHighlighter>
      </div>

      <h3>PINS</h3>

      <span>All input pins are analog inputs.</span>

      <span>
        • The <b>root</b> control is at Pin Header 3 (PH3) pin 5.
        <br />• The <b>scale</b> control is at PH3 pin 3.
        <br />
        <br />• Voice A <b>PITCH</b> control is at PH3 pin 8.
        <br />• Voice A <b>WAVE</b> control is at PH5 pin 12.
        <br />• Voice A <b>SUB</b> control is at PH5 pin 14.
        <br />
        <br />• Voice B <b>PITCH</b> control is at PH3 pin 6.
        <br />• Voice B <b>WAVE</b> control is at PH5 pin 4.
        <br />• Voice B <b>SUB</b> control is at PH5 pin 6.
        <br />
        <br />• Voice C <b>PITCH</b> control is at PH3 pin 4.
        <br />• Voice C <b>WAVE</b> control is at PH5 pin 11.
        <br />• Voice C <b>SUB</b> control is at PH5 pin 13.
        <br />
        <br />• Voice D <b>PITCH</b> control is at PH3 pin 2.
        <br />• Voice D <b>WAVE</b> control is at PH5 pin 3.
        <br />• Voice D <b>SUB</b> control is at PH5 pin 5.
      </span>

      <h3>GITHUB</h3>

      <a href="https://github.com/bmandeberg/l-amb-voice">https://github.com/bmandeberg/l-amb-voice</a>

      <span>
        This example website is a NextJS project, so the main code to check would be at{' '}
        <a href="https://github.com/bmandeberg/l-amb-voice/blob/main/app/page.tsx">/app/page.tsx</a> and{' '}
        <a href="https://github.com/bmandeberg/l-amb-voice/blob/main/components/Voice/index.tsx">
          /components/Voice/index.tsx
        </a>
      </span>
    </div>
  )
}
