
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


@app.get("/")
async def home():
    return RedirectResponse(url="/queue/simple")

@app.get("/queue/simple")
async def simple_queue(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "queue_type": "simple",
            "page_title": "단순 큐",
            "page_description": "리스트를 이용한 FIFO 큐. 추출하면 나머지 원소가 앞으로 이동합니다."
        }
    )


@app.get("/queue/circular")
async def circular_queue(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "queue_type": "circular",
            "page_title": "서큘러 큐",
            "page_description": "고정 크기 배열과 front, rear, count를 이용한 원형 큐입니다."
        }
    )


@app.get("/queue/linked")
async def linked_queue(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "queue_type": "linked",
            "page_title": "원형 링크드 리스트 큐",
            "page_description": "노드의 next를 연결하여 원형 구조를 유지하는 큐입니다."
        }
    )

if __name__ == "__main__":
    import uvicorn
    import webbrowser
    from threading import Timer

    url = "http://127.0.0.1:8000"

    # FastAPI 서버 실행
    uvicorn.run(app, host="127.0.0.1", port=8000)