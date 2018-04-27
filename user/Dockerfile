FROM python:2.7-alpine
RUN mkdir app
COPY ./user /app
COPY ./common.py /app
WORKDIR /app
RUN pip install -r requirements.txt
RUN pip install docker python-etcd gunicorn
EXPOSE 5000
CMD ["./boot.sh"]
