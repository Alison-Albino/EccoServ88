#!/bin/bash
# Script para build da aplicação no CyberPanel

echo "🏗️  Fazendo build da aplicação..."

# Usar package.json otimizado
if [ -f "package.json.vps" ]; then
    cp package.json.vps package.json
fi

# Instalar dependências
npm install --production

# Build da aplicação
npm run build

# Executar migrações do banco
npm run db:push

echo "✅ Build concluído!"