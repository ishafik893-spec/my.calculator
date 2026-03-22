import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Delete, Equal, Plus, Minus, X, Divide, Percent, ChevronRight, ChevronLeft, ArrowLeft, ArrowRight } from 'lucide-react';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isResult, setIsResult] = useState(false);
  const [isScientific, setIsScientific] = useState(false);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [cursorPos, setCursorPos] = useState(1); // Position after the character

  // Keep cursor at the end when display changes normally
  useEffect(() => {
    if (!isResult && !waitingForOperand && cursorPos > display.length) {
      setCursorPos(display.length);
    }
  }, [display]);

  const handleNumber = (num: string) => {
    if (isResult || waitingForOperand) {
      setDisplay(num);
      setCursorPos(num.length);
      setIsResult(false);
      setWaitingForOperand(false);
    } else {
      if (display === '0') {
        setDisplay(num);
        setCursorPos(num.length);
      } else {
        const before = display.slice(0, cursorPos);
        const after = display.slice(cursorPos);
        setDisplay(before + num + after);
        setCursorPos(cursorPos + num.length);
      }
    }
  };

  const handleOperator = (op: string) => {
    if (equation && !waitingForOperand) {
      try {
        const result = calculateResult(equation + display);
        setDisplay(String(result));
        setEquation(result + ' ' + op + ' ');
        setCursorPos(String(result).length);
      } catch (e) {
        setDisplay('Error');
        setEquation('');
        setCursorPos(5);
      }
    } else {
      setEquation(display + ' ' + op + ' ');
    }
    
    setIsResult(false);
    setWaitingForOperand(true);
  };

  const calculateResult = (expr: string) => {
    let evalEquation = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/\^/g, '**');

    const sanitized = evalEquation.replace(/[^-+*/0-9.() MathPIEsinclogqrt**]/g, '');
    const result = Function(`'use strict'; return (${sanitized})`)();
    
    if (isNaN(result) || !isFinite(result)) throw new Error();
    return Number(result.toFixed(8));
  };

  const handleCalculate = () => {
    if (!equation || waitingForOperand) return;
    
    try {
      const result = calculateResult(equation + display);
      setDisplay(String(result));
      setEquation('');
      setIsResult(true);
      setWaitingForOperand(false);
      setCursorPos(String(result).length);
    } catch (error) {
      setDisplay('Error');
      setEquation('');
      setIsResult(true);
      setCursorPos(5);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsResult(false);
    setWaitingForOperand(false);
    setCursorPos(1);
  };

  const handleBackspace = () => {
    if (isResult) {
      handleClear();
      return;
    }

    if (cursorPos > 0) {
      const before = display.slice(0, cursorPos - 1);
      const after = display.slice(cursorPos);
      const newDisplay = before + after;
      
      if (newDisplay === '' && !equation) {
        setDisplay('0');
        setCursorPos(1);
      } else if (newDisplay === '' && equation) {
        // Go back to the equation
        const parts = equation.trim().split(' ');
        if (parts.length >= 2) {
          const lastNum = parts[parts.length - 2];
          const remainingEquation = parts.slice(0, -2).join(' ');
          setDisplay(lastNum);
          setEquation(remainingEquation ? remainingEquation + ' ' : '');
          setWaitingForOperand(false);
          setCursorPos(lastNum.length);
        } else {
          setDisplay('0');
          setEquation('');
          setCursorPos(1);
        }
      } else {
        setDisplay(newDisplay || '0');
        setCursorPos(Math.max(0, cursorPos - 1));
      }
    }
  };

  const moveCursorLeft = () => {
    setCursorPos(prev => Math.max(0, prev - 1));
  };

  const moveCursorRight = () => {
    setCursorPos(prev => Math.min(display.length, prev + 1));
  };

  const handleScientificFunc = (func: string) => {
    setDisplay(func + '(');
    setCursorPos(func.length + 1);
    setIsResult(false);
    setWaitingForOperand(false);
  };

  const handleConstant = (constant: string) => {
    setDisplay(constant);
    setCursorPos(constant.length);
    setIsResult(false);
    setWaitingForOperand(false);
  };

  const handlePercent = () => {
    const val = String(parseFloat(display) / 100);
    setDisplay(val);
    setCursorPos(val.length);
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setCursorPos(2);
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      const before = display.slice(0, cursorPos);
      const after = display.slice(cursorPos);
      setDisplay(before + '.' + after);
      setCursorPos(cursorPos + 1);
    }
  };

  const handleToggleSign = () => {
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
      setCursorPos(Math.max(0, cursorPos - 1));
    } else {
      setDisplay('-' + display);
      setCursorPos(cursorPos + 1);
    }
  };

  const standardButtons = [
    { label: 'AC', action: handleClear, type: 'special' },
    { label: 'DEL', action: handleBackspace, type: 'special' },
    { label: '%', action: handlePercent, type: 'special' },
    { label: '÷', action: () => handleOperator('/'), type: 'operator', icon: <Divide className="w-5 h-5" /> },
    { label: '7', action: () => handleNumber('7'), type: 'number' },
    { label: '8', action: () => handleNumber('8'), type: 'number' },
    { label: '9', action: () => handleNumber('9'), type: 'number' },
    { label: '×', action: () => handleOperator('*'), type: 'operator', icon: <X className="w-5 h-5" /> },
    { label: '4', action: () => handleNumber('4'), type: 'number' },
    { label: '5', action: () => handleNumber('5'), type: 'number' },
    { label: '6', action: () => handleNumber('6'), type: 'number' },
    { label: '-', action: () => handleOperator('-'), type: 'operator', icon: <Minus className="w-5 h-5" /> },
    { label: '1', action: () => handleNumber('1'), type: 'number' },
    { label: '2', action: () => handleNumber('2'), type: 'number' },
    { label: '3', action: () => handleNumber('3'), type: 'number' },
    { label: '+', action: () => handleOperator('+'), type: 'operator', icon: <Plus className="w-5 h-5" /> },
    { label: '+/-', action: handleToggleSign, type: 'number' },
    { label: '0', action: () => handleNumber('0'), type: 'number' },
    { label: '.', action: handleDecimal, type: 'number' },
    { label: '=', action: handleCalculate, type: 'equals', icon: <Equal className="w-5 h-5" /> },
  ];

  const scientificButtons = [
    { label: 'sin', action: () => handleScientificFunc('sin'), type: 'sci' },
    { label: 'cos', action: () => handleScientificFunc('cos'), type: 'sci' },
    { label: 'tan', action: () => handleScientificFunc('tan'), type: 'sci' },
    { label: 'log', action: () => handleScientificFunc('log'), type: 'sci' },
    { label: 'ln', action: () => handleScientificFunc('ln'), type: 'sci' },
    { label: '√', action: () => handleScientificFunc('√'), type: 'sci' },
    { label: '^', action: () => handleNumber('^'), type: 'sci' },
    { label: 'π', action: () => handleConstant('π'), type: 'sci' },
    { label: 'e', action: () => handleConstant('e'), type: 'sci' },
    { label: '(', action: () => handleNumber('('), type: 'sci' },
    { label: ')', action: () => handleNumber(')'), type: 'sci' },
    { label: 'x²', action: () => handleNumber('^2'), type: 'sci' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 font-sans transition-all duration-500">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full ${isScientific ? 'max-w-[480px]' : 'max-w-[360px]'} bg-white rounded-[32px] shadow-2xl shadow-black/5 overflow-hidden border border-black/5 transition-all duration-500`}
        id="calculator-container"
      >
        {/* Mode Toggle & Navigation */}
        <div className="flex justify-between items-center px-8 pt-6">
          <button 
            onClick={() => setIsScientific(!isScientific)}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
            id="mode-toggle"
          >
            {isScientific ? <ChevronLeft className="w-3 h-3" /> : null}
            {isScientific ? 'Standard' : 'Scientific'}
            {!isScientific ? <ChevronRight className="w-3 h-3" /> : null}
          </button>
          
          <div className="flex gap-4">
            <button onClick={moveCursorLeft} className="p-1 text-gray-400 hover:text-black transition-colors" id="nav-left">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={moveCursorRight} className="p-1 text-gray-400 hover:text-black transition-colors" id="nav-right">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Area */}
        <div className="p-8 pb-4 flex flex-col items-end justify-end min-h-[160px] bg-white">
          <AnimatePresence mode="wait">
            <motion.div 
              key={equation}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-sm font-medium tracking-wider mb-2 h-5 text-right w-full truncate"
            >
              {equation}
            </motion.div>
          </AnimatePresence>
          <div className="relative w-full flex justify-end items-center overflow-hidden">
            <motion.div 
              key={display}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`${isScientific ? 'text-4xl' : 'text-6xl'} font-light tracking-tighter text-black truncate w-full text-right transition-all duration-300 relative`}
            >
              {display.slice(0, cursorPos)}
              <span className="inline-block w-[2px] h-[0.8em] bg-emerald-500 animate-pulse align-middle mx-[1px]" />
              {display.slice(cursorPos)}
            </motion.div>
          </div>
        </div>

        {/* Keypad */}
        <div className={`p-6 grid ${isScientific ? 'grid-cols-5' : 'grid-cols-4'} gap-3 bg-[#F9F9F9] transition-all duration-500`}>
          {isScientific && (
            <div className="col-span-5 grid grid-cols-4 gap-3 mb-3 border-b border-black/5 pb-4">
              {scientificButtons.map((btn, idx) => (
                <button
                  key={`sci-${idx}`}
                  onClick={btn.action}
                  className="h-12 rounded-xl bg-gray-100 text-black text-sm font-semibold hover:bg-gray-200 transition-all active:scale-95"
                  id={`btn-sci-${btn.label}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
          
          {standardButtons.map((btn, idx) => (
            <button
              key={`std-${idx}`}
              onClick={btn.action}
              className={`
                h-16 rounded-2xl flex items-center justify-center text-xl font-medium transition-all active:scale-95
                ${btn.type === 'number' ? 'bg-white text-black shadow-sm hover:bg-gray-50' : ''}
                ${btn.type === 'operator' ? 'bg-black text-white hover:bg-black/90' : ''}
                ${btn.type === 'special' ? 'bg-gray-200 text-black hover:bg-gray-300' : ''}
                ${btn.type === 'equals' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}
              `}
              id={`btn-${btn.label}`}
            >
              {btn.icon || btn.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="fixed bottom-8 text-center text-gray-400 text-xs tracking-widest uppercase">
        Scientific Utility • v1.5
      </div>
    </div>
  );
}
