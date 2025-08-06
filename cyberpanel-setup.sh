#!/bin/bash

# EccoServ - Setup script for CyberPanel deployment
echo "🚀 Configurando EccoServ para CyberPanel..."

# 1. Criar estrutura de diretórios necessária
mkdir -p logs
mkdir -p dist

# 2. Verificar se arquivos necessários existem
echo "📋 Verificando arquivos necessários..."

if [ ! -f "package.json.vps" ]; then
    echo "❌ Erro: package.json.vps não encontrado!"
    echo "Execute primeiro o script deploy-instructions.sh"
    exit 1
fi

if [ ! -f ".env.example" ]; then
    echo "❌ Erro: .env.example não encontrado!"
    exit 1
fi

if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# 3. Criar .env baseado no exemplo se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas configurações reais!"
fi

# 4. Criar script de inicialização para CyberPanel
cat > start-app.js << 'EOF'
// Script de inicialização para CyberPanel
// Este arquivo deve ser definido como "Startup File" na configuração Node.js do CyberPanel

require('dotenv').config();

// Verificar se todas as variáveis necessárias estão definidas
const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não definidas:', missingVars);
    console.error('Configure o arquivo .env antes de iniciar a aplicação');
    process.exit(1);
}

// Importar e executar aplicação principal
import('./dist/index.js').catch(err => {
    console.error('❌ Erro ao iniciar aplicação:', err);
    process.exit(1);
});
EOF

# 5. Criar scripts auxiliares
cat > scripts/cyberpanel-build.sh << 'EOF'
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
EOF

cat > scripts/cyberpanel-restart.sh << 'EOF'
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
EOF

# 6. Tornar scripts executáveis
mkdir -p scripts
chmod +x scripts/*.sh

# 7. Criar arquivo de configuração nginx personalizado para CyberPanel
cat > cyberpanel-nginx.conf << 'EOF'
# Configuração Nginx personalizada para CyberPanel
# Adicione esta configuração nas "Rewrite Rules" do seu site no CyberPanel

location /api/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
}

location / {
    try_files $uri $uri/ @nodejs;
}

location @nodejs {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
}
EOF

# 8. Criar checklist para CyberPanel
cat > CYBERPANEL-CHECKLIST.md << 'EOF'
# ✅ Checklist - Deploy EccoServ via CyberPanel

## Preparação Local ✅
- [ ] Script de preparação executado
- [ ] Arquivos transferidos para VPS
- [ ] package.json.vps renomeado para package.json

## CyberPanel - Website ✅
- [ ] Website criado no CyberPanel
- [ ] Domínio configurado
- [ ] SSL (Let's Encrypt) ativado

## CyberPanel - Node.js App ✅
- [ ] Node.js App criada
- [ ] Startup File: `start-app.js`
- [ ] Port: `5000`
- [ ] App Root correto

## Banco de Dados ✅
- [ ] PostgreSQL instalado
- [ ] Database criada: `eccoserv_db`
- [ ] User criado: `eccoserv_user`
- [ ] Permissões configuradas

## Configuração ✅
- [ ] Arquivo .env configurado
- [ ] DATABASE_URL correto
- [ ] SESSION_SECRET definido
- [ ] Build executado: `./scripts/cyberpanel-build.sh`

## Aplicação ✅
- [ ] App iniciada no CyberPanel
- [ ] Status: Running
- [ ] Logs sem erros
- [ ] Site acessível via navegador

## Opcional ✅
- [ ] PM2 configurado
- [ ] Nginx rules personalizadas
- [ ] Backup configurado
- [ ] Monitoramento ativo
EOF

echo ""
echo "✅ Configuração para CyberPanel concluída!"
echo ""
echo "📁 Arquivos criados:"
echo "   - start-app.js (Startup file para CyberPanel)"
echo "   - scripts/cyberpanel-build.sh (Script de build)"
echo "   - scripts/cyberpanel-restart.sh (Script de restart)"
echo "   - cyberpanel-nginx.conf (Configuração Nginx)"
echo "   - CYBERPANEL-CHECKLIST.md (Checklist de deploy)"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Transfira todos os arquivos para VPS"
echo "2. Siga CYBERPANEL-DEPLOYMENT.md"
echo "3. Use CYBERPANEL-CHECKLIST.md como guia"
echo ""
echo "🔧 No CyberPanel:"
echo "   - Startup File: start-app.js"
echo "   - Port: 5000"
echo "   - Execute: ./scripts/cyberpanel-build.sh"