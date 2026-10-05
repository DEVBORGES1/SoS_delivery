# Regras do projeto

## Commits e pull requests

- O único autor dos commits é **DEVBORGES1 <joaovitorpereira.10112@gmail.com>** (autor e committer).
- Nunca adicionar coautor: sem `Co-Authored-By:`, sem `Claude-Session:` ou qualquer outra linha de atribuição na mensagem de commit.
- Descrições de pull request também não levam rodapé de atribuição (ex.: "Generated with Claude Code").
- O hook `.githooks/commit-msg` remove essas linhas automaticamente. Para ativá-lo em um clone novo:
  `git config core.hooksPath .githooks`

## Branches

- Commits vão direto na `main`, com histórico linear (sem merge commit). Não criar nem enviar branches `claude/...` ou qualquer outra branch de trabalho.
- Antes de enviar: `git pull --ff-only origin main`, rodar build/lint/testes e depois `git push origin main`.
