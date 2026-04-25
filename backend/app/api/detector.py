from fastapi import APIRouter
from pydantic import BaseModel
from app.models.rule_based import RuleBasedDetector
from app.models.bert_classifier import BERTClassifier
from app.models.llm_guardrail import LLMGuardrail
import os
import datetime
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from app.models.chatgpt_integration import ChatGPTIntegration

load_dotenv()
chatgpt = ChatGPTIntegration(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

rule_detector = RuleBasedDetector()
bert_detector = BERTClassifier()
llm_detector = LLMGuardrail()

class PromptRequest(BaseModel):
    prompt: str
    layer: str = "all"

class ChatRequest(BaseModel):
    prompt: str
    industry: str = "aib"

class EmailAlertRequest(BaseModel):
    to_email: str
    prompt: str
    confidence: float
    layer: str

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

@router.get("/health")
def detector_health():
    return {
        "rule_based": "active",
        "bert_classifier": "active",
        "llm_guardrail": "active"
    }

SYSTEM_PROMPTS = {
    "aib": "You are a helpful customer service assistant for AIB Bank Ireland. Help customers with banking queries about accounts, mortgages, loans, cards and transfers. Never share passwords or sensitive data. Always be polite and professional.",
    "revolut": "You are a helpful customer service assistant for Revolut digital banking. Help customers with queries about sending money abroad, exchange rates, freezing cards, opening accounts and Revolut premium features. Never share passwords or sensitive data. Always be polite and professional.",
    "uhl": "You are a helpful virtual assistant for University Hospital Limerick in Ireland. Help patients and visitors with queries about booking appointments, finding departments, visiting hours, parking, and available services. Never provide medical diagnoses. Always recommend seeing a doctor for medical advice. Be compassionate and professional.",
    "susi": "You are a helpful assistant for SUSI which stands for Student Universal Support Ireland. Help students with queries about grant applications, checking eligibility, required documents, payment amounts, deadlines and how to appeal decisions. Always be helpful and clear. Direct students to susi.ie for official information.",
}

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
            "confidence": max(
                rule_result["confidence"],
                bert_result["confidence"],
                llm_result["confidence"]
            ),
            "ai_response": None
        }

    system_prompt = SYSTEM_PROMPTS.get(request.industry, SYSTEM_PROMPTS["aib"])
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

@router.post("/send-alert")
async def send_email_alert(request: EmailAlertRequest):
    try:
        sender = "binduvadlamudi03@gmail.com"
        password = "bvxo sinp ekwt scbc"

        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = request.to_email
        msg["Subject"] = "Security Alert — Prompt Injection Attack Detected"

        body = f"""
SECURITY ALERT — Prompt Injection Attack Detected

A prompt injection attack was detected and blocked by the PID Framework.

Details:
- Blocked Prompt: {request.prompt}
- Detection Confidence: {round(request.confidence * 100)}%
- Detection Layer: {request.layer}
- Time: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This attack was completely blocked before reaching the AI system.

PID Framework — Griffith College Dublin MSc Project
Bindu Priya Vadlamudi — Student No: 3159626
        """
        msg.attach(MIMEText(body, "plain"))

        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(sender, password)
            server.sendmail(sender, request.to_email, msg.as_string())

        return {"success": True, "message": f"Alert sent to {request.to_email}"}
    except Exception as e:
        return {"success": False, "message": str(e)}