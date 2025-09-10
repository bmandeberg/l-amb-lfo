import * as Tone from 'tone'

export default function getNativeContext(): AudioContext {
  const ctx = Tone.getContext().rawContext as AudioContext & {
    _nativeAudioContext?: AudioContext
  }
  return (ctx._nativeAudioContext ?? ctx) as AudioContext
}
