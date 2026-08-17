# Correção de responsividade mobile

## Objetivo

Garantir que o BORA TREINAR funcione corretamente em telas a partir de 360px de largura, eliminando overflow horizontal acidental e mantendo todo o conteúdo acessível por rolagem vertical.

## Escopo

O trabalho ficará concentrado nos estilos de layout e componentes existentes. Não haverá alteração de rotas, estado, persistência, dados, comportamento de treino ou contrato do PWA.

As áreas abrangidas são:

- cabeçalho mobile, incluindo menu, busca e perfil;
- área principal e navegação lateral móvel;
- grids do dashboard e configurações;
- cards, cabeçalhos, listas de treinos e exercícios;
- editor de séries e controles de ações;
- formulários, seletor de treino e modais;
- toasts e espaçamentos seguros em telas estreitas.

## Causa técnica observada

O layout já possui viewport configurado e media queries básicas, mas alguns componentes ainda mantêm larguras mínimas ou combinações rígidas de flex/grid. Exemplos relevantes incluem grids com colunas mínimas de 250px/260px, seletor com `min-width: 230px`, editor com colunas fixas e a combinação de largura, margem e padding da área principal. Em telas móveis, essas restrições podem produzir uma largura efetiva maior que a viewport.

## Solução

Usar a responsividade por componentes, centralizada nas folhas CSS existentes:

1. Garantir `min-width: 0` e largura limitada aos containers flex/grid que recebem conteúdo dinâmico.
2. Substituir ou neutralizar larguras mínimas que não cabem em 360px.
3. Fazer cabeçalhos, ações e controles quebrarem ou empilharem no breakpoint mobile apropriado.
4. Reduzir grids de dashboard, configurações, séries e formulários para uma coluna quando a largura disponível não comportar as colunas atuais.
5. Fazer controles de treino e modal ocuparem a largura disponível, respeitando margens internas pequenas.
6. Preservar a rolagem vertical e evitar usar `overflow-x: hidden` como substituto para corrigir conteúdo que excede o layout.
7. Manter o comportamento desktop e os breakpoints existentes sempre que não houver conflito.

## Critérios de aceite

- Em 360px, 375px, 390px e 430px não há rolagem horizontal acidental no documento ou na área principal.
- Cabeçalho, busca, menu e perfil permanecem visíveis e utilizáveis.
- Cards, listas, formulários, modais e editor de séries não cortam conteúdo nem exigem arraste lateral.
- A navegação lateral continua abrindo como drawer no mobile.
- O layout desktop não perde a estrutura de sidebar, grids e ações existentes.
- A suíte atual de testes continua passando.
- A solução não altera dados, rotas, persistência ou funcionalidades do app.

## Validação

Será executada a suíte `npm test`. Também será feita inspeção em viewport mobile nas larguras de 360px, 375px, 390px e 430px, verificando o `scrollWidth` contra o `clientWidth` e navegando pelas telas que renderizam os componentes afetados.

## Fora de escopo

- redesign visual do aplicativo;
- suporte específico abaixo de 360px;
- mudança de framework ou introdução de dependências;
- alteração da estrutura HTML sem necessidade para resolver o layout;
- alterações de lógica JavaScript não relacionadas diretamente à responsividade.
