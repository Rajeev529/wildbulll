const sendBtn = document.getElementById('sendBtn');
const userInput = document.getElementById('userInput');
const chatBox = document.getElementById('chatBox');

// Helper to make URLs clickable and prevent UI stretching
function linkify(text) {
    if (!text) return "";
    const urlPattern = /((https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

// Function to append message bubbles to the UI
function appendMessage(text, type) {
    const now = new Date();
    const time = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
    const formattedText = linkify(text);

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`; // 'sent' or 'received'
    msgDiv.innerHTML = `
        <div class="msg-content">${formattedText}</div>
        <span class="msg-time">${time}</span>
    `;

    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleChat() {
    const text = userInput.value.trim();
    if (text === "") return;

    // 1. Show user message in UI immediately
    appendMessage(text, 'sent');
    userInput.value = "";

    // 2. Prepare data for Django
    const formData = new FormData();
    formData.append('input_text', text);

    try {
        // 3. AJAX Fetch Call
        const response = await fetch('/chat-process/', { // Change to your actual URL
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                // 'X-CSRFToken': getCookie('csrftoken') // Uncomment if not using @csrf_exempt
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            // 4. Show Django's output_text in a 'received' bubble
            appendMessage(data.output_text || "System: Processing complete.", 'received');
        }
    } catch (error) {
        console.error("Error:", error);
        appendMessage("Error: Could not reach the server.", 'received');
    }
}

// Event Listeners
sendBtn.addEventListener('click', handleChat);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChat();
});