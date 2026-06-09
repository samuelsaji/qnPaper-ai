from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from database.db_operations import (
    create_user, get_user_by_email, create_template, get_templates_by_user
)
from database.db_schema import UserCreate, UserLogin
from dotenv import load_dotenv
import os
import shutil
import json
import logging
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("qgen")

app = FastAPI()
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY")
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_token(user_id: str):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload["user_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/signup")
async def signup(user: UserCreate):
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = create_user(user)
    return {"message": "User created successfully", "user_id": user_id}

@app.post("/api/login")
async def login(user: UserLogin):
    db_user = get_user_by_email(user.email)
    if not db_user or db_user["password"] != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(str(db_user["_id"]))
    return {"token": token, "user_id": str(db_user["_id"])}

@app.post("/api/templates")
async def create_template_endpoint(
    name: str = Form(...),
    total_marks: int = Form(...),
    user_id: str = Form(...),
    pdf_files: List[UploadFile] = File(...),
    current_user: str = Depends(verify_token)
):
    pdf_paths = []
    for pdf in pdf_files:
        file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{name}_{pdf.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(pdf.file, buffer)
        pdf_paths.append(file_path)
    
    template_id = create_template(user_id, name, total_marks, pdf_paths)
    return {"message": "Template created", "template_id": template_id}

@app.get("/api/templates/{user_id}")
async def get_templates(user_id: str, current_user: str = Depends(verify_token)):
    templates = get_templates_by_user(user_id)
    return templates

@app.get("/api/template-results/{template_id}")
async def get_template_results_endpoint(template_id: str, current_user: str = Depends(verify_token)):
    from database.db_operations import get_template_results
    print(f"Fetching results for template: {template_id}")
    results = get_template_results(template_id)
    print(f"Results found: {results}")
    if not results:
        raise HTTPException(status_code=404, detail="Results not found")
    return results

@app.post("/api/process-template/{template_id}")
async def process_template(template_id: str, current_user: str = Depends(verify_token)):
    from ai_pipeline_service.pdf_processor import process_pdf_to_json
    from database.db_operations import get_template_by_id, save_template_result
    
    print(f"Processing template: {template_id}")
    template = get_template_by_id(template_id)
    if not template:
        print(f"Template not found: {template_id}")
        raise HTTPException(status_code=404, detail="Template not found")
    
    print(f"Template found: {template}")
    results = []
    
    # Process each PDF one by one
    for idx, pdf_path in enumerate(template["pdf_files"], 1):
        print(f"\n{'='*60}")
        print(f"Processing PDF {idx}/{len(template['pdf_files'])}: {pdf_path}")
        print(f"{'='*60}")
        
        try:
            result_data = process_pdf_to_json(pdf_path)
            results.append(result_data)
            print(f"✓ Successfully processed PDF {idx}")
        except Exception as e:
            print(f"✗ Error processing PDF {idx}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Processing failed for PDF {idx}: {str(e)}")
    
    # Save all results to database
    result_id = save_template_result(template_id, results)
    print(f"\n✓ All PDFs processed. Results saved with ID: {result_id}")
    
    return {"message": "Template processed successfully", "result_id": result_id, "results": results}

@app.post("/api/upload-question-papers")
async def upload_question_papers(
    template_id: str = Form(...),
    question_papers: List[UploadFile] = File(...),
    current_user: str = Depends(verify_token)
):
    from database.db_operations import add_question_papers_to_template, get_template_by_id, update_template_with_questions
    from ai_pipeline_service_qp.qp_processor import process_qp_to_json
    
    # Step 1: Upload and save PDFs
    qp_paths = []
    for qp in question_papers:
        file_path = os.path.join(UPLOAD_DIR, f"qp_{template_id}_{qp.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(qp.file, buffer)
        qp_paths.append(file_path)
    
    add_question_papers_to_template(template_id, qp_paths)
    print(f"✓ Uploaded {len(qp_paths)} question paper(s)")
    
    # Step 2: Automatically process the uploaded question papers
    print(f"\n{'='*60}")
    print("🚀 AUTO-PROCESSING QUESTION PAPERS")
    print(f"{'='*60}")
    
    try:
        template = get_template_by_id(template_id)
        if not template:
            return {"message": "Question papers uploaded but processing skipped - template not found", "count": len(qp_paths)}
        
        # Process each question paper
        qp_results = []
        for idx, qp_path in enumerate(qp_paths, 1):
            print(f"\n📝 Processing Question Paper {idx}/{len(qp_paths)}: {qp_path}")
            try:
                result_data = process_qp_to_json(qp_path)
                qp_results.append(result_data)
                print(f"✓ Successfully processed question paper {idx}")
            except Exception as e:
                print(f"✗ Error processing question paper {idx}: {str(e)}")
                import traceback
                traceback.print_exc()
                # Continue with other papers even if one fails
        
        # Save questions to database
        if qp_results:
            update_template_with_questions(template_id, qp_results)
            print(f"\n✅ All question papers processed and saved")
            return {
                "message": f"Question papers uploaded and processed successfully! Extracted {len(qp_results)} paper(s).",
                "count": len(qp_paths),
                "processed": len(qp_results)
            }
        else:
            return {"message": "Question papers uploaded but processing failed", "count": len(qp_paths)}
            
    except Exception as e:
        print(f"Error during auto-processing: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"message": f"Question papers uploaded but processing failed: {str(e)}", "count": len(qp_paths)}

@app.post("/api/process-question-papers/{template_id}")
async def process_question_papers(template_id: str, current_user: str = Depends(verify_token)):
    """Extract questions from uploaded question papers"""
    from ai_pipeline_service_qp.qp_processor import process_qp_to_json
    from database.db_operations import (
        get_template_by_id, 
        get_template_results, 
        update_template_with_questions
    )
    
    print(f"Processing question papers for template: {template_id}")
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if "question_papers" not in template or not template["question_papers"]:
        raise HTTPException(status_code=400, detail="No question papers uploaded for this template")
    
    # Get syllabus topics from template results
    print("Fetching syllabus topics from template results...")
    template_results = get_template_results(template_id)
    if not template_results or "results" not in template_results:
        raise HTTPException(
            status_code=400, 
            detail="Template must be processed first to extract syllabus topics. Click 'Submit Template' first."
        )
    
    print(f"Processing question papers for template: {template_id}")
    template = get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if "question_papers" not in template or not template["question_papers"]:
        raise HTTPException(status_code=400, detail="No question papers uploaded for this template")
    
    # Process each question paper
    qp_results = []
    for idx, qp_path in enumerate(template["question_papers"], 1):
        print(f"\n{'='*60}")
        print(f"Processing Question Paper {idx}/{len(template['question_papers'])}: {qp_path}")
        print(f"{'='*60}")
        
        try:
            result_data = process_qp_to_json(qp_path)
            qp_results.append(result_data)
            print(f"✓ Successfully processed question paper {idx}")
        except Exception as e:
            print(f"✗ Error processing question paper {idx}: {str(e)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Processing failed for question paper {idx}: {str(e)}")
    
    # Save questions to database
    from database.db_operations import update_template_with_questions
    update_template_with_questions(template_id, qp_results)
    print(f"\n✓ All question papers processed and saved")
    
    return {"message": "Question papers processed successfully", "results": qp_results}

@app.get("/api/question-paper-results/{template_id}")
async def get_qp_results(template_id: str, current_user: str = Depends(verify_token)):
    """Get extracted questions for a template"""
    from database.db_operations import get_question_paper_results
    results = get_question_paper_results(template_id)
    if not results:
        raise HTTPException(status_code=404, detail="Question papers not found")
    return results



# Request schema for question generation
class GenerateRequest(BaseModel):
    template_id: str
    custom_instructions: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "template_id": "6a1db0c90cfbb0538d43466e",
                "custom_instructions": "Focus only on Module 1 topics"
            }
        }


@app.post("/api/generate")
def generate(request: GenerateRequest):
    """
    Generate a new question paper for a template.

    Pulls syllabus and PYQ data from MongoDB automatically.
    Works for any subject — no additional parameters needed.

    Required:
      template_id: The MongoDB _id of the template

    Optional:
      custom_instructions: Extra focus instructions for Gemini
        e.g. "Focus only on Module 3"
        e.g. "Generate only numerical questions"
        e.g. "Make all questions hard difficulty"
    """
    from question_paper_generation.generator import generate_question_paper
    from database.db_operations import save_generated_questions

    logger.info(f"Generate request — template: {request.template_id}")

    # Generate
    result = generate_question_paper(
        template_id=request.template_id,
        custom_instructions=request.custom_instructions,
    )

    if not result:
        raise HTTPException(
            status_code=500,
            detail=(
                "Question generation failed. "
                "Ensure: (1) template_id is valid, "
                "(2) template has been processed (syllabus extracted), "
                "(3) question papers have been uploaded, "
                "(4) GOOGLE_GEMINI_API_KEY is set in .env"
            )
        )

    if not result.get("questions"):
        raise HTTPException(
            status_code=500,
            detail="Gemini returned no questions. Try again or add custom_instructions."
        )

    # Save to MongoDB
    try:
        generation_id = save_generated_questions(
            template_id=request.template_id,
            result=result,
        )
        logger.info(f"Saved — {result['question_count']} questions, id={generation_id}")
    except Exception as e:
        logger.error(f"DB save failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save to database: {e}")

    return {
        "generation_id": generation_id,
        "template_id": request.template_id,
        **result,
    }


@app.get("/generated/{template_id}")
def get_all_generated(template_id: str):
    """Get all generated question papers for a template."""
    from database.db_operations import get_generated_questions
    try:
        papers = get_generated_questions(template_id)
        return {
            "template_id": template_id,
            "total": len(papers),
            "generated_papers": papers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/generated/paper/{generation_id}")
def get_one_generated(generation_id: str):
    """Get one specific generated question paper by its ID."""
    from database.db_connection import get_database
    from bson import ObjectId

    try:
        db = get_database()
        doc = db["generated_questions"].find_one({"_id": ObjectId(generation_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Generated paper not found")
        doc["_id"] = str(doc["_id"])
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


