export function midiNoteNumberToNoteName(noteNumber: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(noteNumber / 12) - 1 // MIDI note 0 is C-1
  const noteIndex = noteNumber % 12
  return `${noteNames[noteIndex]}${octave}`
}

export function midiNoteNumberToFrequency(noteNumber: number): number {
  return 440 * Math.pow(2, (noteNumber - 69) / 12)
}

export function frequencyToMidiNoteNumber(frequency: number): number {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function transposeFreq(freq: number, semitones: number): number {
  return freq * Math.pow(2, semitones / 12)
}

export function octaveDown(freq: number | string): number {
  return typeof freq === 'string'
    ? midiNoteNumberToFrequency(frequencyToMidiNoteNumber(parseFloat(freq)) - 12)
    : freq / 2
}
