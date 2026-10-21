import pytest
from app.services.skill_normalization import normalize_skill_name, get_skill_category


def test_normalize_exact_and_lowercase():
    name, cat = normalize_skill_name("python")
    assert name == "Python"
    assert cat == "Languages"

    name, cat = normalize_skill_name("javascript")
    assert name == "JavaScript"
    assert cat == "Languages"


def test_normalize_aliases():
    assert normalize_skill_name("js") == ("JavaScript", "Languages")
    assert normalize_skill_name("ts") == ("TypeScript", "Languages")
    assert normalize_skill_name("py") == ("Python", "Languages")
    assert normalize_skill_name("react.js") == ("React", "Frontend")
    assert normalize_skill_name("reactjs") == ("React", "Frontend")
    assert normalize_skill_name("nodejs") == ("Node.js", "Backend")
    assert normalize_skill_name("k8s") == ("Kubernetes", "DevOps")
    assert normalize_skill_name("postgres") == ("PostgreSQL", "Database")
    assert normalize_skill_name("postgresql") == ("PostgreSQL", "Database")
    assert normalize_skill_name("mongo") == ("MongoDB", "Database")
    assert normalize_skill_name("docker") == ("Docker", "DevOps")
    assert normalize_skill_name("ci/cd") == ("CI/CD", "DevOps")
    assert normalize_skill_name("tailwind") == ("Tailwind CSS", "Frontend")
    assert normalize_skill_name("nextjs") == ("Next.js", "Frontend")


def test_normalize_special_characters():
    assert normalize_skill_name("c++")[0] == "C++"
    assert normalize_skill_name("cpp")[0] == "C++"
    assert normalize_skill_name("c#")[0] == "C#"
    assert normalize_skill_name("csharp")[0] == "C#"
    assert normalize_skill_name(".net")[0] == "ASP.NET"


def test_normalize_fallback_unknown():
    name, cat = normalize_skill_name("Quantum Computing Simulator")
    assert name == "Quantum Computing Simulator"
    assert cat == "General"


def test_empty_input():
    name, cat = normalize_skill_name("")
    assert name == ""
    assert cat == "General"
