# Teste das Correções Críticas - HUB Empresas

## Status Geral
**URL Deployed**: https://p6fddd5eik94.space.minimax.io
**Data**: 2025-11-07

## Correções para Testar

### ✅ TESTADO - Correção 1: Bug CRUD de Mentores
- **Status**: APROVADO
- **Teste**: Adicionado mentor "João Teste Bio" com campo bio
- **Resultado**: Funciona perfeitamente

### ✅ TESTADO - Correção 2: Salvar Avaliações (RF 4.1)
- **Status**: APROVADO
- **Teste**: Avaliação salva para "AgriTech Connect"
- **Resultado**: Botão funciona, modal fecha com Cancelar, ARIA correto

### ⏳ PENDENTE - Correção 3: Upload de Documentos para Empresas
- **Objetivo**: Interface dedicada de upload no dashboard das empresas
- **Verificar**: 
  - [ ] Página/link claro de upload
  - [ ] Drag-and-drop funcional
  - [ ] Seleção arquivo/URL
  - [ ] Histórico de documentos

### ⏳ PENDENTE - Correção 4: Tutorial "Upload de Documentos"
- **Objetivo**: Registrar conclusão do tutorial
- **Verificar**:
  - [ ] Tutorial marca como completo
  - [ ] Persistência funciona
  - [ ] Consistência com outros tutoriais

### ⏳ PENDENTE - Correção 5: Funcionalidades de Exportação
- **Objetivo**: Separar "Download rápido" e "Visualizar preview"
- **Verificar**:
  - [ ] Duas opções distintas
  - [ ] Download abre download
  - [ ] Preview abre preview
  - [ ] Rotas corretas

### ⏳ PENDENTE - Correção 6: Exportações XLSX/CSV para Empresas
- **Objetivo**: Botões de exportação no dashboard de empresa
- **Verificar**:
  - [ ] Botões visíveis no dashboard
  - [ ] Exportação de deliverables funciona
  - [ ] Exportação de avaliações funciona
  - [ ] Filtros de período (se aplicável)

### ⏳ PENDENTE - Correção 7: Acessibilidade e Responsividade
- **Objetivo**: Suporte a teclado, ARIA labels, scrolling mobile
- **Verificar**:
  - [ ] Tabindex nos elementos interativos
  - [ ] ARIA labels em modais
  - [ ] Contrastes adequados
  - [ ] Modais roláveis em mobile (já testado parcialmente)

## Plano de Teste

### Teste 3: Upload de Documentos (Empresa)
1. Login como empresa
2. Ir para dashboard
3. Procurar interface de upload
4. Testar drag-and-drop
5. Testar seleção de arquivo
6. Verificar histórico

### Teste 4: Tutorial Upload
1. Login como empresa nova
2. Iniciar tutorial de upload
3. Completar tutorial
4. Verificar registro de conclusão
5. Recarregar página e verificar persistência

### Teste 5: Exportações (Admin/Mentor)
1. Login como admin/mentor
2. Ir para página com exportações
3. Localizar "Download rápido"
4. Localizar "Visualizar preview"
5. Testar ambas as opções
6. Verificar se comportamentos são diferentes

### Teste 6: Exports XLSX/CSV (Empresa)
1. Login como empresa
2. Ir para dashboard
3. Localizar seção "Exportar Dados"
4. Testar exportação de deliverables
5. Testar exportação de avaliações
6. Verificar formato do arquivo baixado

### Teste 7: Acessibilidade
1. Abrir qualquer modal
2. Inspecionar HTML (verificar ARIA)
3. Testar navegação por teclado (Tab, Enter)
4. Testar em viewport mobile (375px)
5. Verificar se modal é rolável

## Notas
- Testes 1 e 2 já aprovados anteriormente
- Focar em testes 3-7 agora
- Registrar bugs encontrados
