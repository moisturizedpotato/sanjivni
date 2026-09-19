# otp_login/agent.py
import json
import logging
import os

logger = logging.getLogger('otp_login.security')

AGENT_MODELS = tuple(
    model.strip()
    for model in os.getenv(
        'GOOGLE_AGENT_MODELS',
        'gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.8-flash',
    ).split(',')
    if model.strip()
)


def _is_rate_limit_error(exc):
    message = str(exc).lower()
    return any(value in message for value in (
        '429', 'rate limit', 'rate_limit', 'resource exhausted', 'quota',
    ))


def _extract_text_from_response(response):
    """Normalise Gemini content objects into a plain string."""
    if response is None:
        return ''
    content = getattr(response, 'content', response)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict):
                for key in ('text', 'content'):
                    value = item.get(key)
                    if value:
                        return str(value)
            elif item is not None:
                return str(item)
        return ''
    if isinstance(content, dict):
        for key in ('text', 'content'):
            value = content.get(key)
            if value:
                return str(value)
        return json.dumps(content, ensure_ascii=False)
    return str(content)


def generate_health_summary(patient_data: str) -> str:
    """Uses Gemini to generate a structured 1-page health brief."""
    try:
        from langchain_core.prompts import PromptTemplate
        from langchain_google_genai import ChatGoogleGenerativeAI

        template = """
        You are an expert medical AI assistant. Your task is to generate a comprehensive 1-page health brief for a doctor based on the patient's provided data.

        Format the output EXACTLY like this template (use Markdown):
        PATIENT OVERVIEW
        Name: [Name] | Age: [Age] | Blood Group: [Blood Group]
        Overall Health Score: [Score]

        🚨 ALLERGIES & CONTRAINDICATIONS
        • [List allergies or state None]

        ⚕️ ACTIVE CONDITIONS
        • [List conditions with relevant dates]

        📋 RECENT INVESTIGATIONS
        • [List labs, x-rays, and tests with key findings]

        💊 CURRENT MEDICATIONS
        • [List current medicines and their purpose based on the records]

        🩺 LATEST VITALS
        • [List vitals]

        📅 FOLLOW-UPS DUE
        • [List upcoming follow-ups and appointments]

        Here is the raw patient data to process:
        {patient_data}

        Generate the summary now. Do not include any conversational filler before or after the template.
        """
        prompt = PromptTemplate.from_template(template)
        last_error = None
        for model in AGENT_MODELS:
            try:
                llm = ChatGoogleGenerativeAI(temperature=0, model=model)
                response = (prompt | llm).invoke({'patient_data': patient_data})
                summary = _extract_text_from_response(response).strip()
                if not summary:
                    raise ValueError('Empty model response')
                logger.info('health_summary action=generate result=success model=%s', model)
                return summary
            except Exception as exc:
                last_error = exc
                logger.warning(
                    'health_summary action=provider_failed model=%s rate_limited=%s error_type=%s',
                    model, _is_rate_limit_error(exc), type(exc).__name__,
                )
        raise last_error or RuntimeError('No AI models configured')
    except Exception as exc:
        logger.warning('health_summary action=generate result=fallback error_type=%s', type(exc).__name__)
        return (
            'PATIENT OVERVIEW\n'
            'Name: Patient | Age: Not specified | Blood Group: Not specified\n'
            'Overall Health Score: Demo\n\n'
            '🚨 ALLERGIES & CONTRAINDICATIONS\n'
            '• None recorded in the local demo record\n\n'
            '⚕️ ACTIVE CONDITIONS\n'
            '• Review patient records for active conditions\n\n'
            '📋 RECENT INVESTIGATIONS\n'
            '• No recent investigations available in the demo dataset\n\n'
            '💊 CURRENT MEDICATIONS\n'
            '• Confirm medication list manually from prescription records\n\n'
            '🩺 LATEST VITALS\n'
            '• Vitals unavailable in the demo fallback\n\n'
            '📅 FOLLOW-UPS DUE\n'
            '• Schedule follow-up review with the attending clinician'
        )


# ============================================
# TOOLS FOR SYMPTOM CHECKER AGENT
# ============================================

# ============================================
# TOOL IMPLEMENTATIONS (raw functions)
# ============================================

def _fetch_patient_profile_impl(phone_number: str) -> str:
    """Implementation of fetching patient profile."""
    from .models import UserProfile
    try:
        logger.debug('symptom_agent_action action=fetch_patient_profile')
        user = UserProfile.objects.get(phone_number=phone_number)
        profile_info = {
            "name": user.full_name or "Not provided",
            "age": user.age or "Not provided",
            "blood_group": user.blood_group or "Not provided",
            "abha_id": user.abha_id or "Not provided",
            "phone": user.phone_number,
        }
        result = json.dumps(profile_info)
        logger.debug('symptom_agent_action action=fetch_patient_profile result=success')
        return result
    except Exception:
        error_msg = json.dumps({"error": "Patient profile unavailable"})
        logger.warning('symptom_agent_action action=fetch_patient_profile result=error')
        return error_msg


def _fetch_patient_medical_history_impl(phone_number: str) -> str:
    """Implementation of fetching medical history."""
    from .models import DigiLockerDocument
    try:
        logger.debug('symptom_agent_action action=fetch_patient_medical_history')
        documents = list(DigiLockerDocument.objects.filter(
            user_identifier=phone_number
        ).values('title', 'doc_type', 'issuer', 'date', 'note'))
        
        logger.debug('symptom_agent_action action=fetch_patient_medical_history result=success')
        
        if not documents:
            result = json.dumps({
                "medical_history": "No medical documents found in DigiLocker",
                "documents_count": 0
            })
        else:
            result = json.dumps({
                "medical_history": documents,
                "documents_count": len(documents),
                "phone_number": phone_number
            })
        
        logger.debug('symptom_agent_action action=fetch_patient_medical_history result=success')
        return result
    except Exception:
        error_msg = json.dumps({"error": "Medical history unavailable"})
        logger.warning('symptom_agent_action action=fetch_patient_medical_history result=error')
        return error_msg


# Create wrapped tools for the agent
def fetch_patient_profile(phone_number: str) -> str:
    """Fetch complete patient profile including personal details.
    Use this to get patient's name, age, blood group, and ABHA ID."""
    return _fetch_patient_profile_impl(phone_number)


def fetch_patient_medical_history(phone_number: str) -> str:
    """Fetch patient's medical history from DigiLocker including documents, vaccinations, and health records.
    Use this to understand the patient's medical background."""
    return _fetch_patient_medical_history_impl(phone_number)


# ============================================
# AGENT INITIALIZATION
# ============================================

def get_symptom_agent(model=None):
    """Build and return the Symptom Checker Agent with access to patient data tools."""
    from langchain_core.tools import tool
    from langchain_google_genai import ChatGoogleGenerativeAI

    # Initialize Gemini model
    llm = ChatGoogleGenerativeAI(temperature=0.3, model=model or AGENT_MODELS[0])
    
    # Define available tools
    tools = [tool(fetch_patient_profile), tool(fetch_patient_medical_history)]
    
    # Bind tools directly to the model
    llm_with_tools = llm.bind_tools(tools)
    
    return llm_with_tools


# ============================================
# SYMPTOM ANALYSIS WITH AI AGENT
# ============================================

def _format_agent_response_once(user_text, phone_number, model):
    """
    Use the AI to analyze symptoms based on patient's complete medical history.
    Calls LLM with tools, processes the response, and handles tool calls.
    """
    import re
    from langchain_core.messages import HumanMessage, ToolMessage, BaseMessage
    
    def log_event(event, result='processing'):
        logger.debug('symptom_agent_event event=%s result=%s', event, result)
    
    try:
        log_event('start')
        
        llm_with_tools = get_symptom_agent(model)
        log_event('agent_created', 'success')
        
        # Build prompt
        prompt_text = f"""You are a medical AI assistant analyzing a patient's symptoms.

Patient Phone: {phone_number}
Patient Symptoms: {user_text}

IMPORTANT: Use the available tools to:
1. fetch_patient_profile - Get patient details (name, age, blood group)
2. fetch_patient_medical_history - Get medical records from DigiLocker

After fetching patient data, analyze the symptoms and provide your response as a JSON object with these exact fields:
{{"specialist": "Specialist type", "urgency": "low|medium|high", "advice": "Medical advice"}}

Respond with ONLY the JSON object, no other text."""
        
        log_event('llm_call')
        messages = [HumanMessage(content=prompt_text)]
        
        # Invoke the model
        response = llm_with_tools.invoke(messages)
        log_event('llm_response', 'received')
        
        # Handle tool calls if present
        if hasattr(response, 'tool_calls') and response.tool_calls:
            log_event('tool_calls', 'received')
            # Process tool calls
            messages.append(response)
            
            for tool_call in response.tool_calls:
                log_event('tool_call', 'executing')
                tool_name = tool_call['name']
                tool_args = tool_call['args']
                
                # Call the implementation functions directly
                if tool_name == 'fetch_patient_profile':
                    result = _fetch_patient_profile_impl(tool_args.get('phone_number', phone_number))
                elif tool_name == 'fetch_patient_medical_history':
                    result = _fetch_patient_medical_history_impl(tool_args.get('phone_number', phone_number))
                else:
                    result = json.dumps({"error": f"Unknown tool: {tool_name}"})
                
                messages.append(ToolMessage(content=result, tool_call_id=tool_call['id']))
            
            # Get final response after tools
            log_event('llm_followup')
            response = llm_with_tools.invoke(messages)
        
        raw_response = _extract_text_from_response(response)
        log_event('response_normalisation')
        
        if not raw_response:
            log_event('empty_response', 'fallback')
            return {
                "specialist": "General Physician",
                "urgency": "medium",
                "advice": "Please consult a doctor for a comprehensive evaluation of your symptoms."
            }
        
        # Parse JSON from response - remove code blocks if present
        clean_json = str(raw_response).replace("```json", "").replace("```", "").strip()
        
        json_match = re.search(r'\{.*?\}', clean_json, re.DOTALL)
        if json_match:
            clean_json = json_match.group(0)
        
        try:
            parsed = json.loads(clean_json)
            log_event('json_parse', 'success')
            
            if "specialist" in parsed and "urgency" in parsed and "advice" in parsed:
                if parsed["urgency"] not in ["low", "medium", "high"]:
                    parsed["urgency"] = "medium"
                log_event('response_validation', 'success')
                return parsed
            else:
                log_event('response_validation', 'fallback')
                return {
                    "specialist": "General Physician",
                    "urgency": "medium",
                    "advice": "Please consult a doctor for proper evaluation based on your symptoms and medical history."
                }
        except json.JSONDecodeError:
            log_event('json_parse', 'fallback')
            return {
                "specialist": "General Physician",
                "urgency": "medium",
                "advice": "Please consult a doctor for a comprehensive evaluation of your symptoms."
            }
            
    except Exception:
        log_event('processing', 'fallback')
        raise


def format_agent_response(user_text, phone_number):
    """Analyze symptoms, falling back to the next model when a provider fails."""
    for model in AGENT_MODELS:
        try:
            result = _format_agent_response_once(user_text, phone_number, model)
            logger.info('symptom_agent action=analyze result=success model=%s', model)
            return result
        except Exception as exc:
            logger.warning(
                'symptom_agent action=provider_failed model=%s rate_limited=%s error_type=%s',
                model, _is_rate_limit_error(exc), type(exc).__name__,
            )
    return {
        "specialist": "General Physician",
        "urgency": "medium",
        "advice": "The AI service is temporarily unavailable. Please consult a General Physician for an in-person evaluation.",
        "degraded": True,
    }