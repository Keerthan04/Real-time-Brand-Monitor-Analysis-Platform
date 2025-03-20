FROM python:3.10-slim

WORKDIR /flask_app

COPY app/ /flask_app/app/
COPY .env /flask_app/.env
COPY requirements.txt /flask_app/

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

EXPOSE 5000

CMD ["gunicorn", "app.app:app", "-b", "0.0.0.0:5000", "-w", "4"]
