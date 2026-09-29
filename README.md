# Mídia Igreja

Plataforma para a equipe de mídia publicar fotos e vídeos de cultos e eventos em **qualidade original**, com um link simples para qualquer pessoa ver e baixar, sem criar conta.

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Supabase**: banco de dados (PostgreSQL) e login da equipe
- **Backblaze B2**: armazenamento das fotos e vídeos, em um **bucket privado** (API compatível com S3)
- **Vercel**: hospedagem · **GitHub**: versionamento

> O nome "Mídia Igreja", o nome da igreja, o logo e as cores ficam em `lib/config.ts` e `public/logo.svg`.

---

## Sumário

1. [Como o sistema funciona](#como-o-sistema-funciona)
2. [Instalar o Node.js](#1-instalar-o-nodejs)
3. [Abrir o projeto e instalar as dependências](#2-abrir-o-projeto-e-instalar-as-dependências)
4. [Criar o projeto no Supabase](#3-criar-o-projeto-no-supabase)
5. [Criar as tabelas](#4-criar-as-tabelas)
6. [Configurar a autenticação e criar seu usuário](#5-configurar-a-autenticação-e-criar-seu-usuário)
7. [Criar o Backblaze B2 e o bucket privado](#6-criar-o-backblaze-b2-e-o-bucket-privado)
8. [Gerar a Application Key do B2](#7-gerar-a-application-key-do-b2)
9. [Configurar o CORS](#8-configurar-o-cors)
10. [Preencher o .env.local](#9-preencher-o-envlocal)
11. [Iniciar localmente](#10-iniciar-localmente)
12. [Testar o upload](#11-testar-o-upload)
13. [Subir no GitHub](#12-subir-no-github)
14. [Publicar na Vercel](#13-publicar-na-vercel)
15. [Variáveis na Vercel](#14-variáveis-na-vercel)
16. [Problemas comuns](#problemas-comuns)

---

## Como o sistema funciona

### Fluxo de upload (o arquivo nunca passa pela Vercel)

```
Navegador ──(1) "quero enviar IMG_9281.JPG, 12 MB"──▶ API Next.js (Vercel)
                                                     │ confere login, tipo e tamanho
Navegador ◀──(2) URL assinada, válida por 1 hora─────┘
Navegador ──(3) envia o arquivo DIRETO──────────────▶ Backblaze B2 (bucket privado)
Navegador ──(4) envia miniatura e prévia (geradas no navegador) ─▶ B2
Navegador ──(5) "terminei"──────────────────────────▶ API confere no B2 e registra no Supabase
```

- **Arquivos até 32 MB**: um único envio com URL assinada.
- **Arquivos maiores (vídeos)**: *Multipart Upload*. O arquivo é enviado em partes de 10 MB (3 partes ao mesmo tempo). Cada parte tem novas tentativas automáticas. O progresso fica salvo no navegador: se a internet cair ou a aba fechar, basta selecionar **o mesmo arquivo de novo no mesmo álbum** e o envio continua de onde parou.
- **Fila**: até 4 arquivos simultâneos. A equipe pode navegar pelo painel enquanto envia; se tentar fechar a aba, o navegador avisa.
- **Original intocado**: o arquivo enviado é exatamente o que foi selecionado. Para a galeria ficar rápida, o próprio navegador gera uma **miniatura** (480 px) e uma **prévia** (1600 px) em JPEG, salvas separadamente.
- **Bucket privado, tudo por URL assinada**: como o bucket não é público, o banco guarda só a **chave** de cada arquivo (`media.storage_key`, `thumb_key`, `preview_key`, `profiles.avatar_key`). Toda vez que uma página é carregada, o servidor gera URLs de leitura temporárias (válidas por 6 horas) para exibir miniaturas, prévias e vídeos — nunca uma URL fixa é salva no banco, porque ela expiraria.
- **Download**: o botão "Baixar original" passa por `/api/download/ID`, que confere a permissão e redireciona para um link temporário do B2 que entrega o arquivo original, com o nome original. Sem limite de tamanho.
- **Baixar selecionadas**: os arquivos são baixados um a um direto do B2 (sem ZIP no servidor, então não existe risco de estourar o tempo limite da Vercel).

### Estrutura no B2

```
albums/ID_DO_ALBUM/photos/ID-IMG_9281.jpg    ← original
albums/ID_DO_ALBUM/videos/ID-culto.mp4       ← original
albums/ID_DO_ALBUM/thumbs/ID.jpg             ← miniatura da grade
albums/ID_DO_ALBUM/previews/ID.jpg           ← prévia do lightbox / pôster do vídeo
avatars/ID_DO_USUARIO-TIMESTAMP.jpg          ← foto de perfil da equipe
```

### Banco de dados (resumo de `supabase/schema.sql`)

| Tabela | Para quê |
|---|---|
| `profiles` | Membros da equipe (criado automaticamente para cada usuário do Supabase Auth) |
| `albums` | Título, slug (endereço), data, descrição, capa, status (rascunho/publicado), acesso (público/senha), hash da senha |
| `media` | Cada foto/vídeo: chave do original, miniatura, prévia, tipo, tamanho, dimensões, duração |
| `albums_overview` (view) | Álbuns com contagem de fotos/vídeos, espaço usado e capa |
| `dashboard_stats()` (função) | Números do Dashboard |

Segurança: *Row Level Security* ligado. Visitantes **não** leem o banco diretamente; as páginas públicas consultam pelo servidor e só mostram álbuns publicados (e pedem a senha quando necessário). A senha dos álbuns é guardada com **bcrypt**, nunca em texto.

### Pastas

```
app/                    páginas e rotas de API
  page.tsx              página inicial pública (/)
  a/[slug]/             álbum público (/a/culto-celebracao-27-09-2026)
  login/                tela de login
  admin/                painel (protegido): dashboard, álbuns, configurações
  admin/actions.ts      ações do painel (criar/editar/excluir álbum, capa, excluir arquivos)
  api/upload/...        URLs assinadas e multipart
  api/media/            registro do arquivo no banco
  api/download/[id]/    "Baixar original"
  api/public/...        carregamento infinito da galeria
components/             componentes visuais (admin, galeria, upload, ui)
hooks/                  hooks React (fila de upload, copiar)
lib/                    integração: Supabase, Backblaze B2 (lib/storage.ts), autenticação, regras de arquivo
lib/upload/             fila de upload no navegador (paralelo, multipart, retomada)
services/               consultas ao banco
types/                  tipos TypeScript
utils/                  formatação de datas/tamanhos, slug, nomes de arquivo
supabase/schema.sql     script do banco
b2-cors.json            modelo da regra de CORS do bucket no B2
proxy.ts                protege /admin (no Next 16 o "middleware" se chama "proxy")
```

---

## 1. Instalar o Node.js

1. Acesse **https://nodejs.org**.
2. Baixe a versão **LTS** (botão da esquerda) para Windows e instale clicando em *Next* até o fim (deixe as opções padrão).
3. Abra o **Prompt de Comando** (tecla Windows, digite `cmd`, Enter) e confira:
   ```
   node -v
   npm -v
   ```
   O `node -v` precisa mostrar **v20.9** ou superior (v22 ou v24 são ótimas).

## 2. Abrir o projeto e instalar as dependências

1. Coloque a pasta `midia-igreja` em um local fácil, por exemplo `C:\Projetos\midia-igreja`.
2. Abra o **VS Code** → *File* → *Open Folder...* → selecione a pasta.
3. Abra o terminal do VS Code: menu *Terminal* → *New Terminal*.
4. Digite:
   ```
   npm install
   ```
   Aguarde terminar (cria a pasta `node_modules`).

## 3. Criar o projeto no Supabase

1. Acesse **https://supabase.com** → *Start your project* → entre com o GitHub.
2. Clique em **New project**.
3. Preencha: *Name* `midia-igreja`, crie uma *Database Password* forte (guarde), *Region* **South America (São Paulo)**.
4. Clique em **Create new project** e aguarde uns 2 minutos.

## 4. Criar as tabelas

1. No menu da esquerda do Supabase, clique em **SQL Editor**.
2. Clique em **New query**.
3. No VS Code, abra `supabase/schema.sql`, selecione tudo (Ctrl+A), copie (Ctrl+C).
4. Cole no editor do Supabase e clique em **Run** (ou Ctrl+Enter).
5. Deve aparecer "Success. No rows returned". Confira em **Table Editor**: `albums`, `media` e `profiles`.

> Pode rodar o script de novo sem problema, por exemplo depois de atualizar o sistema.

## 5. Configurar a autenticação e criar seu usuário

**Impedir cadastros públicos** (só a equipe entra):

1. Menu **Authentication** → **Sign In / Providers** (em alguns painéis: *Providers* ou *Settings*).
2. Desligue **Allow new users to sign up** e salve.
3. Confirme que o provedor **Email** está habilitado.

**Endereço do site**:

1. **Authentication** → **URL Configuration**.
2. *Site URL*: `http://localhost:3000` por enquanto (depois você troca pelo endereço da Vercel).

**Criar seu usuário (e de cada pessoa da equipe)**:

1. **Authentication** → **Users** → **Add user** → **Create new user**.
2. Informe e-mail e senha, marque **Auto Confirm User** e clique em **Create user**.
3. O perfil na tabela `profiles` é criado automaticamente. Para torná-lo administrador (opcional), em **Table Editor → profiles** mude `role` para `admin`.

**Chaves da API** (vai usar no passo 10):

1. **Project Settings** (engrenagem) → **API Keys** (ou *API*).
2. Copie a **URL do projeto** (em *Data API* / *Project URL*), algo como `https://abcd1234.supabase.co`.
3. Copie a chave pública: **publishable key** (`sb_publishable_...`) ou, na aba *Legacy*, a **anon public**.
4. Copie a chave secreta: **secret key** (`sb_secret_...`) ou, na aba *Legacy*, a **service_role**. ⚠️ Nunca compartilhe e nunca coloque no código.

## 6. Criar o Backblaze B2 e o bucket privado

1. Acesse **https://www.backblaze.com/sign-up/cloud-storage** e crie uma conta (o plano gratuito inclui 10 GB).
2. No painel, menu **B2 Cloud Storage** → **Buckets** → **Create a Bucket**.
3. *Bucket Unique Name*: algo como `midia-igreja-suaigreja` (o nome precisa ser único entre todos os clientes do B2).
4. *Files in Bucket*: escolha **Private**. ⚠️ Isso é importante: o bucket **não** pode ser público — o site gera uma URL temporária assinada toda vez que precisa mostrar ou baixar um arquivo.
5. *Object Lock*: deixe desativado.
6. Clique em **Create a Bucket**.

**Limpeza de envios interrompidos**: no bucket recém-criado, vá em **Lifecycle Settings** → **Configure Lifecycle Rules** e escolha a opção que apaga uploads em partes (multipart) não finalizados depois de alguns dias. Isso evita cobrança por partes de vídeos que ficaram pela metade.

**Endereço S3 do bucket**: na tela do bucket, anote o **Endpoint** (algo como `https://s3.us-west-004.backblazeb2.com`) — é o seu `B2_ENDPOINT`. A região é a parte do meio do endereço (`us-west-004`) — é o seu `B2_REGION`. O nome do bucket que você escolheu no passo 3 é o `B2_BUCKET_NAME`.

## 7. Gerar a Application Key do B2

1. No menu da esquerda: **Application Keys** → **Add a New Application Key**.
2. *Name of Key*: `midia-igreja-site`.
3. *Allow access to Bucket(s)*: escolha o bucket criado no passo anterior (não "All").
4. *Type of Access*: **Read and Write**.
5. Deixe *File name prefix* e *Duration* em branco e clique em **Create New Key**.
6. Copie **keyID** (é o `B2_KEY_ID`) e **applicationKey** (é o `B2_APPLICATION_KEY`) agora. ⚠️ A `applicationKey` aparece **uma única vez** — se perder, gere outra.

## 8. Configurar o CORS

O CORS autoriza o navegador, a partir do seu site, a enviar e ler arquivos direto no B2 usando as URLs assinadas.

1. Instale a **B2 Command Line Tool** (`pip install b2` ou baixe o binário em backblaze.com) e autentique com `b2 account authorize` usando o `B2_KEY_ID` e o `B2_APPLICATION_KEY`.
2. Rode (trocando `SEU-BUCKET` pelo nome do bucket, e o endereço da Vercel depois que publicar):
   ```
   b2 bucket update SEU-BUCKET --cors-rules "$(cat b2-cors.json)"
   ```
3. O conteúdo usado está no arquivo `b2-cors.json`:
   ```json
   [
     {
       "corsRuleName": "midia-igreja-uploads",
       "allowedOrigins": ["http://localhost:3000", "https://SEU-PROJETO.vercel.app"],
       "allowedOperations": ["s3_get", "s3_put", "s3_head"],
       "allowedHeaders": ["content-type", "cache-control"],
       "exposeHeaders": ["ETag"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

> O `exposeHeaders: ["ETag"]` é **obrigatório** para o envio de vídeos grandes em partes. Sempre que adicionar um novo endereço (ex.: domínio próprio), rode o comando de novo com a lista de origens atualizada.

## 9. Preencher o .env.local

1. No VS Code, clique com o botão direito em `.env.example` → **Copy**, depois clique na raiz do projeto → **Paste**. Renomeie a cópia para **`.env.local`**.
2. Preencha:

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (URL do projeto) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → publishable key ou anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → secret key ou service_role (**secreta**) |
| `B2_KEY_ID` | Application Key criada no passo 7 (`keyID`) |
| `B2_APPLICATION_KEY` | Application Key criada no passo 7 (`applicationKey`, **secreta**) |
| `B2_BUCKET_NAME` | Nome do bucket criado no passo 6 |
| `B2_ENDPOINT` | Endpoint do bucket (passo 6), **sem barra no final** |
| `B2_REGION` | Região do endpoint (passo 6), ex.: `us-west-004` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `ALBUM_ACCESS_SECRET` | Texto aleatório (veja abaixo) |

Para gerar o `ALBUM_ACCESS_SECRET`, rode no terminal e copie o resultado:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O `.env.local` **não vai para o GitHub** (está no `.gitignore`).

## 10. Iniciar localmente

No terminal do VS Code:

```
npm run dev
```

Abra **http://localhost:3000**. O painel fica em **http://localhost:3000/admin** (você será levado ao login).

Para parar: clique no terminal e pressione **Ctrl + C**. Sempre que mudar o `.env.local`, pare e rode `npm run dev` de novo.

## 11. Testar o upload

1. Entre em `/login` com o usuário criado no passo 5.
2. Clique em **Novo álbum**, preencha o nome e a data e clique em **Criar álbum e enviar arquivos**.
3. Arraste algumas fotos (e um vídeo, de preferência maior que 32 MB para testar o envio em partes).
4. Acompanhe o progresso geral e de cada arquivo.
5. Confira:
   - no **Backblaze** → bucket → *Browse Files*: a pasta `albums/...` com `photos`, `videos`, `thumbs`, `previews`;
   - no **Supabase** → *Table Editor* → `media`: uma linha por arquivo (repare que `storage_key` guarda só o caminho, não uma URL).
6. Passe o mouse numa foto e clique em **Definir como capa**.
7. Clique em **Publicar** e depois em **Ver página**. Teste o lightbox, o vídeo, o "Baixar original" e a seleção de várias fotos.
8. Teste o **retomar**: comece a enviar um vídeo grande, recarregue a página no meio, selecione o mesmo vídeo de novo. O status mostra "(retomado)".

## 12. Subir no GitHub

1. Abra o **GitHub Desktop** → *File* → **Add local repository** → escolha a pasta do projeto.
2. Se aparecer "this directory does not appear to be a Git repository", clique em **create a repository** → *Create repository*.
3. Confira na lista de alterações que **não aparece** o `.env.local` (se aparecer, pare e verifique o `.gitignore`).
4. Escreva um resumo como "Primeira versão" e clique em **Commit to main**.
5. Clique em **Publish repository**. Deixe marcado **Keep this code private** e confirme.

Nas próximas mudanças: *Commit to main* → **Push origin**. A Vercel publica sozinha a cada push.

## 13. Publicar na Vercel

1. Acesse **https://vercel.com** e entre com o GitHub.
2. **Add New...** → **Project** → encontre `midia-igreja` → **Import**.
3. *Framework Preset*: Next.js (detectado automaticamente). Não mude os comandos de build.
4. Abra **Environment Variables** e cadastre todas as variáveis do próximo passo.
5. Clique em **Deploy** e aguarde.
6. Copie o endereço gerado (ex.: `https://midia-igreja.vercel.app`) e então:
   - na Vercel → *Settings* → *Environment Variables*: altere `NEXT_PUBLIC_APP_URL` para esse endereço e faça **Redeploy** (*Deployments* → ⋯ → *Redeploy*);
   - rode de novo o comando `b2 bucket update` do passo 8 com o endereço da Vercel na lista de origens do CORS;
   - no Supabase → **Authentication → URL Configuration**: coloque o endereço em *Site URL*.

> Se usar um domínio próprio para o site (ex.: `fotos.suaigreja.com.br`), adicione também esse endereço no CORS e no `NEXT_PUBLIC_APP_URL`.

## 14. Variáveis na Vercel

Cadastre em **Settings → Environment Variables** (ambientes *Production* e *Preview*):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
B2_KEY_ID
B2_APPLICATION_KEY
B2_BUCKET_NAME
B2_ENDPOINT
B2_REGION
NEXT_PUBLIC_APP_URL
ALBUM_ACCESS_SECRET
```

Variáveis que começam com `NEXT_PUBLIC_` são embutidas no site na hora do build: se mudar alguma, faça **Redeploy**.

---

## Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| Upload fica em "Erro: Falha de conexão com o Backblaze B2..." | CORS não configurado ou endereço do site ausente em `allowedOrigins` (passo 8). |
| "O Backblaze B2 recusou o envio (link expirado ou CORS...)" | Credenciais erradas no `.env.local`, Application Key sem acesso *Read and Write* ao bucket, ou relógio do computador errado. |
| Vídeo grande falha com "...CORS expõe o cabeçalho ETag" | Falta `"exposeHeaders": ["ETag"]` na regra de CORS do bucket. |
| Miniaturas ou vídeos não aparecem / dão erro 403 | `B2_ENDPOINT`/`B2_REGION` errados, ou o bucket não é o mesmo da Application Key (passo 7). Confira se o bucket está marcado como *Private* (passo 6) — mesmo privado, o site consegue exibir tudo via URL assinada. |
| "Variável de ambiente ausente: ..." | Falta preencher essa variável (local: `.env.local`; produção: Vercel + Redeploy). |
| Login diz que a senha está errada | Usuário não confirmado: recrie com **Auto Confirm User**. |
| Entra no login mas volta para ele | O usuário não tem perfil: rode o `schema.sql` de novo (ele cria perfis para usuários existentes). |
| Vídeo .MOV não toca no Chrome/Windows | Vídeos de iPhone em HEVC não são suportados por alguns navegadores. O download original funciona; para exibir em todos os aparelhos, prefira exportar em MP4 (H.264). |
| Miniatura de vídeo não aparece | O navegador de quem enviou não conseguiu abrir aquele formato; o vídeo aparece com um ícone e continua funcionando. |

## Próximos passos sugeridos

- Download de várias fotos em **ZIP** gerado no navegador (streaming) para desktop.
- Reordenar fotos arrastando (o campo `sort_order` já existe).
- Página de gerenciamento de usuários da equipe dentro do painel.
- Estatísticas de visualizações e downloads.
