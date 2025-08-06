# 🚀 EccoServ - Guia Rápido CyberPanel

## Resumo: 3 Passos Principais

### 1️⃣ **Preparar Localmente**
```bash
chmod +x cyberpanel-setup.sh
./cyberpanel-setup.sh
```

### 2️⃣ **Upload para VPS**
- Transferir TODOS os arquivos para `/home/SEU-USUARIO/public_html/eccoserv/`
- Renomear: `mv package.json.vps package.json`

### 3️⃣ **Configurar no CyberPanel**
1. **Criar Website** (eccoserv.seudominio.com)
2. **Criar Node.js App**:
   - Nome: `eccoserv`
   - Startup File: `start-app.js`
   - Port: `5000`
3. **Configurar .env** com DATABASE_URL
4. **Build**: `./scripts/cyberpanel-build.sh`
5. **Start App** no painel

---

## ⚙️ Configurações Específicas

### Database (PostgreSQL)
```sql
CREATE DATABASE eccoserv_db;
CREATE USER eccoserv_user WITH PASSWORD 'SUA_SENHA';
GRANT ALL PRIVILEGES ON DATABASE eccoserv_db TO eccoserv_user;
```

### Arquivo .env
```env
DATABASE_URL=postgresql://eccoserv_user:SUA_SENHA@localhost:5432/eccoserv_db
SESSION_SECRET=sua-chave-secreta-super-forte
NODE_ENV=production
PORT=5000
```

### Nginx Rules (se necessário)
Copie o conteúdo de `cyberpanel-nginx.conf` nas Rewrite Rules

---

## 🔍 Troubleshooting

**App não inicia?**
- ✅ Verificar logs: Node.js > Manage Apps > View Logs
- ✅ Conferir .env existe e está correto
- ✅ Testar: `node start-app.js`

**Banco não conecta?**
- ✅ PostgreSQL rodando: `systemctl status postgresql`
- ✅ Credenciais corretas no .env
- ✅ Banco existe: `sudo -u postgres psql -l`

**Site não carrega?**
- ✅ App status: Running
- ✅ Port 5000 livre: `netstat -tlnp | grep 5000`
- ✅ SSL configurado

---

## 📁 Arquivos Importantes

```
eccoserv/
├── start-app.js          ← Startup file do CyberPanel
├── .env                  ← Suas configurações
├── package.json          ← Dependências (renomeado de package.json.vps)
├── scripts/
│   ├── cyberpanel-build.sh    ← Script de build
│   └── cyberpanel-restart.sh  ← Script restart
├── cyberpanel-nginx.conf ← Configuração Nginx
└── dist/                 ← Build da aplicação
```

---

## 🎯 Credenciais de Teste

**Administrador:**
- Email: admin@eccoserv.com
- Senha: admin123

**Prestador:**
- Email: carlos@tecnico.com  
- Senha: tecnico123

**Cliente:**
- Email: joao@cliente.com
- Senha: cliente123

---

Isso é tudo! Siga os 3 passos principais e sua aplicação EccoServ estará rodando no CyberPanel! 🎉