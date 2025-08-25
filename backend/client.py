from google.genai import Client

class GeminiClient:
    def __init__(self, api_key: str):
        self.client = Client(api_key=api_key)

    def generate_content(self, model: str, prompt: str):
        return self.client.models.generate_content(model, prompt)