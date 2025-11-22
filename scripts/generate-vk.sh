#!/bin/bash

# Script para generar el Verification Key (VK) desde un circuito Noir compilado
# Requiere: bb CLI (Barretenberg) instalado

set -e

CIRCUIT_DIR="${1:-circuits/savings-proof}"
OUTPUT_FILE="${2:-circuits/savings-proof/vk.json}"

echo "🔧 Generando Verification Key (VK) para el circuito..."
echo "📁 Directorio del circuito: $CIRCUIT_DIR"
echo "📄 Archivo de salida: $OUTPUT_FILE"

# Verificar que bb está instalado
if ! command -v bb &> /dev/null; then
    echo "❌ Error: bb CLI no está instalado"
    echo ""
    echo "Para instalar bb CLI:"
    echo "  macOS: curl -L https://github.com/AztecProtocol/barretenberg/releases/latest/download/bb-macos -o /usr/local/bin/bb && chmod +x /usr/local/bin/bb"
    echo "  Linux: curl -L https://github.com/AztecProtocol/barretenberg/releases/latest/download/bb-linux -o /usr/local/bin/bb && chmod +x /usr/local/bin/bb"
    echo ""
    echo "O descarga desde: https://github.com/AztecProtocol/barretenberg/releases"
    exit 1
fi

# Verificar que el circuito está compilado
ACIR_FILE="$CIRCUIT_DIR/target/savings_proof.json"
if [ ! -f "$ACIR_FILE" ]; then
    echo "❌ Error: Circuito no compilado. Ejecuta primero:"
    echo "  cd $CIRCUIT_DIR && nargo compile"
    exit 1
fi

echo "📦 Archivo ACIR encontrado: $ACIR_FILE"

# Generar el VK usando bb
echo "🔄 Generando VK con bb..."
bb write_vk -b "$ACIR_FILE" -o "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ VK generado exitosamente: $OUTPUT_FILE"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Lee el contenido de $OUTPUT_FILE"
    echo "2. Configura el VK en el verificador simple:"
    echo "   stellar contract invoke \\"
    echo "     --id CAE5SCP7O6CEC4HQZKSODMULY5VLLDQTYNNXX46L47CXW72B3FMAKJLT \\"
    echo "     --source-account issuer \\"
    echo "     --network testnet \\"
    echo "     -- set_vk \\"
    echo "     --vk_json <contenido-del-archivo-vk.json>"
else
    echo "❌ Error generando VK"
    exit 1
fi

