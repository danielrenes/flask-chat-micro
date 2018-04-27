from functools import wraps
import datetime
import json
import os
import socket
import time

from flask import jsonify, abort
import docker
import etcd
import requests

def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if request.form:
            token = request.form.get('token')
        elif request.json:
            token = request.json.get('token')
        else:
            abort(400)
        resp = requests.get('/api/auth/get_token?token={}'.format(token))
        if resp.status_code != 200:
            return jsonify({'renew_token': '/api/user/token'}), 401
        token = json.loads(resp.text)
        now = datetime.utcnow()
        if not token or token['expires_at'] < now:
            return jsonify({'renew_token': '/api/user/token'}), 401
        return f(*args, **kwargs)
    return wrapper

def internal_endpoint(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not request.json:
            abort(400)
        container_id = request.json.get('container_id')
        if not container_id and not is_container(container_id):
            abort(400)
        return f(*args, **kwargs)
    return wrapper

def etcd_client():
    url = os.environ.get('ETCD')
    url = url.split('//')[1]
    host, port = url.split(':')
    return etcd.Client(host=host, port=int(port), allow_reconnect=True)

def docker_attributes():
    docker_client = docker.from_env()
    container = docker_client.containers.get(socket.gethostname())
    return container.attrs

def get_service_address():
    ip_address = os.environ.get('HOST_IP_ADDRESS')
    docker_attrs = docker_attributes()
    port = list(docker_attrs['NetworkSettings']['Ports'].values())[0][0]['HostPort']
    return '{}:{}'.format(ip_address, port)

def get_container_ids():
    nodes = getattr(etcd_client().read('/services', recursive=True), '_children')[0]['nodes']
    upstream_nodes = None
    for node in nodes:
        if 'nodes' in node and 'upstream' in node['nodes'][0]['key']:
            upstream_nodes = node['nodes']
            break
    if not upstream_nodes:
        return []
    container_ids = []
    for upstream_node in upstream_nodes:
        container_ids.append(upstream_node['key'].split('/')[-1].split('_')[-1])
    return container_ids

def is_container(container_id):
    return container_id in get_container_ids()

def register_container(service_name):
    balance_algorithm = 'roundrobin'
    service_url = '/api/{}'.format(service_name)
    instance_name = service_name + '_' + socket.gethostname()
    service_address = get_service_address()
    etcd = etcd_client()
    while True:
        try:
            print 'Writing etcd'
            etcd.write('/services/{}/location'.format(service_name), service_url)
            print 'Wrote location'
            etcd.write('/services/{}/backend/balance'.format(service_name), balance_algorithm)
            print 'Wrote backend'
            etcd.write('/services/{}/upstream/{}'.format(service_name, instance_name), service_address, ttl=50)
            print 'Wrote upstream'
        except:
            print 'Exception while writing etcd'
            pass
        print 'sleeping for 15 seconds'
        time.sleep(15)
        print 'continue loop'
    print 'Exited loop'
