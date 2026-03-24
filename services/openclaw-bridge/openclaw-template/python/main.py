from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

try:
    import httpx
except Exception:
    httpx = None  # type: ignore

import os

app = FastAPI(title="openclaw-airi-template-python", version="1.1.0")

UPSTREAM_URL = os.getenv("OPENCLAW_UPSTREAM_URL", "").strip()
UPSTREAM_PATH = os.getenv("OPENCLAW_UPSTREAM_PATH", "/v1/airi/invoke")
UPSTREAM_API_KEY = os.getenv("OPENCLAW_UPSTREAM_API_KEY", "").strip()
TOP_K = int(os.getenv("OPENCLAW_CONTEXT_TOP_K", "8"))


class OpenClawContext(BaseModel):
    contextUpdates: Optional[list[dict]] = Field(default=None)
    overrideContextText: Optional[str] = Field(default=None)
    overrides: Optional[Dict[str, Any]] = Field(default=None)
    metadata: Optional[Dict[str, Any]] = Field(default=None)


class OpenClawRequest(BaseModel):
    source: str = "input:text"
    eventId: Optional[str] = None
    correlationId: Optional[str] = None
    sessionId: Optional[str] = None
    prompt: str = ""
    text: Optional[str] = None
    rawText: Optional[str] = None
    context: Optional[OpenClawContext] = None
    capabilities: Dict[str, bool] = Field(default_factory=dict)


class ContextUpdate(BaseModel):
    id: Optional[str] = None
    contextId: Optional[str] = None
    lane: str = "memory.episodic"
    strategy: str = "append-self"
    text: str
    content: Optional[Any] = None
    destinations: List[str] = Field(default_factory=lambda: ["character"])
    metadata: Dict[str, Any] = Field(default_factory=dict)


class OpenClawResponse(BaseModel):
    ok: bool = True
    message: Optional[str] = None
    reply: Optional[str] = None
    output: Optional[Dict[str, Any]] = None
    commands: List[Dict[str, Any]] = Field(default_factory=list)
    contextUpdates: List[ContextUpdate] = Field(default_factory=list)
    context_updates: List[ContextUpdate] = Field(default_factory=list)
    memory: Dict[str, List[ContextUpdate]] = Field(
        default_factory=lambda: {"short_term": [], "long_term": [], "episodic": []}
    )


def pick_best_message(raw: Dict[str, Any]) -> str:
    if isinstance(raw.get("message"), str) and raw["message"].strip():
        return raw["message"].strip()
    if isinstance(raw.get("reply"), str) and raw["reply"].strip():
        return raw["reply"].strip()

    output = raw.get("output")
    if isinstance(output, str) and output.strip():
        return output.strip()
    if isinstance(output, dict):
        if isinstance(output.get("content"), str) and output["content"].strip():
            return output["content"].strip()
        if isinstance(output.get("message"), str) and output["message"].strip():
            return output["message"].strip()

    return "OK，已接收。"


def normalize_response(raw: Dict[str, Any]) -> Dict[str, Any]:
    r = dict(raw or {})
    memory = r.get("memory") if isinstance(r.get("memory"), dict) else {}

    updates = []
    updates.extend(r.get("contextUpdates", []) or [])
    updates.extend(r.get("context_updates", []) or [])
    updates.extend(memory.get("short_term", []) or [])
    updates.extend(memory.get("long_term", []) or [])
    updates.extend(memory.get("episodic", []) or [])

    return {
        "ok": bool(r.get("ok", True)),
        "message": pick_best_message(r),
        "commands": r.get("commands", []),
        "contextUpdates": updates,
        "context_updates": updates,
        "memory": {
            "short_term": memory.get("short_term", []),
            "long_term": memory.get("long_term", []),
            "episodic": memory.get("episodic", []),
        },
        "meta": {
            "source": "openclaw-template-python",
            "upstreamUsed": bool(UPSTREAM_URL),
            "upstreamUrl": UPSTREAM_URL or None,
        },
    }


def build_fallback(payload: OpenClawRequest) -> Dict[str, Any]:
    content = payload.prompt or payload.text or ""
    context_text = ""
    snippets = []
    if payload.context and payload.context.contextUpdates:
        for item in payload.context.contextUpdates:
            if not isinstance(item, dict):
                continue
            txt = str(item.get("text", "") or "").strip()
            if txt:
                snippets.append(txt)
    if snippets:
        context_text = "\n".join(snippets[-TOP_K:])

    reply = f"已接收 {payload.source} 事件（eventId={payload.eventId or 'n/a'}）：{content[:120] or '空内容'}"
    if context_text:
        reply += f" | 上下文片段：{context_text[:140]}"

    commands: List[Dict[str, Any]] = []
    if any(k in content for k in ["提醒", "remind", "task", "任务"]):
        commands.append({
            "destinations": ["character"],
            "intent": "action",
            "priority": "normal",
            "ack": "收到提醒意图，转交任务子代理",
            "guidance": {
                "type": "proposal",
                "options": [{
                    "label": "执行提醒",
                    "steps": ["解析任务", "确认时间", "写入任务"],
                    "rationale": "用户表达提醒意图",
                    "possibleOutcome": ["任务已入队"],
                    "risk": "low",
                    "fallback": ["请求用户确认"],
                    "triggers": ["检测到提醒关键词"],
                }],
            },
        })

    updates: List[ContextUpdate] = []
    if payload.capabilities.get("memory", False) and payload.sessionId:
        short_text = f"session={payload.sessionId}: latest_input={content[:120] or 'empty'}"
        updates.append(ContextUpdate(
            id=f"st-{id(short_text)}",
            contextId=f"ctx-{id(short_text)}",
            lane="memory.short_term",
            strategy="append-self",
            text=short_text,
            content=content,
            destinations=["character"],
            metadata={"memoryType": "short_term", "source": "openclaw-template-python-fallback"},
        ))

        if any(k in content for k in ["偏好", "长期", "关系", "用户画像"]):
            updates.append(ContextUpdate(
                id=f"lt-{id(content)}",
                contextId=f"ctx-{id(content)}",
                lane="memory.long_term",
                strategy="append-self",
                text=f"session={payload.sessionId}: 长期偏好片段 {content[:120]}",
                content=content,
                destinations=["character"],
                metadata={"memoryType": "long_term", "source": "openclaw-template-python-fallback"},
            ))

    return {
        "ok": True,
        "message": reply,
        "commands": commands,
        "contextUpdates": [u.model_dump() for u in updates],
        "memory": {
            "short_term": [u.model_dump() for u in updates if u.lane == "memory.short_term"],
            "long_term": [u.model_dump() for u in updates if u.lane == "memory.long_term"],
            "episodic": [],
        },
    }


async def call_upstream(payload: OpenClawRequest):
    if not UPSTREAM_URL:
        return None
    if httpx is None:
        raise RuntimeError("httpx 未安装：请在环境里安装依赖（pip install -r requirements.txt）")

    endpoint = f"{UPSTREAM_URL.rstrip('/')}{UPSTREAM_PATH}"
    headers = {"content-type": "application/json"}
    if UPSTREAM_API_KEY:
        headers["authorization"] = f"Bearer {UPSTREAM_API_KEY}"

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(endpoint, headers=headers, json=payload.model_dump())
    if resp.status_code >= 300:
        text = resp.text
        raise RuntimeError(f"Upstream OpenClaw error: {resp.status_code} {resp.reason_phrase}. body={text}")
    raw = resp.json()
    return normalize_response(raw)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "service": "openclaw-airi-template-python", "upstream": bool(UPSTREAM_URL)}


@app.post("/v1/airi/invoke")
async def invoke(payload: OpenClawRequest):
    try:
        if UPSTREAM_URL:
            try:
                normalized = await call_upstream(payload)
                if normalized:
                    return JSONResponse(content=normalized)
            except Exception as err:
                fallback = {
                    "ok": False,
                    "message": f"上游 OpenClaw 调用失败，已降级：{err}",
                    "commands": [],
                    "contextUpdates": [],
                    "context_updates": [],
                    "memory": {"short_term": [], "long_term": [], "episodic": []},
                    "meta": {"source": "openclaw-template-python", "upstreamUsed": True, "upstreamUrl": UPSTREAM_URL},
                }
                return JSONResponse(content=normalize_response(fallback))

        return JSONResponse(content=normalize_response(build_fallback(payload)))
    except Exception as err:
        return JSONResponse(status_code=500, content={
            "ok": False,
            "message": f"服务异常：{err}",
            "commands": [],
            "contextUpdates": [],
            "context_updates": [],
            "memory": {"short_term": [], "long_term": [], "episodic": []},
            "meta": {"source": "openclaw-template-python"},
        })
