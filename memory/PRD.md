# Projeto Alegria - PRD (Product Requirements Document)

## Visão Geral
Sistema completo para gestão do Projeto Alegria - ONG que oferece atividades artísticas, culturais e esportivas para crianças e adultos em situação de vulnerabilidade social.

## Data de Criação
27/03/2026

## Última Atualização
27/03/2026 - CMS Completo implementado

## Arquitetura
- **Frontend**: React.js com Tailwind CSS
- **Backend**: FastAPI (Python)
- **Banco de Dados**: MongoDB
- **Autenticação**: JWT

## User Personas
1. **Administrador**: Gerencia alunos, turmas, pagamentos, fluxo de caixa, relatórios, e TODO o conteúdo do site
2. **Responsável**: Visualiza dados do aluno, histórico de pagamentos, frequência
3. **Visitante**: Acessa site institucional, faz inscrição, entra em contato

## Core Requirements (Estático)
1. Site institucional com landing page completa
2. Sistema de inscrição online
3. Gestão de alunos e matrículas
4. Gestão de turmas
5. Controle de presença/chamada
6. Gestão de pagamentos
7. Fluxo de caixa (contas a pagar e receber)
8. Relatórios por turma (matriculados, faltas, pagamentos)
9. **CMS Completo para edição do site**
10. Login/autenticação

## O que foi implementado

### Backend (100% Funcional)
- ✅ API REST completa com FastAPI
- ✅ Autenticação JWT (login/registro)
- ✅ CRUD de Alunos (students)
- ✅ CRUD de Turmas (classes)
- ✅ Gestão de Matrículas (enrollments)
- ✅ Controle de Presença em lote (attendance bulk)
- ✅ Gestão de Pagamentos (payments)
- ✅ Fluxo de Caixa (cashflow)
- ✅ Relatórios por turma
- ✅ Dashboard com estatísticas
- ✅ **CMS - Site Settings** (editar textos, contato, redes sociais)
- ✅ **CMS - Galeria de Fotos**
- ✅ **CMS - Projetos**
- ✅ **CMS - Depoimentos**
- ✅ **CMS - Mensagens de Contato**

### Frontend (100% Funcional)
- ✅ Landing Page institucional
- ✅ Dashboard administrativo
- ✅ Gestão de alunos, turmas, fluxo de caixa
- ✅ **Página Editar Site** (com abas: Hero, Sobre, Contato, Redes Sociais)
- ✅ **Página Galeria** (adicionar/remover imagens)
- ✅ **Página Projetos** (CRUD completo)
- ✅ **Página Depoimentos** (CRUD completo)
- ✅ **Página Mensagens** (visualizar, marcar status, excluir)

### Credenciais de Acesso
- **Admin**: admin@projetoalegria.org / admin123

## Backlog Priorizado

### P0 (Próximas Prioridades)
- [ ] Completar formulário de presença com seleção de alunos
- [ ] Completar página de pagamentos com registro de mensalidades

### P1 (Importante)
- [ ] Área do responsável (visualização de dados do aluno)
- [ ] Upload de imagens direto (ao invés de URL)

### P2 (Melhorias)
- [ ] Dashboard com gráficos visuais
- [ ] Exportar relatórios em PDF
- [ ] Notificações por email/WhatsApp

## Próximas Tarefas
1. Finalizar controle de presença
2. Implementar registro de pagamentos
3. Criar área do responsável
