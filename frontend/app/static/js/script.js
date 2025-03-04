import conversationFlow from './workflow.js';

const chatHistory = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const chatInputArea = document.querySelector('.chat-input-area');

const hardcodedResponses = {
    "hello": "Hello there! It's a pleasure to connect with you. I'm a simple chatbot, but I'm always eager to assist and chat. How can I help you today? I hope we can have a great conversation!",
    "hi": "Hello there! It's a pleasure to connect with you. I'm a simple chatbot, but I'm always eager to assist and chat. How can I help you today? I hope we can have a great conversation!",
    "how are you?": "I'm doing well, thank you. As a chatbot, I don't experience emotions, but I'm functioning perfectly and ready to assist you!",
    "what's your name?": "I'm a simple chatbot. You can call me Maria's AI assistant.",
    "bye": "Goodbye! It was nice talking to you. Feel free to come back anytime!",
    "default": "I'm not sure I understand. Could you rephrase your question?"
};

let currentStep = "welcome";
let isBotResponding = false;
let currentButtonContainer = null;

function displayMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return messageDiv;
}

function typeBotResponse(message, messageDiv) {
    let index = 0;
    const intervalId = setInterval(() => {
        if (index < message.length) {
            messageDiv.textContent += message[index];
            index++;
            disableUserInput(); //disable user input
        } else {
            clearInterval(intervalId);
            enableUserInput(); //re-enable user input
            isBotResponding = false;
            if (conversationFlow[currentStep].options) {
                addConversationButtons(messageDiv, conversationFlow[currentStep].options);
            }
        }
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 30);
}

function displayBotMessage(message) {
    const botMessageDiv = displayMessage("", 'bot');
    typeBotResponse(message, botMessageDiv);
}

function getBotResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();
    return hardcodedResponses[lowerCaseMessage] || hardcodedResponses["default"];
}

function disableSendButton() {
    sendButton.disabled = true;
    sendButton.style.backgroundColor = "#cccccc";
    sendButton.style.cursor = "default";
}

function enableSendButton() {
    sendButton.disabled = false;
    sendButton.style.backgroundColor = "#007bff";
    sendButton.style.cursor = "pointer";
}

function addConversationButtons(messageDiv, options) {
    currentButtonContainer = document.createElement('div');
    currentButtonContainer.classList.add('button-container');

    options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.label;
        button.classList.add("chat-button");
        button.addEventListener('click', () => handleOptionClick(option.next, option.label));
        currentButtonContainer.appendChild(button);
    });

    messageDiv.after(currentButtonContainer);
}

function handleOptionClick(nextStep, userResponse) {
    if (currentButtonContainer) {
        currentButtonContainer.remove();
        currentButtonContainer = null;
    }
    displayMessage(userResponse, "user").textContent = userResponse;
    updateConversation(nextStep);
}

function updateConversation(nextStep) {
    currentStep = nextStep;
    const stepData = conversationFlow[currentStep];
    displayBotMessage(stepData.message);
}

function sendMessage() {
    if (isBotResponding || userInput.disabled) return; // Only check if userInput is disabled

    const userMessage = userInput.value.trim();
    if (userMessage === '') return;

    disableUserInput(); //disable user input
    isBotResponding = true;
    userInput.value = '';

    displayMessage(userMessage, 'user').textContent = userMessage;
    const botResponse = getBotResponse(userMessage);

    setTimeout(() => {
        const botMessageDiv = displayMessage("", 'bot');
        typeBotResponse(botResponse, botMessageDiv);
        currentStep = "freeform";
    }, 500);
}

function disableUserInput() {
    userInput.disabled = true;
    userInput.style.backgroundColor = "#cccccc";
    userInput.style.cursor = "default";
}
function enableUserInput() {
    userInput.disabled = false;
    userInput.style.backgroundColor = "#ffffff";
    userInput.style.cursor = "text";
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

window.onload = () => {
    disableUserInput(); // disable input as bot loading
    updateConversation(currentStep);
    chatInputArea.style.display = "flex";
    enableUserInput(); //re-enable the user input once everything is loaded.
};
