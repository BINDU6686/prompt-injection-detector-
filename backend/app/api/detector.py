from fastapi import APIRouter
from pydantic import BaseModel
from app.models.rule_based import RuleBasedDetector
from app.models.bert_classifier import BERTClassifier

router = APIRouter()
rule_detector = RuleBasedDetector()
bert_detector = BERTClassifier()

class PromptRequest(BaseModel):
    prompt: str
    layer: str = "both"

class DetectionResult(BaseModel):
    prompt: str
    is_injection: bool
    confidence: float
    detection_layer: str
    matched_patterns: list
    explanation: str

@router.post("/detect", response_model=DetectionResult)
def detect_injection(request: PromptRequest):
    if request.layer == "rule_based":
        result = rule_detector.detect(request.prompt)
    elif request.layer == "bert":
        result = bert_detector.detect(request.prompt)
    else:
        rule_result = rule_detector.detect(request.prompt)
        bert_result = bert_detector.detect(request.prompt)
        is_injection = rule_result["is_injection"] or bert_result["is_injection"]
        confidence = max(rule_result["confidence"], bert_result["confidence"])
        result = {
            "is_injection": is_injection,
            "confidence": confidence,
            "detection_layer": "rule_based + bert_classifier",
            "matched_patterns": rule_result["matched_patterns"],
            "explanation": f"Rule-based: {rule_result['explanation']} | BERT: {bert_result['explanation']}"
        }
    return DetectionResult(
        prompt=request.prompt,
        is_injection=result["is_injection"],
        confidence=result["confidence"],
        detection_layer=result["detection_layer"],
        matched_patterns=result["matched_patterns"],
        explanation=result["explanation"]
    )

@router.get("/health")
def detector_health():
    return {"rule_based": "active", "bert_classifier": "active"}