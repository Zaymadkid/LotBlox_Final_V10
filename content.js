setInterval(async () => {
    // 1. Look for the 2FA input box on the page
    const input = document.querySelector('input[name="verificationCode"]') || 
                  document.querySelector('#two-step-verification-code-input');
    
    // 2. Only run if the input exists and is currently empty
    if (input && !input.value) {
        
        // 3. Get your saved accounts list from the extension storage
        const data = await chrome.storage.local.get("lotblox_accs");
        const accounts = data.lotblox_accs || [];
        
        // 4. Try to find a secret key that matches the current login attempt
        // We loop through saved accounts to see if any generate a code.
        for (const acc of accounts) {
            if (acc.secret && acc.secret.length > 8) {
                const code = getOtp(acc.secret);
                
                // If we generated a valid code, let's type it in
                if (code && code !== "000000") {
                    console.log(`LotBlox: Auto-filling code for ${acc.name}`);
                    
                    input.value = code;
                    
                    // Fire events so Roblox knows the user "typed" it
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Click the "Verify" button automatically
                    const btn = document.querySelector('button[type="submit"]') || 
                                document.querySelector('.verification-submit-button');
                    if (btn) {
                        setTimeout(() => btn.click(), 500);
                    }
                    
                    break; // Stop after filling the first valid one we find
                }
            }
        }
    }
}, 1000); // Check every second
