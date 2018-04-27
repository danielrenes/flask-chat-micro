from flask import Flask, render_template
import os
import config

app = Flask(__name__)
app.config.from_object('config.Config')

@app.route('/', methods=['GET'])
def index():
    # TODO: do not query active users and messages, client should query them on startup
    # active_users = User.query.filter(User.active==True).all()
    # messages = Message.query.join(User, User.id==Message.user_id).all()
    active_users = []
    messages = []
    return render_template('index.html', active_users=active_users, messages=messages)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
