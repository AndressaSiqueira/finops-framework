# FinOps Framework

FinOps Demo Application - Dashboard de custos com integração Azure AI Hub, Cost Management e análise de FinOps. Implementação do framework FinOps com containerização, CI/CD e observabilidade completa.

## 🚀 Features

- **Rate Limiting por API Key**: Controle de taxa de requisições configurável por chave de API
- **Autenticação por API Key**: Sistema seguro de autenticação baseado em chaves
- **Headers HTTP Padrão**: Implementação completa de headers de rate limit (`X-RateLimit-*`)
- **Armazenamento Redis**: Contadores de requisições persistentes e eficientes
- **Containerização**: Pronto para deploy com Docker e Docker Compose
- **TypeScript**: Código type-safe com suporte completo a tipos

## 📋 Pré-requisitos

- Node.js 18+
- Redis 7+
- Docker e Docker Compose (opcional)

## 🔧 Instalação

### Desenvolvimento Local

1. Clone o repositório:
```bash
git clone https://github.com/AndressaSiqueira/finops-framework.git
cd finops-framework
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o Redis (se não estiver usando Docker):
```bash
redis-server
```

5. Execute a aplicação em modo desenvolvimento:
```bash
npm run dev
```

### Usando Docker Compose

```bash
docker-compose up -d
```

A aplicação estará disponível em `http://localhost:3000`.

## 🔐 Rate Limiting

### Como Funciona

O sistema de rate limiting é implementado usando um algoritmo de janela deslizante (sliding window) com Redis como backend de armazenamento. Cada API key possui limites configuráveis de requisições por intervalo de tempo.

### Configuração de API Keys

A aplicação vem com três chaves de demonstração pré-configuradas:

| API Key | Plano | Limite |
|---------|-------|--------|
| `demo-key-basic` | Basic | 10 requisições/minuto |
| `demo-key-premium` | Premium | 100 requisições/minuto |
| `demo-key-enterprise` | Enterprise | 1000 requisições/minuto |

As configurações das API keys estão em `src/config/apiKeys.ts`.

### Headers de Rate Limit

Todas as respostas de endpoints protegidos incluem os seguintes headers:

- **`X-RateLimit-Limit`**: Número máximo de requisições permitidas na janela de tempo
- **`X-RateLimit-Remaining`**: Número de requisições restantes na janela atual
- **`X-RateLimit-Reset`**: Timestamp Unix (em segundos) quando o limite será resetado
- **`Retry-After`**: Segundos até poder fazer nova requisição (apenas em 429)

### Resposta ao Exceder o Limite

Quando o limite é excedido, o servidor retorna HTTP 429 (Too Many Requests):

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "limit": 10,
  "remaining": 0,
  "reset": 1706554800,
  "retryAfter": 45
}
```

## 📡 Endpoints da API

### Health Check
```bash
GET /health
```
Verifica se a aplicação está funcionando. Não requer autenticação.

**Exemplo:**
```bash
curl http://localhost:3000/health
```

### Dados de Custos
```bash
GET /api/v1/costs
```
Retorna dados de custos do Azure. Requer API key e está sujeito a rate limiting.

**Exemplo:**
```bash
curl -H "X-API-Key: demo-key-basic" http://localhost:3000/api/v1/costs
```

**Resposta:**
```json
{
  "message": "Cost data retrieved successfully",
  "apiKey": "Basic Plan",
  "data": {
    "totalCost": 1234.56,
    "period": "last-30-days",
    "currency": "USD",
    "services": [
      { "name": "Compute", "cost": 800.00 },
      { "name": "Storage", "cost": 234.56 },
      { "name": "Network", "cost": 200.00 }
    ]
  },
  "timestamp": "2026-01-29T19:00:00.000Z"
}
```

### Recomendações de Economia
```bash
GET /api/v1/recommendations
```
Retorna recomendações para otimização de custos. Requer API key e está sujeito a rate limiting.

**Exemplo:**
```bash
curl -H "X-API-Key: demo-key-premium" http://localhost:3000/api/v1/recommendations
```

### Status do Rate Limit
```bash
GET /api/v1/rate-limit-status
```
Consulta o status do rate limit sem consumir uma requisição. Requer API key.

**Exemplo:**
```bash
curl -H "X-API-Key: demo-key-basic" http://localhost:3000/api/v1/rate-limit-status
```

## 🧪 Testes

### Executar Todos os Testes
```bash
npm test
```

### Executar Testes em Modo Watch
```bash
npm run test:watch
```

### Cobertura de Testes
```bash
npm test -- --coverage
```

## 🔨 Build

```bash
npm run build
```

Os arquivos compilados serão gerados no diretório `dist/`.

## 🐳 Docker

### Build da Imagem
```bash
docker build -t finops-framework .
```

### Executar Container
```bash
docker run -p 3000:3000 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  finops-framework
```

## 📊 Exemplo de Uso Completo

### Testando Rate Limiting

1. Fazer múltiplas requisições com a chave básica (limite de 10/min):
```bash
for i in {1..15}; do
  echo "Requisição $i:"
  curl -i -H "X-API-Key: demo-key-basic" http://localhost:3000/api/v1/costs
  echo ""
done
```

2. Observar os headers de rate limit:
```bash
curl -i -H "X-API-Key: demo-key-basic" http://localhost:3000/api/v1/costs
```

Você verá headers como:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1706554800
```

3. Após exceder o limite, você receberá:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706554800
Retry-After: 45
```

## 🔧 Configuração Avançada

### Customizar Limites de Rate

Edite `src/config/apiKeys.ts` para adicionar ou modificar API keys:

```typescript
export const apiKeyConfigs: Map<string, ApiKeyConfig> = new Map([
  [
    'my-custom-key',
    {
      key: 'my-custom-key',
      name: 'Custom Plan',
      rateLimit: {
        windowMs: 3600000, // 1 hora
        maxRequests: 500,   // 500 requisições por hora
      },
      enabled: true,
    },
  ],
]);
```

### Variáveis de Ambiente

Crie um arquivo `.env` baseado em `.env.example`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting Defaults
DEFAULT_RATE_LIMIT_WINDOW=60000
DEFAULT_RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Arquitetura

```
src/
├── config/          # Configurações da aplicação e API keys
├── middleware/      # Middleware de autenticação e rate limiting
├── routes/          # Definição de rotas da API
├── services/        # Serviços (Redis, rate limiting)
├── types/           # Definições de tipos TypeScript
└── index.ts         # Entry point da aplicação
```

### Fluxo de Requisição

1. Cliente envia requisição com header `X-API-Key`
2. `validateApiKey` middleware verifica a validade da chave
3. `rateLimiter` middleware consulta o Redis
4. Se dentro do limite: requisição prossegue
5. Se limite excedido: retorna HTTP 429
6. Headers de rate limit são adicionados à resposta

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🐛 Problemas Conhecidos

- Rate limiting requer Redis em execução
- Em ambientes distribuídos, sincronização pode ter pequena latência

## 🗺️ Roadmap

- [ ] Dashboard web para visualização de métricas
- [ ] Integração real com Azure Cost Management API
- [ ] Rate limiting por IP
- [ ] Autenticação OAuth2
- [ ] Logs estruturados e métricas Prometheus
- [ ] Admin API para gerenciar API keys
- [ ] Suporte a múltiplos backends de storage (não apenas Redis)
