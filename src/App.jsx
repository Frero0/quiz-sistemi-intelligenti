// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import quizDataRaw from './quiz_Sistemi_Intelligenti.json';
import './App.css'; // Assicurati che questo importi il nuovo CSS che ti ho fornito

export default function QuizApp() {
    // 1) Carica e mescola (se non è array, fallback a [])
    const [quizData] = useState(() =>
        Array.isArray(quizDataRaw) ? [...quizDataRaw].sort(() => Math.random() - 0.5) : []
    );

    // Stati principali
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [showExplanation, setShowExplanation] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [started, setStarted] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);
    const [wrongAnswers, setWrongAnswers] = useState([]);
    const [theme, setTheme] = useState('light');
    const [times, setTimes] = useState([]);
    const [questionStart, setQuestionStart] = useState(null);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [shuffledOptions, setShuffledOptions] = useState([]);
    const [matchingAnswers, setMatchingAnswers] = useState({});
    const [trueFalseAnswers, setTrueFalseAnswers] = useState({});

    // Ref per far scorrere il pallino corrente in vista
    const currentPillRef = useRef(null);

    // 2) Timer automatico
    useEffect(() => {
        if (!started || answered || showExplanation) return;
        if (questionStart === null) setQuestionStart(Date.now());
        if (timeLeft > 0) {
            const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(id);
        }
        handleAnswer(null);
    }, [timeLeft, answered, showExplanation, started, questionStart]);

    // 3) Tema light/dark
    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    // 4) Randomizza opzioni e gestisce lo scroll del pallino corrente
    useEffect(() => {
        if (quizData[current]?.options) {
            const options = [...quizData[current].options];
            const shuffled = options
                .map((value) => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
            setShuffledOptions(shuffled);
        }

        // Fa scorrere il pallino corrente nella vista
        if (currentPillRef.current) {
            currentPillRef.current.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest'
            });
        }

    }, [current, quizData]);

    const handleTrueFalseAnswer = (statement, userValue) => {
        setTrueFalseAnswers(prev => ({
            ...prev,
            [statement]: userValue
        }));
    };

    const handleTrueFalseSubmit = () => {
        setAnswered(true);
        setShowExplanation(true);
        setAnsweredQuestions(prev => [...new Set([...prev, current])]);
        setQuestionStart(null);
        setTimes(ts => [...ts, (Date.now() - (questionStart ?? Date.now())) / 1000]);

        const correctStatements = quizData[current].statements;
        let correctCount = 0;

        for (let [statement, correctVal] of Object.entries(correctStatements)) {
            const userAnswer = trueFalseAnswers[statement];
            if (userAnswer === correctVal) correctCount++;
        }

        if (correctCount === Object.keys(correctStatements).length) {
            setScore(s => s + 1);
        } else {
            setMistakes(m => m + 1);
            setWrongAnswers(ws => [
                ...ws,
                {
                    ...quizData[current],
                    selected: trueFalseAnswers,
                    questionIndex: current
                }
            ]);
        }
    };

    // 5) Gestione risposta
    const handleAnswer = (opt) => {
        if (answered) return;
        setAnswered(true);
        setSelected(opt);
        setAnsweredQuestions(prev => [...new Set([...prev, current])]); // Usa Set per evitare duplicati
        setTimes(ts => [...ts, (Date.now() - (questionStart ?? Date.now())) / 1000]);
        setQuestionStart(null);

        if (opt === quizData[current]?.answer) {
            setScore(s => s + 1);
        } else {
            setMistakes(m => m + 1);
            setWrongAnswers(ws => [...ws, { ...quizData[current], selected: opt, questionIndex: current }]);
        }
        setShowExplanation(true);
    };

    const handleMatchingSubmit = () => {
        if (answered) return;

        const currentPairs = quizData[current].pairs;
        const allCorrect = Object.entries(currentPairs).every(
            ([left, correctRight]) => matchingAnswers[left] === correctRight
        );

        setAnswered(true);
        setAnsweredQuestions(prev => [...new Set([...prev, current])]);
        setTimes(ts => [...ts, (Date.now() - (questionStart ?? Date.now())) / 1000]);
        setQuestionStart(null);

        if (allCorrect) {
            setScore(s => s + 1);
        } else {
            setMistakes(m => m + 1);
            setWrongAnswers(ws => [...ws, { ...quizData[current], selected: matchingAnswers, questionIndex: current }]);
        }

        setShowExplanation(true);
    };

    // 6) Ripristina stato per nuova domanda
    const resetQuestion = () => {
        setSelected(null);
        setAnswered(false);
        setShowExplanation(false);
        setTimeLeft(60);
        setMatchingAnswers({});

    };

    // 7) Navigazione
    const goTo = (idx) => {
        const clamped = Math.min(Math.max(idx, 0), quizData.length);
        setCurrent(clamped);
        if (clamped < quizData.length) {
            if (answeredQuestions.includes(clamped)) {
                setAnswered(true);
                setShowExplanation(true);
                const wrong = wrongAnswers.find(w => w.questionIndex === clamped);
                setSelected(wrong ? wrong.selected : quizData[clamped]?.answer);
            } else {
                resetQuestion();
            }
        }
    };

    const prev = () => goTo(current - 1);
    const next = () => goTo(current + 1);
    const finishTest = () => goTo(quizData.length);

    // 8) Restart e Review
    const restartQuiz = () => {
        // Rimescola i dati per un nuovo quiz
        const shuffledData = [...quizDataRaw].sort(() => Math.random() - 0.5);
        // Resetta tutti gli stati
        // NOTA: Per semplicità qui non ricarico `quizData`, ma in un'app reale lo faresti.
        setStarted(false);
        setReviewMode(false);
        setCurrent(0);
        setScore(0);
        setMistakes(0);
        setWrongAnswers([]);
        setTimes([]);
        setAnsweredQuestions([]);
        resetQuestion();
    };

    const reviewErrors = () => setReviewMode(true);

    // Statistiche
    const avgTime = times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 0;
    const pctCorrect = quizData.length ? Math.round((score / quizData.length) * 100) : 0;

    // --- RENDER ---

    // Schermata Iniziale
    if (!started) {
        return (
            <ScreenWrapper>
                <h1 className="text-3xl font-bold mb-4">🧠 Quiz Sistemi Intelligenti  </h1>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 w-full"> {/* Aggiunta classi per responsività */}
                    <button onClick={() => setStarted(true)} className="btn btn-primary">
                        🚀 Inizia Quiz
                    </button>
                </div>
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
            </ScreenWrapper>
        );
    }

    // Schermata Revisione Errori
    if (reviewMode) {
        return (
            <ScreenWrapper>
                <h2 className="text-xl font-bold mb-4">📘 Revisione Errori</h2>
                <ul className="space-y-4 text-left">
                    {wrongAnswers.map((item, idx) => (
                        <li key={idx} className="explanation border-l-4 border-yellow-400 pl-4 bg-yellow-100 p-4 rounded-md">
                            <p className="font-semibold text-lg mb-2">❌ {item.question}</p>

                            {/* TRUE/FALSE */}
                            {item.type === 'truefalse' && (
                                <div className="space-y-1 mt-2">
                                    {Object.entries(item.statements || {}).map(([statement, correctAnswer], i) => {
                                        const userAnswer = item.selected?.[statement];
                                        const isCorrect = userAnswer === correctAnswer;

                                        return (
                                            <p key={i}>
                                                <strong>{statement}</strong>:
                                                <span className="ml-2">
                <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                  Tua risposta: {userAnswer ? 'Vero' : 'Falso'}
                </span>{' '}
                                                    — Corretta: {correctAnswer ? 'Vero' : 'Falso'}
              </span>
                                            </p>
                                        );
                                    })}
                                </div>
                            )}

                            {/* MATCHING */}
                            {item.type === 'matching' && (
                                <div className="space-y-1 mt-2">
                                    {Object.entries(item.pairs || {}).map(([left, correctRight], i) => {
                                        const userAnswer = item.selected?.[left];
                                        const isCorrect = userAnswer === correctRight;

                                        return (
                                            <p key={i}>
                                                <strong>{left}</strong>:
                                                <span className="ml-2">
                <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                  Tua risposta: {userAnswer || 'Nessuna'}
                </span>{' '}
                                                    — Corretta: {correctRight}
              </span>
                                            </p>
                                        );
                                    })}
                                </div>
                            )}

                            {/* MULTIPLA o fallback */}
                            {(!item.type || item.type === 'multiple') && (
                                <>
                                    <p><strong>Tua risposta:</strong> {item.selected || 'Nessuna'}</p>
                                    <p><strong>Corretta:</strong> <span className="text-green-600">{item.answer}</span></p>
                                </>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                    <button
                        onClick={() => {
                            restartQuiz(); // esegue la tua logica interna
                            window.location.reload(); // forza un vero reset di tutto
                        }}
                        className="btn btn-primary"
                    >
                        🔄 Ricomincia
                    </button>
                </div>
            </ScreenWrapper>
        );
    }

    // Schermata Finale
    if (current >= quizData.length) {
        return (
            <ScreenWrapper>
                <h2 className="text-3xl font-bold mb-2">🎉 Quiz Completo!</h2>
                <p>✅ Corrette: {score} ({pctCorrect}%)</p>
                <p>❌ Sbagliate: {mistakes}</p>
                <p>⏱️ Tempo medio: {avgTime}s/q</p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center"> {/* Aggiunta classi per responsività */}
                    <button onClick={restartQuiz} className="btn btn-primary">
                        🔁 Ricomincia
                    </button>
                    {wrongAnswers.length > 0 && (
                        <button onClick={reviewErrors} className="btn btn-secondary">
                            📘 Rivedi Errori
                        </button>
                    )}
                </div>
                <ThemeSwitcher theme={theme} setTheme={setTheme} />
            </ScreenWrapper>
        );
    }

    // Schermata Quiz Principale
    const item = quizData[current] || {};
    const pct = Math.round(((current + (answered ? 1 : 0)) / quizData.length) * 100);

    return (
        <ScreenWrapper>
            <ThemeSwitcher theme={theme} setTheme={setTheme} />

            {/* NUOVA Navigazione Domande */}
            <div className="question-nav-container">
                <div className="question-nav">
                    {quizData.map((_, i) => {
                        const isAnswered = answeredQuestions.includes(i);
                        const isWrong = wrongAnswers.some(w => w.questionIndex === i);
                        const isCorrect = isAnswered && !isWrong;
                        const isCurrent = i === current;

                        const pillClasses = [
                            'question-pill',
                            isCurrent && 'current',
                            isAnswered && 'answered',
                            isCorrect && 'correct',
                            isWrong && 'wrong',
                        ].filter(Boolean).join(' ');

                        return (
                            <button
                                key={i}
                                ref={isCurrent ? currentPillRef : null}
                                onClick={() => goTo(i)}
                                className={pillClasses}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            <span className="font-medium text-sm text-center block mb-2">
                Domanda {current + 1} / {quizData.length}
            </span>

            <div className="progress-bg mb-4">
                <div className="progress-fg" style={{ width: `${pct}%` }} />
            </div>

            <div className="counter mb-4">
                <span>✔️ {score}</span>
                <span>❌ {mistakes}</span>
                <span>⏳ {timeLeft}s</span>
            </div>

            <h2 className="text-center text-lg font-medium mb-6">{item.question}</h2>

            <div className="space-y-3 mb-6">
                {/* DOMANDE A SCELTA MULTIPLA */}
                {item.type !== 'matching' && item.type !== 'truefalse' && shuffledOptions.map(opt => {
                    const isCorrect = opt === item.answer;
                    const isSelectedWrong = selected === opt && !isCorrect;

                    return (
                        <button
                            key={opt}
                            onClick={() => handleAnswer(opt)}
                            disabled={answered}
                            className={`btn-answer ${answered && isCorrect ? 'correct' : ''} ${answered && isSelectedWrong ? 'wrong' : ''}`}
                        >
                            {opt}
                        </button>
                    );
                })}

                {/* DOMANDE MATCHING */}
                {item.type === 'matching' && (
                    <div className="matching-question space-y-4">
                        {Object.entries(item.pairs).map(([left, correctRight], idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/20 p-3 rounded-xl">
                                <span className="font-medium w-full sm:w-1/2">{left}</span>
                                {answered ? (
                                    <div className="w-full sm:w-1/2 space-y-1">
                                        <div
                                            className={`text-sm font-bold ${
                                                matchingAnswers[left] === correctRight ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
      <span className="block">
        <strong>Tua risposta:</strong> {matchingAnswers[left] || 'Nessuna risposta'}
      </span>
                                        </div>
                                        {matchingAnswers[left] !== correctRight && (
                                            <div className="text-sm text-gray-700">
                                                <strong>Corretta:</strong> {correctRight}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <select
                                        value={matchingAnswers[left] || ''}
                                        onChange={(e) => setMatchingAnswers(ans => ({ ...ans, [left]: e.target.value }))}
                                        className="custom-select"
                                    >
                                        <option value="" disabled>Seleziona</option>
                                        {Object.values(item.pairs).map((opt, i) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* DOMANDE TRUE/FALSE */}
                {item.type === 'truefalse' && (
                    <div className="truefalse-question space-y-2">
                        {Object.entries(item.statements).map(([statement, correctValue], idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/20 p-4 rounded-xl">
                                {/* La frase */}
                                <p className="font-medium w-full sm:w-2/3">{statement}</p>

                                {/* I pulsanti Vero / Falso */}
                                <div className="flex gap-2 w-full sm:w-1/3 justify-end">
                                    {['Vero', 'Falso'].map((label) => {
                                        const expectedValue = label === 'Vero';
                                        const userAnswer = trueFalseAnswers[statement];
                                        const selected = userAnswer === expectedValue;
                                        const correct = correctValue === expectedValue;

                                        let className = 'truefalse-btn'; // base class per tutti

                                        if (answered) {
                                            if (selected && correct) className += ' answered-correct-selected';
                                            else if (selected && !correct) className += ' answered-incorrect-selected';
                                            else if (!selected && correct) className += ' answered-correct-notselected';
                                            else className += ' answered-unselected';
                                        } else {
                                            className += selected ? ' preselected' : ' unselected';
                                        }

                                        return (
                                            <button
                                                key={label}
                                                onClick={() => handleTrueFalseAnswer(statement, expectedValue)}
                                                className={className}
                                                disabled={answered}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Feedback risposta */}
                                {answered && (
                                    <div className="w-full sm:w-full text-sm mt-2 sm:mt-0 text-right">
                                        <strong>Risposta data:</strong>{' '}
                                        {trueFalseAnswers[statement] === undefined
                                            ? 'Nessuna'
                                            : trueFalseAnswers[statement]
                                                ? 'Vero'
                                                : 'Falso'}
                                        <br />
                                        <span
                                            className={
                                                correctValue === trueFalseAnswers[statement]
                                                    ? 'text-green-400 font-semibold'
                                                    : 'text-red-400 font-semibold'
                                            }
                                        >
          {correctValue === trueFalseAnswers[statement]
              ? '✓ Corretta'
              : '✗ Errata'}
        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showExplanation && (
                <motion.div
                    className="explanation mb-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <strong>Spiegazione:</strong> {item.explanation}
                </motion.div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">

                {/* Bottone Conferma per True/False */}
                {!answered && item.type === 'truefalse' &&
                    Object.keys(trueFalseAnswers).length === Object.keys(item.statements).length && (
                        <button
                            onClick={handleTrueFalseSubmit}
                            className="btn btn-primary"
                        >
                            ✅ Conferma Risposte
                        </button>
                    )}

                {/* Bottone Conferma per Matching */}
                {!answered && item.type === 'matching' && (
                    <button
                        onClick={handleMatchingSubmit}
                        className="btn btn-primary"
                    >
                        ✅ Conferma Risposte
                    </button>
                )}

                {/* Bottone Termina */}
                <button onClick={finishTest} className="btn btn-danger">
                    🔴 Termina
                </button>

                {/* Bottone Prossima/Vai ai Risultati */}
                {showExplanation && current < quizData.length - 1 && (
                    <button onClick={next} className="btn btn-primary">
                        Prossima ➡️
                    </button>
                )}
                {showExplanation && current === quizData.length - 1 && (
                    <button onClick={finishTest} className="btn btn-primary">
                        Vai ai Risultati
                    </button>
                )}
            </div>
        </ScreenWrapper>
    );
}

// Wrapper per le schermate
function ScreenWrapper({ children }) {
    return (
        <motion.div
            className="card w-full max-w-2xl" // max-w-2xl si comporterà bene con le media query che abbiamo in App.css
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}

// Selettore Tema
function ThemeSwitcher({ theme, setTheme }) {
    return (
        <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="theme-switcher"
            aria-label="Cambia tema"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
}