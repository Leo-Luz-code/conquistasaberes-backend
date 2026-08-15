<div align="center">

# 🏛️ AVA UniVC — Back-end API
### *Ambiente Virtual de Aprendizagem da Prefeitura Municipal de Vitória da Conquista*

[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://localhost:3001/api/docs)
[![LGPD](https://img.shields.io/badge/LGPD-Conforme-059669?style=for-the-badge&logo=shield&logoColor=white)](#)

</div>

---

## 📌 Sobre o Projeto

O **AVA UniVC (Back-end)** é a API RESTful modular responsável pela inteligência de negócios, persistência de dados, telemetria de aprendizagem e serviços de certificação do Ambiente Virtual de Aprendizagem dos servidores públicos municipais de Vitória da Conquista (CETI / SETP).

Construído com base nos princípios de Clean Architecture e Domain-Driven Design (DDD), o sistema atende integralmente às demandas de governança digital, conformidade com a LGPD e gamificação ativa.

---

## 🚀 Principais Módulos & Recursos

- 🔐 **Autenticação & RBAC:** Login via CPF/Matrícula (SSO Municipal), JWT com Guards de perfis (`SERVIDOR`, `GESTOR_SECRETARIA`, `ADMIN_RH_CETI`) e termo de consentimento LGPD.
- 📚 **Catálogo de Cursos & Trilhas:** Gestão de cursos, módulos, aulas (Vídeo, Texto, PDF, Quiz) e trilhas organizadas pelos 5 Eixos Oficiais de Conhecimento.
- 🎮 **Motor de Gamificação:** Concessão automática de XP por aulas concluídas, cálculo de níveis, galeria de badges e ranking intersecretarial.
- 📜 **Certificação Digital Automatizada:** Emissão nativa de certificados em PDF com hash único de autenticidade, QR Code dinâmico e validação pública instantânea.
- 📊 **Analytics & Telemetria:** Agregação de dados para painéis executivos do gestor (taxas de adesão, conclusão por órgão e horas dedicadas).
- 🛡️ **Auditoria & Soft Delete:** Rastreamento de ações administrativas e exclusão lógica em conformidade com a governança pública.

---

## 🛠️ Stack Tecnológica

| Componente | Tecnologia |
|---|---|
| **Framework** | NestJS 10 (TypeScript, Node.js) |
| **ORM & Database** | Prisma ORM com PostgreSQL |
| **Validação & DTOs** | `class-validator` e `class-transformer` |
| **Segurança** | Passport JWT, Bcrypt, Helmet e CORS |
| **Geração de PDF** | PDFKit |
| **Documentação Interativa** | Swagger / OpenAPI (`/api/docs`) |

---

## ⚡ Como Executar o Projeto

### Pré-requisitos
- **Node.js:** Versão 18 ou superior
- **npm** ou **yarn**
- **PostgreSQL:** Banco de dados ativo local ou via Docker

### 1. Clonar e Instalar Dependências
```bash
cd conquistasaberes-backend
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie ou edite o arquivo `.env` na raiz do módulo backend:
```env
DATABASE_URL="postgres://postgres:123@localhost:5432/conquista-saberes?schema=public"
JWT_SECRET="segredo-super-seguro-conquista-saberes-2026"
JWT_EXPIRES_IN="1d"
PORT=3001
CORS_ORIGIN="*"
```

### 3. Executar Migrations e Popular o Banco (Seed)
```bash
# Executar as migrações do Prisma
npx prisma migrate dev

# Popular a base com dados realistas da PMVC (Secretarias, Servidores, Cursos e Eixos)
npx prisma db seed
```

### 4. Iniciar a API em Modo Desenvolvimento
```bash
npm run start:dev
```
A API estará acessível em: `http://localhost:3001`  
Documentação Swagger disponível em: `http://localhost:3001/api/docs`

---

## 👥 Credenciais de Acesso Padrão (Seed)

| Papel / Perfil | E-mail | Senha | Descrição |
|---|---|---|---|
| **Admin CETI / RH** | `admin.rh@pmvc.ba.gov.br` | `admin` | Acesso administrativo completo à plataforma |
| **Gestor Secretaria (SMS)** | `ana.souza@pmvc.ba.gov.br` | `123456` | Painel de indicadores e gestão de cursos da Saúde |
| **Servidor Municipal (SETP)** | `carlos.silva@pmvc.ba.gov.br` | `123456` | Dashboard do servidor, trilhas, aulas e certificados |

---

## 🏛️ Prefeitura Municipal de Vitória da Conquista
**Central de Tecnologia da Informação (CETI)**  
*Secretaria Municipal de Transparência, Controle e Governança (SETP)*
