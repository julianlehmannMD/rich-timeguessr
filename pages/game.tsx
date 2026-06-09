import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Map from '../components/Map';
import './game.css';
import { String } from 'aws-sdk/clients/cloudtrail';

// Define the start and end dates
const startDate = new Date('1960-04-08').getTime();
const endDate = new Date().getTime();
const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

export default function Game() {
    const [round, setRound] = useState(0);
    const [result, setResult] = useState('');
    const router = useRouter();
    const [currentImage, setCurrentImage] = useState<{ file: string, lat: number | null, lng: number | null, time: string | null, url: string | null }>({ file: '', lat: null, lng: null, time: null, url: null});
    const [userGuessLocation, setUserGuessLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
    const [userGuessTime, setUserGuessTime] = useState(new Date());
    const [month, setMonth] = useState(userGuessTime.getMonth());
    const [day, setDay] = useState(userGuessTime.getDate());
    const [year, setYear] = useState(userGuessTime.getFullYear());
    const [gameLink, setGameLink] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let folderNameParam = params.get('folderName');
        let randomIndexesParam = JSON.stringify(params.get('5_indexes'));
        if(folderNameParam && randomIndexesParam){
            folderNameParam = folderNameParam.replace(/"/g, '');
            randomIndexesParam = randomIndexesParam.replace(/"/g, '');
            localStorage.setItem('5_indexes', randomIndexesParam);
            localStorage.setItem('folderName', folderNameParam);
            localStorage.removeItem('round');
            localStorage.removeItem('gameLink');
        }   
        let link: String;
        if(localStorage.getItem('gameLink')){
            link = localStorage.getItem('gameLink')!;
        }
        else{
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
                    'folderName': JSON.stringify(folderName),
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
        var roundNumber = storedRound ? parseInt(storedRound) : 1;
        if(roundNumber > 5) {
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

       // If randomIndexes is empty or all indexes have been used, generate a new group of 5 random indexes
        if (randomIndexes.length === 0) {
            randomIndexes = [];
            // Generate a list of all possible indexes
            let allIndexes = Array.from({ length: images.length }, (_, i) => i);
            // Shuffle the list
            for (let i = allIndexes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIndexes[i], allIndexes[j]] = [allIndexes[j], allIndexes[i]];
            }
            // Take the first 5 indexes that are not in shownImages
            for (let i = 0; randomIndexes.length < 5; i++) {
                if(shownImages.size == images.length){
                    shownImages.clear();
                }
                if(i >= allIndexes.length){
                    i = 0;
                }
                if (!shownImages.has(allIndexes[i])) {
                    randomIndexes.push(allIndexes[i]);
                    shownImages.add(allIndexes[i]);
                }
            }
            if(shownImages.size < 5){
                shownImages.clear();
                randomIndexes.forEach((index: Number) => shownImages.add(index));
            }
            localStorage.setItem('shownImages', JSON.stringify(Array.from(shownImages)));
            localStorage.setItem('5_indexes', JSON.stringify(randomIndexes));

            let folderName = localStorage.getItem('folderName') || '';
            const newParams = new URLSearchParams({
                'folderName': JSON.stringify(folderName),
                '5_indexes': JSON.stringify(randomIndexes)
            });
            let link = `${window.location.origin}${window.location.pathname}?${newParams.toString()}`;
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

    const handleSliderChange = (value: number) => {
        const newGuessTime = new Date(startDate + value * 24 * 60 * 60 * 1000);
        setUserGuessTime(newGuessTime);
        setMonth(newGuessTime.getMonth());
        setDay(newGuessTime.getDate());
        setYear(newGuessTime.getFullYear());
    };
    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = Number(event.target.value);
        const newGuessTime = new Date(userGuessTime.setMonth(newMonth));
        setUserGuessTime(newGuessTime);
        setMonth(newMonth);
    };
    const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newDay = Number(event.target.value);
        const newGuessTime = new Date(userGuessTime.setDate(newDay));
        setUserGuessTime(newGuessTime);
        setDay(newDay);
    };
    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = Number(event.target.value);
        const newGuessTime = new Date(userGuessTime.setFullYear(newYear));
        setUserGuessTime(newGuessTime);
        setYear(newYear);
    };

    // Function to check the user's guess
    const checkGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (userGuessLocation.lat === null || userGuessLocation.lng === null) {
            console.log('No location selected');
            return;
        }

        // Correct location and time
        const correctLocation = { lat: currentImage.lat, lng: currentImage.lng };
        const correctTime = currentImage.time ? new Date(currentImage.time) : null;

        if (correctLocation.lat === null || correctLocation.lng === null || correctTime === null) {
            console.log('Correct location or time is null');
            return;
        }

        const R = 3958.8; // Radius of the Earth in miles
        const dLat = (correctLocation.lat - userGuessLocation.lat) * Math.PI / 180;
        const dLng = (correctLocation.lng - userGuessLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userGuessLocation.lat * Math.PI / 180) * Math.cos(correctLocation.lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Calculate the difference in days
        userGuessTime.setDate(userGuessTime.getDate());
        correctTime.setHours(0, 0, 0, 0);
        userGuessTime.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(correctTime.getTime() - userGuessTime.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const resultString = `Guess: ${userGuessLocation.lat}, ${userGuessLocation.lng} on ${userGuessTime.toDateString()} Answer: ${correctLocation.lat}, ${correctLocation.lng} on ${correctTime.toDateString()} Error: ${distance.toFixed(2)} miles, ${diffDays} days.`;        
        setResult(resultString);
        
        localStorage.setItem('round', (round + 1).toString());
        router.push(`/results?result=${encodeURIComponent(resultString)}`);
    };
    
    return (
        <main style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Round {round} of 5</h2>
                <button className="copy-link-button" onClick={copyToClipboard}>Copy Game Link</button>
            </div>
            <div>
                {currentImage && currentImage.url && (
                    <div style={{ position: 'relative', width: '45vw', height: '45vh' }}>
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
            <form 
                onSubmit={checkGuess} 
            >
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div className="map-container">
                        <Map setGuessLocation={setUserGuessLocation} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '32vh' }}>
                        <div className="time-container">
                        <input
                            type="range"
                            min="0"
                            max={totalDays}
                            value={(userGuessTime.getTime() - startDate) / (24 * 60 * 60 * 1000)}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleSliderChange(Number(event.target.value))}
                            style={{ width: '90%' }}
                            />
                            <div>
                                <select value={month} onChange={handleMonthChange} className="bigger-dropdown">
                                    {Array.from({ length: 12 }, (_, i) => i).map((_, i) => (
                                    <option key={i} value={i}>
                                        {new Date(year, i, 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                    ))}
                                </select>
                                <select value={day} onChange={handleDayChange} className="bigger-dropdown">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                    ))}
                                </select>
                                <select value={year.toString()} onChange={handleYearChange} className="bigger-dropdown">
                                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((value) => (
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
