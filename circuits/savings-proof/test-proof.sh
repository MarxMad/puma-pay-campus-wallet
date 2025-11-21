#!/bin/bash

# Script para probar el circuito con diferentes valores
# Uso: ./test-proof.sh <balance> <target_amount>
# Ejemplo: ./test-proof.sh 1000 500

BALANCE=${1:-600}
TARGET=${2:-500}

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "📝 Uso: ./test-proof.sh <balance> <target_amount>"
  echo "📝 Ejemplo: ./test-proof.sh 1000 500"
  echo ""
  echo "Usando valores por defecto: balance=$BALANCE, target=$TARGET"
  echo ""
fi

echo "🔄 Actualizando Prover.toml con:"
echo "   balance = $BALANCE"
echo "   target_amount = $TARGET"
echo ""

# Actualizar Prover.toml
cat > Prover.toml << EOF
balance = "$BALANCE"
target_amount = "$TARGET"
EOF

echo "🔐 Generando proof..."
echo ""

# Generar proof
/Users/gerryp/.nargo/bin/nargo prove

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Proof generado exitosamente!"
  echo "📁 Ubicación: proofs/savings_proof.proof"
  echo ""
  echo "🔍 Verificar proof:"
  echo "   /Users/gerryp/.nargo/bin/nargo verify"
else
  echo ""
  echo "❌ Error generando proof"
  echo "💡 Verifica que balance >= target_amount"
fi

