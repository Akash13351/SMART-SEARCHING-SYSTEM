

const profanityWords = [
    
    'fuck',
    'fucking',
    'fucked',
    'fucker',
    'motherfucker',
    'fck',
    'fuk',
    
    // Vulgar terms
    'shit',
    'shitting',
    'shitty',
    'shits',
    'bullshit',
    
    // Offensive terms
    'bitch',
    'bitches',
    'bitching',
    'bastard',
    'asshole',
    'ass',
    'arse',
    
    // Sexual/crude terms
    'suck',
    'sucks',
    'sucking',
    'dick',
    'cock',
    'pussy',
    'penis',
    'vagina',
    'boobs',
    'tits',
    
    // Religious profanity
    'damn',
    'damned',
    'goddamn',
    'hell',
    'jesus christ',
    
    // Slang/crude
    'crap',
    'piss',
    'pissed',
    'whore',
    'slut',
    'fag',
    'retard',
    'retarded',
    'stupid',
    'idiot',
    'dumb',
    'moron',
    
    // Hate speech (add carefully)
    'nigger',
    'nigga',
    
    // Add more words as needed
];


const warningMessages = [
    {
        title: "Please Be Respectful!",
        text: "Please don't use inappropriate language. Let's keep this a friendly space! 🙏"
    },
    {
        title: "Oops! Watch Your Language!",
        text: "That word is not appropriate. Please use respectful language! 😊"
    },
    {
        title: "Language Alert! ⚠️",
        text: "Let's keep our conversation clean and respectful. Thank you! 🌟"
    },
    {
        title: "Hey There! 🛑",
        text: "Inappropriate language detected. Please be kind and respectful! 💙"
    },
    {
        title: "Friendly Reminder 📢",
        text: "This is a respectful space. Please avoid using offensive words! 🙂"
    }
];

// Positive/Good Words List
// These words trigger positive, encouraging responses
const positiveWords = [
    // Appreciation
    'thank',
    'thanks',
    'thankyou',
    'thank you',
    'appreciate',
    'grateful',
    'gratitude',
    
    // Positive emotions
    'love',
    'lovely',
    'beautiful',
    'amazing',
    'awesome',
    'wonderful',
    'fantastic',
    'excellent',
    'great',
    'good',
    'nice',
    'perfect',
    'brilliant',
    'fabulous',
    'superb',
    
    // Encouragement
    'yes',
    'yeah',
    'yay',
    'hurray',
    'hooray',
    'congratulations',
    'congrats',
    'well done',
    'good job',
    
    // Happiness
    'happy',
    'joy',
    'joyful',
    'excited',
    'delighted',
    'pleased',
    'cheerful',
    
    // Affirmation
    'please',
    'sorry',
    'excuse me',
    'pardon',
    'bless',
    'blessed',
    'blessing',
    
    // Success
    'success',
    'successful',
    'win',
    'winner',
    'victory',
    'achieve',
    'accomplished',
    
    // Add more positive words as needed
];

// Positive response messages - randomly selected when positive words are detected
const positiveMessages = [
    {
        title: "That's Wonderful! 🌟",
        text: "Your positive energy is amazing! Keep spreading the joy! ✨",
        emoji: "😊"
    },
    {
        title: "You're Awesome! 🎉",
        text: "Thank you for being so kind and positive! 💖",
        emoji: "🥰"
    },
    {
        title: "Great Vibes! ⭐",
        text: "Your positivity brightens up the day! Keep it up! 🌈",
        emoji: "😄"
    },
    {
        title: "Love Your Energy! 💫",
        text: "Such beautiful words! You're making the world better! 🌸",
        emoji: "🤗"
    },
    {
        title: "Amazing Spirit! 🎊",
        text: "Your kindness and positivity are truly inspiring! 💝",
        emoji: "🌺"
    },
    {
        title: "Fantastic! 🌻",
        text: "You're spreading happiness everywhere! Thank you! 🦋",
        emoji: "😊"
    },
    {
        title: "Beautiful Words! 🌷",
        text: "Your positive attitude is contagious! Love it! 💕",
        emoji: "🥳"
    },
    {
        title: "You Made My Day! ☀️",
        text: "Such wonderful positivity! Keep shining bright! ✨",
        emoji: "😍"
    }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { profanityWords, warningMessages, positiveWords, positiveMessages };
}
