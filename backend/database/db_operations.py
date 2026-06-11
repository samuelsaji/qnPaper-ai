from bson import ObjectId
from typing import List, Optional
from database.db_schema import UserCreate
from database.db_connection import get_database
from bson import ObjectId


db = get_database()
user_collection = db["users"]
template_collection = db["templates"]

def create_user(user: UserCreate) -> str:
    user_dict = {
        "name": user.name,
        "email": user.email,
        "password": user.password
    }
    result = user_collection.insert_one(user_dict)
    return str(result.inserted_id)

def get_user_by_email(email: str) -> Optional[dict]:
    return user_collection.find_one({"email": email})

def create_template(user_id: str, name: str, total_marks: int, pdf_files: List[str]) -> str:
    template_dict = {
        "user_id": user_id,
        "name": name,
        "total_marks": total_marks,
        "pdf_files": pdf_files
    }
    result = template_collection.insert_one(template_dict)
    return str(result.inserted_id)

def get_templates_by_user(user_id: str) -> List[dict]:
    templates = list(template_collection.find({"user_id": user_id}))
    for template in templates:
        template_id = str(template["_id"])
        template["_id"] = template_id
        
        # Check if this template has results
        result = db["template_results"].find_one({"template_id": template_id})
        template["has_results"] = result is not None
    return templates

def get_template_by_id(template_id: str) -> Optional[dict]:
    try:
        return template_collection.find_one({"_id": ObjectId(template_id)})
    except Exception as e:
        print(f"Error finding template: {e}")
        return None

def save_template_result(template_id: str, results: List[dict]) -> str:
    result_dict = {
        "template_id": template_id,
        "results": results,
        "created_at": str(ObjectId())
    }
    result = db["template_results"].insert_one(result_dict)
    return str(result.inserted_id)


def save_template_layout(template_id: str, layout: dict) -> None:
    """Upsert layout for a template (one layout per template)."""
    db["template_layouts"].update_one(
        {"template_id": template_id},
        {"$set": {"template_id": template_id, "layout": layout}},
        upsert=True
    )

def get_template_layout(template_id: str) -> Optional[dict]:
    """Return saved layout for a template, or None."""
    doc = db["template_layouts"].find_one({"template_id": template_id})
    if doc:
        return doc.get("layout")
    return None

def save_template_config(template_id: str, config: dict) -> None:
    """Save exam config details onto the template document."""
    try:
        template_collection.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": {"config": config}}
        )
    except Exception as e:
        print(f"Error saving template config: {e}")
        raise

def get_template_config(template_id: str) -> Optional[dict]:
    """Return saved config for a template, or None."""
    try:
        doc = template_collection.find_one({"_id": ObjectId(template_id)}, {"config": 1})
        return doc.get("config") if doc else None
    except Exception as e:
        print(f"Error getting template config: {e}")
        return None

def get_template_results(template_id: str) -> Optional[dict]:
    try:
        print(f"Searching for template_id: '{template_id}' (type: {type(template_id)})")
        
        # Try both string and ObjectId formats
        result = db["template_results"].find_one({"template_id": template_id})
        
        if not result:
            # Try with ObjectId conversion
            try:
                result = db["template_results"].find_one({"template_id": ObjectId(template_id)})
            except:
                pass
        
        print(f"Found result: {result is not None}")
        if result:
            result["_id"] = str(result["_id"])
        return result
    except Exception as e:
        print(f"Error finding template results: {e}")
        import traceback
        traceback.print_exc()
        return None

def add_question_papers_to_template(template_id: str, question_paper_paths: List[str]):
    try:
        template_collection.update_one(
            {"_id": ObjectId(template_id)},
            {"$push": {"question_papers": {"$each": question_paper_paths}}}
        )
        print(f"Added {len(question_paper_paths)} question papers to template {template_id}")
    except Exception as e:
        print(f"Error adding question papers: {e}")
        raise

def save_question_paper_result(template_id: str, qp_results: List[dict]) -> str:
    """Save extracted questions to database"""
    result_dict = {
        "template_id": template_id,
        "questions": qp_results,
        "created_at": str(ObjectId())
    }
    result = db["question_papers"].insert_one(result_dict)
    return str(result.inserted_id)

def get_question_paper_results(template_id: str) -> Optional[dict]:
    """Get extracted questions for a template"""
    try:
        result = db["question_papers"].find_one({"template_id": template_id})
        if result:
            result["_id"] = str(result["_id"])
        return result
    except Exception as e:
        print(f"Error finding question papers: {e}")
        return None

def update_template_with_questions(template_id: str, qp_results: List[dict]):
    """
    Update template with extracted questions.
    Stores questions directly without topic mapping.
    Flattens all questions from multiple question papers into a single array.
    """
    try:
        # Flatten all questions from all question papers
        all_questions = []
        for qp_result in qp_results:
            if "questions" in qp_result and isinstance(qp_result["questions"], list):
                all_questions.extend(qp_result["questions"])
        
        # Check if document already exists
        existing = db["question_papers"].find_one({"template_id": template_id})
        
        if existing:
            # Update existing document by appending new questions
            db["question_papers"].update_one(
                {"template_id": template_id},
                {
                    "$push": {"questions": {"$each": all_questions}},
                    "$set": {"updated_at": str(ObjectId())}
                }
            )
            print(f"✓ Added {len(all_questions)} questions to existing document")
        else:
            # Create new document
            result_dict = {
                "template_id": template_id,
                "questions": all_questions,
                "created_at": str(ObjectId())
            }
            db["question_papers"].insert_one(result_dict)
            print(f"✓ Saved {len(all_questions)} questions to new document")
            
    except Exception as e:
        print(f"Error saving questions: {e}")
        import traceback
        traceback.print_exc()
        raise


def save_generated_questions(template_id: str, result: dict) -> str:
    """Save generated question paper to generated_questions collection."""
    db = get_database()
    doc = {"template_id": template_id, **result}
    inserted = db["generated_questions"].insert_one(doc)
    return str(inserted.inserted_id)


def get_generated_questions(template_id: str) -> list:
    """Get all generated question papers for a template, newest first."""
    db = get_database()
    docs = list(db["generated_questions"].find({"template_id": template_id}).sort("_id", -1))
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs