console.clear();

import { useState, useEffect } from "react";

export default function App() {
  const [isModeSelected, setIsModeSelected] = useState(false);
  const [isConnect4, setIsConnect4] = useState(false);
  const [isComputerOpponent, setIsComputerOpponent] = useState(false);
  const [hasSecondPlayerClicked, setHasSecondPlayerClicked] = useState(false);
  const [isBoardLocked, setIsBoardLocked] = useState(false);
  const [tiles, setTiles] = useState(createTiles(false));
  const [isPlayer1Turn, setIsPlayer1Turn] = useState(true);
  const [isDraw, setIsDraw] = useState(false);

  // computer turn
  useEffect(() => {
    if (isComputerOpponent && !isPlayer1Turn) {
      setIsBoardLocked(true);
      setTimeout(() => {
        computerTurn();
        // setIsBoardLocked(false);
      }, 500);
      setTimeout(() => {
        setIsBoardLocked(false);
      }, 750);
    }
  }, [isComputerOpponent, isPlayer1Turn]);

  useEffect(() => {
    if (!hasSecondPlayerClicked) {
      setHasSecondPlayerClicked(tiles.some((tile) => tile.clicked === 2));
    }
  }, [tiles, hasSecondPlayerClicked]);

  function createTiles(isConnect4) {
    return Array.from({ length: isConnect4 ? 42 : 9 }, (_, i) => {
      return { id: i };
    });
  }

  function computerTurn() {
    const emptyTiles = tiles.filter((tile) => !tile.clicked);
    if (emptyTiles.length === 0) return;

    // const isFirstComputerMove = tiles.filter((tile) => tile.clicked === 2).length < 1;
    const isFirstComputerMove = emptyTiles.length > (isConnect4 ? 40 : 7);

    const randomIdx = Math.floor(Math.random() * emptyTiles.length);
    const randomEmptyTile = emptyTiles[randomIdx];

    // remove randomEmptyTile to make it harder
    handleTileClick(
      isFirstComputerMove ? randomEmptyTile : { id: getBestComputerMove() },
    );
  }

  function getBestComputerMove() {
    const board = tiles.map((tile) => tile.clicked || 0);

    const config = isConnect4
      ? { rows: 6, cols: 7, connect: 4, maxDepth: 7 }
      : { rows: 3, cols: 3, connect: 3, maxDepth: 9 };

    let bestScore = -Infinity;
    let bestMove = null;

    const legalMoves = getLegalMoves(board, config); // shared helper

    for (const move of legalMoves) {
      board[move.idx] = 2; // computer is Player 2
      const score = minimax(board, 1, false, -Infinity, Infinity, config);
      board[move.idx] = 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move.id; // column for Connect 4, idx for Tic-Tac-Toe
      }
    }

    return bestMove;
  }

  function minimax(board, depth, isMaximizing, alpha, beta, config) {
    const likelyWinner = getLikelyWinner(board);

    if (likelyWinner === 2) {
      return 100 - depth;
    }

    if (likelyWinner === 1) {
      return depth - 100;
    }

    if (depth >= config.maxDepth) {
      return 0;
    }

    const legalMoves = getLegalMoves(board, config);
    if (legalMoves.length === 0) {
      return 0;
    }

    if (isMaximizing) {
      let maxEval = -Infinity;

      for (const move of legalMoves) {
        board[move.idx] = 2;
        const evalScore = minimax(board, depth + 1, false, alpha, beta, config);
        board[move.idx] = 0;

        if (evalScore > maxEval) {
          maxEval = evalScore;
        }

        if (evalScore > alpha) {
          alpha = evalScore;
        }

        if (beta <= alpha) {
          break;
        }
      }

      return maxEval;
    } else {
      let minEval = Infinity;

      for (const move of legalMoves) {
        board[move.idx] = 1;
        const evalScore = minimax(board, depth + 1, true, alpha, beta, config);
        board[move.idx] = 0;

        if (evalScore < minEval) {
          minEval = evalScore;
        }

        if (evalScore < beta) {
          beta = evalScore;
        }

        if (beta <= alpha) {
          break;
        }
      }

      return minEval;
    }
  }

  // shared helper for both modes
  function getLegalMoves(board, config) {
    const moves = [];

    if (isConnect4) {
      // Connect 4: moves are columns, but we apply them to the lowest empty cell in that column
      for (let col = 0; col < config.cols; col++) {
        const dropIdx = (() => {
          for (let row = config.rows - 1; row >= 0; row--) {
            const idx = row * config.cols + col;
            if (!board[idx]) {
              return idx;
            }
          }
          return null;
        })();

        if (dropIdx === null) {
          continue;
        }

        moves.push({
          id: col, // what we return to choose the column
          idx: dropIdx, // where we actually place the piece in the board array
        });
      }
    } else {
      // Tic-Tac-Toe: moves are just empty cells
      for (let i = 0; i < board.length; i++) {
        if (!board[i]) {
          moves.push({
            id: i,
            idx: i,
          });
        }
      }
    }

    return moves;
  }

  function getLines() {
    const lines = [];
    const rows = isConnect4 ? 6 : 3;
    const cols = isConnect4 ? 7 : 3;
    const connect = isConnect4 ? 4 : 3;

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - connect; c++) {
        const line = [];
        for (let i = 0; i < connect; i++) {
          line.push(r * cols + c + i);
        }
        lines.push(line);
      }
    }

    // Vertical lines
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r <= rows - connect; r++) {
        const line = [];
        for (let i = 0; i < connect; i++) {
          line.push((r + i) * cols + c);
        }
        lines.push(line);
      }
    }

    // Diagonal lines (↘)
    for (let r = 0; r <= rows - connect; r++) {
      for (let c = 0; c <= cols - connect; c++) {
        const line = [];
        for (let i = 0; i < connect; i++) {
          line.push((r + i) * cols + (c + i));
        }
        lines.push(line);
      }
    }

    // Diagonal lines (↙)
    for (let r = 0; r <= rows - connect; r++) {
      for (let c = connect - 1; c < cols; c++) {
        const line = [];
        for (let i = 0; i < connect; i++) {
          line.push((r + i) * cols + (c - i));
        }
        lines.push(line);
      }
    }

    return lines;
  }

  function getLikelyWinner(board) {
    const lines = getLines();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.every((idx) => board[idx] && board[idx] === board[line[0]])) {
        return board[line[0]];
      }
    }

    return null;
  }

  function getWinnerObj() {
    const lines = getLines();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        line.every(
          (idx) =>
            tiles[idx].clicked && tiles[idx].clicked === tiles[line[0]].clicked,
        )
      ) {
        return {
          winner: tiles[line[0]].clicked === 1 ? "Player 1" : "Player 2",
          connectedIndices: line,
        };
      }
    }

    return null;
  }

  const winnerObj = isModeSelected ? getWinnerObj() : null;
  const winner = winnerObj ? winnerObj.winner : null;

  // show winning connected tiles
  useEffect(() => {
    if (!winnerObj) return;

    setTiles((prev) =>
      prev.map((prevTile) =>
        winnerObj.connectedIndices.includes(prevTile.id)
          ? { ...prevTile, connected: true }
          : prevTile,
      ),
    );
  }, [winner]);

  // check for draw
  useEffect(() => {
    if (!hasSecondPlayerClicked) return;

    if (tiles.every((tile) => tile.clicked)) {
      setIsDraw(true);
    }
  }, [tiles]);

  function handleTileClick(clickedTile) {
    if (isBoardLocked || winner) return;
    if (clickedTile.clicked) return;

    let difference = 0;
    if (isConnect4) {
      difference =
        clickedTile.id > 34
          ? 0
          : clickedTile.id > 27
            ? 7
            : clickedTile.id > 20
              ? 14
              : clickedTile.id > 13
                ? 21
                : clickedTile.id > 6
                  ? 28
                  : 35;

      const isLandedTileClicked = () => {
        return tiles.find((tile) => tile.id === clickedTile.id + difference)
          .clicked;
      };

      while (isLandedTileClicked()) {
        difference -= 7;
        isLandedTileClicked();
      }
    }

    setTiles((prev) =>
      prev.map((prevTile) =>
        prevTile.id === clickedTile.id + (isConnect4 && difference)
          ? { ...prevTile, clicked: isPlayer1Turn ? 1 : 2 }
          : prevTile,
      ),
    );

    setIsPlayer1Turn((prev) => !prev);
  }

  // new game / select mode
  function selectMode(isConnect4) {
    setIsModeSelected(true);
    setIsConnect4(isConnect4);
    setIsComputerOpponent(false);
    setHasSecondPlayerClicked(false);
    setTiles(createTiles(isConnect4));
    setIsPlayer1Turn(true);
    setIsDraw(false);
  }

  const tileEls = tiles.map((tile) => (
    <span
      className={`tile${tile.clicked ? " clicked-" + tile.clicked : ""}${tile.connected ? " connected" : ""}`}
      onClick={() => handleTileClick(tile)}
      key={tile.id}
    ></span>
  ));

  return (
    <>
      <div className="info">
        {!isModeSelected ? (
          <>
            <button onClick={() => selectMode(false)}>Tic-Tac-Toe</button>
            or
            <button onClick={() => selectMode(true)}>Connect 4</button>
          </>
        ) : (
          <>
            {!isComputerOpponent && !hasSecondPlayerClicked && (
              <button onClick={() => setIsComputerOpponent(true)}>
                Play against computer
              </button>
            )}
            {(winner || isDraw) && (
              <>
                <span className={winner && `player-${winner.slice(-1)}`}>
                  {isComputerOpponent && winner === "Player 2"
                    ? "Computer wins!"
                    : isComputerOpponent && winner === "Player 1"
                      ? "You win!"
                      : winner
                        ? `${winner} wins!`
                        : "It's a draw!"}
                </span>
                <button onClick={() => setIsModeSelected(false)}>
                  New Game
                </button>
              </>
            )}
          </>
        )}
      </div>
      {isModeSelected && (
        <div className={isConnect4 ? "board connect-4" : "board"}>
          {tileEls}
        </div>
      )}
    </>
  );
}
