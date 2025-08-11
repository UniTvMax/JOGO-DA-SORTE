Jogo da Sorte — Moeda Fictícia
================================

Conteúdo
-------
- index.html : página principal (UI)
- styles.css : estilos
- script.js  : lógica do jogo (randomização, persistência, gráfico)
- README.md  : este arquivo

Funcionalidades principais
-------------------------
- Saldo inicial configurável
- Valor de aposta configurável
- Seleção de dificuldade (fácil / normal / difícil)
- Histórico das últimas 20 jogadas
- Gráfico de saldo usando canvas (sem bibliotecas externas)
- Persistência no localStorage para manter o progresso entre sessões
- Interface responsiva e focada para apresentação em aula
- Código organizado e comentado para explicar algoritmo

Como usar (passo a passo para apresentação)
------------------------------------------
1. Abra `index.html` em um navegador moderno (Chrome, Edge, Firefox).
2. Defina o saldo inicial e a aposta. Clique em "Iniciar / Reiniciar".
3. Explique o algoritmo:
   - `Math.random()` gera números pseudo-aleatórios.
   - Convertemos para inteiro entre 1 e 10: `Math.floor(Math.random() * 10) + 1`
   - Dependendo do número sorteado, alteramos o saldo (+ / -).
   - Armazenamos histórico e desenhamos o gráfico para visualizar o comportamento.
4. Durante a aula, mostre probabilidades e peça para a turma calcular probabilidades e valor esperado:
   - Ex.: chance de sair 7 = 1/10 (10%) no modo normal.

Observações para avaliação crítica (o que considerei)
----------------------------------------------------
- Balanceamento: optei por multiplicadores dependentes da aposta (mais didático).
- Persistência no localStorage (sem backend) — suficiente para apresentação.
- Limitei a série do gráfico para evitar uso excessivo de memória.
- Usei canvas puro para reduzir dependências e manter o pacote pequeno.

Se quiser:
- Posso adicionar exportação CSV do histórico.
- Adicionar som/efeitos ou um modo multiplayer (local).
- Gerar versão compacta (minificada) dos arquivos.

Licença
------
Use à vontade para projeto escolar. Atribuição opcional.

