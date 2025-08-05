import google.generativeai as genai

# Replace with your actual Gemini API key
API_KEY = "AIzaSyC8cXUMLF6UcJgwP7yTqQbuj5WDq8Edksw"

# Configure API
genai.configure(api_key=API_KEY)

# Try calling Gemini Flash 1.5
try:
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    response = model.generate_content("What's the weather like on Mars?")
    
    print("✅ API key is working. Gemini Flash 1.5 says:")
    print(response.text)

except Exception as e:
    print("❌ Error! Either the API key is invalid or the model name is incorrect.")
    print("Details:", e)
