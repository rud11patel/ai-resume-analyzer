import re
from typing import Dict, Optional, Tuple, Set

# Comprehensive taxonomy mapping Canonical Skill Name -> Category
SKILL_TAXONOMY: Dict[str, str] = {
    # Programming Languages
    "Python": "Languages",
    "JavaScript": "Languages",
    "TypeScript": "Languages",
    "Go": "Languages",
    "Java": "Languages",
    "C": "Languages",
    "C++": "Languages",
    "C#": "Languages",
    "Rust": "Languages",
    "Ruby": "Languages",
    "PHP": "Languages",
    "Swift": "Languages",
    "Kotlin": "Languages",
    "SQL": "Languages",
    "HTML5": "Languages",
    "CSS3": "Languages",
    "Bash": "Languages",
    "Assembly": "Languages",
    
    # Embedded Systems & Hardware Engineering
    "Embedded C": "Embedded",
    "FPGA Development": "Hardware",
    "VHDL": "Hardware",
    "Verilog": "Hardware",
    "SystemVerilog": "Hardware",
    "PCB Design": "Hardware",
    "Hardware Debugging": "Hardware",
    "RTOS": "Embedded",
    "FreeRTOS": "Embedded",
    "Microcontrollers": "Embedded",
    "ARM Architecture": "Embedded",
    "Firmware Development": "Embedded",
    "I2C": "Embedded",
    "SPI": "Embedded",
    "UART": "Embedded",
    "CAN Bus": "Embedded",
    "Oscilloscope": "Hardware",
    "Logic Analyzer": "Hardware",
    "Circuit Design": "Hardware",
    "Schematic Capture": "Hardware",
    "Altium": "Hardware",
    
    # AI/ML & Data Science
    "Machine Learning": "AI/ML",
    "Deep Learning": "AI/ML",
    "PyTorch": "AI/ML",
    "TensorFlow": "AI/ML",
    "Scikit-Learn": "AI/ML",
    "NLP": "AI/ML",
    "Computer Vision": "AI/ML",
    "LLMs": "AI/ML",
    "LangChain": "AI/ML",
    "Pandas": "AI/ML",
    "NumPy": "AI/ML",
    
    # Frontend
    "React": "Frontend",
    "Vue.js": "Frontend",
    "Angular": "Frontend",
    "Next.js": "Frontend",
    "Svelte": "Frontend",
    "Tailwind CSS": "Frontend",
    "Redux": "Frontend",
    "Vite": "Frontend",
    "Webpack": "Frontend",
    "Responsive Design": "Frontend",
    "Accessibility (a11y)": "Frontend",
    "Web Vitals": "Frontend",
    
    # Backend
    "Node.js": "Backend",
    "Express.js": "Backend",
    "FastAPI": "Backend",
    "Django": "Backend",
    "Flask": "Backend",
    "Spring Boot": "Backend",
    "Ruby on Rails": "Backend",
    "ASP.NET": "Backend",
    "REST APIs": "Backend",
    "GraphQL": "Backend",
    "gRPC": "Backend",
    "Microservices": "Backend",
    "WebSockets": "Backend",
    
    # Database & Storage
    "PostgreSQL": "Database",
    "MySQL": "Database",
    "MongoDB": "Database",
    "Redis": "Database",
    "SQLite": "Database",
    "DynamoDB": "Database",
    "Elasticsearch": "Database",
    "Cassandra": "Database",
    "Firebase": "Database",
    "Supabase": "Database",
    
    # Cloud & DevOps
    "AWS": "DevOps",
    "GCP": "DevOps",
    "Azure": "DevOps",
    "Docker": "DevOps",
    "Kubernetes": "DevOps",
    "CI/CD": "DevOps",
    "Terraform": "DevOps",
    "Linux": "DevOps",
    "Nginx": "DevOps",
    "GitHub Actions": "DevOps",
    "Jenkins": "DevOps",
    
    # Testing & QA
    "Jest": "Testing",
    "PyTest": "Testing",
    "Cypress": "Testing",
    "Playwright": "Testing",
    "Mocha": "Testing",
    "Selenium": "Testing",
    "Unit Testing": "Testing",
    "E2E Testing": "Testing",
    
    # Architecture & Practices
    "Git": "DevOps",
    "System Design": "Engineering",
    "Agile/Scrum": "Engineering",
    "Performance Optimization": "Engineering",
    "Clean Architecture": "Engineering",
}

# Alias lookup table: Lowercase normalized alias -> Canonical Skill Name
SKILL_ALIASES: Dict[str, str] = {
    # Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ecmascript": "JavaScript",
    "es6": "JavaScript",
    "es6+": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "golang": "Go",
    "go": "Go",
    "java": "Java",
    "c": "C",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    ".net": "ASP.NET",
    "dotnet": "ASP.NET",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "sql": "SQL",
    "html": "HTML5",
    "html5": "HTML5",
    "css": "CSS3",
    "css3": "CSS3",
    "bash": "Bash",
    "shell": "Bash",
    "sh": "Bash",
    "assembly": "Assembly",
    "asm": "Assembly",
    
    # Embedded Systems & Hardware (explicit aliases, never equated to web or generic C)
    "embedded c": "Embedded C",
    "embedded c/c++": "Embedded C",
    "fpga": "FPGA Development",
    "fpga development": "FPGA Development",
    "fpgas": "FPGA Development",
    "vhdl": "VHDL",
    "verilog": "Verilog",
    "systemverilog": "SystemVerilog",
    "system verilog": "SystemVerilog",
    "pcb": "PCB Design",
    "pcb design": "PCB Design",
    "printed circuit board": "PCB Design",
    "altium": "Altium",
    "altium designer": "Altium",
    "hardware debugging": "Hardware Debugging",
    "hw debugging": "Hardware Debugging",
    "oscilloscope": "Oscilloscope",
    "oscilloscopes": "Oscilloscope",
    "logic analyzer": "Logic Analyzer",
    "logic analyzers": "Logic Analyzer",
    "rtos": "RTOS",
    "freertos": "FreeRTOS",
    "microcontroller": "Microcontrollers",
    "microcontrollers": "Microcontrollers",
    "mcu": "Microcontrollers",
    "mcus": "Microcontrollers",
    "arm": "ARM Architecture",
    "arm cortex": "ARM Architecture",
    "firmware": "Firmware Development",
    "firmware development": "Firmware Development",
    "i2c": "I2C",
    "spi": "SPI",
    "uart": "UART",
    "can": "CAN Bus",
    "can bus": "CAN Bus",
    "schematic capture": "Schematic Capture",
    "circuit design": "Circuit Design",
    
    # AI/ML & Data
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "scikit learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "llm": "LLMs",
    "llms": "LLMs",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "langchain": "LangChain",
    "computer vision": "Computer Vision",
    "cv": "Computer Vision",
    
    # Frontend
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "react 18": "React",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "next": "Next.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "svelte": "Svelte",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "redux": "Redux",
    "redux toolkit": "Redux",
    "vite": "Vite",
    "vite tooling": "Vite",
    "webpack": "Webpack",
    "responsive design": "Responsive Design",
    "accessibility": "Accessibility (a11y)",
    "a11y": "Accessibility (a11y)",
    "web vitals": "Web Vitals",
    
    # Backend
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "express.js": "Express.js",
    "expressjs": "Express.js",
    "fastapi": "FastAPI",
    "fast api": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "asp.net": "ASP.NET",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "rest apis": "REST APIs",
    "restful": "REST APIs",
    "restful apis": "REST APIs",
    "restful api": "REST APIs",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "microservices": "Microservices",
    "microservice": "Microservices",
    "websocket": "WebSockets",
    "websockets": "WebSockets",
    
    # Database
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "dynamodb": "DynamoDB",
    "dynamo": "DynamoDB",
    "elasticsearch": "Elasticsearch",
    "elastic search": "Elasticsearch",
    "cassandra": "Cassandra",
    "firebase": "Firebase",
    "supabase": "Supabase",
    
    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "docker": "Docker",
    "containerization": "Docker",
    "containers": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "continuous integration": "CI/CD",
    "ci / cd": "CI/CD",
    "terraform": "Terraform",
    "linux": "Linux",
    "nginx": "Nginx",
    "github actions": "GitHub Actions",
    "jenkins": "Jenkins",
    "git": "Git",
    "github": "Git",
    "gitlab": "Git",
    
    # Testing
    "jest": "Jest",
    "pytest": "PyTest",
    "cypress": "Cypress",
    "playwright": "Playwright",
    "mocha": "Mocha",
    "selenium": "Selenium",
    "unit test": "Unit Testing",
    "unit testing": "Unit Testing",
    "e2e": "E2E Testing",
    "e2e testing": "E2E Testing",
    "end to end testing": "E2E Testing",
    
    # Architecture
    "system design": "System Design",
    "agile": "Agile/Scrum",
    "scrum": "Agile/Scrum",
    "performance optimization": "Performance Optimization",
}


def normalize_skill_name(raw_name: str) -> Tuple[str, str]:
    """
    Normalizes a raw skill string to its canonical name and category.
    Handles capitalization, abbreviations, and formatting variations.
    
    Returns:
        (canonical_name, category)
    """
    if not raw_name:
        return ("", "General")
        
    cleaned = raw_name.strip()
    # Normalize internal whitespace
    cleaned = re.sub(r"\s+", " ", cleaned)
    lookup_key = cleaned.lower()
    
    # 1. Direct alias match
    if lookup_key in SKILL_ALIASES:
        canonical = SKILL_ALIASES[lookup_key]
        category = SKILL_TAXONOMY.get(canonical, "General")
        return (canonical, category)
        
    # 2. Check if already canonical
    for canon_skill, cat in SKILL_TAXONOMY.items():
        if canon_skill.lower() == lookup_key:
            return (canon_skill, cat)
            
    # 3. Clean punctuation edge cases (e.g., trailing commas, parenthesis)
    sub_key = re.sub(r"[^\w\s\+#\.]", "", lookup_key).strip()
    if sub_key in SKILL_ALIASES:
        canonical = SKILL_ALIASES[sub_key]
        category = SKILL_TAXONOMY.get(canonical, "General")
        return (canonical, category)

    # Fallback: title-cased token with General category
    return (cleaned.title(), "General")


def get_skill_category(skill_name: str) -> str:
    """Returns the taxonomy category for a canonical or arbitrary skill name."""
    canonical, category = normalize_skill_name(skill_name)
    return category
