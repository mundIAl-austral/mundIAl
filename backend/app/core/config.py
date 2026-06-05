from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        protected_namespaces=(),
    )

    database_url: str
    env: str = "development"
    cors_origins: str = "http://localhost:5173"
    model_api_key: str = ""
    model: str = "deepseek/deepseek-v4-flash"
    model_temperature: float = 0.7

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",")]


settings = Settings()  # type: ignore[call-arg]
