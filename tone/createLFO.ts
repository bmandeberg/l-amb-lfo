import * as Tone from 'tone'
import { ensureLFOWorkletLoaded } from '@/util/workletLoader'
import { constrain } from '@/util/math'

export interface LFOParameters {
  frequency: number
  dutyCycle: number
  shape: 0 | 1 // 0=square, 1=triangle
}

export async function createLFO({
  frequency = 1,
  dutyCycle = 0.5,
  shape = 0, // 0=square, 1=triangle
}: LFOParameters) {
  // Make sure the worklet module is loaded once
  await ensureLFOWorkletLoaded()

  const node = Tone.getContext().createAudioWorkletNode('custom-lfo', {
    numberOfOutputs: 1,
    outputChannelCount: [1],
    parameterData: { frequency, dutyCycle, shape },
  })

  return {
    node,
    setFrequency: (hz: number) => (node.parameters.get('frequency')!.value = constrain(hz, 0.05, 2000)),
    setDuty: (d: number) => (node.parameters.get('dutyCycle')!.value = constrain(d, 0, 1)),
    setShape: (s: 0 | 1) => (node.parameters.get('shape')!.value = s),
    setPhase: (phase: number) => {
      node.port.postMessage({ type: 'setPhase', value: phase })
    },
  }
}
