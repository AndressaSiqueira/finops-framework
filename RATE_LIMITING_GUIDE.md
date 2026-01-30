# Rate Limiting - Guia de Uso Rápido

## Iniciando a Aplicação

### Com Docker Compose (Recomendado)

```bash
# Iniciar Redis e API
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f api
```

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar Redis
docker compose up -d redis

# Iniciar aplicação em modo desenvolvimento
npm run dev
```

## Testando Rate Limiting

### 1. Teste Básico - Free Tier (100 req/hora)

```bash
# Fazer uma requisição
curl -H "X-API-Key: free-api-key-123" http://localhost:3000/api/costs

# Ver informações de rate limit
curl -H "X-API-Key: free-api-key-123" http://localhost:3000/api/rate-limit-info
```

### 2. Verificar Headers de Rate Limit

```bash
curl -i -H "X-API-Key: free-api-key-123" http://localhost:3000/api/costs

# Saída esperada:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1769801234
```

### 3. Teste de Diferentes Tiers

```bash
# Free tier (100 req/hora)
curl -H "X-API-Key: free-api-key-123" http://localhost:3000/api/rate-limit-info

# Pro tier (1000 req/hora)
curl -H "X-API-Key: pro-api-key-456" http://localhost:3000/api/rate-limit-info

# Enterprise tier (10000 req/hora)
curl -H "X-API-Key: enterprise-api-key-789" http://localhost:3000/api/rate-limit-info
```

### 4. Testar Limite Excedido (HTTP 429)

```bash
# Script para exceder o limite
for i in {1..105}; do 
  curl -s -H "X-API-Key: free-api-key-123" http://localhost:3000/api/costs
done

# A partir da 101ª requisição, você verá:
# {
#   "error": "Too Many Requests",
#   "message": "Rate limit exceeded. Maximum 100 requests per 3600 seconds allowed.",
#   "retryAfter": 3600
# }
```

### 5. Testar Sem API Key (HTTP 401)

```bash
curl http://localhost:3000/api/costs

# Saída esperada:
# {
#   "error": "API key is required",
#   "message": "Please provide an API key in the X-API-Key header"
# }
```

### 6. Testar API Key Inválida (HTTP 401)

```bash
curl -H "X-API-Key: invalid-key" http://localhost:3000/api/costs

# Saída esperada:
# {
#   "error": "Invalid API key",
#   "message": "The provided API key is not valid"
# }
```

## Executando Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Ver cobertura de testes
npm test -- --coverage
```

## Monitoramento

### Verificar Logs

```bash
# Logs da aplicação
docker-compose logs -f api

# Logs do Redis
docker-compose logs -f redis
```

### Verificar Redis

```bash
# Conectar ao Redis
docker exec -it finops-redis redis-cli

# Ver todas as chaves de rate limit
keys ratelimit:*

# Ver detalhes de uma chave específica
zrange ratelimit:free-api-key-123 0 -1 withscores

# Limpar dados de rate limit (útil para testes)
flushdb
```

## Solução de Problemas

### Problema: Testes falhando com "address already in use"

```bash
# Verificar processos na porta 3000
lsof -i :3000

# Matar processo específico
kill <PID>
```

### Problema: Redis não conecta

```bash
# Verificar se Redis está rodando
docker-compose ps

# Reiniciar Redis
docker-compose restart redis

# Ver logs de erro do Redis
docker-compose logs redis
```

### Problema: Rate limit não está funcionando

```bash
# Verificar conexão com Redis
docker exec -it finops-redis redis-cli ping
# Deve retornar: PONG

# Verificar variáveis de ambiente
cat .env

# Verificar logs da aplicação
docker-compose logs api | grep -i rate
```

## Configuração Avançada

### Customizar Limites

Edite o arquivo `.env`:

```env
# Tier Free - 50 requisições por hora
RATE_LIMIT_FREE_MAX=50
RATE_LIMIT_FREE_WINDOW=3600

# Tier Pro - 5000 requisições por hora
RATE_LIMIT_PRO_MAX=5000
RATE_LIMIT_PRO_WINDOW=3600

# Tier Enterprise - 50000 requisições por hora
RATE_LIMIT_ENTERPRISE_MAX=50000
RATE_LIMIT_ENTERPRISE_WINDOW=3600
```

Depois, reinicie a aplicação:

```bash
docker-compose restart api
```

## Scripts Úteis

### Script para teste de carga

```bash
#!/bin/bash
# teste-carga.sh

API_KEY="free-api-key-123"
ENDPOINT="http://localhost:3000/api/costs"

echo "Iniciando teste de carga..."
for i in {1..10}; do
  response=$(curl -s -w "\n%{http_code}" -H "X-API-Key: $API_KEY" $ENDPOINT)
  http_code=$(echo "$response" | tail -n1)
  remaining=$(echo "$response" | head -n1 | jq -r '.data // "N/A"')
  
  echo "Requisição $i - Status: $http_code"
  
  if [ "$http_code" == "429" ]; then
    echo "Rate limit atingido!"
    break
  fi
  
  sleep 0.1
done
```

### Script para monitorar rate limit

```bash
#!/bin/bash
# monitorar-rate-limit.sh

API_KEY="$1"
ENDPOINT="http://localhost:3000/api/rate-limit-info"

watch -n 2 "curl -s -H 'X-API-Key: $API_KEY' $ENDPOINT | jq '.rateLimit'"
```

Uso:
```bash
chmod +x monitorar-rate-limit.sh
./monitorar-rate-limit.sh free-api-key-123
```

## Referências

- [Express Rate Limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [Redis Documentation](https://redis.io/docs/)
- [HTTP Status Code 429](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
