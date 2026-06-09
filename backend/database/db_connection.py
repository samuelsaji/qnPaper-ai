from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

def get_database():
    client = MongoClient(MONGO_URI)
    return client["codescape_proj"]
