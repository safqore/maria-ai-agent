const chatMessages = document.getElementById('chat-messages');
const textInput = document.getElementById('text-input');
const sendButton = document.getElementById('send-button');
const suggestionContainer = document.getElementById('suggestion-container');
const suggestionLabel = document.getElementById('suggestion-label');
const suggestionLabelContainer = document.getElementById('suggestion-label-container');

//list of prompt suggestions
const promptSuggestions = [
    "Can you tell me how you can transform my customer experience?",
    "What services do Safqore provide?"
];

// State to track bot creation progress and initial suggestion
let botCreationState = {
    inProgress: false,
    botName: null,
    botPurpose: null,
    botTone: null
};
let initialSuggestionShown = false;
let waitingForInitialResponse = false;
let userMessageCount = 0; // Track user message count

function createSuggestionLinks() {
    suggestionContainer.innerHTML = ''; // Clear existing links
    
    promptSuggestions.forEach(prompt => {
        const link = document.createElement('a');
        link.classList.add('suggestion-link');
        link.textContent = prompt;
        link.href = '#'; //placeholder
        link.addEventListener('click', (event) => {
            event.preventDefault();// Prevent default link behavior
            handleSuggestionClick({target: link});
        });
        suggestionContainer.appendChild(link);
    });
}

function addMessage(message, type, options = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);

    if (options) {
        const messageText = document.createElement('span');
        messageText.textContent = message;
        messageDiv.appendChild(messageText);

        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('inline-options-container');
        options.forEach(option => {
            const link = document.createElement('a');
            link.href = '#'; // Placeholder link
            link.classList.add('inline-option-link');
            link.textContent = option.label;
            link.dataset.value = option.value;
            link.addEventListener('click', handleInlineOptionClick);
            optionsContainer.appendChild(link);
        });
        messageDiv.appendChild(optionsContainer);
    } else {
        messageDiv.textContent = message;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getHardcodedResponse(userInput) {
    userInput = userInput.toLowerCase();

    if (waitingForInitialResponse) {
        waitingForInitialResponse = false;

        // Show options as part of the chat
        const services = [
            { label: "Create a Bot", value: "create-bot" },
            { label: "General Inquiry", value: "general-inquiry" },
            // Add more services here
        ];
        addMessage("I can help transform your customer experience in the following ways:", 'bot', services);
        return ""; // No additional text response needed, options are displayed.
    }
    else if (userInput.includes("hello") || userInput.includes("hi")) {
        return "Hello there!";
    } else if (userInput.includes("how are you")) {
        return "I'm doing well, thank you for asking!";
    } else if (userInput.includes("what's your name")) {
        return "I'm Maria, and can transform your customer experience. Tell me how I can help!";
    } else if (userInput.includes("bye") || userInput.includes("goodbye")) {
        return "Goodbye!";
    } else {
        return "I'm not sure I understand. Can you rephrase?";
    }
}
function handleInlineOptionClick(event) {
    event.preventDefault(); // Prevent default link behavior
    const selectedOption = event.target.dataset.value;
    const selectedLabel = event.target.textContent
    addMessage(selectedLabel, 'user')

    if (selectedOption === 'create-bot') {
        startBotCreation();
    } else if (selectedOption === 'general-inquiry') {
        addMessage("How can i help you today?", 'bot');
    }
}

function showBotCreationQuestion(question) {
    addMessage(question, 'bot');
}

function startBotCreation() {
    botCreationState.inProgress = true;
    showBotCreationQuestion("What would you like to name your bot?");
}

function handleBotCreationResponse(userResponse) {
    if (!botCreationState.botName) {
        botCreationState.botName = userResponse;
        showBotCreationQuestion("What is the primary purpose of your bot?");
    } else if (!botCreationState.botPurpose) {
        botCreationState.botPurpose = userResponse;
        showBotCreationQuestion("What tone should your bot have (e.g., friendly, formal, playful)?");
    } else if (!botCreationState.botTone) {
        botCreationState.botTone = userResponse;
        // data has been gathered.
        addMessage("Thank you! We are now creating your bot...", 'bot');
        // reset values and inProgress
        botCreationState = {
            inProgress: false,
            botName: null,
            botPurpose: null,
            botTone: null
        };

        // Send botCreationState to backend
        console.log("Bot Creation Data:", botCreationState);
        // In real-world it would be sent to backend
        // offer options to start over?
        addMessage("What would you like to do next?", 'bot', [
            {label: "Create another bot", value: "create-bot"},
            {label: "General inquiry", value: "general-inquiry"}
        ])
    }
}

function sendMessage() {
    const userMessage = textInput.value;
    if (userMessage.trim() === '') return;

    addMessage(userMessage, 'user');
    textInput.value = '';

    // Check if bot creation is in progress
    if (botCreationState.inProgress) {
        handleBotCreationResponse(userMessage);
        return;
    }

    userMessageCount++; // Increment user message count
    // Show suggestion after two messages
    if (userMessageCount >= 2) {
        showSuggestions();
    }

    // Simulate bot response (replace with actual logic later)
    setTimeout(() => {
        const botResponse = getHardcodedResponse(userMessage);
        if (botResponse){
            addMessage(botResponse, 'bot');
        }
    }, 500);
}

function handleSuggestionClick(event) {
    if (event.target.textContent === "Can you tell me how you can transform my customer experience?" || event.target.textContent === "What services do Safqore provide?") {
        waitingForInitialResponse = true;
    }
    textInput.value = event.target.textContent; // Set text to the link text
    sendMessage();
}
function showSuggestions() {
    createSuggestionLinks();
    suggestionContainer.style.display = 'block'; //Show container
    suggestionLabelContainer.style.display = 'block'; //Show label
}

sendButton.addEventListener('click', sendMessage);
textInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
//hide suggestions on load
suggestionContainer.style.display = 'none';
suggestionLabelContainer.style.display = 'none';
