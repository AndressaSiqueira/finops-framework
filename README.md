# FinOps Framework

![FinOps](https://img.shields.io/badge/FinOps-Framework-blue)
![Azure](https://img.shields.io/badge/Azure-Cloud-0078D4)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

## 📋 Visão Geral

O **FinOps Framework** é uma aplicação demonstrativa de dashboard de custos com integração completa ao Azure AI Hub, Cost Management e análise de práticas FinOps. Este projeto implementa os princípios fundamentais do FinOps com containerização, pipelines CI/CD e observabilidade completa.

### O que é FinOps?

FinOps (Financial Operations) é uma disciplina de gerenciamento financeiro de nuvem que combina sistemas, melhores práticas e cultura para aumentar a capacidade de uma organização de compreender custos de nuvem e tomar decisões de negócio orientadas por dados.

## ✨ Características Principais

- **Dashboard de Custos**: Visualização em tempo real dos custos de infraestrutura
- **Integração Azure AI Hub**: Aproveitamento de IA para análise preditiva de custos
- **Cost Management**: Monitoramento e controle de gastos em nuvem
- **Análise FinOps**: Insights baseados nos pilares do FinOps Framework
- **Containerização**: Aplicação totalmente containerizada para fácil implantação
- **CI/CD**: Pipeline automatizado de integração e entrega contínua
- **Observabilidade**: Monitoramento, logging e tracing completos

## 🏗️ Arquitetura

A aplicação segue uma arquitetura moderna baseada em:

- **Frontend**: Dashboard interativo para visualização de dados
- **Backend**: API para processamento e análise de custos
- **Integração Azure**: Conexão com serviços Azure (AI Hub, Cost Management)
- **Containers**: Docker para containerização
- **Observabilidade**: Ferramentas de monitoramento e logging

## 🚀 Começando

### Pré-requisitos

- Docker e Docker Compose
- Conta Azure com acesso ao Cost Management
- Azure AI Hub configurado (opcional, para recursos de IA)
- Git

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/AndressaSiqueira/finops-framework.git
cd finops-framework
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais Azure
```

3. Execute com Docker Compose:
```bash
docker-compose up -d
```

4. Acesse o dashboard:
```
http://localhost:3000
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Azure Configuration
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Azure AI Hub (opcional)
AZURE_AI_HUB_ENDPOINT=your-ai-hub-endpoint
AZURE_AI_HUB_KEY=your-ai-hub-key

# Application Settings
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting Configuration
RATE_LIMIT_FREE_MAX=100
RATE_LIMIT_FREE_WINDOW=3600
RATE_LIMIT_PRO_MAX=1000
RATE_LIMIT_PRO_WINDOW=3600
RATE_LIMIT_ENTERPRISE_MAX=10000
RATE_LIMIT_ENTERPRISE_WINDOW=3600
```

### Rate Limiting

A API implementa rate limiting por API key para proteger contra abusos e garantir qualidade de serviço. Diferentes limites são aplicados conforme o tier do cliente:

#### Tiers Disponíveis

| Tier | Limite | Janela de Tempo |
|------|--------|----------------|
| Free | 100 requisições | 3600 segundos (1 hora) |
| Pro | 1000 requisições | 3600 segundos (1 hora) |
| Enterprise | 10000 requisições | 3600 segundos (1 hora) |

#### Usando a API com Rate Limiting

Todas as requisições para `/api/*` devem incluir o header `X-API-Key`:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/costs
```

#### Headers de Rate Limit

Cada resposta inclui headers informativos sobre o rate limiting:

- `X-RateLimit-Limit`: Número máximo de requisições permitidas na janela
- `X-RateLimit-Remaining`: Número de requisições restantes na janela atual
- `X-RateLimit-Reset`: Timestamp Unix quando o contador será resetado

#### Erro 429 - Too Many Requests

Quando o limite é excedido, a API retorna HTTP 429:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Maximum 100 requests per 3600 seconds allowed.",
  "retryAfter": 3600
}
```

#### API Keys de Teste

**⚠️ AVISO DE SEGURANÇA**: As API keys listadas abaixo são APENAS para desenvolvimento e testes locais. NUNCA use essas keys em ambientes de produção.

Para desenvolvimento e testes locais, use as seguintes API keys:

- **Free tier**: `free-api-key-123`
- **Pro tier**: `pro-api-key-456`
- **Enterprise tier**: `enterprise-api-key-789`

**Nota Importante**: 
- Em produção, as API keys devem ser gerenciadas por um sistema de autenticação seguro (ex: OAuth 2.0, JWT)
- As keys devem ser armazenadas em um banco de dados com hash/criptografia
- O mapeamento hardcoded no código (`src/middleware/rateLimitMiddleware.js`) deve ser substituído por consulta a banco de dados
- Implemente um sistema de geração e rotação de API keys
- Considere usar um serviço de gerenciamento de API keys como AWS API Gateway, Azure API Management, ou Kong

## 📊 Os Três Pilares do FinOps

Esta aplicação implementa os três pilares fundamentais do FinOps:

### 1. Informar (Inform)
- Visibilidade completa dos custos em tempo real
- Relatórios detalhados por serviço, equipe e projeto
- Análise de tendências e previsões

### 2. Otimizar (Optimize)
- Identificação de recursos subutilizados
- Recomendações de economia baseadas em IA
- Análise de oportunidades de Reserved Instances e Savings Plans

### 3. Operar (Operate)
- Automação de políticas de custo
- Alertas proativos de anomalias
- Governança e compliance financeiro

## 🛠️ Tecnologias Utilizadas

- **Cloud**: Microsoft Azure
- **Containers**: Docker, Docker Compose
- **IA/ML**: Azure AI Hub
- **Monitoring**: Azure Monitor, Application Insights
- **Cost Management**: Azure Cost Management API
- **CI/CD**: GitHub Actions (planejado)

## 📈 Funcionalidades

### Dashboard de Custos
- Visualização de custos por período
- Breakdown por serviço Azure
- Análise de tendências
- Comparação mês a mês

### Análise Preditiva
- Previsão de custos futuros usando Azure AI
- Identificação de anomalias
- Alertas inteligentes

### Relatórios
- Relatórios customizados
- Exportação de dados (CSV, PDF)
- Agendamento de relatórios

### Otimização
- Recomendações de economia
- Análise de recursos ociosos
- Sugestões de rightsizing

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Roadmap

- [ ] Implementação do frontend do dashboard
- [ ] Integração com Azure Cost Management API
- [ ] Desenvolvimento da API backend
- [ ] Integração com Azure AI Hub
- [ ] Setup de containerização Docker
- [ ] Configuração de CI/CD
- [ ] Implementação de observabilidade
- [ ] Documentação de APIs
- [ ] Testes automatizados
- [ ] Deploy em produção

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Andressa Siqueira** - [AndressaSiqueira](https://github.com/AndressaSiqueira)

## 🔗 Links Úteis

- [FinOps Foundation](https://www.finops.org/)
- [Azure Cost Management](https://azure.microsoft.com/en-us/services/cost-management/)
- [Azure AI Hub](https://azure.microsoft.com/en-us/products/ai-studio/)
- [FinOps Framework](https://www.finops.org/framework/)

## 📞 Suporte

Para questões e suporte, por favor abra uma [issue](https://github.com/AndressaSiqueira/finops-framework/issues) no GitHub.

---

**Nota**: Este é um projeto em desenvolvimento ativo. Recursos e funcionalidades estão sendo adicionados continuamente.
