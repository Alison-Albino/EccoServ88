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
