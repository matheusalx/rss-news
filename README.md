# 📡 RSS News Hub

Um centralizador de notícias moderno, elegante e de alto desempenho, construído para oferecer uma experiência de leitura premium das suas fontes RSS favoritas.

![Aesthetics](https://img.shields.io/badge/Aesthetics-Premium-blueviolet)
![License](https://img.shields.io/badge/License-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Funcionalidades

- **🚀 Performance Extrema:** Backend otimizado com sistema de cache inteligente e detecção de codificação (UTF-8/Latin1).
- **🎨 Design State-of-the-Art:** Interface baseada em *Glassmorphism*, modo escuro nativo e micro-animações fluidas.
- **📱 Responsividade Total:** Experiência otimizada para Desktop, Tablet e Mobile.
- **🔄 Atualização Automática:** Mantém seu feed sempre fresco sem necessidade de recarregar a página.
- **🔍 Filtros Avançados:** Busca em tempo real e filtragem por categorias (Brasil, Mundo, Política, Economia).
- **🌓 Dual View:** Alterne entre visualização em Grade (Grid) ou Lista (List) com um clique.
- **🐳 Docker Ready:** Totalmente containerizado para facilitar o deploy e desenvolvimento.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5 semântico, Vanilla CSS (Design Systems), JavaScript (ES6+).
- **Backend:** Node.js, Express.
- **Parsing:** `rss-parser` com suporte a campos customizados (media:content, thumbnails).
- **DevOps:** Docker, Docker Compose.

## 🚀 Como Iniciar

### Pré-requisitos

- Node.js (v20 ou superior)
- Docker (opcional, para rodar via container)

### Opção 1: Rodando Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/rss-news.git
   cd rss-news
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm start
   ```
   O projeto estará disponível em `http://localhost:3000`.

### Opção 2: Rodando com Docker (Recomendado)

Você pode subir todo o ambiente rapidamente usando o Docker Compose:

```bash
docker-compose up -d --build
```

Isso criará um container isolado rodando o serviço na porta `3000`.

## 📂 Estrutura do Projeto

```text
├── public/              # Arquivos estáticos (HTML, CSS, JS)
│   ├── app.js           # Lógica principal do frontend
│   ├── styles.css       # Design System e Estilos
│   └── index.html       # Estrutura da aplicação
├── server.js            # Servidor Express e Lógica de Parsing RSS
├── Dockerfile           # Configuração da imagem Docker
├── docker-compose.yml   # Orquestração do container
└── package.json         # Dependências e scripts
```


