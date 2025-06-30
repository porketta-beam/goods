from fastapi import FastAPI
import uvicorn

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/data/front/{name}")
def send_data(name: str):
    import json
    
    try:
        with open(f"./data/front/{name}.json", "r") as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        return {"error": "파일을 찾을 수 없습니다"}
    except json.JSONDecodeError:
        return {"error": "잘못된 JSON 형식입니다"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)