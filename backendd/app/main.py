import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes.auth import router as auth_router
from app.routes.vendors import router as vendors_router
from app.routes.jobs import router as jobs_router
from app.routes.marketplace import router as marketplace_router
from app.routes.applications import router as applications_router
from app.routes.payments import router as payments_router
from app.routes.ratings import router as ratings_router


def create_app() -> FastAPI:
    app = FastAPI(title="Repair Marketplace System", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Ensure uploads folder exists
    os.makedirs("app/uploads", exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")

    app.include_router(auth_router)
    app.include_router(vendors_router)
    app.include_router(jobs_router)
    app.include_router(marketplace_router)
    app.include_router(applications_router)
    app.include_router(payments_router)
    app.include_router(ratings_router)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
