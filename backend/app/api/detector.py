from fastapi import APIRouter
from pydantic import BaseModel
from app.models.rule_based import RuleBasedDetector

router = APIRouter()
detector = RuleBasedDetector()

class PromptRequest(BaseModel):
    prompt: str

class DetectionResult(BaseModel):
    prompt: str
    is_injection: bool
    confidence: float
    detection_layer: str
    matched_patterns: list
    explanation: str

@router.post("/detect", response_model=DetectionResult)
def detect_injection(request: PromptRequest):
    result = detector.detect(request.prompt)
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
    return {"detector": "rule_based", "status": "active"}
