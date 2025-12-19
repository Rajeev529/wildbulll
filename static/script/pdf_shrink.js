const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');

// Function to detect URLs and wrap them in <a> tags
function linkify(text) {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');
}

function sendMessage() {
    const text = userInput.value.trim();
    if (text === "") return;

    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');

    // Convert plain text to "Linkified" HTML
    const formattedText = linkify(text);

    // Create Sent Message Element
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message sent';
    msgDiv.innerHTML = `
        <div class="msg-content">${formattedText}</div>
        <span class="msg-time">${time}</span>
    `;

    chatBox.appendChild(msgDiv);
    userInput.value = "";
    
    // Auto-scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Optional: Auto-Reply simulation
    setTimeout(() => {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'message received';
        replyDiv.innerHTML = `
            <div class="msg-content">Link received! I'm checking it now...</div>
            <span class="msg-time">${time}</span>
        `;
        chatBox.appendChild(replyDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});