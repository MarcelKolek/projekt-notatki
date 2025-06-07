module.exports = {
    reactStrictMode: true,
    env: {
      KEYCLOAK_URL: process.env.KEYCLOAK_URL,
      REALM: process.env.REALM,
      CLIENT_ID: process.env.CLIENT_ID,
      CLIENT_SECRET: process.env.CLIENT_SECRET,
      API_URL: process.env.API_URL
    }
};