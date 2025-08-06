# EccoServ - Guia de Implantação em VPS

Este guia contém todas as instruções necessárias para implantar o EccoServ em uma VPS fora da Replit.

## Pré-requisitos

### 1. VPS Requirements
- **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 7+
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **CPU**: 2 cores
- **Armazenamento**: 20GB de espaço livre
- **Portas**: 80, 443, 5000 (ou porta personalizada)

### 2. Software Necessário
- Node.js 18+ e npm
- PostgreSQL 13+
- PM2 (para gerenciamento de processos)
- Nginx (proxy reverso)
- Certbot (SSL/HTTPS)

## Passo a Passo da Instalação

### 1. Configuração Inicial da VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git nginx postgresql postgresql-contrib
```

### 2. Instalar Node.js 18+

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Configurar PostgreSQL

```bash
# Iniciar e habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar usuário e banco
sudo -u postgres psql -c "CREATE USER eccoserv WITH PASSWORD 'sua_senha_aqui';"
sudo -u postgres psql -c "CREATE DATABASE eccoserv OWNER eccoserv;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eccoserv TO eccoserv;"
```

### 4. Preparar o Código da Aplicação

```bash
# Criar diretório para aplicação
sudo mkdir -p /var/www/eccoserv
sudo chown $USER:$USER /var/www/eccoserv

# Navegar para o diretório
cd /var/www/eccoserv

# Clonar/copiar código da aplicação aqui
# (você pode usar git clone ou transferir os arquivos via scp/sftp)
```

### 5. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env baseado no .env.example
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Configurações importantes no .env:**
```env
DATABASE_URL=postgresql://eccoserv:sua_senha_aqui@localhost:5432/eccoserv
SESSION_SECRET=gere-uma-chave-secreta-forte-aqui
NODE_ENV=production
PORT=5000
```

### 6. Instalar Dependências e Build

```bash
# Instalar dependências
npm install

# Fazer build da aplicação
npm run build

# Executar migrações do banco (se necessário)
npm run db:push
```

### 7. Instalar e Configurar PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar arquivo de configuração PM2
nano ecosystem.config.js
```

**Conteúdo do ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'eccoserv',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Criar diretório de logs
mkdir logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar com o sistema
pm2 startup
pm2 save
```

### 8. Configurar Nginx

```bash
# Criar configuração do site
sudo nano /etc/nginx/sites-available/eccoserv
```

**Conteúdo da configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

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
}
```

```bash
# Habilitar o site
sudo ln -s /etc/nginx/sites-available/eccoserv /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 9. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

### 10. Configurar Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Comandos de Monitoramento

### PM2
```bash
# Ver status das aplicações
pm2 status

# Ver logs
pm2 logs eccoserv

# Reiniciar aplicação
pm2 restart eccoserv

# Parar aplicação
pm2 stop eccoserv
```

### PostgreSQL
```bash
# Verificar status
sudo systemctl status postgresql

# Conectar ao banco
sudo -u postgres psql eccoserv
```

### Nginx
```bash
# Verificar status
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx
```

## Manutenção

### Atualizações
```bash
# Navegar para diretório da aplicação
cd /var/www/eccoserv

# Parar aplicação
pm2 stop eccoserv

# Atualizar código (git pull ou transferir arquivos)
# ...

# Instalar novas dependências
npm install

# Fazer novo build
npm run build

# Executar migrações se necessário
npm run db:push

# Reiniciar aplicação
pm2 start eccoserv
```

### Backup do Banco
```bash
# Criar backup
sudo -u postgres pg_dump eccoserv > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
sudo -u postgres psql eccoserv < backup_file.sql
```

## Solução de Problemas

### 1. Aplicação não inicia
```bash
# Verificar logs
pm2 logs eccoserv

# Verificar se banco está rodando
sudo systemctl status postgresql

# Verificar variáveis de ambiente
cat .env
```

### 2. Problemas de conexão
```bash
# Verificar se porta está sendo usada
sudo netstat -tlnp | grep :5000

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log
```

### 3. Problemas de banco
```bash
# Verificar conexão
sudo -u postgres psql -c "SELECT version();"

# Verificar logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Arquivos Importantes

- `/var/www/eccoserv/.env` - Configurações da aplicação
- `/etc/nginx/sites-available/eccoserv` - Configuração do Nginx
- `/var/www/eccoserv/ecosystem.config.js` - Configuração do PM2
- `/var/www/eccoserv/logs/` - Logs da aplicação

## Segurança Adicional

1. **Firewall**: Configure apenas as portas necessárias
2. **Usuário não-root**: Execute a aplicação com usuário dedicado
3. **Backup regular**: Configure backups automáticos do banco
4. **Monitoramento**: Implemente logs e alertas
5. **Atualizações**: Mantenha sistema e dependências atualizados

## Suporte

Para problemas específicos, verifique:
1. Logs da aplicação (`pm2 logs`)
2. Logs do Nginx (`/var/log/nginx/`)
3. Logs do PostgreSQL (`/var/log/postgresql/`)
4. Status dos serviços (`systemctl status`)