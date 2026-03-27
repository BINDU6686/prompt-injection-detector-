from transformers import pipeline
from app.utils.preprocessor import preprocess

class BERTClassifier:
    def __init__(self):
        print("Loading BERT classifier...")
        self.classifier = pipeline(
            "text-classification",
            model="deepset/deberta-v3-base-injection",
            truncation=True,
            max_length=512
        )
        print("BERT classifier loaded!")

    def detect(self, prompt: str) -> dict:
        prompt = preprocess(prompt)
        result = self.classifier(prompt)[0]
        
        is_injection = result["label"] == "INJECTION"
        confidence = round(result["score"], 2)

        return {
            "is_injection": is_injection,
            "confidence": confidence,
            "detection_layer": "bert_classifier",
            "matched_patterns": [],
            "explanation": (
                f"BERT classifier detected injection with {confidence*100:.0f}% confidence."
                if is_injection else
                f"BERT classifier found no injection with {confidence*100:.0f}% confidence."
            )
        }