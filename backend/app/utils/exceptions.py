from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", status_code=404)


class PermissionDeniedError(AppError):
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status_code=403)


class AuthenticationError(AppError):
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, status_code=401)


class ConflictError(AppError):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status_code=409)


class BudgetExceededError(AppError):
    def __init__(self, message: str = "Budget limit exceeded"):
        super().__init__(message, status_code=422)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})
