// frontend-spa/src/kc-config.js

export const kcConfig = {
    url: "http://localhost:8080/auth",  // upewnij się, że to dokładnie adres Keycloak-a
    realm: "notes-realm",               // nazwa realm w Keycloak
    clientId: "notes-spa",              // clientId w Keycloak → Clients
  };
  