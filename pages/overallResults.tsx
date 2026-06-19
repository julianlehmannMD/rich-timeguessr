import { useEffect, useState } from 'react';
import Link from 'next/link';
import './game.css';

function OverallResults() {
    const [totalScore, setTotalScore] = useState(0);
    const [gameLink, setGameLink] = useState('');

    useEffect(() => {
        const storedLink = localStorage.getItem('gameLink');
        setGameLink(storedLink || '');
    }, []);

    useEffect(() => {
        const storedScores = localStorage.getItem('scores');
        const scores = storedScores ? JSON.parse(storedScores) : [];
        const sum = scores.reduce((a: number, b: number) => a + b, 0);
        setTotalScore(sum);
    }, []);

    const newGame = () => {
        localStorage.setItem('round', '1');
        localStorage.removeItem('5_indexes');
        localStorage.removeItem('currentImage');
        localStorage.removeItem('gameLink');
    };
    const copyLink = () => {
        navigator.clipboard.writeText(gameLink);
    }

    return (
        <div style={{padding: '10px'}}>
            <h2>Overall Results</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <p style={{ fontSize: '32px' }}>You scored <strong>{totalScore}</strong> out of 10000</p>
                <progress value={totalScore} max={10000} style={{ height: '50px', width: '80%' }}></progress>
            </div>
           <div style={{ marginTop: '10px', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <Link href="/game" onClick={newGame} style={{ fontSize: '24px' }}>
                    New Game
                </Link>
                <Link href="/" onClick={newGame} style={{ fontSize: '24px' }}>
                    Home
                </Link>
                <button onClick={copyLink} style={{ fontSize: '16px' }}>
                    Copy Game Link
                </button>
            </div>
        </div>
    );
}

export default OverallResults;
