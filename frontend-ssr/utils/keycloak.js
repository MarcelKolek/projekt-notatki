// utils/keycloak.js
import Keycloak from 'keycloak-js'

let _kc       = null
let _initOnce = null

export function initKeycloak() {
  // never run on the server
  if (typeof window === 'undefined') return Promise.resolve(null)

  // if we already kicked off init, just return the same promise
  if (_initOnce) return _initOnce

  // first time: create the instance
  _kc = new Keycloak({
    url:   process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    realm: process.env.NEXT_PUBLIC_REALM,
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
  })

  // call init exactly once and stash the promise
  _initOnce = _kc
    .init({
      onLoad:                  'login-required',
      pkceMethod:              'S256',
      checkLoginIframe:        true,
      silentCheckSsoRedirectUri:
        window.location.origin + '/silent-check-sso.html',
    })
    .then((authenticated) => {
      if (!authenticated) _kc.login()
      return _kc
    })

  return _initOnce
}