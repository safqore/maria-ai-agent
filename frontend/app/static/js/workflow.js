const conversationFlow = {
    welcome: {
        message: "👋 Hi there! I’m Maria, your AI guide at Safqore. Ready to discover how we can help you grow?",
        options: [
            { label: "Yes", next: "yesResponse" },
            { label: "No", next: "noResponse" }
        ]
    },
    yesResponse: {
        message: "Absolutely! Let's get started.",
        options: [] // No further options at this point; you would add them later
    },
    noResponse: {
        message: "💡 Psst… Great opportunities start with a “yes.” Change your mind? Click “Let’s Go” anytime!",
        options: [
            { label: "Let’s Go", next: "yesResponse" },
            { label: "May be next time", next: "goodbye" }
        ]
    },
    goodbye: {
        message: "I'll be here when you're ready!",
        options: []
    }
};

export default conversationFlow;
