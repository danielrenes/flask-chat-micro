import os

from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
import config
from common import token_required

app = Flask(__name__)
app.config.from_object('config.Config')
db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32), unique=True, nullable=False)
    password = db.Column(db.String(32), unique=True, nullable=False)
    active = db.Column(db.Boolean, default=False)

    # def generate_token(self):
    #     token = ''.join(choice(ascii_lowercase) for _ in range(128))
    #     expires_at = datetime.utcnow() + timedelta(minutes=10)
    #     return {'token': token, 'expires_at': expires_at}

@app.route('/user/login', methods=['POST'])
def login():
    username = request.form.get('username')
    if not username:
        abort(400)
    user = User.query.filter(User.name==username).first()
    if not user:
        abort(400)
    if user.active:
        return '', 304
    password = request.form.get('password')
    if user.password != password:
        abort(400)
    user.active = True
    # token_data = user.generate_token()
    # token = Token(token=token_data['token'], expires_at=token_data['expires_at'], user_id=user.id)
    # db.session.add(token)
    # db.session.commit()
    # TODO: request to auth service to generate token (params: user_id, post request, json param container_id)
    push_users()
    return jsonify({
        'token': token_data['token']
    })

@app.route('/user/logout', methods=['POST'])
@token_required
def logout():
    # TODO: request to auth service to get the token (params: user_id, post request, json param container_id)
    # TODO: user query based on user_id
    # user = User.query.join(Token, User.id==Token.user_id).filter(Token.token==request.json.get('token')).first()
    if not user:
        abort(400)
    if not user.active:
        abort(400)
    user.active = False
    db.session.commit()
    push_users()
    return '', 200

@app.route('/user/token', methods=['POST'])
def renew_token():
    token = request.json.get('token')
    if not token:
        abort(400)
    # TODO: request to auth service to get the token (params: user_id, post request, json param container_id)
    # old_token = Token.query.filter(Token.token==token).first()
    if not token:
        abort(400)
    # TODO: user query based on user_id
    # user = User.query.join(Token, User.id==Token.user_id).filter(User.token==old_token).first()
    if not user:
        abort(400)
    # TODO: request to auth service to generate token (params: user_id, post request, json param container_id)
    # TODO: the auth service will remove the old_token because a new one is generated for the user_id
    # db.session.delete(old_token)
    # token_data = user.generate_token()
    # new_token = Token(token=token_data['token'], expires_at=token_data['expires_at'], user_id=user.id)
    # db.session.add(new_token)
    # db.session.commit()
    return jsonify({
        'token': token_data['token']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
