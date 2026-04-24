from openai import OpenAI

class ChatGPTIntegration:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def get_response(self, user_message: str, system_prompt: str = None) -> str:
        if system_prompt is None:
            system_prompt = "You are a helpful assistant. Always be polite and professional."
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=200
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error getting response: {str(e)}"