import re
from app.utils.preprocessor import preprocess

class LLMGuardrail:

    def __init__(self):
        self.suspicious_patterns = [
            r"ignore\s+(previous|prior|all)\s+instructions?",
            r"i\s+am\s+now\s+(an?\s+)?(unrestricted|different|new)",
            r"my\s+new\s+(instructions?|rules?|directive)",
            r"disregard\s+(previous|prior|all|my)",
            r"as\s+an?\s+(unrestricted|jailbroken|unfiltered)",
            r"i\s+will\s+now\s+(ignore|bypass|disregard)",
        ]

        self.compiled = [
            re.compile(p, re.IGNORECASE) for p in self.suspicious_patterns
        ]

    def detect(self, prompt: str, response: str = "") -> dict:
        prompt = preprocess(prompt)

        prompt_matches = []
        for pattern in self.compiled:
            if pattern.search(prompt):
                prompt_matches.append(pattern.pattern)

        response_matches = []
        if response:
            for pattern in self.compiled:
                if pattern.search(response):
                    response_matches.append(pattern.pattern)

        all_matches = prompt_matches + response_matches
        is_injection = len(all_matches) > 0
        confidence = min(0.98, 0.55 + (len(all_matches) * 0.15)) if is_injection else 0.03

        if is_injection:
            parts = []
            if prompt_matches:
                parts.append(f"Input contains {len(prompt_matches)} suspicious pattern(s)")
            if response_matches:
                parts.append(f"Response contains {len(response_matches)} suspicious pattern(s)")
            explanation = "LLM Guardrail detected: " + " and ".join(parts) + "."
        else:
            explanation = "LLM guardrail found no suspicious patterns in input or response."

        return {
            "is_injection": is_injection,
            "confidence": round(confidence, 2),
            "detection_layer": "llm_guardrail",
            "matched_patterns": all_matches,
            "explanation": explanation
        }