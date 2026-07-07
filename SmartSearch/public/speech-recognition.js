// Check for browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    document.getElementById('status').textContent = 
        'Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
    document.getElementById('status').className = 'status error';
    document.getElementById('startBtn').disabled = true;
} else {
    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    let isRecognizing = false;
    let finalTranscript = '';

    // DOM Elements
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const output = document.getElementById('output');
    const status = document.getElementById('status');
    const languageSelect = document.getElementById('languageSelect');
    const continuousMode = document.getElementById('continuousMode');
    const searchInput = document.getElementById('searchInput');
    const textSearchBtn = document.getElementById('textSearchBtn');

    // Configure Recognition
    function configureRecognition() {
        recognition.continuous = continuousMode.checked;
        recognition.interimResults = true;
        recognition.lang = languageSelect.value;
        recognition.maxAlternatives = 1;
    }

    // Update Status
    function updateStatus(message, type = 'info') {
        status.textContent = message;
        status.className = `status ${type}`;
    }

    // Update Output
    function updateOutput(text) {
        if (text.trim()) {
            output.textContent = text;
            output.classList.remove('empty');
        } else {
            output.textContent = 'Your speech will appear here...';
            output.classList.add('empty');
        }
    }

    // Start Recording
    startBtn.addEventListener('click', () => {
        configureRecognition();
        
        try {
            recognition.start();
            isRecognizing = true;
            startBtn.classList.add('listening');
            startBtn.textContent = '🎙️ Listening...';
            startBtn.disabled = true;
            stopBtn.disabled = false;
            updateStatus('Listening... Speak now!', 'listening');
        } catch (error) {
            console.error('Error starting recognition:', error);
            updateStatus('Error starting recognition. Please try again.', 'error');
        }
    });

    // Stop Recording
    stopBtn.addEventListener('click', () => {
        recognition.stop();
        isRecognizing = false;
        startBtn.classList.remove('listening');
        startBtn.textContent = 'Start Recording';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        updateStatus('Recording stopped.', 'success');
    });

    // Clear Text
    clearBtn.addEventListener('click', () => {
        finalTranscript = '';
        updateOutput('');
        updateStatus('Text cleared. Ready to start.', 'info');
    });

    // Copy Text
    copyBtn.addEventListener('click', () => {
        const text = output.textContent;
        if (text && text !== 'Your speech will appear here...') {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✓ Copied!';
                copyBtn.style.background = '#2e7d32';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.style.background = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text:', err);
                updateStatus('Failed to copy text', 'error');
            });
        }
    });

    // Recognition Events
    recognition.onstart = () => {
        console.log('Speech recognition started');
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
                
                // Check for greeting words (hi, hello, hey)
                checkForGreeting(transcript);
                
                // Check for inappropriate language
                checkForProfanity(transcript);
                
                // Check for positive words
                checkForPositiveWords(transcript);
                
                // Check for search queries
                checkForSearch(transcript);
            } else {
                interimTranscript += transcript;
            }
        }

        // Display both final and interim results
        const displayText = finalTranscript + interimTranscript;
        updateOutput(displayText);
        
        if (event.results[event.results.length - 1].isFinal) {
            updateStatus('Processing... Keep speaking!', 'listening');
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'An error occurred: ';
        switch (event.error) {
            case 'no-speech':
                errorMessage += 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage += 'No microphone found. Please ensure microphone is connected.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone permission denied. Please allow microphone access.';
                break;
            case 'network':
                errorMessage += 'Network error occurred. Please check your connection.';
                break;
            default:
                errorMessage += event.error;
        }
        
        updateStatus(errorMessage, 'error');
        
        // Reset buttons
        isRecognizing = false;
        startBtn.classList.remove('listening');
        startBtn.textContent = 'Start Recording';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    };

    recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // If continuous mode is on and we're still supposed to be recognizing
        if (continuousMode.checked && isRecognizing) {
            try {
                recognition.start();
            } catch (error) {
                console.error('Error restarting recognition:', error);
                isRecognizing = false;
                startBtn.classList.remove('listening');
                startBtn.textContent = 'Start Recording';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                updateStatus('Recording stopped.', 'info');
            }
        } else {
            isRecognizing = false;
            startBtn.classList.remove('listening');
            startBtn.textContent = 'Start Recording';
            startBtn.disabled = false;
            stopBtn.disabled = true;
            
            if (finalTranscript.trim()) {
                updateStatus('Recording complete!', 'success');
            } else {
                updateStatus('Ready to start. Click "Start Recording" to begin.', 'info');
            }
        }
    };

    // Update recognition settings when language changes
    languageSelect.addEventListener('change', () => {
        if (isRecognizing) {
            recognition.stop();
            updateStatus('Language changed. Click Start to resume with new language.', 'info');
        }
    });

    // Update recognition settings when continuous mode changes
    continuousMode.addEventListener('change', () => {
        if (isRecognizing) {
            recognition.stop();
            updateStatus('Mode changed. Click Start to resume.', 'info');
        }
    });

    // Text Search Functionality
    textSearchBtn.addEventListener('click', () => {
        performTextSearch();
    });

    // Allow Enter key to trigger search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performTextSearch();
        }
    });

    async function performTextSearch() {
        const searchQuery = searchInput.value.trim();
        
        if (!searchQuery) {
            updateStatus('Please enter a search term', 'error');
            return;
        }

        // Check for profanity before searching
        if (checkForProfanity(searchQuery)) {
            searchInput.value = ''; // Clear the input
            updateStatus('Search blocked due to inappropriate language', 'error');
            return;
        }

        console.log('🔍 Text search triggered for:', searchQuery);
        updateStatus('Searching database...', 'info');
        
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const result = await response.json();
            
            if (response.ok) {
                showSearchResult(result.data, result.timeMs, result.source);
                updateStatus(`Found information about "${searchQuery}" (Speed: ${result.timeMs}ms)`, 'success');
                searchInput.value = ''; // Clear the search input
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            updateStatus(`No information found for "${searchQuery}". Try: Wrangell, Douglas Hwy, etc.`, 'error');
            
            // Show available keywords hint
            setTimeout(() => {
                updateStatus('Try searching: 117 3rd St, Wrangell, Mendenhall Loop, Douglas Hwy', 'info');
            }, 3000);
        }
    }
}

// Panda Greeting Functions
let pandaTimeout;

function checkForGreeting(text) {
    const lowerText = text.toLowerCase().trim();
    const greetings = ['hi', 'hello', 'hey', 'hii', 'hiii', 'helo', 'hola', 'namaste'];
    
    // Check if any greeting word is present
    const hasGreeting = greetings.some(greeting => {
        // Match whole word or at the start/end with punctuation
        const regex = new RegExp(`(^|\\s|[.,!?])${greeting}($|\\s|[.,!?])`, 'i');
        return regex.test(lowerText);
    });
    
    if (hasGreeting) {
        showPanda(lowerText);
    }
}

function showPanda(greetingText) {
    const pandaContainer = document.getElementById('pandaContainer');
    const pandaSpeech = document.getElementById('pandaSpeech');
    
    // Determine response based on greeting
    let response = 'Hi! 👋';
    if (greetingText.includes('hello')) {
        response = 'Hello! 🐼';
    } else if (greetingText.includes('hey')) {
        response = 'Hey there! 😊';
    } else if (greetingText.includes('hola')) {
        response = '¡Hola! 🎉';
    } else if (greetingText.includes('namaste')) {
        response = 'Namaste! 🙏';
    }
    
    pandaSpeech.textContent = response;
    pandaContainer.classList.add('show');
    
    // Clear any existing timeout
    if (pandaTimeout) {
        clearTimeout(pandaTimeout);
    }
    
    // Auto-hide after 5 seconds
    pandaTimeout = setTimeout(() => {
        hidePanda();
    }, 5000);
}

function hidePanda() {
    const pandaContainer = document.getElementById('pandaContainer');
    pandaContainer.classList.remove('show');
    
    if (pandaTimeout) {
        clearTimeout(pandaTimeout);
    }
}

// Make hidePanda available globally for the close button
window.hidePanda = hidePanda;

// Profanity Filter Functions
let warningTimeout;
let lastWarningIndex = -1;

function checkForProfanity(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Use profanity list from profanity-list.js
    const profanityList = typeof profanityWords !== 'undefined' ? profanityWords : [];
    
    // Check if any profanity is present
    let detectedWords = [];
    profanityList.forEach(word => {
        const regex = new RegExp(`(^|\\s|[.,!?])${word}($|s?\\s|[.,!?])`, 'i');
        if (regex.test(lowerText)) {
            detectedWords.push(word);
        }
    });
    
    if (detectedWords.length > 0) {
        showWarningMessage(detectedWords);
        return true;
    }
    return false;
}

function showWarningMessage(detectedWords = []) {
    const warningContainer = document.getElementById('warningContainer');
    const warningTitle = warningContainer.querySelector('.popup-title');
    const warningText = warningContainer.querySelector('.warning-text');
    
    // Get random warning message (different from last one)
    const messages = typeof warningMessages !== 'undefined' ? warningMessages : [
        {
            title: "Please Be Respectful!",
            text: "Please don't use inappropriate language. Let's keep this a friendly space! 🙏"
        }
    ];
    
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * messages.length);
    } while (randomIndex === lastWarningIndex && messages.length > 1);
    
    lastWarningIndex = randomIndex;
    const selectedMessage = messages[randomIndex];
    
    // Update warning content
    warningTitle.textContent = selectedMessage.title;
    warningText.textContent = selectedMessage.text;
    
    // Log detected words to console (for admin/debugging)
    if (detectedWords.length > 0) {
        console.warn('⚠️ Inappropriate language detected:', detectedWords.join(', '));
    }
    
    // Show warning
    warningContainer.classList.add('show');
    
    // Clear any existing timeout
    if (warningTimeout) {
        clearTimeout(warningTimeout);
    }
    
    // Auto-hide after 5 seconds
    warningTimeout = setTimeout(() => {
        hideWarning();
    }, 5000);
}

function hideWarning() {
    const warningContainer = document.getElementById('warningContainer');
    warningContainer.classList.remove('show');
    
    if (warningTimeout) {
        clearTimeout(warningTimeout);
    }
}

// Make hideWarning available globally for the close button
window.hideWarning = hideWarning;

// Positive Words Filter Functions
let positiveTimeout;
let lastPositiveIndex = -1;

function checkForPositiveWords(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Use positive words list from profanity-list.js
    const positiveList = typeof positiveWords !== 'undefined' ? positiveWords : [];
    
    // Check if any positive word is present
    let detectedPositiveWords = [];
    positiveList.forEach(word => {
        const regex = new RegExp(`(^|\\s|[.,!?])${word}($|s?\\s|[.,!?])`, 'i');
        if (regex.test(lowerText)) {
            detectedPositiveWords.push(word);
        }
    });
    
    if (detectedPositiveWords.length > 0) {
        showPositiveMessage(detectedPositiveWords);
    }
}

function showPositiveMessage(detectedWords = []) {
    const positiveContainer = document.getElementById('positiveContainer');
    const positiveEmoji = document.getElementById('positiveEmoji');
    const positiveTitle = document.getElementById('positiveTitle');
    const positiveText = document.getElementById('positiveText');
    
    // Get random positive message (different from last one)
    const messages = typeof positiveMessages !== 'undefined' ? positiveMessages : [
        {
            title: "That's Wonderful! 🌟",
            text: "Your positive energy is amazing! Keep spreading the joy! ✨",
            emoji: "😊"
        }
    ];
    
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * messages.length);
    } while (randomIndex === lastPositiveIndex && messages.length > 1);
    
    lastPositiveIndex = randomIndex;
    const selectedMessage = messages[randomIndex];
    
    // Update positive message content
    positiveEmoji.textContent = selectedMessage.emoji;
    positiveTitle.textContent = selectedMessage.title;
    positiveText.textContent = selectedMessage.text;
    
    // Log detected positive words to console (for tracking positivity!)
    if (detectedWords.length > 0) {
        console.log(' Positive words detected:', detectedWords.join(', '));
    }
    
    // Show positive message
    positiveContainer.classList.add('show');
    
    // Clear any existing timeout
    if (positiveTimeout) {
        clearTimeout(positiveTimeout);
    }
    
    // Auto-hide after 5 seconds
    positiveTimeout = setTimeout(() => {
        hidePositive();
    }, 5000);
}

function hidePositive() {
    const positiveContainer = document.getElementById('positiveContainer');
    positiveContainer.classList.remove('show');
    
    if (positiveTimeout) {
        clearTimeout(positiveTimeout);
    }
}

// Make hidePositive available globally for the close button
window.hidePositive = hidePositive;

// Search Functionality
async function checkForSearch(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Get search triggers from search-database.js
    const triggers = typeof searchTriggers !== 'undefined' ? searchTriggers : ['search', 'find', 'who is', 'tell me about'];
    
    // Check if text contains any search trigger
    const triggerWords = triggers.filter(trigger => lowerText.includes(trigger));
    
    if (triggerWords.length > 0) {
        // Find what they are searching for by taking text after the trigger
        const trigger = triggerWords[0];
        const searchParts = lowerText.split(trigger);
        const searchPhrase = searchParts.length > 1 ? searchParts[1].trim() : '';
        
        if (searchPhrase) {
            console.log('🔍 Voice search triggered for:', searchPhrase);
            
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(searchPhrase)}`);
                const result = await response.json();
                
                if (response.ok) {
                    showSearchResult(result.data, result.timeMs, result.source);
                } else {
                    console.log('🔍 Voice search triggered but no matching keyword found in backend database');
                }
            } catch (error) {
                console.error('Error fetching search results via voice:', error);
            }
        }
    }
}

function showSearchResult(data, timeMs, source) {
    const overlay = document.getElementById('searchOverlay');
    const container = document.getElementById('searchResultContainer');
    const loading = document.getElementById('searchLoading');
    const content = document.getElementById('searchResultContent');
    const error = document.getElementById('searchError');
    const title = document.getElementById('searchResultTitle');
    const text = document.getElementById('searchResultText');
    
    // Remove existing timing badge if any
    const existingBadge = document.getElementById('perfTimingBadge');
    if (existingBadge) existingBadge.remove();
    
    // Show overlay and container
    overlay.classList.add('show');
    container.classList.add('show');
    
    // Show loading initially
    loading.style.display = 'block';
    content.style.display = 'none';
    error.style.display = 'none';
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        if (data) {
            const resultsArray = Array.isArray(data) ? data : [data];
            
            if (resultsArray.length > 0 && resultsArray[0].title && resultsArray[0].content) {
                // Show content
                title.textContent = `Found ${resultsArray.length} result(s)`;
                
                let allContent = '';
                resultsArray.forEach((item, idx) => {
                    allContent += `<div class="result-item" style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: ${idx < resultsArray.length - 1 ? '1px solid var(--border-subtle)' : 'none'};">
                                      <h3 class="result-title" style="margin-top: 0; margin-bottom: 16px; color: var(--text-primary); font-size: 1.3rem; font-weight: 500;">${item.title}</h3>
                                      ${item.content}
                                   </div>`;
                });
                text.innerHTML = allContent;
                
                // Format timing badge
                if (timeMs && source) {
                    const timingBadge = document.createElement('div');
                    timingBadge.id = 'perfTimingBadge';
                    timingBadge.className = 'timing-badge';
                    const icon = source.includes('redis') ? '⚡' : '💾';
                    timingBadge.innerHTML = `<div><strong>${icon} Execution Time: </strong><span class="ms-highlight">${timeMs} ms</span></div><div class="data-source-text">Data Source: ${source}</div>`;
                    text.prepend(timingBadge);
                }
                
                loading.style.display = 'none';
                content.style.display = 'block';
            } else {
                // Show error
                loading.style.display = 'none';
                error.style.display = 'block';
            }
        } else {
            // Show error
            loading.style.display = 'none';
            error.style.display = 'block';
        }
    }, 800); // 800ms loading animation
}

function hideSearchResult() {
    const overlay = document.getElementById('searchOverlay');
    const container = document.getElementById('searchResultContainer');
    
    overlay.classList.remove('show');
    container.classList.remove('show');
}

// Make hideSearchResult available globally
window.hideSearchResult = hideSearchResult;

// Request microphone permission on page load
window.addEventListener('load', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                console.log('Microphone access granted');
                // Stop the stream immediately, we just needed permission
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => {
                console.warn('Microphone access denied:', err);
                document.getElementById('status').textContent = 
                    'Please allow microphone access to use speech recognition.';
                document.getElementById('status').className = 'status error';
            });
    }
});
