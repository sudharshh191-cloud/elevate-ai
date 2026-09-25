from typing import List, Dict, Any

class RAGEngine:
    @staticmethod
    def generate_contextual_questions(domain: str, candidate_skills: List[str], difficulty: str, count: int = 3) -> List[Dict[str, Any]]:
        questions = [
            {
                "question_text": f"Given your experience with {', '.join(candidate_skills[:3]) if candidate_skills else domain}, explain how you would architect a zero-downtime database migration strategy for a high-traffic microservice.",
                "domain": domain,
                "category": "Architecture & Reliability",
                "difficulty": difficulty,
                "hints": [
                    "Discuss the expand-and-contract pattern (dual writes).",
                    "Address schema versioning and rollback triggers."
                ],
                "rubric_criteria": [
                    {"title": "Migration Strategy", "weight": 40},
                    {"title": "Data Consistency", "weight": 30},
                    {"title": "Failure Recovery", "weight": 30}
                ],
                "ideal_answer_outline": "The optimal pattern uses the 4-phase Expand and Contract approach: 1. Add new columns/tables in parallel. 2. Write to both old and new schemas (dual writing) while reading from old. 3. Backfill historic data. 4. Switch reads to new schema and deprecate old writes."
            },
            {
                "question_text": "Walk me through how you design an idempotent payment processing webhook receiver that handles duplicate deliveries and network partitions gracefully.",
                "domain": domain,
                "category": "Idempotency & Concurrency",
                "difficulty": difficulty,
                "hints": [
                    "Use unique idempotency keys in Redis or a relational unique index constraint.",
                    "Implement a state machine with pending, processing, and completed statuses."
                ],
                "rubric_criteria": [
                    {"title": "Idempotency Enforcement", "weight": 40},
                    {"title": "Distributed Locking / Atomicity", "weight": 35},
                    {"title": "Error Handling & Retries", "weight": 25}
                ],
                "ideal_answer_outline": "Assign each webhook event an Idempotency-Key. Check in Redis/Postgres inside an atomic transaction. If key exists with status COMPLETED, return cached 200 OK immediately. If IN_PROGRESS, wait or return 409/429. If not found, create record and process within a distributed lock."
            }
        ]
        return questions[:count]
