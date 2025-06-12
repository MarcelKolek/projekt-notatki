import { useState, useEffect } from 'react'
import { initKeycloak } from '../utils/keycloak'
import './styles.css';

function MyApp({ Component, pageProps }) {
  const [keycloak, setKeycloak] = useState(null)

  useEffect(() => {
    initKeycloak().then((kc) => {
      if (kc) setKeycloak(kc)
    })
  }, [])

  if (!keycloak) {
    return <div>Trwa logowanie…</div>
  }

  return <Component {...pageProps} keycloak={keycloak} />
}

export default MyApp