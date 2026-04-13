import { useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export default function App() {
  const videoRef = useRef(null)
  const [health, setHealth] = useState(null)
  const [cameraError, setCameraError] = useState('')
  const [installEvent, setInstallEvent] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', service: 'api unreachable' }))
  }, [])

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault()
      setInstallEvent(event)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Ta przeglądarka nie wspiera Notification API.')
      return
    }

    const permission = await Notification.requestPermission()
    alert(`Status powiadomień: ${permission}`)
  }

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setCameraError('Brak dostępu do kamery lub użytkownik odmówił uprawnień.')
      console.error(error)
    }
  }

  const installApp = async () => {
    if (isStandalone) {
      alert('Aplikacja jest już zainstalowana.')
      return
    }

    if (!installEvent) {
      alert('Prompt instalacji nie jest dostępny. Użyj opcji \"Zainstaluj aplikację\" w menu przeglądarki.')
      return
    }

    installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  return (
    <main className="app">
      <h1>Sportgram</h1>
      <p>React 19.2 + Symfony 8 API + PWA</p>

      <section>
        <h2>Health API</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>

      <section>
        <h2>PWA / Urządzenie</h2>
        <button onClick={installApp}>Zainstaluj aplikację</button>
        <button onClick={enableNotifications}>Włącz powiadomienia</button>
        <button onClick={enableCamera}>Włącz kamerę</button>
        {cameraError ? <p className="error">{cameraError}</p> : null}
        {!installEvent && !isStandalone ? (
          <p>
            Jeśli przycisk nie otwiera promptu, zainstaluj aplikację z menu przeglądarki
            (np. Chrome: trzy kropki - Zainstaluj aplikację).
          </p>
        ) : null}
        <video ref={videoRef} autoPlay playsInline muted className="camera" />
      </section>
    </main>
  )
}
