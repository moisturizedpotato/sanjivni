# otp_login/agent.py
import json
import os
from langchain_core.tools import tool
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI # <-- New import
from langchain_core.prompts import PromptTemplate

def generate_health_summary(patient_data: str) -> str:
    """Uses Gemini 1.5 Flash to generate a structured 1-page health brief."""

    os.environ["GOOGLE_API_KEY"] = "test"
    
    # Initialize the fast Gemini model
    llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-3.5-flash")
    
    # Strict formatting template
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
    
    # Build the LCEL Chain
    chain = prompt | llm
    
    # Invoke the model
    response = chain.invoke({"patient_data": patient_data})
    
    return response.content

# 1. Define the tool
@tool
def fetch_patient_profile(phone_number: str) -> str:
    """Use this to look up patient details based on their phone number."""
    from .models import UserProfile
    try:
        user = UserProfile.objects.get(phone_number=phone_number)
        return f"User is verified. Phone: {user.phone_number}"
    except Exception:
        return "No user profile found."

# 2. Build the Agent with Gemini
def get_symptom_agent():
    # Set your Gemini API Key here
    os.environ["GOOGLE_API_KEY"] = "test"
    
    # Initialize the Gemini model (gemini-1.5-flash is extremely fast for this)
    llm = ChatGoogleGenerativeAI(temperature=0, model="gemini-3.5-flash")
    
    # Pass the tool directly
    tools = [fetch_patient_profile]
    
    # Create the agent executor
    agent_executor = create_agent(llm, tools=tools)
    
    return agent_executor

# 3. Format the execution
def format_agent_response(user_text, phone_number):
    agent_executor = get_symptom_agent()
    
    prompt_text = f"""
    Patient Phone: {phone_number}
    Patient Symptoms: {user_text}
    
    Analyze the symptoms. You must return your response ONLY as a raw JSON object with exactly these three keys:
    "specialist": (string, e.g., "Cardiologist", "General Physician"),
    "urgency": (string, exactly "low", "medium", or "high"),
    "advice": (string, 2-3 sentences of advice)
    """
    
    # Invoke the agent using the modern messages format
    response = agent_executor.invoke({"messages": [("user", prompt_text)]})
    
    # Extract the final AI message content
    raw_response = response["messages"][-1].content
    
    # Handle Gemini's list output structure
    if isinstance(raw_response, list):
        extracted_text = ""
        for block in raw_response:
            if isinstance(block, dict) and "text" in block:
                extracted_text += block["text"]
            elif isinstance(block, str):
                extracted_text += block
        raw_response = extracted_text
    
    # Clean up and parse the LLM's JSON
    try:
        clean_json = raw_response.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"Failed to parse AI JSON: {e}")
        return {
            "specialist": "General Physician", 
            "urgency": "medium", 
            "advice": "Please consult a doctor for a proper evaluation."
        }