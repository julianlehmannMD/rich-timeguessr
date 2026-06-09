import { useRouter } from 'next/router';
import Link from 'next/link';
import Map from '../components/ResultsMap';
import { useEffect, useState } from 'react';
import './game.css';

function Results() {
    const [currentImage, setCurrentImage] = useState<{
        file: string,
        lat: number | null,
        lng: number | null,
        time: string | null,
        url: string | null
    }>({
        file: '',
        lat: null,
        lng: null,
        time: null,
        url: null
    });

    useEffect(() => {
        const storedImage = localStorage.getItem('currentImage');
        if (storedImage) {
            setCurrentImage(JSON.parse(storedImage));
        }
    }, []);

    const [round, setRound] = useState(1);

    useEffect(() => {
        const storedRound = localStorage.getItem('round');
        const roundNumber = storedRound ? parseInt(storedRound) : 1;
        setRound(roundNumber);
    }, []);

    const router = useRouter();
    const result = decodeURIComponent(router.query.result as string);

    const words = result.split(' ');

    const userLat = parseFloat(words[1]);
    const userLng = parseFloat(words[2]);
    const userYear = parseInt(words[4]);

    const correctLat = parseFloat(words[7]);
    const correctLng = parseFloat(words[8]);
    const correctYear = parseInt(words[10]);

    const distanceErr = parseFloat(words[12]);
    const yearErr = parseInt(words[14]);

    const maxScore = 500;

    // Relaxed party-friendly scoring
    const maxDistanceError = 4000; // miles
    const maxYearError = 30;       // years

    const distanceScore = Math.round(
        Math.max(0, maxScore - (distanceErr / maxDistanceError) * maxScore)
    );

    const timeScore = Math.round(
        Math.max(0, maxScore - (yearErr / maxYearError) * maxScore)
    );

    const totalScore = distanceScore + timeScore;

    useEffect(() => {
        const storedScores = localStorage.getItem('scores');
        const scores = storedScores ? JSON.parse(storedScores) : [];
        const scoreAdded = localStorage.getItem('scoreAdded');

        if (!scoreAdded) {
            scores.push(totalScore);
            localStorage.setItem('scores', JSON.stringify(scores));
            localStorage.setItem('scoreAdded', 'true');
        }
    }, [totalScore]);

    return (
        <main style={{ padding: '20px' }}>
            <h2>Round {round - 1} Results</h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ fontSize: '28px', marginBottom: '0.5em' }}>
                    <strong>Score: </strong>{totalScore}/{2 * maxScore}
                </p>
                <progress value={totalScore} max={2 * maxScore} style={{ width: '50%', height: '36px' }}></progress>
            </div>

            <div className="results-div">
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '36px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {currentImage && currentImage.url && (
                            <div style={{ position: 'relative', width: '45vw', height: '45vh' }}>
                                <img
                                    src={currentImage.url || ''}
                                    alt="Game Image"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                        )}

                        <p style={{ fontSize: '24px' }}>
                            You were <strong>{yearErr} years</strong> off, {timeScore}/{maxScore} pts
                        </p>

                        <p style={{ fontSize: '20px' }}>
                            Guessed: {userYear}
                            <span style={{ marginLeft: '2em' }}>Actual: {correctYear}</span>
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Map userLat={userLat} userLng={userLng} correctLat={correctLat} correctLng={correctLng} />

                        <p style={{ fontSize: '24px' }}>
                            You were <strong>{distanceErr} miles</strong> away, {distanceScore}/{maxScore} pts
                        </p>
                    </div>
                </div>

                <div style={{ position: 'fixed', right: '20px', bottom: '20px', padding: '10px' }}>
                    {round <= 5 ? (
                        <Link
                            href="/game"
                            style={{ fontSize: '24px' }}
                            onClick={() => localStorage.removeItem('currentImage')}
                        >
                            Next Round
                        </Link>
                    ) : (
                        <Link
                            href="/overallResults"
                            style={{ fontSize: '24px' }}
                            onClick={() => localStorage.removeItem('currentImage')}
                        >
                            Overall Results
                        </Link>
                    )}
                </div>
            </div>
        </main>
    );
}

export default Results;
