# Mídia Igreja

Plataforma para a equipe de mídia publicar fotos e vídeos de cultos e eventos em **qualidade original**, com um link simples para qualquer pessoa ver e baixar, sem criar conta.

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- **Supabase**: banco de dados (PostgreSQL) e login da equipe
- **Cloudflare R2**: armazenamento das fotos e vídeos
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
7. [Criar o Cloudflare R2 e o bucket](#6-criar-o-cloudflare-r2-e-o-bucket)
8. [Deixar o bucket acessível para visualização](#7-deixar-o-bucket-acessível-para-visualização)
9. [Gerar as credenciais do R2](#8-gerar-as-credenciais-do-r2)
10. [Configurar o CORS](#9-configurar-o-cors)
11. [Preencher o .env.local](#10-preencher-o-envlocal)
12. [Iniciar localmente](#11-iniciar-localmente)
13. [Testar o upload](#12-testar-o-upload)
14. [Subir no GitHub](#13-subir-no-github)
15. [Publicar na Vercel](#14-publicar-na-vercel)
16. [Variáveis na Vercel](#15-variáveis-na-vercel)
17. [Problemas comuns](#problemas-comuns)

---

## Como o sistema funciona

### Fluxo de upload (o arquivo nunca passa pela Vercel)

```
Navegador ──(1) "quero enviar IMG_9281.JPG, 12 MB"──▶ API Next.js (Vercel)
                                                     │ confere login, tipo e tamanho
Navegador ◀──(2) URL assinada, válida por 1 hora─────┘
Navegador ──(3) envia o arquivo DIRETO──────────────▶ Cloudflare R2
Navegador ──(4) envia miniatura e prévia (geradas no navegador) ─▶ R2
Navegador ──(5) "terminei"──────────────────────────▶ API confere no R2 e registra no Supabase
```

- **Arquivos até 32 MB**: um único envio com URL assinada.
- **Arquivos maiores (vídeos)**: *Multipart Upload*. O arquivo é enviado em partes de 10 MB (3 partes ao mesmo tempo). Cada parte tem novas tentativas automáticas. O progresso fica salvo no navegador: se a internet cair ou a aba fechar, basta selecionar **o mesmo arquivo de novo no mesmo álbum** e o envio continua de onde parou.
- **Fila**: até 4 arquivos simultâneos. A equipe pode navegar pelo painel enquanto envia; se tentar fechar a aba, o navegador avisa.
- **Original intocado**: o arquivo enviado é exatamente o que foi selecionado. Para a galeria ficar rápida, o próprio navegador gera uma **miniatura** (480 px) e uma **prévia** (1600 px) em JPEG, salvas separadamente.
- **Download**: o botão "Baixar original" passa por `/api/download/ID`, que confere a permissão e redireciona para um link temporário do R2 que entrega o arquivo original, com o nome original. Sem limite de tamanho.
- **Baixar selecionadas**: os arquivos são baixados um a um direto do R2 (sem ZIP no servidor, então não existe risco de estourar o tempo limite da Vercel).

### Estrutura no R2

```
albums/ID_DO_ALBUM/photos/ID-IMG_9281.jpg    ← original
albums/ID_DO_ALBUM/videos/ID-culto.mp4       ← original
albums/ID_DO_ALBUM/thumbs/ID.jpg             ← miniatura da grade
albums/ID_DO_ALBUM/previews/ID.jpg           ← prévia do lightbox / pôster do vídeo
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
lib/                    integração: Supabase, R2, autenticação, regras de arquivo
lib/upload/             fila de upload no navegador (paralelo, multipart, retomada)
services/               consultas ao banco
types/                  tipos TypeScript
utils/                  formatação de datas/tamanhos, slug, nomes de arquivo
supabase/schema.sql     script do banco
r2-cors.json            modelo da política de CORS do R2
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

## 6. Criar o Cloudflare R2 e o bucket

1. Acesse **https://dash.cloudflare.com** e crie uma conta (gratuita).
2. No menu da esquerda: **R2 Object Storage**. Na primeira vez, ative o R2 (a Cloudflare pede um cartão, mas o plano gratuito inclui 10 GB por mês e **não cobra pelo download dos arquivos**).
3. Clique em **Create bucket**.
4. *Bucket name*: `midia-igreja` · *Location*: Automatic (ou *South America* se aparecer) · *Default storage class*: Standard.
5. Clique em **Create bucket**.
6. Na página **Overview** do R2, anote o **Account ID** (aparece na lateral direita, em *Account Details*).

**Limpeza de envios interrompidos**: abra o bucket → **Settings** → **Object lifecycle rules**. Confira se existe uma regra para *Abort incomplete multipart uploads* (em geral já vem criada com 7 dias). Se não existir, clique em *Add rule*, marque essa opção com 7 dias e salve. Isso apaga partes de envios abandonados.

## 7. Deixar o bucket acessível para visualização

As miniaturas e os vídeos são exibidos por um endereço público do bucket. Os nomes dos arquivos contêm códigos aleatórios, então ninguém consegue "adivinhar" arquivos.

**Opção A (para testar): endereço r2.dev**

1. Abra o bucket → **Settings** → **Public Development URL** → **Enable** → digite `allow` e confirme.
2. Copie o endereço, por exemplo `https://pub-1234abcd.r2.dev`. Este é o `R2_PUBLIC_URL`.

**Opção B (recomendado para uso real): domínio próprio**

O r2.dev tem limite de velocidade e é só para desenvolvimento. Se o domínio da igreja está na Cloudflare:

1. Bucket → **Settings** → **Custom Domains** → **Connect Domain**.
2. Digite um subdomínio, por exemplo `midia.suaigreja.com.br`, e confirme.
3. Use `https://midia.suaigreja.com.br` como `R2_PUBLIC_URL`. Isso ativa o **cache da CDN** da Cloudflare.

## 8. Gerar as credenciais do R2

1. Na página do **R2 Object Storage**, clique em **Manage API tokens** (ou *API* → *Manage API Tokens*).
2. **Create Account API token** (ou *Create API token*).
3. *Token name*: `midia-igreja-site` · *Permissions*: **Object Read & Write** · *Specify bucket(s)*: **Apply to specific buckets only** → `midia-igreja`.
4. Clique em **Create API Token**.
5. Copie **Access Key ID** e **Secret Access Key** agora. ⚠️ A Secret aparece **uma única vez**.

## 9. Configurar o CORS

O CORS autoriza o navegador, a partir do seu site, a enviar arquivos direto para o R2.

1. Abra o bucket → **Settings** → **CORS Policy** → **Add CORS policy** (ou *Edit*).
2. Apague o conteúdo e cole (troque o endereço da Vercel depois que publicar):
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://SEU-PROJETO.vercel.app"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["content-type", "cache-control"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. Salve. O mesmo conteúdo está no arquivo `r2-cors.json`.

> O `ExposeHeaders: ["ETag"]` é **obrigatório** para o envio de vídeos grandes em partes.

## 10. Preencher o .env.local

1. No VS Code, clique com o botão direito em `.env.example` → **Copy**, depois clique na raiz do projeto → **Paste**. Renomeie a cópia para **`.env.local`**.
2. Preencha:

| Variável | Onde pegar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (URL do projeto) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → publishable key ou anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → secret key ou service_role (**secreta**) |
| `R2_ACCOUNT_ID` | Cloudflare → R2 → Overview → Account ID |
| `R2_ACCESS_KEY_ID` | Token criado no passo 8 |
| `R2_SECRET_ACCESS_KEY` | Token criado no passo 8 (**secreta**) |
| `R2_BUCKET_NAME` | `midia-igreja` |
| `R2_PUBLIC_URL` | Endereço do passo 7, **sem barra no final** |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `ALBUM_ACCESS_SECRET` | Texto aleatório (veja abaixo) |

Para gerar o `ALBUM_ACCESS_SECRET`, rode no terminal e copie o resultado:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O `.env.local` **não vai para o GitHub** (está no `.gitignore`).

## 11. Iniciar localmente

No terminal do VS Code:

```
npm run dev
```

Abra **http://localhost:3000**. O painel fica em **http://localhost:3000/admin** (você será levado ao login).

Para parar: clique no terminal e pressione **Ctrl + C**. Sempre que mudar o `.env.local`, pare e rode `npm run dev` de novo.

## 12. Testar o upload

1. Entre em `/login` com o usuário criado no passo 5.
2. Clique em **Novo álbum**, preencha o nome e a data e clique em **Criar álbum e enviar arquivos**.
3. Arraste algumas fotos (e um vídeo, de preferência maior que 32 MB para testar o envio em partes).
4. Acompanhe o progresso geral e de cada arquivo.
5. Confira:
   - no **Cloudflare** → bucket → *Objects*: a pasta `albums/...` com `photos`, `videos`, `thumbs`, `previews`;
   - no **Supabase** → *Table Editor* → `media`: uma linha por arquivo.
6. Passe o mouse numa foto e clique em **Definir como capa**.
7. Clique em **Publicar** e depois em **Ver página**. Teste o lightbox, o vídeo, o "Baixar original" e a seleção de várias fotos.
8. Teste o **retomar**: comece a enviar um vídeo grande, recarregue a página no meio, selecione o mesmo vídeo de novo. O status mostra "(retomado)".

## 13. Subir no GitHub

1. Abra o **GitHub Desktop** → *File* → **Add local repository** → escolha a pasta do projeto.
2. Se aparecer "this directory does not appear to be a Git repository", clique em **create a repository** → *Create repository*.
3. Confira na lista de alterações que **não aparece** o `.env.local` (se aparecer, pare e verifique o `.gitignore`).
4. Escreva um resumo como "Primeira versão" e clique em **Commit to main**.
5. Clique em **Publish repository**. Deixe marcado **Keep this code private** e confirme.

Nas próximas mudanças: *Commit to main* → **Push origin**. A Vercel publica sozinha a cada push.

## 14. Publicar na Vercel

1. Acesse **https://vercel.com** e entre com o GitHub.
2. **Add New...** → **Project** → encontre `midia-igreja` → **Import**.
3. *Framework Preset*: Next.js (detectado automaticamente). Não mude os comandos de build.
4. Abra **Environment Variables** e cadastre todas as variáveis do próximo passo.
5. Clique em **Deploy** e aguarde.
6. Copie o endereço gerado (ex.: `https://midia-igreja.vercel.app`) e então:
   - na Vercel → *Settings* → *Environment Variables*: altere `NEXT_PUBLIC_APP_URL` para esse endereço e faça **Redeploy** (*Deployments* → ⋯ → *Redeploy*);
   - no Cloudflare → bucket → **CORS Policy**: adicione o endereço em `AllowedOrigins`;
   - no Supabase → **Authentication → URL Configuration**: coloque o endereço em *Site URL*.

> Se usar um domínio próprio para o site (ex.: `fotos.suaigreja.com.br`), adicione também esse endereço no CORS e no `NEXT_PUBLIC_APP_URL`.

## 15. Variáveis na Vercel

Cadastre em **Settings → Environment Variables** (ambientes *Production* e *Preview*):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
NEXT_PUBLIC_APP_URL
ALBUM_ACCESS_SECRET
```

Variáveis que começam com `NEXT_PUBLIC_` são embutidas no site na hora do build: se mudar alguma, faça **Redeploy**.

---

## Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| Upload fica em "Erro: Falha de conexão com o Cloudflare R2..." | CORS não configurado ou endereço do site ausente em `AllowedOrigins` (passo 9). |
| "O Cloudflare R2 recusou o envio (link expirado ou CORS...)" | Credenciais erradas no `.env.local`, token sem permissão *Object Read & Write* no bucket, ou relógio do computador errado. |
| Vídeo grande falha com "...CORS expõe o cabeçalho ETag" | Falta `"ExposeHeaders": ["ETag"]` no CORS. |
| Miniaturas não aparecem | `R2_PUBLIC_URL` errado ou acesso público não habilitado (passo 7). |
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
