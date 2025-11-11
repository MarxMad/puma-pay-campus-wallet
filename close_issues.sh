#!/bin/bash

# Script para cerrar issues completados en GitHub
# Uso: GITHUB_TOKEN=tu_token ./close_issues.sh

REPO="MarxMad/puma-pay-campus-wallet"
TOKEN="${GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Necesitas proporcionar un GITHUB_TOKEN"
  echo "Uso: GITHUB_TOKEN=tu_token ./close_issues.sh"
  exit 1
fi

# Issues a cerrar con sus comentarios de cierre
declare -A ISSUES=(
  ["2"]="✅ Mejoras de contraste completadas en la página de Cursos. Tags y badges ahora tienen mejor legibilidad. Pendiente: sistema de colores global y tema claro/oscuro."
  ["6"]="✅ Sección de Cursos implementada con filtros, búsqueda y pagos MXNB. Integración de toasts para mejor UX. Pendiente: optimizaciones de performance más amplias."
)

echo "🔍 Cerrando issues completados..."

for ISSUE_NUM in "${!ISSUES[@]}"; do
  COMMENT="${ISSUES[$ISSUE_NUM]}"
  
  echo "📝 Cerrando issue #$ISSUE_NUM..."
  
  # Agregar comentario al issue
  curl -X POST \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/issues/$ISSUE_NUM/comments" \
    -d "{\"body\": \"$COMMENT\"}" \
    -s -o /dev/null
  
  # Cerrar el issue
  curl -X PATCH \
    -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$REPO/issues/$ISSUE_NUM" \
    -d '{"state": "closed"}' \
    -s -o /dev/null
  
  if [ $? -eq 0 ]; then
    echo "✅ Issue #$ISSUE_NUM cerrado exitosamente"
  else
    echo "❌ Error cerrando issue #$ISSUE_NUM"
  fi
done

echo "✨ Proceso completado!"

