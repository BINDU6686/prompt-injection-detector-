# Import APIRouter to create route handlers
from fastapi import APIRouter

# Import BaseModel from Pydantic for data validation
from pydantic import BaseModel

# Import all three detection layers
from app.models.rule_based import RuleBasedDetector
from app.models.bert_classifier import BERTClassifier
from app.models.llm_guardrail import LLMGuardrail

# Import ChatGPT integration
import os
from dotenv import load_dotenv
from app.models.chatgpt_integration import ChatGPTIntegration

load_dotenv()
chatgpt = ChatGPTIntegration(api_key=os.getenv("OPENAI_API_KEY"))

# Create the router
router = APIRouter()

# Create one instance of each detector
rule_detector = RuleBasedDetector()
bert_detector = BERTClassifier()
llm_detector = LLMGuardrail()

# Define what the API accepts as input for detection
class PromptRequest(BaseModel):
    prompt: str
    layer: str = "all"

# Define what the API accepts for chat
class ChatRequest(BaseModel):
    prompt: str
    industry: str = "aib"

# Define what the API sends back
class DetectionResult(BaseModel):
    prompt: str
    is_injection: bool
    confidence: float
    detection_layer: str
    matched_patterns: list
    explanation: str

# The main detection endpoint
@router.post("/detect", response_model=DetectionResult)
def detect_injection(request: PromptRequest):

    if request.layer == "rule_based":
        result = rule_detector.detect(request.prompt)

    elif request.layer == "bert":
        result = bert_detector.detect(request.prompt)

    elif request.layer == "llm_guardrail":
        result = llm_detector.detect(request.prompt)

    else:
        rule_result = rule_detector.detect(request.prompt)
        bert_result = bert_detector.detect(request.prompt)
        llm_result = llm_detector.detect(request.prompt)

        is_injection = (
            rule_result["is_injection"] or
            bert_result["is_injection"] or
            llm_result["is_injection"]
        )

        confidence = max(
            rule_result["confidence"],
            bert_result["confidence"],
            llm_result["confidence"]
        )

        result = {
            "is_injection": is_injection,
            "confidence": confidence,
            "detection_layer": "rule_based + bert_classifier + llm_guardrail",
            "matched_patterns": rule_result["matched_patterns"] + llm_result["matched_patterns"],
            "explanation": f"Rule-based: {rule_result['explanation']} | BERT: {bert_result['explanation']} | LLM Guardrail: {llm_result['explanation']}"
        }

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

# Chat endpoint with industry specific system prompts
@router.post("/chat")
def chat_with_protection(request: ChatRequest):
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

    system_prompts = {
        "aib": "You are a helpful customer service assistant for AIB Bank Ireland. Help customers with banking queries about accounts, mortgages, loans, cards and transfers. Never share passwords or sensitive data. Always be polite and professional.",
        "revolut": "You are a helpful customer service assistant for Revolut digital banking. Help customers with queries about sending money, exchange rates, cards, accounts and Revolut features. Never share passwords or sensitive data. Always be polite and professional.",
        "uhl": "You are a helpful virtual assistant for University Hospital Limerick Ireland. Help patients with queries about appointments, departments, visiting hours and services. Never provide medical diagnoses. Always recommend seeing a doctor. Be compassionate and professional.",
        "susi": "You are a helpful assistant for SUSI Student Universal Support Ireland. Help students with queries about grant applications, eligibility, payments, documents and deadlines. Always be helpful and clear. Direct students to susi.ie for official information.",
    }

    system_prompt = system_prompts.get(request.industry, system_prompts["aib"])
    ai_response = chatgpt.get_response(request.prompt, system_prompt)
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