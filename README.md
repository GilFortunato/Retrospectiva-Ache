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

## BI demográfico

O painel `/bi` também está acessível pelo Nexus. Inclui o filtro de público (Geral ou Aprovados), filtros por região do Brasil, UF e região de São Paulo, indicadores do recorte, gráficos demográficos e de formação, exportação CSV, impressão e links que preservam os filtros selecionados.

Configure `BI_DRIVE_FILE_ID` no ambiente da aplicação para ler o arquivo XLSX/XLSM do Drive que contém a aba **Base Tratada**. O arquivo precisa permitir leitura por link. O identificador é usado apenas no servidor e não aparece no navegador. Não há login Google para visitantes nem banco de dados.

Para teste local, `BI_WORKBOOK_PATH` aceita o caminho absoluto da planilha demográfica e tem prioridade sobre o Drive. Configure `BI_DIARIO_TURMA_A`, `BI_DIARIO_TURMA_B` e `BI_DIARIO_TURMA_C` com os caminhos absolutos das listas de aprovados ou com IDs de arquivos que o servidor já pode ler no Drive. Cada lista deve conter uma coluna **Nome**, **Nome completo**, **Participante** ou **Name**. O filtro **Aprovados** inclui todos os nomes distintos dessas listas. Quando falta uma correspondência única na base demográfica, a pessoa entra no total com os dados demográficos como não informados. O painel consulta as fontes novamente ao atualizar os dados.

Para variações de nome verificadas, a variável de servidor `BI_APROVADOS_NOMES_EQUIVALENTES` aceita um objeto JSON que associa cada grafia da lista à grafia da base demográfica. A correspondência direta tem prioridade e a grafia alternativa exige um único registro na base.

Em `/aprovados`, selecione a turma e abra a ficha pelo nome. A ficha lê a **Média final**, as avaliações semanais e as **Observações finais** do diário. Os diários configurados com caminhos locais são carregados ao abrir em localhost no modo de desenvolvimento. Use `npm run dev -- --hostname 127.0.0.1` para a consulta local. A opção **Carregar lista** lê a planilha selecionada no navegador.

O **Ranking por nota** usa as médias finais registradas na turma. Enquanto a turma aguarda o lançamento das médias finais, a posição usa as avaliações semanais em comum. O ambiente local lê os destaques dos professores da variável `BI_DESTAQUES_DOCENTES`, um objeto JSON por turma com os nomes dos participantes e as respectivas listas de destaques.

Em `/candidatos`, o **Ranking geral** reúne as turmas pela média final. O filtro por turma preserva a posição geral. **Atualizar notas** aplica as médias finais preenchidas aos nomes do diário carregado, durante a sessão. Para tornar a atualização permanente, salve o diário completo com as novas notas no caminho local configurado para a turma e reabra a página.

O painel consulta `/api/bi` ao abrir, a cada 5 minutos enquanto a aba está visível e ao clicar em **Atualizar dados**. A API baixa novamente o mesmo arquivo com cache desativado, lê os valores salvos e devolve somente resumos estatísticos. Preserve o ID do arquivo, os nomes das colunas e as abas Base Tratada e Dicionário ao atualizar a planilha. Se editar fórmulas no Excel, recalcule e salve o arquivo antes de substituir sua versão no Drive. Macros e links externos não são executados.

O filtro de deficiência e neurodivergência apresenta contagens nacionais por categoria nos públicos Geral e Aprovados. A fonte com acesso restrito pode conter a coluna **Grupo de deficiência ou neurodivergência**. Na ausência dessa coluna, configure `BI_DISABILITY_ROSTER` como variável sensível de servidor com um JSON contendo `key` (64 dígitos hexadecimais) e `groups` (mapa de HMAC-SHA256 do nome normalizado para a chave de categoria em `disabilityGroups`). Atualize esse mapa quando o cruzamento com o Squad Aché mudar. Descrições declaradas, nomes e laudos ficam fora do retorno da API. Totais de categorias pequenas e complementos que permitiriam deduzi-los são protegidos.

Sem conexão, o painel conserva a última carga exibida com um aviso. A carga inicial em `src/data/bi-demografico.json` permite abrir a página durante a primeira consulta. Ela contém apenas estatísticas; nomes, nascimentos e registros individuais não são publicados. Recortes com menos de 5 pessoas exibem somente o total. Localidades com menos de 3 participantes são agrupadas na tabela.

A média etária exclui idades ausentes ou inconsistentes (fora de 18 a 100 anos). Esses registros permanecem no total de participantes e aparecem na faixa não informada. Na planilha inicial, uma idade zerada foi excluída da média de 130 idades válidas.

Para gerar novamente a carga inicial de forma independente, usando apenas a biblioteca padrão do Python:

```sh
python scripts/import-bi-demografico.py /caminho/fora/do/repositorio/planilha.xlsm
npm test
```

Mantenha a planilha original fora do repositório. A leitura periódica do Drive não exige esse comando nem um novo deploy.

## Administração opcional

A área `/admin` continua exigindo uma sessão administrativa válida. Ela fica indisponível até configurar `ACHE_ADMIN_PASSWORD_HASH` (no formato scrypt aceito por `src/lib/acheAdminAuth.ts`) e `ACHE_ADMIN_SESSION_SECRET` (pelo menos 32 caracteres).

O arquivo `.env.example` lista as configurações opcionais. Use somente credenciais e identificadores exclusivos desta cópia. Nenhuma integração ou hospedagem foi provisionada por esta importação.
