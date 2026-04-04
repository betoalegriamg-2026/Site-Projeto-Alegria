# Projeto Alegria - Guia de Deploy

## Pré-requisitos

Antes de fazer o deploy, você precisa criar um banco MongoDB gratuito:

### 1. Criar MongoDB Atlas (Gratuito)

1. Acesse [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crie uma conta gratuita
3. Crie um cluster (escolha "FREE - Shared")
4. Clique em "Connect" → "Connect your application"
5. Copie a connection string (será algo como):
   ```
   mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Em "Network Access", adicione `0.0.0.0/0` para permitir conexões de qualquer IP

---

## Opção 1: Deploy no Railway (Recomendado)

### Passo 1: Preparar o código

1. Faça download do código via GitHub (Save to GitHub → Download ZIP)
2. Ou clone o repositório

### Passo 2: Criar conta no Railway

1. Acesse [https://railway.app](https://railway.app)
2. Faça login com GitHub

### Passo 3: Deploy do Backend

1. Clique em "New Project" → "Deploy from GitHub repo"
2. Selecione a pasta `backend` do seu repositório
3. Railway detectará o Dockerfile automaticamente
4. Adicione as variáveis de ambiente:
   - `MONGO_URL` = sua connection string do MongoDB Atlas
   - `DB_NAME` = projeto_alegria
   - `JWT_SECRET` = (gere uma string aleatória)
   - `CORS_ORIGINS` = * (depois troque pela URL do frontend)
5. Clique em "Deploy"
6. Copie a URL gerada (ex: `https://projeto-alegria-api.up.railway.app`)

### Passo 4: Deploy do Frontend

1. Crie outro projeto no Railway
2. Selecione a pasta `frontend`
3. Adicione a variável de ambiente:
   - `REACT_APP_BACKEND_URL` = URL do backend (do passo anterior)
4. Deploy!

### Passo 5: Atualizar CORS

1. Volte no backend e atualize:
   - `CORS_ORIGINS` = URL do frontend

---

## Opção 2: Deploy no Render

### Passo 1: Preparar

1. Tenha o código no GitHub
2. Tenha o MongoDB Atlas configurado

### Passo 2: Deploy

1. Acesse [https://render.com](https://render.com)
2. Clique em "New" → "Blueprint"
3. Conecte seu repositório GitHub
4. Render lerá o arquivo `render.yaml` e criará os serviços
5. Configure a variável `MONGO_URL` com sua connection string

---

## Opção 3: Deploy no Vercel (Frontend) + Railway (Backend)

### Frontend no Vercel (Gratuito ilimitado)

1. Acesse [https://vercel.com](https://vercel.com)
2. Importe o repositório
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `yarn build`
   - Output Directory: `build`
4. Adicione variável: `REACT_APP_BACKEND_URL`
5. Deploy!

### Backend no Railway

Siga os passos da Opção 1 para o backend.

---

## Variáveis de Ambiente Necessárias

### Backend (.env)
```
MONGO_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/
DB_NAME=projeto_alegria
JWT_SECRET=sua-chave-secreta-aqui
CORS_ORIGINS=https://seu-frontend.vercel.app
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://seu-backend.up.railway.app
```

---

## Credenciais do Sistema

Após o deploy, acesse o painel admin com:
- **Email**: admin@projetoalegria.org
- **Senha**: admin123

⚠️ **IMPORTANTE**: Troque a senha do admin após o primeiro acesso!

---

## Custos Estimados

| Serviço | Custo |
|---------|-------|
| MongoDB Atlas | Gratuito (512MB) |
| Railway | Gratuito até $5/mês |
| Render | Gratuito (com limitações) |
| Vercel | Gratuito (frontend) |

**Total: R$ 0 para começar!**

---

## Suporte

Se tiver dúvidas, consulte:
- [Documentação Railway](https://docs.railway.app)
- [Documentação Render](https://render.com/docs)
- [Documentação Vercel](https://vercel.com/docs)
