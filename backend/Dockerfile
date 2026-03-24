FROM python:3.12-slim

# Install uv 
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install dependencies using uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy application code
COPY . /app

# Expose Daphne port
EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"

# Run migrations and start Daphne ASGI server
CMD ["sh", "-c", "uv run python manage.py makemigrations && uv run python manage.py migrate && uv run daphne -b 0.0.0.0 -p 8000 core.asgi:application"]
