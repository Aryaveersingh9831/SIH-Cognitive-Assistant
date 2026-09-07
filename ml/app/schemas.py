"""
Request/response schemas for the ML difficulty prediction API.

Field names on the wire are camelCase to match the existing GameResult
contract used elsewhere in the app; internally we use snake_case
(Python convention) via pydantic aliases.
"""

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Only "memory" is supported in this iteration. Extend this set when
# other game types are added to the platform.
SUPPORTED_GAME_TYPES = {"memory"}


class DifficultyPredictionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    game_type: str = Field(alias="gameType")
    score: int = Field(ge=0)
    accuracy: float = Field(ge=0.0, le=1.0)
    reaction_time: float = Field(alias="reactionTime", ge=0)
    mistakes: int = Field(ge=0)
    current_difficulty: int = Field(alias="currentDifficulty", ge=1, le=5)

    @field_validator("game_type")
    @classmethod
    def validate_game_type(cls, v: str) -> str:
        if v not in SUPPORTED_GAME_TYPES:
            raise ValueError(
                f"Unsupported gameType '{v}'. Supported types: {sorted(SUPPORTED_GAME_TYPES)}"
            )
        return v


class DifficultyPredictionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    recommended_difficulty: int = Field(alias="recommendedDifficulty", ge=1, le=5)


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
