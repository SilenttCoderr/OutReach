from playwright.sync_api import sync_playwright
import os

def run():
    # Only verify frontend ports (assuming 3000)
    # Ensure screenshots dir exists
    if not os.path.exists('logs/screenshots'):
        os.makedirs('logs/screenshots')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Home Page
        print("Visiting Home...")
        try:
            page.goto("http://localhost:3000", timeout=10000)
            page.wait_for_load_state("networkidle", timeout=5000)
            page.screenshot(path="logs/screenshots/home.png", full_page=True)
            print("Home Screenshot saved.")
        except Exception as e:
            print(f"Error visiting Home: {e}")

        # 2. Login Page
        print("Visiting Login...")
        try:
            page.goto("http://localhost:3000/login", timeout=10000)
            page.wait_for_load_state("networkidle")
            page.screenshot(path="logs/screenshots/login.png")
            print("Login Screenshot saved.")
        except Exception as e:
            print(f"Error visiting Login: {e}")

        # 3. Dashboard (might redirect if we had auth, but currently unprotected)
        print("Visiting Dashboard...")
        try:
            page.goto("http://localhost:3000/dashboard", timeout=10000)
            page.wait_for_load_state("networkidle", timeout=5000)
            page.screenshot(path="logs/screenshots/dashboard.png", full_page=True)
            
            # Save HTML for inspection
            with open("logs/dashboard.html", "w", encoding="utf-8") as f:
                f.write(page.content())
            print("Dashboard Screenshot and HTML saved.")
        except Exception as e:
            print(f"Error visiting Dashboard: {e}")

        browser.close()

if __name__ == "__main__":
    run()
