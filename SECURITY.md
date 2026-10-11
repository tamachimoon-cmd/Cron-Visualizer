# Política de segurança

A versão 1.x recebe correções de segurança durante o desenvolvimento ativo.

## Relato responsável

Use **GitHub → Security → Report a vulnerability** (aviso privado), quando disponível. Caso contrário, abra uma issue sem detalhes exploráveis solicitando contato privado. Não divulgue provas de conceito antes da correção.

## Modelo de segurança

- Sem execução de comandos, autenticação, tokens, upload, APIs externas ou persistência.
- Servidor HTTP com lista explícita de rotas e métodos GET/HEAD; CSP, nosniff, no-referrer e X-Frame-Options DENY.
- Dados digitados exibidos via `textContent`, sem interpolação HTML.
- Expressões limitadas a 200 caracteres, simulação limitada a cinco anos e 20 resultados.
- Docker usa usuário não privilegiado.

Não exponha diretamente à internet sem TLS e controles de borda. O servidor é destinado a uso local e demonstração.
