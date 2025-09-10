export const maxDivMult = 9
export const numClockOptions = (maxDivMult - 1) * 2 + 1
export const clockDivMultOptions = initClockDivMultOptions()

function initClockDivMultOptions() {
  const options = []

  // freq knob sweeps from divide by 9 to multiply by 9 of clock frequency
  let descending = true
  let optionIndex = 0
  for (let i = maxDivMult; i < maxDivMult + 1; descending ? i-- : i++) {
    if (i < 2) {
      descending = false
    }
    options[optionIndex] = i
    optionIndex++
  }

  return options
}
