/**
 * Load the Google Picker API on demand (no extra npm package).
 * Resolves once `window.gapi` can boot the picker feature.
 */
export const loadGooglePickerApi = () =>
  new Promise((resolve, reject) => {
    const boot = () => {
      try {
        window.gapi.load("picker", { callback: resolve })
      } catch (err) {
        reject(err)
      }
    }
    if (window.gapi) {
      boot()
      return
    }
    const existing = document.querySelector("script[data-google-picker]")
    if (existing) {
      existing.addEventListener("load", boot)
      return
    }
    const script = document.createElement("script")
    script.src = "https://apis.google.com/js/api.js"
    script.async = true
    script.defer = true
    script.setAttribute("data-google-picker", "true")
    script.onload = boot
    script.onerror = () => reject(new Error("Could not load the Google picker"))
    document.head.appendChild(script)
  })
