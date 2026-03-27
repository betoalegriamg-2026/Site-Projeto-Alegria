# Projeto Alegria - PRD (Product Requirements Document)

## Visão Geral
Sistema completo para gestão do Projeto Alegria - ONG que oferece atividades artísticas, culturais e esportivas para crianças e adultos em situação de vulnerabilidade social.

## Data de Criação
27/03/2026

## Arquitetura
- **Frontend**: React.js com Tailwind CSS
- **Backend**: FastAPI (Python)
- **Banco de Dados**: MongoDB
- **Autenticação**: JWT

## User Personas
1. **Administrador**: Gerencia alunos, turmas, pagamentos, fluxo de caixa, relatórios
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
9. Área do responsável
10. Login/autenticação

## O que foi implementado (27/03/2026)

### Backend (100% Funcional)
- ✅ API REST completa com FastAPI
- ✅ Autenticação JWT (login/registro)
- ✅ CRUD de Alunos (students)
- ✅ CRUD de Turmas (classes) - 8 turmas iniciais: Zumba, Pilates, Natação Infantil 3-6 anos, Natação Infantil 7-12 anos, Jiu-Jitsu Infantil, Ballet Infantil, Hidroginástica, Funcional
- ✅ Gestão de Matrículas (enrollments)
- ✅ Controle de Presença em lote (attendance bulk)
- ✅ Gestão de Pagamentos (payments)
- ✅ Fluxo de Caixa (cashflow) - income/expense
- ✅ Relatórios por turma com estatísticas
- ✅ Dashboard com estatísticas gerais
- ✅ Endpoints públicos (stats, classes, testimonials, contact)
- ✅ Seeds de dados iniciais

### Frontend (90% Funcional)
- ✅ Landing Page institucional com design Vibrant Play (azul/amarelo)
- ✅ Seções: Hero, Sobre, Turmas, Depoimentos, Contato
- ✅ Formulário de Contato funcional
- ✅ Página de Inscrição
- ✅ Login/Autenticação
- ✅ Dashboard administrativo com estatísticas
- ✅ Página de Gestão de Alunos (CRUD)
- ✅ Página de Turmas
- ✅ Página de Presença (estrutura)
- ✅ Página de Pagamentos (estrutura)
- ✅ Página de Fluxo de Caixa (CRUD completo)
- ✅ Página de Relatórios por Turma

### Credenciais de Acesso
- **Admin**: admin@projetoalegria.org / admin123

## Backlog Priorizado

### P0 (Próximas Prioridades)
- [ ] Completar formulário de presença com seleção de alunos
- [ ] Completar página de pagamentos com registro de mensalidades

### P1 (Importante)
- [ ] Área do responsável (visualização de dados do aluno)
- [ ] Notificações de pagamentos pendentes
- [ ] Galeria de fotos/eventos

### P2 (Melhorias)
- [ ] Dashboard com gráficos visuais (Recharts)
- [ ] Exportar relatórios em PDF
- [ ] Envio de e-mail para novos cadastros
- [ ] Recuperação de senha

## Próximas Tarefas
1. Finalizar controle de presença com seleção de turma e alunos
2. Implementar registro de pagamentos vinculado a alunos/turmas
3. Criar área do responsável com visualização de dados
4. Adicionar galeria de projetos/fotos
