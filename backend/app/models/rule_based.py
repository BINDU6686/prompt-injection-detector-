import re

class RuleBasedDetector:
    def __init__(self):
        self.patterns = [
            # Ignore/override instructions
            r"ignore\s+(previous|prior|above|all)\s+(instructions?|prompts?|context)",
            r"disregard\s+(previous|prior|above|all)\s+(instructions?|prompts?)",
            r"forget\s+(previous|prior|above|all)\s+(instructions?|prompts?)",
            r"override\s+(previous|prior|above|all)\s+(instructions?|prompts?)",

            # Role manipulation
            r"you\s+are\s+now\s+(a|an|the)\s+\w+",
            r"act\s+as\s+(a|an|the)\s+\w+",
            r"pretend\s+(you\s+are|to\s+be)\s+(a|an|the)\s+\w+",
            r"roleplay\s+as",
            r"simulate\s+(a|an|the)\s+\w+",

            # Jailbreak patterns
            r"do\s+anything\s+now",
            r"DAN\s+mode",
            r"jailbreak",
            r"no\s+restrictions",
            r"without\s+(any\s+)?(restrictions?|limitations?|filters?|guidelines?)",
            r"bypass\s+(your\s+)?(safety|restrictions?|filters?|guidelines?)",

            # System prompt extraction
            r"(reveal|show|print|display|tell\s+me)\s+(your\s+)?(system\s+prompt|instructions?|prompt)",
            r"what\s+(are\s+your|is\s+your)\s+(instructions?|system\s+prompt|prompt)",

            # Indirect injection
            r"<\s*script\s*>",
            r"<\s*img\s+src",
            r"\{\{.*\}\}",
            r"\$\{.*\}",

            # Payload splitting
            r"(first|second|third|next)\s+part\s+of\s+(the\s+)?instruction",
            r"combine\s+(the\s+)?(previous|above|following)\s+(parts?|instructions?)",
        ]
        self.compiled = [
            re.compile(p, re.IGNORECASE) for p in self.patterns
        ]

    def detect(self, prompt: str) -> dict:
        matched = []
        for i, pattern in enumerate(self.compiled):
            if pattern.search(prompt):
                matched.append(self.patterns[i])

        is_injection = len(matched) > 0
        confidence = min(0.95, 0.5 + (len(matched) * 0.15)) if is_injection else 0.05

        return {
            "is_injection": is_injection,
            "confidence": round(confidence, 2),
            "detection_layer": "rule_based",
            "matched_patterns": matched,
            "explanation": (
                f"Detected {len(matched)} suspicious pattern(s) matching known injection signatures."
                if is_injection else
                "No known injection patterns detected."
            )
        }