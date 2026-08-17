# BORA TREINAR

Aplicação web local-first para organizar treinos de academia, consultar o treino do dia e marcar séries concluídas.

## Tecnologias

- HTML5
- CSS3
- JavaScript ES modules
- `localStorage` do navegador
- Node.js built-in test runner apenas para os testes das regras puras

Não há backend, banco remoto, framework de interface ou dependência de terceiros.

## Como executar

Como o projeto usa módulos JavaScript nativos, a forma mais confiável de executar localmente é iniciar um servidor estático na pasta do projeto:

```bash
python -m http.server 8000
```

Depois, abra:

```text
http://localhost:8000
```

Também é possível usar qualquer servidor estático equivalente. Não existe etapa de build.

## PWA

BORA TREINAR pode ser instalado no iPhone, Android e desktop. Após o primeiro acesso online, funciona offline e continua usando a chave `bora_treinar_state_v1` do `localStorage`.

Para testar localmente, execute `python -m http.server 8000` e abra `http://localhost:8000`. Service Workers exigem HTTP/HTTPS, portanto não funcionam com `file://`.

No iPhone, abra no Safari e siga **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**. No Android, abra em um navegador compatível e use a opção de instalar ou adicionar à tela inicial.

Para publicar no GitHub Pages:

1. Envie os arquivos para o branch que será publicado (por exemplo, `main`).
2. No GitHub, abra **Settings** → **Pages** e, em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha o branch do repositório (por exemplo, `main`) e a pasta `/(root)`, depois salve.
4. Preserve os caminhos relativos (`./`) dos arquivos: a aplicação é publicada no subcaminho do repositório, em `https://victorhugoaraujodev.github.io/app-js-bora-treinar/`.

Para publicar uma nova versão do cache da aplicação, incremente `CACHE_NAME` em `service-worker.js` (por exemplo, de `bora-treinar-v1` para `bora-treinar-v2`). Os caches antigos do BORA TREINAR são removidos na ativação e o `localStorage` é preservado.

## Fluxo principal

1. Abra **Treino do dia**.
2. Clique em um exercício, como **Supino reto**.
3. O item será expandido e exibirá todas as séries planejadas.
4. Marque cada série ao terminar.
5. Use **Editar** na série para ajustar carga e descanso durante a sessão.
6. O progresso e os ajustes serão salvos automaticamente no navegador.
7. Finalize a sessão para registrá-la no histórico.

## Dados locais

Os dados são salvos na chave `bora_treinar_state_v1` do `localStorage`.

Na tela **Configurações**, é possível:

- exportar os dados para JSON;
- importar uma cópia JSON;
- restaurar os dados de demonstração;
- apagar os dados locais.

Os dados não são sincronizados entre dispositivos e não representam uma conta segura. Limpar os dados do navegador pode apagar o conteúdo caso não exista uma exportação de segurança.

Arquivos importados são validados antes de substituir o estado atual. A aplicação rejeita estruturas incompletas, séries com valores inválidos e dados incompatíveis com a versão atual.

## Testes

O ambiente bloqueia instalação de pacotes externos, portanto o projeto utiliza apenas o runner nativo do Node. Execute pelos scripts do projeto:

```bash
npm test
```

Ou execute o runner diretamente:

```bash
node --test
```

Os testes cobrem:

- identificação do treino do dia;
- cálculo de progresso;
- conclusão e reversão de séries;
- validação de treinos;
- persistência local;
- helpers de apresentação;
- validação profunda do estado importado;
- valores numéricos inválidos em séries;
- ajustes de carga e descanso por sessão;
- sanitização de cores usadas na interface.

## Estrutura

```text
index.html
css/
  variables.css
  reset.css
  layout.css
  components.css
  responsive.css
js/
  app.js
  data.js
  domain.js
  state.js
  storage.js
  ui.js
tests/
  domain.test.js
  storage.test.js
  ui.test.js
```

## Limitações do MVP

- perfil local sem autenticação real;
- dados restritos ao navegador atual;
- sem API ou sincronização;
- sem prescrição profissional de exercícios;
- sem cronômetro, gráficos ou notificações push.
