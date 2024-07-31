'use client'; 

import React, { useState, useEffect } from 'react';
import { Clock, Flag, Lightning, Shield, Binoculars } from "@phosphor-icons/react";

const INITIAL_BOARD_SIZE = 10;
const INITIAL_NUM_MINES = 15;

const Cell = ({ value, revealed, flagged, powerUp, onClick, onContextMenu }) => (
  <button
    className={`w-10 h-10 border border-cyan-400 flex items-center justify-center text-sm font-bold rounded-md transition-all duration-300 ${
      revealed
        ? value === 'X'
          ? 'bg-red-500 text-white'
          : 'bg-cyan-200'
        : 'bg-cyan-700 hover:bg-cyan-600'
    } ${powerUp ? 'animate-pulse' : ''}`}
    onClick={onClick}
    onContextMenu={onContextMenu}
    disabled={revealed}
  >
    {revealed ? value : flagged ? '🚩' : powerUp ? '⚡' : ''}
  </button>
);

const Minesweeper = () => {
  const [board, setBoard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [flagCount, setFlagCount] = useState(INITIAL_NUM_MINES);
  const [time, setTime] = useState(0);
  const [score, setScore] = useState(0);
  const [boardSize, setBoardSize] = useState(INITIAL_BOARD_SIZE);
  const [numMines, setNumMines] = useState(INITIAL_NUM_MINES);
  const [powerUps, setPowerUps] = useState({ reveal: 3, shield: 2, scan: 1 });

  useEffect(() => {
    initializeBoard();
  }, [boardSize, numMines]);

  useEffect(() => {
    let timer;
    if (!gameOver && !win) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameOver, win]);

  const initializeBoard = () => {
    const newBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < numMines) {
      const row = Math.floor(Math.random() * boardSize);
      const col = Math.floor(Math.random() * boardSize);
      if (newBoard[row][col] !== 'X') {
        newBoard[row][col] = 'X';
        minesPlaced++;
      }
    }

    // Calculate numbers and place power-ups
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (newBoard[row][col] !== 'X') {
          newBoard[row][col] = countAdjacentMines(newBoard, row, col);
          if (Math.random() < 0.1) { // 10% chance of power-up
            newBoard[row][col] = { value: newBoard[row][col], powerUp: true };
          }
        }
      }
    }

    setBoard(newBoard.map(row => row.map(cell => ({ 
      value: cell.value || cell, 
      revealed: false, 
      flagged: false, 
      powerUp: cell.powerUp || false 
    }))));
    setFlagCount(numMines);
  };

  const countAdjacentMines = (board, row, col) => {
    let count = 0;
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
          if (board[newRow][newCol] === 'X') count++;
        }
      }
    }
    return count;
  };

  const revealCell = (row, col) => {
    if (gameOver || win || board[row][col].revealed || board[row][col].flagged) return;

    const newBoard = [...board];
    newBoard[row][col].revealed = true;

    if (newBoard[row][col].value === 'X') {
      if (powerUps.shield > 0) {
        setPowerUps(prev => ({ ...prev, shield: prev.shield - 1 }));
        newBoard[row][col].value = 'S'; // 'S' for shielded
      } else {
        setGameOver(true);
      }
    } else {
      if (newBoard[row][col].value === 0) {
        revealAdjacentCells(newBoard, row, col);
      }
      if (newBoard[row][col].powerUp) {
        const powerUpType = Math.random() < 0.33 ? 'reveal' : Math.random() < 0.66 ? 'shield' : 'scan';
        setPowerUps(prev => ({ ...prev, [powerUpType]: prev[powerUpType] + 1 }));
        newBoard[row][col].powerUp = false;
      }
      setScore(prev => prev + 10);
    }

    setBoard(newBoard);
    checkWinCondition(newBoard);
  };

  const revealAdjacentCells = (board, row, col) => {
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const newRow = row + r;
        const newCol = col + c;
        if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize) {
          if (!board[newRow][newCol].revealed && !board[newRow][newCol].flagged) {
            board[newRow][newCol].revealed = true;
            if (board[newRow][newCol].value === 0) {
              revealAdjacentCells(board, newRow, newCol);
            }
          }
        }
      }
    }
  };

  const toggleFlag = (row, col) => {
    if (gameOver || win || board[row][col].revealed) return;

    const newBoard = [...board];
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);
    setFlagCount(prevCount => newBoard[row][col].flagged ? prevCount - 1 : prevCount + 1);
  };

  const checkWinCondition = (board) => {
    const win = board.every(row =>
      row.every(cell => cell.revealed || cell.value === 'X' || cell.value === 'S')
    );
    if (win) {
      setWin(true);
      setScore(prev => prev + boardSize * numMines * 10);
    }
  };

  const resetGame = () => {
    setBoardSize(prev => Math.min(prev + 2, 20)); // Increase board size, max 20x20
    setNumMines(prev => Math.min(prev + 5, 99)); // Increase mines, max 99
    initializeBoard();
    setGameOver(false);
    setWin(false);
    setTime(0);
    setPowerUps({ reveal: 3, shield: 2, scan: 1 });
  };

  const usePowerUp = (type) => {
    if (powerUps[type] > 0) {
      setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
      if (type === 'reveal') {
        const newBoard = [...board];
        let revealed = false;
        while (!revealed) {
          const row = Math.floor(Math.random() * boardSize);
          const col = Math.floor(Math.random() * boardSize);
          if (!newBoard[row][col].revealed && newBoard[row][col].value !== 'X') {
            revealCell(row, col);
            revealed = true;
          }
        }
      } else if (type === 'scan') {
        const newBoard = board.map(row => row.map(cell => ({
          ...cell,
          revealed: cell.value === 'X' ? false : true
        })));
        setBoard(newBoard);
        setTimeout(() => {
          setBoard(board.map(row => row.map(cell => ({ ...cell, revealed: cell.revealed }))));
        }, 2000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-cyan-300">
      <h1 className="text-4xl font-bold mb-4 text-cyan-400">Minesweeper Evolution</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between mb-4">
          <div className="flex items-center">
            <Flag className="mr-2" />
            <span>{flagCount}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2" />
            <span>{time}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">Score:</span>
            <span>{score}</span>
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1 mb-4">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cell.value}
                revealed={cell.revealed}
                flagged={cell.flagged}
                powerUp={cell.powerUp}
                onClick={() => revealCell(rowIndex, colIndex)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(rowIndex, colIndex);
                }}
              />
            ))
          )}
        </div>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={() => usePowerUp('reveal')}
          >
            <Lightning className="mr-2" /> Reveal ({powerUps.reveal})
          </button>
          <button
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={() => usePowerUp('shield')}
          >
            <Shield className="mr-2" /> Shield ({powerUps.shield})
          </button>
          <button
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded flex items-center"
            onClick={() => usePowerUp('scan')}
          >
            <Binoculars className="mr-2" /> Scan ({powerUps.scan})
          </button>
        </div>
        {(gameOver || win) && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold mb-2">
              {win ? 'Congratulations! You won!' : 'Game Over!'}
            </p>
            <p className="text-xl mb-4">Final Score: {score}</p>
            <button
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded"
              onClick={resetGame}
            >
              Next Level
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Minesweeper;
