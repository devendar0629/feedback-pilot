"""Application custom exceptions and error models."""
from fastapi import HTTPException, status


class FeedbackPilotException(Exception):
    """Base exception for FeedbackPilot."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class EntityNotFoundError(FeedbackPilotException):
    """Raised when a requested resource is not found."""
    pass


class InvalidStatusTransitionError(FeedbackPilotException):
    """Raised when an invalid status transition is requested."""

    def __init__(self, current_status: str, target_status: str, allowed_transitions: list):
        self.current_status = current_status
        self.target_status = target_status
        self.allowed_transitions = allowed_transitions
        super().__init__(
            f"Invalid status transition from '{current_status}' to '{target_status}'. "
            f"Allowed transitions are: {allowed_transitions}"
        )


class UnauthorizedAccessError(FeedbackPilotException):
    """Raised when a user attempts an unauthorized resource action."""
    pass


class TrackingVerificationError(FeedbackPilotException):
    """Raised when public tracking credentials do not match or fail validation."""
    pass


class GeminiAnalysisError(FeedbackPilotException):
    """Raised when Gemini analysis fails permanently after retries."""
    pass
