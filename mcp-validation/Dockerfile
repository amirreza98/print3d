FROM python:3.12-slim AS runtime

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Dependencies are pure-Python or manylinux wheels (numpy, rtree bundles libspatialindex),
# so no system build packages are required.
COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY mcp_validation ./mcp_validation
COPY samples ./samples

# Default to the remote SSE transport in a container; override MCP_TRANSPORT=stdio to run
# as a spawned stdio server instead.
ENV MCP_TRANSPORT=http \
    HOST=0.0.0.0 \
    PORT=8084
EXPOSE 8084

RUN useradd --create-home --uid 10001 appuser
USER appuser

CMD ["python", "-m", "mcp_validation"]
