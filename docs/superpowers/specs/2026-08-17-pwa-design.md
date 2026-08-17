# BORA TREINAR — PWA instalável

## Objetivo

Adicionar suporte PWA ao BORA TREINAR para instalação em iPhone, Android e desktop e funcionamento offline após o primeiro acesso, preservando a aplicação atual em HTML, CSS, JavaScript puro, ES Modules e `localStorage`.

## Escopo

- Criar `manifest.webmanifest` com configuração instalável, `start_url` em `./#/inicio` e `scope` relativo.
- Criar `service-worker.js` com precache do app shell, fallback de navegação para `index.html` e cache versionado.
- Registrar o Service Worker sem tornar o carregamento dependente dele.
- Gerar os seis ícones solicitados a partir de `Icone H.png`, sem redesenhar a identidade visual.
- Atualizar `index.html` com manifest, favicons, Apple Touch Icon e metadados iOS necessários.
- Fazer ajustes mínimos de safe area e uso standalone em telas pequenas.
- Atualizar o `README.md` com instruções de teste, instalação e publicação.
- Manter intactos rotas hash, dados, sessões, histórico, importação/exportação e chave `bora_treinar_state_v1`.

## Decisões técnicas

### Ícones

`Icone H.png` será a fonte única dos ícones. Serão produzidos:

- `icons/icon-192.png` — 192×192;
- `icons/icon-512.png` — 512×512;
- `icons/icon-maskable-512.png` — 512×512, com margem segura;
- `icons/apple-touch-icon.png` — 180×180;
- `icons/favicon-32.png` — 32×32;
- `icons/favicon-16.png` — 16×16.

Nenhum símbolo, cor ou proporção visual será redesenhado.

### Manifest

O manifest usará caminhos relativos para funcionar tanto na raiz quanto em `/app-js-bora-treinar/`. Incluirá os ícones `any` de 192×192 e 512×512 e o ícone `maskable` de 512×512. A cor de tema seguirá a identidade existente do projeto (`#3b5ccc`), salvo evidência de que o ícone ou as variáveis exigem outra cor.

### Service Worker

Será usado um cache nomeado e versionado, por exemplo `bora-treinar-v1`. O evento `install` armazenará somente arquivos existentes e necessários ao app shell. O evento `activate` removerá apenas caches antigos cujo nome pertença ao BORA TREINAR. Requests estáticos usarão cache-first; navegações terão fallback para `./index.html`. Atualizações ocorrerão quando o nome da versão do cache mudar, sem tocar no `localStorage`.

### Registro

O registro será feito na inicialização existente, após o carregamento da página, usando `./service-worker.js`. Falhas serão tratadas com `catch` e não interromperão a aplicação.

### Compatibilidade mobile

Serão adicionados somente ajustes necessários para `viewport-fit=cover`, áreas seguras e espaçamento inferior/superior em telas pequenas. O layout desktop e os componentes atuais permanecerão preservados.

## Arquivos previstos

Criados:

- `manifest.webmanifest`;
- `service-worker.js`;
- `icons/icon-192.png`;
- `icons/icon-512.png`;
- `icons/icon-maskable-512.png`;
- `icons/apple-touch-icon.png`;
- `icons/favicon-32.png`;
- `icons/favicon-16.png`.

Modificados:

- `index.html`;
- `js/app.js`;
- `css/responsive.css` ou outro arquivo CSS existente, somente se necessário;
- `README.md`.

## Validação

- Executar `npm test`.
- Executar `node --check` nos arquivos JavaScript alterados e no Service Worker.
- Confirmar dimensões e existência dos seis ícones.
- Confirmar que manifest, Service Worker e referências usam caminhos relativos.
- Revisar que o precache contém somente arquivos existentes.
- Verificar que a chave e o comportamento do `localStorage` não foram alterados.
- Inspecionar o diff final para evitar refatorações fora do escopo.

