#!/bin/bash
# Script para reiniciar aplicação no CyberPanel

echo "🔄 Reiniciando aplicação..."

# Via PM2 (se disponível)
if command -v pm2 &> /dev/null; then
    pm2 restart eccoserv || pm2 start ecosystem.config.js
else
    echo "PM2 não encontrado, reinicie via interface do CyberPanel"
fi

echo "✅ Aplicação reiniciada!"