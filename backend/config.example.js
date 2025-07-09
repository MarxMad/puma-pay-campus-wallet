// Archivo de configuración de ejemplo para PumaPay Backend
// Copia este archivo como config.js y añade tus credenciales reales

module.exports = {
  // Configuración del servidor
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // API Keys de Bitso/Juno (Stage Environment)
  // Obtener desde: https://stage.buildwithjuno.com/settings/api-keys
  BITSO_APIKEY: process.env.BITSO_APIKEY || 'your_juno_api_key_here',
  BITSO_SECRET_APIKEY: process.env.BITSO_SECRET_APIKEY || 'your_juno_secret_key_here',
  
  // URLs de Juno
  JUNO_BASE_URL: process.env.JUNO_BASE_URL || 'https://stage.buildwithjuno.com',
  
  // CORS Origins permitidos
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pumapay-campus.vercel.app'
  ]
}; 