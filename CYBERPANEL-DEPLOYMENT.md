# EccoServ - Deploy via CyberPanel

Este guia mostra como fazer deploy do EccoServ usando CyberPanel, que simplifica muito o processo de deployment.

## Pré-requisitos

### 1. VPS com CyberPanel
- **VPS Requirements**: 2GB RAM, 2 CPU cores, 20GB storage
- **CyberPanel**: Já instalado na VPS
- **Acesso**: Admin do CyberPanel e SSH da VPS

### 2. Preparação Local
Execute o script de preparação:
```bash
chmod +x deploy-instructions.sh
./deploy-instructions.sh
```

## Passo a Passo - CyberPanel

### 1. Criar Website no CyberPanel

1. **Login no CyberPanel**: Acesse `https://SEU-IP:8090`
2. **Websites > Create Website**:
   - **Domain**: `eccoserv.seudominio.com`
   - **Email**: seu@email.com
   - **Package**: Default
   - **PHP**: Não necessário (aplicação Node.js)
   - **SSL**: Sim (Let's Encrypt)

### 2. Configurar Node.js App

1. **Node.js > Create App**:
   - **Domain**: Selecione o domínio criado
   - **App Name**: `eccoserv`
   - **Node.js Version**: 18.x ou superior
   - **App Root**: `/public_html/eccoserv`
   - **Startup File**: `dist/index.js`
   - **Port**: `5000` (ou disponível)

### 3. Upload dos Arquivos

#### Via CyberPanel File Manager:
1. **File Manager > Ir para seu domínio**
2. **Criar pasta**: `eccoserv` em `public_html/`
3. **Upload**: Todos os arquivos do projeto
4. **Renomear**: `package.json.vps` → `package.json`

#### Ou via SSH:
```bash
# Conectar via SSH
ssh root@SEU-IP

# Navegar para diretório do site
cd /home/SEU-USUARIO/public_html/eccoserv

# Upload via scp, git clone, ou outro método
# Exemplo com git:
git clone https://seu-repositorio.com/eccoserv.git .

# Renomear arquivos para produção
mv package.json.vps package.json
```

### 4. Configurar Banco PostgreSQL

#### Via CyberPanel:
1. **Databases > Create Database**:
   - **Database Name**: `eccoserv_db`
   - **Username**: `eccoserv_user`
   - **Password**: Senha forte

#### Via SSH (alternativo):
```bash
# Instalar PostgreSQL se não estiver instalado
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar banco e usuário
sudo -u postgres psql -c "CREATE DATABASE eccoserv_db;"
sudo -u postgres psql -c "CREATE USER eccoserv_user WITH PASSWORD 'SUA_SENHA';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eccoserv_db TO eccoserv_user;"
```

### 5. Configurar Variáveis de Ambiente

1. **Criar arquivo .env** no diretório da aplicação:
```bash
cd /home/SEU-USUARIO/public_html/eccoserv
nano .env
```

2. **Conteúdo do .env**:
```env
DATABASE_URL=postgresql://eccoserv_user:SUA_SENHA@localhost:5432/eccoserv_db
SESSION_SECRET=sua-chave-secreta-super-forte-aqui
NODE_ENV=production
PORT=5000
```

### 6. Instalar Dependências e Build

```bash
cd /home/SEU-USUARIO/public_html/eccoserv

# Instalar dependências
npm install

# Build da aplicação
npm run build

# Executar migrações do banco
npm run db:push
```

### 7. Iniciar Aplicação no CyberPanel

1. **Node.js > Manage Apps**
2. **Selecionar**: eccoserv
3. **Actions**:
   - **Start App**: Iniciar aplicação
   - **Enable**: Ativar auto-start

### 8. Configurar Proxy Reverso (se necessário)

Se a aplicação não estiver acessível diretamente:

1. **Websites > List Websites**
2. **Manage > Rewrite Rules**
3. **Adicionar regra**:
```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

### 9. Configurar SSL

1. **SSL > Manage SSL**
2. **Selecionar domínio**: eccoserv.seudominio.com
3. **Issue SSL**: Let's Encrypt
4. **Auto Renew**: Ativado

## Monitoramento via CyberPanel

### 1. Status da Aplicação
- **Node.js > Manage Apps**: Ver status, logs, reiniciar

### 2. Logs
```bash
# Via SSH - Logs da aplicação
tail -f /home/SEU-USUARIO/public_html/eccoserv/logs/combined.log

# Logs do CyberPanel
tail -f /usr/local/lsws/logs/error.log
```

### 3. Performance
- **Monitoring**: CPU, RAM, Network usage
- **Databases**: PostgreSQL monitoring

## Comandos Úteis via SSH

### Gerenciar Aplicação
```bash
cd /home/SEU-USUARIO/public_html/eccoserv

# Ver status
pm2 status eccoserv

# Reiniciar
pm2 restart eccoserv

# Ver logs
pm2 logs eccoserv

# Parar
pm2 stop eccoserv
```

### Backup
```bash
# Backup do banco
pg_dump eccoserv_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup dos arquivos
tar -czf eccoserv_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/SEU-USUARIO/public_html/eccoserv
```

## Atualizações

### Via CyberPanel File Manager:
1. **Upload**: Novos arquivos
2. **Node.js > Manage Apps > Restart**

### Via SSH:
```bash
cd /home/SEU-USUARIO/public_html/eccoserv

# Parar aplicação
pm2 stop eccoserv

# Atualizar código (git pull ou upload)
git pull origin main

# Reinstalar dependências (se necessário)
npm install

# Rebuild
npm run build

# Executar migrações
npm run db:push

# Reiniciar
pm2 start eccoserv
```

## Solução de Problemas

### 1. App não inicia
- **Check**: Node.js > Manage Apps > View Logs
- **Verificar**: .env existe e está correto
- **Testar**: `node dist/index.js` via SSH

### 2. Banco não conecta
- **Verificar**: PostgreSQL running
- **Check**: Credenciais no .env
- **Testar**: Conexão manual via `psql`

### 3. SSL não funciona
- **CyberPanel**: SSL > Issue SSL again
- **Verificar**: DNS pointing to server
- **Check**: Port 443 open

### 4. Performance Issues
- **Monitoring**: Check CPU/RAM usage
- **Upgrade**: Increase server resources
- **Optimize**: Database queries

## Configurações Específicas do CyberPanel

### 1. Auto-start App
```bash
# Via PM2 (preferido)
pm2 startup
pm2 save

# Ou via CyberPanel Node.js manager
```

### 2. Log Rotation
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Firewall (via CyberPanel)
- **Security > Firewall**
- **Allow**: Port 5000 (se necessário)
- **Standard**: 80, 443, 22, 8090

## Vantagens do CyberPanel

1. **Interface Gráfica**: Fácil gerenciamento
2. **SSL Automático**: Let's Encrypt integrado
3. **Backup**: Sistema de backup integrado
4. **Monitoring**: Monitoramento em tempo real
5. **Updates**: Atualizações simplificadas
6. **Multi-site**: Gerenciar múltiplos sites
7. **Performance**: LiteSpeed otimizado

## Arquivos Importantes

- `/home/SEU-USUARIO/public_html/eccoserv/.env` - Configurações
- `/home/SEU-USUARIO/public_html/eccoserv/logs/` - Logs da app
- `/usr/local/lsws/logs/` - Logs do servidor
- `/home/SEU-USUARIO/public_html/eccoserv/ecosystem.config.js` - PM2 config

Este método via CyberPanel é mais simples que o deployment manual e oferece uma interface gráfica para gerenciar a aplicação!