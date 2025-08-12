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
