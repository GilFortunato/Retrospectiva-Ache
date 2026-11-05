# Retrospectiva Aché

Cópia independente do [Programa PcD - Propagandista Trainee](https://github.com/GilFortunato/ache-propagandista-trainee), a partir do commit `5eff2388a94bfc157927c37ef7d10943c2429414`.

As páginas, os conteúdos, os estilos e as imagens do programa foram preservados. A entrada `/` e os links antigos para `/login` levam diretamente a `/home`, sem autenticação de participantes.

## O que esta versão inclui

- Home Nexus e páginas Aché, Prosper, Letramento, Cultura, Vagas, Potenc.IA, Comunidade e ReBrand Pessoal.
- Conteúdo de orientação profissional no ReBrand, sem pesquisa automática ou consulta a resultados anteriores.
- Área administrativa opcional, protegida por senha própria, e código de gerenciamento de integrações preservado para configuração independente.

## Independência do projeto original

- Sem banco de dados, migrações SQL, driver Postgres ou código de cotas e persistência.
- Sem usuários, diagnósticos, dados ou histórico de commits importados do projeto original.
- Sem Google OAuth, callbacks, cookies ou credenciais de login de participantes.
- Sem cópia de segredos, configurações de hospedagem ou variáveis do ambiente original.
- As APIs legadas de pesquisa, plano, cota e histórico retornam HTTP 410. A pesquisa automática permanece desativada mesmo que existam chaves de integrações no ambiente.

As bibliotecas de análise e integração independentes do banco foram mantidas como referência para futuras alterações. Não são acionadas pela página pública de ReBrand.

## Executar localmente

Requer Node.js 22 e npm.

```sh
npm ci
npm run dev
```

Acesse `http://localhost:3000`. Nenhuma variável de ambiente é necessária para navegar pelos conteúdos.

## Validar e iniciar em produção

```sh
npm run build
npm start
```

## Administração opcional

A área `/admin` continua exigindo uma sessão administrativa válida. Ela fica indisponível até configurar `ACHE_ADMIN_PASSWORD_HASH` (no formato scrypt aceito por `src/lib/acheAdminAuth.ts`) e `ACHE_ADMIN_SESSION_SECRET` (pelo menos 32 caracteres).

O arquivo `.env.example` lista as configurações opcionais. Use somente credenciais e identificadores exclusivos desta cópia. Nenhuma integração ou hospedagem foi provisionada por esta importação.
