import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Map from '../components/Map';
import './game.css';
import { String } from 'aws-sdk/clients/cloudtrail';

const startYear = 1960;
const endYear = new Date().getFullYear();

export default function Game() {
    const [round, setRound] = useState(0);
    const [result, setResult] = useState('');
    const router = useRouter();

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

    const [userGuessLocation, setUserGuessLocation] = useState<{
        lat: number | null,
        lng: number | null
    }>({
        lat: null,
        lng: null
    });

    const [year, setYear] = useState(endYear);
    const [gameLink, setGameLink] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let folderNameParam = params.get('folderName');
        let randomIndexesParam = JSON.stringify(params.get('5_indexes'));

        if (folderNameParam && randomIndexesParam) {
            folderNameParam = folderNameParam.replace(/"/g, '');
            randomIndexesParam = randomIndexesParam.replace(/"/g, '');
            localStorage.setItem('5_indexes', randomIndexesParam);
            localStorage.setItem('folderName', folderNameParam);
            localStorage.removeItem('round');
            localStorage.removeItem('gameLink');
        }

        let link: String;

        if (localStorage.getItem('gameLink')) {
            link = localStorage.getItem('gameLink')!;
        } else {
            const generateGameLink = () => {
                let folderName, randomIndexes;

                if (folderNameParam && randomIndexesParam) {
                    folderName = folderNameParam;
                    randomIndexes = randomIndexesParam;
                } else {
                    folderName = localStorage.getItem('folderName') || '';
                    randomIndexes = localStorage.getItem('5_indexes') || '';
                }

                const newParams = new URLSearchParams({
                    folderName: JSON.stringify(folderName),
                    '5_indexes': randomIndexes,
                });

                return `${window.location.origin}${window.location.pathname}?${newParams.toString()}`;
            };

            link = generateGameLink();
        }

        setGameLink(link);
        localStorage.setItem('gameLink', link);
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(gameLink);
    };

    useEffect(() => {
        const storedRound = localStorage.getItem('round');
        let roundNumber = storedRound ? parseInt(storedRound) : 1;

        if (roundNumber > 10) {
            roundNumber = 1;
        }

        setRound(roundNumber);

        if (roundNumber === 1) {
            localStorage.removeItem('scores');
        }
    }, []);

    const loadNewImage = async () => {
        const folderName = localStorage.getItem('folderName') || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/python/images?folderName=${folderName}`);
        const images = await res.json();

        let randomIndexes = [];
        const storedIndexes = localStorage.getItem('5_indexes');
        randomIndexes = storedIndexes ? JSON.parse(storedIndexes) : [];

        const shownImagesItem = localStorage.getItem('shownImages');
        let shownImages = shownImagesItem ? new Set(JSON.parse(shownImagesItem)) : new Set();

        const currentIndex = round - 1;

        if (randomIndexes.length === 0) {
            randomIndexes = [];

            let allIndexes = Array.from({ length: images.length }, (_, i) => i);

            for (let i = allIndexes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIndexes[i], allIndexes[j]] = [allIndexes[j], allIndexes[i]];
            }

            for (let i = 0; randomIndexes.length < 10; i++) {
                if (shownImages.size === images.length) {
                    shownImages.clear();
                }

                if (i >= allIndexes.length) {
                    i = 0;
                }

                if (!shownImages.has(allIndexes[i])) {
                    randomIndexes.push(allIndexes[i]);
                    shownImages.add(allIndexes[i]);
                }
            }

            if (shownImages.size < 10) {
                shownImages.clear();
                randomIndexes.forEach((index: Number) => shownImages.add(index));
            }

            localStorage.setItem('shownImages', JSON.stringify(Array.from(shownImages)));
            localStorage.setItem('5_indexes', JSON.stringify(randomIndexes));

            const folderName = localStorage.getItem('folderName') || '';

            const newParams = new URLSearchParams({
                folderName: JSON.stringify(folderName),
                '5_indexes': JSON.stringify(randomIndexes)
            });

            const link = `${window.location.origin}${window.location.pathname}?${newParams.toString()}`;
            setGameLink(link);
            localStorage.setItem('gameLink', link);
        }

        const newImageIndex = randomIndexes[currentIndex];
        const newImage = images[newImageIndex];

        localStorage.setItem('currentImage', JSON.stringify(newImage));
        setCurrentImage(newImage);
    };

    useEffect(() => {
        if (round === 0) {
            return;
        }

        loadNewImage();
        localStorage.removeItem('scoreAdded');
    }, [round]);

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setYear(Number(event.target.value));
    };

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setYear(Number(event.target.value));
    };

    const checkGuess = (e: React.FormEvent) => {
        e.preventDefault();

        if (userGuessLocation.lat === null || userGuessLocation.lng === null) {
            console.log('No location selected');
            return;
        }

        const correctLocation = {
            lat: currentImage.lat,
            lng: currentImage.lng
        };

        const correctTime = currentImage.time ? new Date(currentImage.time) : null;

        if (correctLocation.lat === null || correctLocation.lng === null || correctTime === null) {
            console.log('Correct location or time is null');
            return;
        }

        const correctYear = correctTime.getFullYear();
        const yearDiff = Math.abs(correctYear - year);

        const R = 3958.8;
        const dLat = (correctLocation.lat - userGuessLocation.lat) * Math.PI / 180;
        const dLng = (correctLocation.lng - userGuessLocation.lng) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userGuessLocation.lat * Math.PI / 180) *
            Math.cos(correctLocation.lat * Math.PI / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const resultString =
            `Guess: ${userGuessLocation.lat}, ${userGuessLocation.lng} in ${year} ` +
            `Answer: ${correctLocation.lat}, ${correctLocation.lng} in ${correctYear} ` +
            `Error: ${distance.toFixed(2)} miles, ${yearDiff} years.`;

        setResult(resultString);

        localStorage.setItem('round', (round + 1).toString());
        router.push(`/results?result=${encodeURIComponent(resultString)}`);
    };

    return (
        <main style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Round {round} of 10</h2>
                <button className="copy-link-button" onClick={copyToClipboard}>Copy Game Link</button>
            </div>

            <div>
                {currentImage && currentImage.url && (
                    <div className="game-image-container">
                        <Image
                            src={currentImage.url || ''}
                            alt="Game Image"
                            fill
                            sizes="(max-width: 768px) 100vw, 45vw"
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                )}
            </div>

            <form onSubmit={checkGuess}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div className="map-container">
                        <Map setGuessLocation={setUserGuessLocation} />
                    </div>

                    <div className="game-controls">
                        <div className="time-container">
                            <input
                                type="range"
                                min={startYear}
                                max={endYear}
                                value={year}
                                onChange={handleSliderChange}
                                style={{ width: '90%' }}
                            />

                            <div>
                                <select value={year.toString()} onChange={handleYearChange} className="bigger-dropdown">
                                    {Array.from(
                                        { length: endYear - startYear + 1 },
                                        (_, i) => endYear - i
                                    ).map((value) => (
                                        <option key={value} value={value}>
                                            {value}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="button-container">
                            <button type="submit" className="guess-button">Guess</button>
                        </div>
                    </div>
                </div>
            </form>
        </main>
    );
}
