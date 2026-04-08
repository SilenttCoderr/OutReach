from src.langgraph_workflow import build_email_graph

graph = build_email_graph()

initial_state = {
    "recruiter": {
        "recruiter_name": "Test Name",
        "company": "Test Company",
        "recruiter_email": "test@example.com"
    },
    "user_profile": {
        "full_name": "John Doe",
        "current_title": "Software Engineer",
        "current_company": "Tech Corp",
        "degree": "B.S. Computer Science",
        "university": "State University",
        "experience_summary": "developed web apps",
        "email_sign_off": "Best"
    },
    "has_attachments": False
}

result = graph.invoke(initial_state)
print("RESULT:")
print(result)