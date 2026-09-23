FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./

ENV HOST=0.0.0.0
ENV PORT=8000
ENV OLLAMA_BASE_URL=http://ollama:11434
ENV OLLAMA_MODEL=qwen2.5:7b

EXPOSE 8000

CMD ["python", "server.py"]
