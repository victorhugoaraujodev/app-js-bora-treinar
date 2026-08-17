# Transformar o BORA TREINAR em PWA

Analise e altere o repositório atual:

`victorhugoaraujodev/app-js-bora-treinar`

Quero transformar a aplicação existente **BORA TREINAR** em uma **Progressive Web App (PWA)** instalável em iPhone, Android e desktop.

## Objetivo principal

A aplicação deve continuar sendo feita somente com:

* HTML
* CSS
* JavaScript puro
* ES Modules
* localStorage

Não adicionar:

* React
* Vue
* Angular
* TypeScript
* backend
* banco remoto
* frameworks
* bundlers
* ferramentas de build desnecessárias

Não fazer over engineering.

A aplicação já funciona atualmente e sua lógica deve ser preservada.

---

# 1. Preservar a aplicação atual

Não reescrever a aplicação.

Preservar:

* `index.html`
* estrutura atual de CSS
* estrutura atual de JavaScript
* rotas utilizando hash
* `localStorage`
* treinos cadastrados
* sessões
* histórico
* progresso
* configurações
* importação/exportação JSON
* testes existentes

A PWA deve ser adicionada sobre a estrutura existente.

A aplicação deve continuar funcionando normalmente quando executada como site.

---

# 2. Estrutura desejada

Adicionar os arquivos necessários para PWA.

A estrutura deve ficar aproximadamente:

```text
app-js-bora-treinar/
│
├── index.html
├── manifest.webmanifest
├── service-worker.js
│
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-512.png
│   ├── apple-touch-icon.png
│   ├── favicon-32.png
│   └── favicon-16.png
│
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── data.js
│   ├── domain.js
│   ├── state.js
│   ├── storage.js
│   └── ui.js
│
└── tests/
```

Adapte essa estrutura se necessário, mas mantenha simples.

---

# 3. Ícone

Vou fornecer junto deste pedido a imagem oficial do ícone do BORA TREINAR.

Use **essa imagem como fonte oficial**.

Não redesenhar o ícone.

Não alterar:

* cores
* símbolo
* proporções visuais
* identidade

Gerar a partir dela os arquivos:

```text
icons/icon-192.png
icons/icon-512.png
icons/icon-maskable-512.png
icons/apple-touch-icon.png
icons/favicon-32.png
icons/favicon-16.png
```

Tamanhos:

```text
icon-192.png              192x192
icon-512.png              512x512
icon-maskable-512.png     512x512
apple-touch-icon.png      180x180
favicon-32.png             32x32
favicon-16.png             16x16
```

O ícone maskable deve manter margem de segurança suficiente para não cortar o símbolo em Android.

Se a imagem oficial do ícone não estiver disponível no ambiente, **não inventar outro ícone**. Informar que preciso fornecer o arquivo.

---

# 4. Manifest

Criar:

```text
manifest.webmanifest
```

Configuração desejada:

```json
{
  "id": "./",
  "name": "BORA TREINAR",
  "short_name": "Bora Treinar",
  "description": "Seu treino organizado de forma simples.",
  "start_url": "./#/inicio",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#12295b",
  "theme_color": "#12295b"
}
```

Completar a configuração com os ícones apropriados.

Adicionar pelo menos:

* ícone 192x192
* ícone 512x512
* ícone 512x512 maskable

Exemplo conceitual:

```json
"icons": [
  {
    "src": "./icons/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "./icons/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "./icons/icon-maskable-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "maskable"
  }
]
```

Se as cores oficiais existentes no projeto forem diferentes de `#12295b`, priorizar as variáveis de identidade visual que já existirem no CSS.

---

# 5. Alterar o index.html

Adicionar corretamente no `<head>`:

```html
<link rel="manifest" href="./manifest.webmanifest">
```

Adicionar:

```html
<link
  rel="apple-touch-icon"
  sizes="180x180"
  href="./icons/apple-touch-icon.png"
>
```

Adicionar favicon:

```html
<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="./icons/favicon-32.png"
>

<link
  rel="icon"
  type="image/png"
  sizes="16x16"
  href="./icons/favicon-16.png"
>
```

Manter o `theme-color`.

Adicionar os metadados apropriados para experiência standalone no iPhone quando forem úteis e compatíveis.

Não duplicar metatags que já existam.

---

# 6. Service Worker

Criar:

```text
service-worker.js
```

Objetivo:

Permitir que a aplicação continue abrindo e funcionando mesmo quando o usuário estiver sem internet.

O Service Worker deve armazenar o **app shell** da aplicação.

Incluir os arquivos essenciais existentes no projeto:

```text
index.html

css/variables.css
css/reset.css
css/layout.css
css/components.css
css/responsive.css

js/app.js
js/data.js
js/domain.js
js/state.js
js/storage.js
js/ui.js

manifest.webmanifest

ícones utilizados
```

Antes de escrever a lista, verificar a estrutura real do repositório e incluir somente arquivos existentes.

---

# 7. Estratégia de cache

Não fazer uma implementação excessivamente complexa.

Usar uma estratégia simples e segura.

Para arquivos estáticos da aplicação, como:

* CSS
* JavaScript
* ícones
* manifest

pode utilizar cache-first ou stale-while-revalidate.

Para navegação da aplicação, garantir fallback para:

```text
index.html
```

quando estiver offline.

Como a aplicação utiliza rotas por hash, como:

```text
#/inicio
#/treino-do-dia
#/treinos
#/historico
#/configuracoes
```

não criar sistema de rotas adicional.

Não alterar a navegação existente.

---

# 8. Versionamento do cache

Utilizar nome de cache versionado.

Por exemplo:

```javascript
const CACHE_NAME = 'bora-treinar-v1';
```

Quando uma nova versão for instalada, remover caches antigos durante o evento `activate`.

Não apagar:

* localStorage
* dados dos usuários
* treinos
* sessões
* histórico

A limpeza deve atingir somente caches do Service Worker pertencentes ao BORA TREINAR.

---

# 9. Registro do Service Worker

Registrar o Service Worker na aplicação.

Preferencialmente criar um pequeno código isolado ou registrar na inicialização existente sem poluir a lógica principal.

Exemplo conceitual:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}
```

Tratar erros sem quebrar a aplicação.

Se o registro do Service Worker falhar, o BORA TREINAR deve continuar funcionando como site normal.

---

# 10. localStorage

Não substituir o armazenamento atual.

Continuar utilizando:

```text
bora_treinar_state_v1
```

Não migrar para:

* IndexedDB
* SQLite
* backend
* Capacitor Preferences

nesta implementação.

A prioridade desta etapa é somente transformar a aplicação atual em PWA.

---

# 11. Offline

Depois da primeira visita online, a aplicação deve conseguir abrir offline.

Offline devem continuar disponíveis:

* Início
* Treino do dia
* Meus treinos
* Histórico
* Configurações
* criação de treino
* edição de treino
* conclusão de séries
* conclusão de sessão
* dados salvos no localStorage

Não criar tela offline separada se não for necessária.

A própria aplicação deve ser o modo offline.

---

# 12. GitHub Pages

Preparar a PWA para funcionar corretamente quando hospedada pelo GitHub Pages no repositório:

```text
victorhugoaraujodev/app-js-bora-treinar
```

Provável endereço:

```text
https://victorhugoaraujodev.github.io/app-js-bora-treinar/
```

ATENÇÃO:

Não utilizar caminhos absolutos como:

```text
/icons/icon-192.png
/js/app.js
/css/layout.css
```

pois isso pode quebrar no GitHub Pages.

Preferir caminhos relativos:

```text
./icons/icon-192.png
./js/app.js
./css/layout.css
```

O Service Worker também precisa funcionar corretamente quando a aplicação estiver dentro de:

```text
/app-js-bora-treinar/
```

e não somente na raiz de um domínio.

Verifique especificamente esse cenário.

---

# 13. Atualizações da aplicação

Quero evitar que o usuário fique permanentemente preso em uma versão antiga do cache.

Implemente uma estratégia simples para que:

1. uma nova versão do Service Worker seja detectada;
2. novos arquivos possam substituir a versão antiga;
3. caches antigos sejam removidos;
4. na próxima abertura/reload a nova versão seja utilizada.

Não criar sistema complexo de atualização.

Se implementar `skipWaiting()` e `clients.claim()`, faça isso somente se não causar comportamento inesperado durante uma sessão de treino.

Preservar os dados de `localStorage` durante qualquer atualização.

---

# 14. Experiência no iPhone

A aplicação será usada principalmente em iPhone.

Verificar:

* safe areas do iOS;
* notch;
* Dynamic Island;
* barra inferior;
* modo standalone;
* viewport;
* scroll;
* menus;
* modais;
* campos de formulário;
* botões;
* tamanho das áreas clicáveis.

Quando necessário, utilizar:

```css
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

Mas somente se necessário.

Não alterar o design desktop desnecessariamente.

---

# 15. Não quebrar o design atual

Manter a identidade visual existente:

* azul-marinho
* laranja
* fundo claro
* cards
* sidebar
* cabeçalho
* tipografia
* componentes existentes

A versão instalada como PWA deve parecer o mesmo BORA TREINAR que existe hoje.

Apenas ajustar detalhes necessários para uso no celular.

---

# 16. Testes

Rodar os testes existentes:

```bash
npm test
```

ou:

```bash
node --test
```

Todos devem continuar passando.

Além disso, validar manualmente:

```text
1. Aplicação abre normalmente.
2. Manifest é carregado.
3. Service Worker é registrado.
4. Assets são armazenados no cache.
5. Aplicação abre offline depois da primeira visita.
6. localStorage continua funcionando.
7. Criar treino funciona.
8. Marcar séries funciona.
9. Finalizar treino funciona.
10. Histórico funciona.
11. Importar/exportar JSON continua funcionando.
12. Rotas por hash continuam funcionando.
13. Ícone aparece corretamente quando instalado.
14. GitHub Pages funciona em /app-js-bora-treinar/.
```

---

# 17. Verificação de instalação

Depois da implementação, validar no Chrome DevTools:

```text
Application
├── Manifest
├── Service Workers
├── Cache Storage
└── Storage
```

Verificar se:

* manifest não possui erro;
* ícones carregam;
* Service Worker está ativo;
* cache é criado;
* não existem requests 404;
* start_url funciona;
* scope está correto.

---

# 18. README

Atualizar o `README.md` acrescentando uma seção:

```text
## PWA
```

Explicar de forma curta:

* que o BORA TREINAR é instalável;
* que funciona offline após o primeiro acesso;
* que os dados continuam armazenados localmente;
* como testar localmente;
* como instalar no iPhone;
* como instalar no Android;
* como publicar no GitHub Pages.

No iPhone explicar:

```text
Safari
→ Compartilhar
→ Adicionar à Tela de Início
→ Adicionar
```

---

# 19. Não alterar sem necessidade

Não faça refatorações grandes que não estejam relacionadas à PWA.

Não:

* reorganizar todo o JavaScript;
* alterar domínio;
* alterar formato do estado;
* alterar chave do localStorage;
* mudar a arquitetura;
* instalar frameworks;
* adicionar TypeScript;
* adicionar backend;
* adicionar dependências sem necessidade.

O objetivo é uma implementação **pequena, segura e incremental**.

---

# 20. Resultado esperado

Ao terminar, quero conseguir:

```text
Abrir o endereço do BORA TREINAR no Safari
                ↓
Compartilhar
                ↓
Adicionar à Tela de Início
                ↓
BORA TREINAR aparece com o ícone oficial
                ↓
Abrir pelo ícone
                ↓
Aplicação abre em modo standalone
                ↓
Treinar normalmente
                ↓
Fechar o aplicativo
                ↓
Abrir novamente
                ↓
Dados continuam salvos
```

E depois do primeiro carregamento online:

```text
Internet indisponível
        ↓
Abrir BORA TREINAR
        ↓
Aplicação carrega
        ↓
Treinos disponíveis
        ↓
Séries podem ser marcadas
        ↓
Dados continuam sendo salvos localmente
```

---

# 21. Antes de finalizar

Faça uma revisão final de toda a implementação.

Verifique especialmente:

* caminhos relativos;
* compatibilidade com GitHub Pages;
* `start_url`;
* `scope`;
* Service Worker;
* cache;
* ícones;
* iPhone;
* localStorage;
* funcionamento offline;
* testes existentes.

Não considere a tarefa concluída apenas porque os arquivos foram criados.

Execute os testes e valide a estrutura final.

Ao concluir, me entregue um resumo contendo:

```text
Arquivos criados
Arquivos modificados
Como testar localmente
Como publicar no GitHub Pages
Como instalar no iPhone
Como atualizar o cache em novas versões
Resultado dos testes
```
