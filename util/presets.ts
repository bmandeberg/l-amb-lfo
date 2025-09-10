function hasWindow() {
  return typeof window !== 'undefined'
}

export function initState(stateName: string, defaultState: unknown, parentObj?: string) {
  if (!hasWindow() || !window.localStorage) return defaultState

  let finalState = defaultState

  const presetSetting = getUrlPresetParam(stateName, parentObj)
  const localPreset = window.localStorage.getItem('preset')
  let localState = null
  if (localPreset) {
    const parsedPreset = parentObj ? JSON.parse(localPreset)[parentObj] ?? null : JSON.parse(localPreset)
    localState = parsedPreset && parsedPreset[stateName]
  }

  if (presetSetting !== null && presetSetting !== undefined) {
    // first check url query string for preset
    finalState = presetSetting
    updateLocalStorage(stateName, finalState, parentObj, true)
  } else if (localState !== null && localState !== undefined) {
    // next check local storage
    finalState = localState
  } else {
    // otherwise assign/update default
    updateLocalStorage(stateName, finalState, parentObj, true)
  }

  return finalState
}

const debounces: Record<string, NodeJS.Timeout> = {}

export function updateLocalStorage(stateName: string, localState: unknown, parentObj?: string, immediate?: boolean) {
  if (!hasWindow() || !window.localStorage) return

  const localPreset = window.localStorage.getItem('preset')
  if (!localPreset) {
    const newPreset = parentObj ? { [parentObj]: { [stateName]: localState } } : { [stateName]: localState }
    window.localStorage.setItem('preset', JSON.stringify(newPreset))
  } else {
    const parsedPreset = JSON.parse(localPreset)
    if (parentObj) {
      parsedPreset[parentObj] = parsedPreset[parentObj] || {}
      parsedPreset[parentObj][stateName] = localState
    } else {
      parsedPreset[stateName] = localState
    }

    if (immediate) {
      window.localStorage.setItem('preset', JSON.stringify(parsedPreset))
    } else {
      const debounceKey = parentObj ? `${parentObj}_${stateName}` : stateName
      clearTimeout(debounces[debounceKey])
      debounces[debounceKey] = setTimeout(() => {
        window.localStorage.setItem('preset', JSON.stringify(parsedPreset))
      }, 100)
    }
  }
}

export function getParamFromQueryString(param: string) {
  if (!hasWindow() || !window.location) return null

  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(param)
}

export function getUrlPresetParam(stateName: string, parentObj?: string) {
  // base64 decode ?preset=<encoded>
  const encoded = getParamFromQueryString('preset')
  if (encoded) {
    const decoded = decodePreset(encoded)
    return (parentObj ? decoded[parentObj]?.[stateName] : decoded[stateName]) ?? null
  }
  return null
}

export function copyPresetUrl() {
  if (!window?.localStorage || !navigator?.clipboard) return

  const preset = window.localStorage.getItem('preset')
  if (preset) {
    const encoded = btoa(preset)
    const url = `${window.location.origin}${window.location.pathname}?preset=${encoded}`
    navigator.clipboard.writeText(url)
  }
}

export function decodePreset(encoded: string) {
  const decoded = atob(encoded)
  return JSON.parse(decoded)
}
