import re
import io
from typing import List, Dict, Any, Optional
import pypdf

try:
    import docx
except ImportError:
    docx = None

TECH_SKILLS_DICTIONARY = [
    # Programming Languages
    "Python", "TypeScript", "JavaScript", "Go", "Golang", "Rust", "Java", "C++", "C#", "C", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
    # Frontend Technologies & Frameworks
    "React", "Next.js", "Vue", "Angular", "Svelte", "Redux", "Zustand", "Tailwind CSS", "HTML5", "CSS3", "Sass", "Webpack", "Vite",
    "WebSockets", "WebRTC", "Web Audio API", "GraphQL", "REST APIs",
    # Backend & Frameworks
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot", "NestJS", "gRPC", "Microservices",
    # Databases & Caching
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "SQLite", "Elasticsearch", "Neo4j", "Prisma", "Mongoose",
    # Cloud & DevOps
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD", "GitHub Actions", "Linux", "Nginx", "Ansible",
    # Messaging & Distributed Systems
    "Kafka", "RabbitMQ", "Event-Driven Architecture", "System Design", "Distributed Systems", "Message Queues",
    # Testing & QA
    "Jest", "Pytest", "Cypress", "Mocha", "Playwright", "Selenium", "TDD",
    # AI / ML
    "PyTorch", "TensorFlow", "scikit-learn", "Pandas", "NumPy", "OpenAI", "Gemini", "LangChain", "RAG", "LLM", "NLP"
]

ROLE_KEY_SKILLS = {
    "frontend": ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Next.js", "Tailwind CSS", "Redux", "WebSockets"],
    "backend": ["Node.js", "Python", "Go", "Java", "PostgreSQL", "MongoDB", "Redis", "Microservices", "REST APIs", "gRPC", "Docker"],
    "fullstack": ["React", "TypeScript", "Node.js", "PostgreSQL", "MongoDB", "Redis", "Docker", "REST APIs", "Next.js", "AWS"],
    "devops": ["Docker", "Kubernetes", "AWS", "GCP", "Terraform", "CI/CD", "Linux", "GitHub Actions"],
    "staff": ["System Design", "Distributed Systems", "Microservices", "Kafka", "Kubernetes", "AWS", "PostgreSQL", "Redis"],
}

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        if not pdf_bytes or len(pdf_bytes) == 0:
            raise ValueError("The uploaded PDF file is empty (0 bytes).")

        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            if len(reader.pages) == 0:
                raise ValueError("The uploaded PDF contains 0 pages.")

            extracted_pages = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text)

            full_text = "\n".join(extracted_pages).strip()
            if not full_text:
                raise ValueError("Could not extract readable text from PDF. The file may be a scanned image or corrupted.")

            return full_text
        except Exception as e:
            if isinstance(e, ValueError):
                raise e
            raise ValueError(f"Corrupted or unreadable PDF document: {str(e)}")

    @staticmethod
    def extract_text_from_docx_bytes(docx_bytes: bytes) -> str:
        if not docx_bytes or len(docx_bytes) == 0:
            raise ValueError("The uploaded DOCX file is empty (0 bytes).")

        try:
            doc = docx.Document(io.BytesIO(docx_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            full_text = "\n".join(paragraphs).strip()
            if not full_text:
                raise ValueError("Could not extract readable text from DOCX document.")
            return full_text
        except Exception as e:
            if isinstance(e, ValueError):
                raise e
            raise ValueError(f"Corrupted or unreadable DOCX document: {str(e)}")

    @staticmethod
    def extract_skills_from_text(text: str) -> List[str]:
        if not text:
            return []

        text_lower = text.lower()
        matched_skills = []

        for skill in TECH_SKILLS_DICTIONARY:
            pattern = r'(?:\b|(?<=[^a-zA-Z0-9]))' + re.escape(skill.lower()) + r'(?:\b|(?=[^a-zA-Z0-9])|(?=[A-Z]))'
            if re.search(pattern, text, re.IGNORECASE):
                matched_skills.append(skill)

        # Retain order of discovery while deduplicating
        seen = set()
        deduped = []
        for s in matched_skills:
            if s not in seen:
                seen.add(s)
                deduped.append(s)

        return deduped

    @staticmethod
    def estimate_experience_years(text: str) -> float:
        if not text:
            return 3.0

        # Pattern 1: e.g. "5+ years of experience", "7 years"
        match = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)(?:\s+of\s+experience)?', text, re.IGNORECASE)
        if match:
            try:
                val = float(match.group(1))
                if 0.5 <= val <= 40:
                    return val
            except ValueError:
                pass

        # Pattern 2: Year range detection e.g., 2019 - 2024, 2018 - Present
        year_ranges = re.findall(r'\b(200\d|201\d|202[0-6])\s*[-–—]\s*(Present|Current|20[0-2]\d)\b', text, re.IGNORECASE)
        if year_ranges:
            earliest_year = 2026
            for start_str, _ in year_ranges:
                try:
                    start_yr = int(start_str)
                    if start_yr < earliest_year:
                        earliest_year = start_yr
                except ValueError:
                    pass
            if earliest_year < 2026:
                diff = 2026 - earliest_year
                return float(min(30, max(1, diff)))

        return 4.0

    @staticmethod
    def extract_education(text: str) -> List[Dict[str, str]]:
        education_list = []
        degrees = [
            (r'Master(?:\'s)?\s*(?:of\s+Science|in\s+Computer\s+Science|in\s+Engineering|Degree)?|\bM\.?S\.?\b|\bMCA\b', 'Master of Science (M.S.) in Computer Science'),
            (r'Bachelor(?:\'s)?\s*(?:of\s+Science|of\s+Technology|of\s+Engineering|in\s+Computer\s+Science)?|\bB\.?S\.?\b|\bB\.?Tech\b|\bB\.?E\.?\b', 'Bachelor of Science (B.S.) in Computer Science / Engineering'),
            (r'\bPh\.?D\.?\b|\bDoctorate\b', 'Ph.D. in Computer Science'),
        ]

        for pattern, default_title in degrees:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Look for university name nearby
                uni_match = re.search(r'(?:University|Institute|College|Academy|State)\s+[A-Za-z\s]+', text[max(0, match.start() - 100):min(len(text), match.end() + 100)], re.IGNORECASE)
                institution = uni_match.group(0).strip() if uni_match else "Accredited University"
                education_list.append({
                    "degree": default_title,
                    "institution": institution
                })
                break

        if not education_list:
            education_list.append({
                "degree": "B.S. in Computer Science or Equivalent Engineering",
                "institution": "University / Institute"
            })

        return education_list

    @staticmethod
    def extract_work_highlights(text: str) -> List[str]:
        lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 25]
        bullet_lines = []
        for line in lines:
            if re.match(r'^[•\-\*–]\s+', line) or re.search(r'\b(developed|architected|built|designed|implemented|optimized|scaled|led)\b', line, re.IGNORECASE):
                cleaned = re.sub(r'^[•\-\*–\s]+', '', line).strip()
                if len(cleaned) > 20:
                    bullet_lines.append(cleaned)
                    if len(bullet_lines) >= 3:
                        break

        if not bullet_lines:
            bullet_lines = [
                "Engineered performant, highly-available services and scalable cloud components",
                "Streamlined CI/CD build pipelines and improved overall developer efficiency"
            ]

        return bullet_lines

    @staticmethod
    def calculate_ats_and_alignment(skills: List[str], target_role: str, text: str = "") -> Dict[str, Any]:
        skill_count = len(skills)
        role_lower = (target_role or "Fullstack").lower()

        # Determine target category
        category = "fullstack"
        if "front" in role_lower:
            category = "frontend"
        elif "back" in role_lower or "distributed" in role_lower:
            category = "backend"
        elif "devops" in role_lower or "infra" in role_lower:
            category = "devops"
        elif "staff" in role_lower or "principal" in role_lower or "architect" in role_lower:
            category = "staff"

        key_skills = ROLE_KEY_SKILLS.get(category, ROLE_KEY_SKILLS["fullstack"])
        matched_key = [s for s in skills if any(ks.lower() == s.lower() for ks in key_skills)]
        role_match_ratio = len(matched_key) / max(1, len(key_skills))

        # Base ATS calculation: Skills presence (40) + Keyword density (30) + Structural formatting (30)
        has_sections = sum([
            1 for sec in ['experience', 'education', 'skills', 'projects', 'summary']
            if sec in text.lower()
        ]) if text else 4

        section_score = (has_sections / 5.0) * 30
        skill_score = min(40, skill_count * 3.5)
        relevance_score = min(30, role_match_ratio * 30 + 10)

        ats_score = int(min(98, max(50, section_score + skill_score + relevance_score)))
        target_role_match = int(min(98, max(55, 50 + role_match_ratio * 45)))

        # Recommended focus areas based on role and skills
        focus_areas = []
        if category == "frontend":
            focus_areas = [
                "Advanced Core Web Vitals (LCP, INP, CLS) & Rendering Performance",
                "Complex State Machines, Micro-Frontends & Hydration Strategies",
                "Reactive Stream Management & WebSocket Connection Resiliency"
            ]
        elif category == "backend":
            focus_areas = [
                "High-Throughput Distributed Systems & Kafka Partitioning Strategies",
                "Relational vs NoSQL Schema Tradeoffs & Index Tuning under 50k+ QPS",
                "Distributed Locking, Idempotency & Saga Orchestration"
            ]
        elif category == "staff":
            focus_areas = [
                "Global Multi-Region Active-Active Replication & Disaster Recovery",
                "Cross-Service Failure Domains, Circuit Breakers & Backpressure",
                "STAR Behavioral Leadership & Cross-Organizational Consensus Building"
            ]
        else:
            focus_areas = [
                "End-to-End Type Safety & Microservice Contract Verification",
                "Distributed Caching Invalidation Patterns (Cache-Aside vs Write-Through)",
                "Full-Stack Observability with OpenTelemetry & Distributed Tracing"
            ]

        return {
            "ats_score": ats_score,
            "target_role_match": target_role_match,
            "recommended_focus_areas": focus_areas
        }
