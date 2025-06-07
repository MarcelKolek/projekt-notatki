import Keycloak from 'keycloak-js'

let _kc       = null
let _initOnce = null

export function initKeycloak() {
  if (typeof window === 'undefined') return Promise.resolve(null)

  if (_initOnce) return _initOnce

  _kc = new Keycloak({
    url:   process.env.NEXT_PUBLIC_KEYCLOAK_URL,
    realm: process.env.NEXT_PUBLIC_REALM,
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
  })

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