// Setup screen for VR Tic Tac Toe
const setupScreen = document.createElement('div');
setupScreen.style.position = 'fixed';
setupScreen.style.top = '0';
setupScreen.style.left = '0';
setupScreen.style.width = '100%';
setupScreen.style.height = '100%';
setupScreen.style.backgroundColor = '#1c472c';
setupScreen.style.display = 'flex';
setupScreen.style.flexDirection = 'column';
setupScreen.style.alignItems = 'center';
setupScreen.style.padding = '20px';
setupScreen.style.color = 'white';
setupScreen.style.fontFamily = 'Arial, sans-serif';

// Create form container
const formContainer = document.createElement('div');
formContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
formContainer.style.padding = '30px';
formContainer.style.borderRadius = '10px';
formContainer.style.width = '100%';
formContainer.style.maxWidth = '500px';
formContainer.style.marginTop = '50px';

// Title
const title = document.createElement('h1');
title.textContent = 'VR Tic Tac Toe Setup';
title.style.marginBottom = '30px';
title.style.textAlign = 'center';
formContainer.appendChild(title);

// API Key input
const apiKeyLabel = document.createElement('label');
apiKeyLabel.textContent = 'OpenAI API Key:';
apiKeyLabel.style.display = 'block';
apiKeyLabel.style.marginBottom = '5px';
formContainer.appendChild(apiKeyLabel);

const apiKeyInput = document.createElement('input');
apiKeyInput.type = 'password';
apiKeyInput.placeholder = 'Enter your OpenAI API key';
apiKeyInput.style.width = '100%';
apiKeyInput.style.padding = '10px';
apiKeyInput.style.marginBottom = '20px';
apiKeyInput.style.borderRadius = '5px';
apiKeyInput.style.border = 'none';
formContainer.appendChild(apiKeyInput);

// Topic input
const topicLabel = document.createElement('label');
topicLabel.textContent = 'Learning Topic:';
topicLabel.style.display = 'block';
topicLabel.style.marginBottom = '5px';
formContainer.appendChild(topicLabel);

const topicInput = document.createElement('input');
topicInput.type = 'text';
topicInput.placeholder = 'Enter the topic you want to learn';
topicInput.style.width = '100%';
topicInput.style.padding = '10px';
topicInput.style.marginBottom = '20px';
topicInput.style.borderRadius = '5px';
topicInput.style.border = 'none';
formContainer.appendChild(topicInput);

// Generate button
const generateButton = document.createElement('button');
generateButton.textContent = 'Generate Options';
generateButton.style.backgroundColor = '#00ff00';
generateButton.style.color = 'black';
generateButton.style.padding = '12px 24px';
generateButton.style.border = 'none';
generateButton.style.borderRadius = '5px';
generateButton.style.cursor = 'pointer';
generateButton.style.width = '100%';
generateButton.style.fontWeight = 'bold';
generateButton.style.marginBottom = '20px';
formContainer.appendChild(generateButton);

// Loading indicator
const loadingIndicator = document.createElement('div');
loadingIndicator.textContent = 'Generating options...';
loadingIndicator.style.display = 'none';
loadingIndicator.style.marginBottom = '20px';
loadingIndicator.style.textAlign = 'center';
formContainer.appendChild(loadingIndicator);

// Options display
const optionsDisplay = document.createElement('div');
optionsDisplay.style.display = 'none';
optionsDisplay.style.marginBottom = '20px';
formContainer.appendChild(optionsDisplay);

// Enter VR button (initially hidden)
const enterVRButton = document.createElement('button');
enterVRButton.textContent = 'Enter VR';
enterVRButton.style.backgroundColor = '#4CAF50';
enterVRButton.style.color = 'white';
enterVRButton.style.padding = '12px 24px';
enterVRButton.style.border = 'none';
enterVRButton.style.borderRadius = '5px';
enterVRButton.style.cursor = 'pointer';
enterVRButton.style.width = '100%';
enterVRButton.style.fontWeight = 'bold';
enterVRButton.style.display = 'none';
formContainer.appendChild(enterVRButton);

// Error message
const errorMessage = document.createElement('div');
errorMessage.style.color = '#ff4444';
errorMessage.style.marginTop = '10px';
errorMessage.style.textAlign = 'center';
errorMessage.style.display = 'none';
formContainer.appendChild(errorMessage);

setupScreen.appendChild(formContainer);

// Generate options function
async function generateOptions(apiKey, topic) {
    const prompt = `To learn the following topic: "${topic}".
Now, generate 9 options where 3 of them are the right options of the game topic and 6 are false and slightly off topic. Format your response following these EXACT rules:

1. Generate 9 options labeled from a) to i)
2. Each option MUST start with a lowercase letter from a to i, followed by a closing parenthesis
3. Each option MUST be on a new line
4. After all 9 options, add a line starting with "right)" followed by exactly 3 RANDOM letters from a-i. These are the 3 right options.
5. The 3 letters in the right) line MUST be separated by commas without spaces
6. The 3 letters MUST be different from each other and MUST be randomly chosen
7. There is no specific order of the letters of the 3 right options. They should be random every time.
8. Do not add any other text, explanations, or formatting`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        console.log('API response:', data);
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating options:', error);
        throw new Error('Failed to generate options: ' + error.message);
    }
}

// Process API response
function processApiResponse(response) {
    const parts = response.split('right)');
    const options = parts[0].trim().split('\n');
    const rightAnswerLetters = parts[1].trim().split(',');
    console.log('Processed API response:', options, rightAnswerLetters);
    return { options, rightAnswerLetters };
}

// Event listeners
generateButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const topic = topicInput.value.trim();

    if (!apiKey || !topic) {
        errorMessage.textContent = 'Please enter both API key and topic';
        errorMessage.style.display = 'block';
        return;
    }

    errorMessage.style.display = 'none';
    loadingIndicator.style.display = 'block';
    generateButton.disabled = true;

    try {
        const response = await generateOptions(apiKey, topic);
        const { options, rightAnswerLetters } = processApiResponse(response);

        // Store in multiple places for redundancy
        try {
            const dataToStore = {
                options,
                rightAnswers: rightAnswerLetters,
                topic
            };
            console.log('Data to store:', dataToStore);
            localStorage.setItem('vrTicTacOptions', JSON.stringify(dataToStore));
            sessionStorage.setItem('vrTicTacOptions', JSON.stringify(dataToStore));
            window.vrTicTacOptions = dataToStore;
            document.vrTicTacOptions = dataToStore;
            
            // Add visible feedback
            const feedback = document.createElement('div');
            feedback.style.position = 'fixed';
            feedback.style.bottom = '20px';
            feedback.style.left = '50%';
            feedback.style.transform = 'translateX(-50%)';
            feedback.style.backgroundColor = '#00ff00';
            feedback.style.color = 'black';
            feedback.style.padding = '10px';
            feedback.style.borderRadius = '5px';
            feedback.textContent = 'Options saved successfully!';
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3000);
            
        } catch (e) {
            console.error('Error storing data:', e);
            alert('Error saving options: ' + e.message);
        }

        // Display options
        optionsDisplay.innerHTML = `
            <h3 style="margin-bottom: 10px;">Generated Options:</h3>
            <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px;">
                ${options.join('<br>')}
            </div>
        `;
        optionsDisplay.style.display = 'block';
        enterVRButton.style.display = 'block';

    } catch (error) {
        console.error('Error generating options:', error);
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
        generateButton.disabled = false;
    }
});

enterVRButton.addEventListener('click', () => {
    setupScreen.style.display = 'none';
    // The main.js will handle showing the VR scene
});

// Export for main.js
export { setupScreen };
