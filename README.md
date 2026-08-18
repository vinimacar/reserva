# RESERVE - Sistema de Agendamento de Salas e Laboratórios Escolares

O **RESERVE** é uma plataforma desenvolvida para instituições de ensino da rede pública e privada, permitindo que professores e coordenadores agendem o uso de **Salas de Informática**, **Laboratórios de Ciências/Química/Física**, **Espaço Maker/Robótica** e **Auditórios/Salas Multimídia** com controle inteligente de conflitos, autenticação Google e níveis de acesso (Professor e Administrador).

---

## 🚀 Funcionalidades Principais

- 🔐 **Autenticação Google com Controle de Acesso (RBAC)**:
  - **Perfil de Administrador**: Gestão de espaços e laboratórios, aprovação/recusa de reservas, relatórios de taxa de ocupação, exportação em CSV e gestão de permissões docentes.
  - **Perfil de Professor (Docente)**: Visualização da grade de horários, agendamento de aulas práticas, solicitação de equipamentos adicionais e emissão de comprovantes.
- 📅 **Grade de Horários Interativa (Agenda Escolar)**:
  - Matriz visual por dias da semana (Segunda a Sexta) e períodos escolares (1ª à 6ª aula nos turnos Matutino, Vespertino e Noturno).
  - Intervalos/recreios demarcados.
  - Agendamento com 1 clique direto no horário vago.
- ⚡ **Prevenção Inteligente de Conflitos**:
  - Validação em tempo real que impede agendamentos simultâneos no mesmo laboratório.
  - Suporte a aulas geminadas (ex.: 1ª e 2ª aula no mesmo agendamento).
- 🖨️ **Ficha Oficial de Reserva (Comprovante / PDF)**:
  - Geração de documento timbrado para visto pedagógico e controle escolar.
- 📊 **Painel de Estatísticas & Exportação**:
  - Métricas de uso por laboratório e exportação completa em formato `.csv`.
- 📢 **Mural de Avisos Escolares**:
  - Notificações em tempo real sobre manutenções ou novos recursos disponíveis.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações**: [Motion](https://motion.dev/)

---

## 💻 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

### Passo a passo

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/vinimacar/reserve.git
   cd reserve
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**:
   ```
   http://localhost:3000
   ```

---

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento.
- `npm run build`: Compila a aplicação para produção na pasta `dist/`.
- `npm run preview`: Visualiza o build de produção localmente.
- `npm run lint`: Executa a verificação estática de tipos do TypeScript.

---

## 🏫 Estrutura do Projeto

```
├── src/
│   ├── components/         # Componentes React (Grade, Modais, Painel Admin, etc.)
│   ├── context/            # Contextos de Autenticação e Reservas (AuthContext, ReservationContext)
│   ├── data/               # Dados iniciais e sementes de salas e horários (initialData.ts)
│   ├── types.ts            # Definições de tipos TypeScript
│   ├── App.tsx             # Componente raiz da aplicação
│   ├── main.tsx            # Ponto de entrada React
│   └── index.css           # Estilos globais e utilitários de impressão
├── index.html              # HTML base
├── package.json            # Dependências e scripts
└── tsconfig.json           # Configuração do compilador TypeScript
```

---

## 📄 Licença

Distribuído sob a licença [Apache-2.0](LICENSE).
