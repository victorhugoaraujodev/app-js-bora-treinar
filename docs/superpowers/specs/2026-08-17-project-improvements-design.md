# Melhorias de robustez do Bora Treinar

## Objetivo

Tornar o MVP local-first mais resistente a dados inválidos, importações malformadas e problemas de acessibilidade, preservando a arquitetura sem framework e sem dependências externas.

## Escopo

- Centralizar e aprofundar a validação do estado persistido/importado.
- Validar valores numéricos de séries.
- Sanitizar cores usadas em estilos inline.
- Corrigir escape duplicado em descrições de modais.
- Melhorar foco e fechamento dos modais.
- Adicionar testes de regressão e atualizar a documentação.

## Decisões

O estado inválido será rejeitado e substituído por um estado vazio, evitando que novos usuários recebam dados de demonstração automaticamente. A validação será compartilhada entre `storage.js` e a importação para evitar regras divergentes. Os dados de demonstração continuarão disponíveis apenas pela ação explícita de restauração. Sessões continuarão vinculadas ao dia local atual.

## Testes

Os testes unitários verificarão estados inválidos, números não finitos/negativos, sanitização de cores e preservação dos dados válidos. A verificação final incluirá `npm test` e `node --check` nos módulos JavaScript.
