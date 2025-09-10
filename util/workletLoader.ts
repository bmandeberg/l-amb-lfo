import * as Tone from 'tone'

let workletReady: Promise<void> | null = null

export function ensureLFOWorkletLoaded() {
  if (!workletReady) {
    workletReady = Tone.getContext().addAudioWorkletModule('/worklets/lfo-processor.js')
  }
  return workletReady
}
