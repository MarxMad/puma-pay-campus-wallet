#!/usr/bin/env node

/**
 * Script para iniciar el backend con ngrok
 * Esto expone el backend local a internet para que el frontend en Vercel pueda conectarse
 * 
 * Uso:
 *   1. Instala ngrok: npm install -g ngrok (o brew install ngrok)
 *   2. Obtén un token de ngrok en https://dashboard.ngrok.com/get-started/your-authtoken
 *   3. Configura el token: ngrok config add-authtoken YOUR_TOKEN
 *   4. Ejecuta: node start-with-ngrok.js
 * 
 * O usa el script npm: npm run dev:tunnel
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const BACKEND_PORT = process.env.PORT || 4000;
const NGROK_PORT = 4040; // Puerto por defecto de ngrok web interface

console.log('🚀 Iniciando backend con ngrok...\n');

// Iniciar el backend
console.log('📦 Iniciando servidor backend...');
const backend = spawn('node', ['index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: BACKEND_PORT }
});

backend.on('error', (error) => {
  console.error('❌ Error iniciando backend:', error);
  process.exit(1);
});

// Esperar un poco para que el backend inicie
setTimeout(() => {
  console.log('\n🌐 Iniciando túnel ngrok...');
  
  // Iniciar ngrok
  const ngrok = spawn('ngrok', ['http', BACKEND_PORT.toString()], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let ngrokOutput = '';
  
  ngrok.stdout.on('data', (data) => {
    ngrokOutput += data.toString();
  });

  ngrok.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('started tunnel') || output.includes('Session Status')) {
      console.log(output);
    }
  });

  // Obtener la URL pública de ngrok
  const getNgrokUrl = async () => {
    try {
      // Esperar un poco para que ngrok se inicie
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await axios.get(`http://localhost:${NGROK_PORT}/api/tunnels`);
      const tunnels = response.data.tunnels;
      
      if (tunnels && tunnels.length > 0) {
        const httpsTunnel = tunnels.find(t => t.proto === 'https');
        const tunnel = httpsTunnel || tunnels[0];
        
        if (tunnel) {
          const publicUrl = tunnel.public_url;
          console.log('\n✅ Túnel ngrok iniciado exitosamente!');
          console.log(`\n🌍 URL pública del backend: ${publicUrl}`);
          console.log(`\n📋 Configura esta URL en Vercel como variable de entorno:`);
          console.log(`   VITE_BACKEND_URL=${publicUrl}`);
          console.log(`\n💡 O actualiza manualmente en Vercel Dashboard > Settings > Environment Variables`);
          console.log(`\n🔗 Backend local: http://localhost:${BACKEND_PORT}`);
          console.log(`🔗 Ngrok web interface: http://localhost:${NGROK_PORT}`);
          console.log(`\n⚠️  IMPORTANTE: Esta URL cambiará cada vez que reinicies ngrok (a menos que uses plan de pago)`);
          console.log(`\n🛑 Presiona Ctrl+C para detener el servidor y ngrok\n`);
        }
      }
    } catch (error) {
      console.error('⚠️  No se pudo obtener la URL de ngrok automáticamente');
      console.log('💡 Verifica manualmente en: http://localhost:' + NGROK_PORT);
      console.log('💡 O ejecuta: curl http://localhost:' + NGROK_PORT + '/api/tunnels');
    }
  };

  // Intentar obtener la URL después de unos segundos
  setTimeout(getNgrokUrl, 3000);

  // Manejar cierre
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Cerrando servidor y ngrok...');
    ngrok.kill();
    backend.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    ngrok.kill();
    backend.kill();
    process.exit(0);
  });

}, 2000);

