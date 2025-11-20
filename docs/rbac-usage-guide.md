# Guia de Uso - Sistema RBAC Expandido

## Visão Geral

O AuthContext foi atualizado para suportar 6 roles com permissões granulares. O sistema inclui **conversão automática** de roles antigas para as novas.

## Roles Disponíveis

| Role Antiga | Role Nova | Descrição |
|-------------|-----------|-----------|
| `admin` | `admin` | Administrador com acesso completo |
| `mentor` | `mentor` | Mentor que avalia e acompanha startups |
| `company` | `startup_owner` | **MIGRADO AUTOMATICAMENTE** - Líder da startup |
| - | `gestor` | Novo - Gestor de programas de incubação |
| - | `startup_member` | Novo - Membro da equipe da startup |
| - | `viewer_executivo` | Novo - Visualizador executivo (somente leitura) |

## Conversão Automática

O sistema converte automaticamente `company` → `startup_owner` no carregamento do perfil:

```typescript
// ANTES (role antiga no banco): 'company'
// DEPOIS (role convertida automaticamente): 'startup_owner'
// ✅ Atualização persistida no banco de dados
```

## Uso das Funções de Permissão

### 1. hasPermission - Verificação Simples

Verifica se o usuário atual tem uma permissão específica em um recurso.

```tsx
import { useAuth } from '@/features/auth/contexts/AuthContext';

function MyComponent() {
  const { hasPermission } = useAuth();

  return (
    <div>
      {hasPermission('startup', 'update') && (
        <button>Editar Startup</button>
      )}
      
      {hasPermission('evaluation', 'create') && (
        <button>Nova Avaliação</button>
      )}
    </div>
  );
}
```

### 2. hasAnyPermission - Verificação OR

Verifica se o usuário tem **qualquer uma** das permissões especificadas.

```tsx
function ActionBar() {
  const { hasAnyPermission } = useAuth();

  // Mostra botão se pode criar OU atualizar
  const canManageEvaluations = hasAnyPermission('evaluation', ['create', 'update']);

  return (
    <div>
      {canManageEvaluations && (
        <button>Gerenciar Avaliações</button>
      )}
    </div>
  );
}
```

### 3. hasAllPermissions - Verificação AND

Verifica se o usuário tem **todas** as permissões especificadas.

```tsx
function ApprovalButton() {
  const { hasAllPermissions } = useAuth();

  // Só mostra se pode ler E aprovar
  const canApprove = hasAllPermissions('deliverable', ['read', 'approve']);

  return (
    <>
      {canApprove && (
        <button>Aprovar Deliverable</button>
      )}
    </>
  );
}
```

### 4. getPermissions - Obter Lista de Permissões

Retorna array com todas as permissões do usuário para um recurso.

```tsx
function PermissionsList() {
  const { getPermissions } = useAuth();

  const startupPermissions = getPermissions('startup');
  // Para admin: ['create', 'read', 'update', 'delete', 'assign', 'advance']
  // Para startup_owner: ['read', 'update_self']

  return (
    <ul>
      {startupPermissions.map(permission => (
        <li key={permission}>{permission}</li>
      ))}
    </ul>
  );
}
```

## Recursos Disponíveis

| Recurso | Descrição | Ações Possíveis |
|---------|-----------|-----------------|
| `startup` | Gerenciamento de startups | create, read, update, delete, assign, advance, update_self, update_partial |
| `evaluation` | Avaliações | create, read, update, delete, publish, assign, evaluate, comment, answer, read_aggregated |
| `deliverable` | Entregáveis | create, read, update, delete, approve, request_changes, comment |
| `mentorship` | Mentorias | schedule, read, delete, log_notes, request |
| `badge` | Badges/Conquistas | create, read, assign |
| `user` | Gerenciamento de usuários | create, read, update, delete |
| `permission` | Gerenciamento de permissões | create, read, update, delete |

## Matriz de Permissões Completa

### Startup
- **ADMIN**: create, read, update, delete, assign, advance
- **GESTOR**: read, update, assign, advance
- **MENTOR**: read
- **STARTUP_OWNER**: read, update_self
- **STARTUP_MEMBER**: read, update_partial
- **VIEWER_EXECUTIVO**: read

### Evaluation
- **ADMIN**: create, read, update, delete, publish, assign
- **GESTOR**: read, assign, evaluate
- **MENTOR**: read, comment
- **STARTUP_OWNER**: read, answer
- **STARTUP_MEMBER**: read, answer
- **VIEWER_EXECUTIVO**: read_aggregated

### Deliverable
- **ADMIN**: read, update, delete
- **GESTOR**: read, approve, request_changes
- **MENTOR**: read, comment
- **STARTUP_OWNER**: create, read, update
- **STARTUP_MEMBER**: create, read

### Mentorship
- **ADMIN**: schedule, read, delete
- **GESTOR**: schedule, read
- **MENTOR**: read, log_notes
- **STARTUP_OWNER**: request, read
- **STARTUP_MEMBER**: read

### Badge
- **ADMIN**: create, assign
- **GESTOR**: read, assign
- **MENTOR**: read
- **STARTUP_OWNER**: read
- **STARTUP_MEMBER**: read
- **VIEWER_EXECUTIVO**: read

## Migrando Código Legado

### ❌ ANTES - Verificação Direta de Role
```tsx
// NÃO USAR MAIS
const { profile } = useAuth();

if (profile?.role === 'admin') {
  // Renderizar algo
}

if (profile?.role === 'company' || profile?.role === 'mentor') {
  // Renderizar algo
}
```

### ✅ DEPOIS - Verificação de Permissão
```tsx
// USAR ASSIM
const { hasPermission, hasAnyPermission } = useAuth();

if (hasPermission('user', 'create')) {
  // Admin pode criar usuários
}

if (hasAnyPermission('evaluation', ['create', 'evaluate'])) {
  // Admin ou Gestor podem criar/avaliar
}
```

## Exemplo Completo: Componente com Permissões

```tsx
import { useAuth } from '@/features/auth/contexts/AuthContext';

function StartupManagementPage() {
  const { profile, hasPermission, hasAnyPermission } = useAuth();

  // Verificações de permissão
  const canCreateStartup = hasPermission('startup', 'create');
  const canUpdateStartup = hasAnyPermission('startup', ['update', 'update_self']);
  const canDeleteStartup = hasPermission('startup', 'delete');
  const canAdvance = hasPermission('startup', 'advance');

  return (
    <div>
      <h1>Gestão de Startups</h1>

      {/* Botões condicionais baseados em permissões */}
      <div className="actions">
        {canCreateStartup && (
          <button>Nova Startup</button>
        )}
        
        {canUpdateStartup && (
          <button>Editar</button>
        )}
        
        {canDeleteStartup && (
          <button className="danger">Excluir</button>
        )}
        
        {canAdvance && (
          <button>Avançar para Próximo Programa</button>
        )}
      </div>

      {/* Renderização condicional de seções */}
      {hasPermission('evaluation', 'create') && (
        <section>
          <h2>Nova Avaliação</h2>
          {/* Formulário de avaliação */}
        </section>
      )}

      {hasPermission('deliverable', 'approve') && (
        <section>
          <h2>Deliverables Pendentes de Aprovação</h2>
          {/* Lista de deliverables */}
        </section>
      )}
    </div>
  );
}

export default StartupManagementPage;
```

## Benefícios do Sistema RBAC

1. **Granularidade**: Permissões específicas por recurso e ação
2. **Flexibilidade**: Fácil adicionar novas roles ou permissões
3. **Segurança**: Controle preciso de acesso
4. **Manutenibilidade**: Lógica centralizada em PERMISSION_MATRIX
5. **Testabilidade**: Funções puras e isoladas
6. **Compatibilidade**: Conversão automática de roles antigas

## Próximos Passos para Desenvolvedores

1. **Atualizar Componentes**: Substituir verificações de `profile.role === 'x'` por `hasPermission()`
2. **Guards de Rota**: Criar componente `ProtectedRoute` usando as funções de permissão
3. **Navegação Condicional**: Atualizar menu lateral baseado em permissões
4. **Admin Dashboard**: Criar interface de gerenciamento de usuários e roles
5. **Testes**: Adicionar testes unitários para verificação de permissões

## Componentes que Precisam de Atualização

Componentes identificados com verificações diretas de role:
- `src/pages/DashboardPage.tsx`
- `src/features/admins/pages/AdminDashboard.tsx`
- `src/features/companies/pages/EmpresasPage.tsx`
- `src/features/evaluations/pages/AvaliacoesPage.tsx`
- `src/features/mentors/pages/MentorDashboardPage.tsx`
- `src/features/mentors/pages/MentorPartnershipsPage.tsx`

**Ação Recomendada**: Refatorar gradualmente para usar `hasPermission()` ao invés de verificações diretas.
