from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def scan_code(request):
    """
    Accepts HTML, CSS, JS code and optional lint results from frontend.
    First tries OpenAI AI check, if it fails goes to fallback using lint errors.
    """
    html = request.data.get('html', '')
    css = request.data.get('css', '')
    js = request.data.get('js', '')
    lint_errors = request.data.get('lintErrors', None)

    # ===== Try OpenAI first =====
    try:
        from openai import OpenAI

        # Initialize client with your API key
        client = OpenAI(api_key="")  # <-- Replace with your key

        # Minimal prompt for testing AI
        prompt = f"""
        Analyze this code and return JSON format:
        {{
          "score": number,
          "issues": [],
          "fixes": []
        }}

        HTML:
        {html}
        CSS:
        {css}
        JS:
        {js}
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )

        # Extract AI result
        ai_result = response.choices[0].message.content
        return Response({
            "type": "ai",
            "result": ai_result
        })

    except Exception as e:
        # Print the exact error for debugging
        print("open api error",str(e)); 
           # ===== FALLBACK if OpenAI fails =====
    issues = []
    fixes = []
    score = 100

    if lint_errors:
        # Use frontend lint exactly
        for lang in ['js', 'css', 'html']:
            for err in lint_errors.get(lang, []):
                issues.append(f"{lang.upper()} Line {err.get('line')}: {err.get('msg')}")
                msg = err.get('msg', '').lower()
                if 'console.log' in msg:
                    fixes.append("Remove console.log in production")
                    score -= 5
                elif 'var' in msg:
                    fixes.append("Use let/const instead of var")
                    score -= 10
                elif 'eval' in msg:
                    fixes.append("Avoid using eval()")
                    score -= 20
                elif 'missing semicolon' in msg:
                    fixes.append("Add semicolon at end")
                    score -= 2
                elif '==' in msg:
                    fixes.append("Use strict equality ===")
                    score -= 5
                else:
                    fixes.append("Check this issue")
                    score -= 3
    else:
        # Simple string checks if no lint provided
        if "console.log" in js:
            issues.append("JS: console.log found")
            fixes.append("Remove console.log in production")
            score -= 5
        if "var" in js:
            issues.append("JS: Use of var")
            fixes.append("Use let/const")
            score -= 10
        if "<script>" in html:
            issues.append("HTML: Inline script detected")
            fixes.append("Move JS to external file")
            score -= 5

    if not issues:
        issues.append("No major issues detected")
        fixes.append("Your code looks clean 🎉")
        score = 95

    return Response({
        "type": "fallback",
        "score": max(score, 50),
        "issues": issues,
        "fixes": fixes
    })