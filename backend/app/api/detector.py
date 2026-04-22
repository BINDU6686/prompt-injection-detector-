import os
from dotenv import load_dotenv
from app.models.chatgpt_integration import ChatGPTIntegration

load_dotenv()

chatgpt = ChatGPTIntegration(api_key=os.getenv("OPENAI_API_KEY"))# Import APIRouter to create route handlers
from fastapi import APIRouter

# Import BaseModel from Pydantic for data validation
from pydantic import BaseModel

# Import all three detection layers
from app.models.rule_based import RuleBasedDetector
from app.models.bert_classifier import BERTClassifier
from app.models.llm_guardrail import LLMGuardrail

# Create the router — this handles all /api/v1/ endpoints
router = APIRouter()

# Create one instance of each detector
# They load once at startup and stay in memory
rule_detector = RuleBasedDetector()
bert_detector = BERTClassifier()
llm_detector = LLMGuardrail()

# Define what the API accepts as input
class PromptRequest(BaseModel):
    prompt: str          # The text to analyse
    layer: str = "all"   # Which layer to use — default is all three

# Define what the API sends back
class DetectionResult(BaseModel):
    prompt: str
    is_injection: bool      # True = attack detected
    confidence: float       # How confident 0.0 to 1.0
    detection_layer: str    # Which layer(s) detected it
    matched_patterns: list  # Exactly which patterns matched
    explanation: str        # Human readable explanation

# The main detection endpoint
# POST means send data to the server
@router.post("/detect", response_model=DetectionResult)
def detect_injection(request: PromptRequest):

    # Run only Layer 1 if requested
    if request.layer == "rule_based":
        result = rule_detector.detect(request.prompt)

    # Run only Layer 2 if requested
    elif request.layer == "bert":
        result = bert_detector.detect(request.prompt)

    # Run only Layer 3 if requested
    elif request.layer == "llm_guardrail":
        result = llm_detector.detect(request.prompt)

    # Run ALL THREE layers together — default behaviour
    else:
        rule_result = rule_detector.detect(request.prompt)
        bert_result = bert_detector.detect(request.prompt)
        llm_result = llm_detector.detect(request.prompt)

        # If ANY layer says it is an attack — flag it
        # This is conservative security — better safe than sorry
        is_injection = (
            rule_result["is_injection"] or
            bert_result["is_injection"] or
            llm_result["is_injection"]
        )

        # Take the highest confidence score from all layers
        confidence = max(
            rule_result["confidence"],
            bert_result["confidence"],
            llm_result["confidence"]
        )

        # Combine explanation from all layers
        result = {
            "is_injection": is_injection,
            "confidence": confidence,
            "detection_layer": "rule_based + bert_classifier + llm_guardrail",
            "matched_patterns": rule_result["matched_patterns"] + llm_result["matched_patterns"],
            "explanation": f"Rule-based: {rule_result['explanation']} | BERT: {bert_result['explanation']} | LLM Guardrail: {llm_result['explanation']}"
        }

    # Return the final result
    return DetectionResult(
        prompt=request.prompt,
        is_injection=result["is_injection"],
        confidence=result["confidence"],
        detection_layer=result["detection_layer"],
        matched_patterns=result["matched_patterns"],
        explanation=result["explanation"]
    )

# Health check endpoint
@router.get("/health")
def detector_health():
    return {
        "rule_based": "active",
        "bert_classifier": "active",
        "llm_guardrail": "active"
    }
@router.post("/chat")
def chat_with_protection(request: PromptRequest):
    rule_result = rule_detector.detect(request.prompt)
    bert_result = bert_detector.detect(request.prompt)
    llm_result = llm_detector.detect(request.prompt)

    is_injection = (
        rule_result["is_injection"] or
        bert_result["is_injection"] or
        llm_result["is_injection"]
    )

    if is_injection:
        return {
            "is_injection": True,
            "blocked": True,
            "message": "Your message was blocked. Prompt injection attack detected.",
            "confidence": max(rule_result["confidence"], bert_result["confidence"], llm_result["confidence"]),
            "ai_response": None
        }

    ai_response = chatgpt.get_response(request.prompt)
    output_check = llm_detector.detect(request.prompt, ai_response)

    if output_check["is_injection"]:
        return {
            "is_injection": True,
            "blocked": True,
            "message": "AI response was blocked. Manipulation detected in output.",
            "confidence": output_check["confidence"],
            "ai_response": None
        }

    return {
        "is_injection": False,
        "blocked": False,
        "message": "Message is safe.",
        "confidence": 0.0,
        "ai_response": ai_response
    }