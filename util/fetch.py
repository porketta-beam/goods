import requests

def fetch_n8n (query: str, n8n_url: str) -> str:
    url = f"{n8n_url}/webhook-node/webhook/1234567890"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {n8n_token}"
    }
    data = {
        "query": query
    }
    response = requests.post(url, headers=headers, json=data)
    return response.json()
  

def fetch_n8n_naver(query: str, display: int = 100, start: int = 1, sort: str = "date") -> str:
    url = 'https://moluvalu.app.n8n.cloud/webhook/41271191-b817-42a2-b8fd-0a82e083f131'
    params = {
        'query': query,
        'display': display,
        'start': start,
        'sort': sort
    }
    response = requests.get(url, params=params)
    return response.json()