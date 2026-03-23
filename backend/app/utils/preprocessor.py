import re

def clean_prompt(prompt: str) -> str:
    prompt = prompt.strip()
    prompt = re.sub(r'\s+', ' ', prompt)
    return prompt

def truncate_prompt(prompt: str, max_length: int = 512) -> str:
    if len(prompt) > max_length:
        return prompt[:max_length]
    return prompt

def preprocess(prompt: str) -> str:
    prompt = clean_prompt(prompt)
    prompt = truncate_prompt(prompt)
    return prompt