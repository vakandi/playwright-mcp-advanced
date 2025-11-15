from playwright.sync_api import sync_playwright
import os

def launch_brave_with_profile():
    # Path to Brave browser executable
    brave_path = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
    
    # Path to your Brave user data directory
    user_data_dir = r"C:\Users\vakandi\AppData\Local\BraveSoftware\Brave-Browser\User Data"
    
    # Check if paths exist
    if not os.path.exists(brave_path):
        print(f"Error: Brave browser not found at {brave_path}")
        return
    
    if not os.path.exists(user_data_dir):
        print(f"Error: User data directory not found at {user_data_dir}")
        return
    
    with sync_playwright() as p:
        # Launch Brave with your existing profile
        browser = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            executable_path=brave_path,
            headless=False,  # Set to True if you don't want to see the browser
            channel=None,
            args=[
                '--disable-blink-features=AutomationControlled',  # Hide automation
            ]
        )
        
        # Create a new page (tab)
        page = browser.new_page()
        
        # Navigate to Google
        page.goto('https://www.google.com')
        
        print("Browser opened with your profile and navigated to Google!")
        print("Press Enter to close the browser...")
        input()
        
        # Close browser
        browser.close()

if __name__ == "__main__":
    launch_brave_with_profile()