# Cron Visualizer · LAB//ABERTO

Visualizador de expressões **cron de cinco campos** para aprender, validar e simular horários de execução. Funciona localmente com Node.js 20+, sem dependências externas, contas, APIs, telemetria ou banco de dados.

## Recursos

- Editor com validação de sintaxe, descrição em português e campos destacados.
- Cinco presets, data inicial configurável e próximas **8 execuções** no fuso local do navegador.
- Cópia da expressão e dos horários, interface responsiva e navegação por teclado.
- Parser independente, testes automatizados, servidor estático com CSP e endpoint `/healthz`.
- Docker, Compose e GitHub Actions.

## Executar

Requer Node.js 20+.

```bash
npm start
# Abra http://localhost:3000
```

Sem instalação de dependências. Para outra porta: `PORT=8080 npm start`.

## Testar

```bash
npm run check
npm test
```

O CI executa os testes com `TZ=UTC` para datas reproduzíveis.

## Docker

```bash
docker build -t cron-visualizer .
docker run --rm -p 3000:3000 cron-visualizer
# ou: docker compose up --build
```

A imagem usa Node 22 Alpine e usuário não privilegiado.

## Cron clássico: cinco campos

```text
minuto  hora  dia-do-mês  mês  dia-da-semana
 0–59  0–23     1–31     1–12      0–7
   *     *        *        *         *
```

| Exemplo | Significado |
| --- | --- |
| `* * * * *` | A cada minuto |
| `*/15 * * * *` | A cada 15 minutos |
| `0 9 * * MON-FRI` | Às 09h de segunda a sexta |
| `0 0 1 * *` | Primeiro dia do mês |
| `30 6 * * SUN` | Domingo às 06h30 |
| `0 12 1 * MON` | Primeiro dia do mês **OU** segunda-feira, às 12h |

Suporta `*` (qualquer valor), `,` (lista), `-` (intervalo), `/` (passo), meses JAN–DEC e dias SUN–SAT. Domingo pode ser 0 ou 7. Quando **dia do mês e dia da semana são restritos**, vale a semântica **OU** do cron clássico. Nos demais casos, ambos devem coincidir.

### Limitações

- Não suporta segundos, ano, aliases `@daily`, `?`, `L`, `W` ou `#` de outros dialetos.
- Pesquisa até **cinco anos** e retorna até 20 ocorrências pela API JavaScript; a interface exibe 8.
- Usa o fuso do dispositivo e as regras de horário de verão de JavaScript `Date`. Verifique transições de DST antes de implantar agendas críticas.
- Não executa tarefas, não lê crontabs e não envia dados a serviços externos.

## Estrutura

- `public/`: interface HTML, CSS e JavaScript.
- `src/cron.js`: parser e simulador.
- `server.js`: servidor estático e health check.
- `test/`: testes de cron e HTTP.
- `.github/workflows/ci.yml`: testes e build Docker.
- `docs/ROADMAP.md`: evolução planejada.

## Contribuição, segurança e licença

Leia [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) e [docs/ROADMAP.md](docs/ROADMAP.md). Licença [MIT](LICENSE).
