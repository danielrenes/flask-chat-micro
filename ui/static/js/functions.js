function randomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function hexToRgb(hex) {
  var bigint = parseInt(parseInt(hex.replace(/^#/, ''), 16), 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return r + ',' + g + ',' + b;
};

$(document).ready(function() {
  var username;
  var token;
  var active_users = [];

  var active_users_refreshing = false;
  var messages_refreshing = false;

  var form_login = $('form#login');
  var form_msg = $('form#msg');
  var button_logout = $('p#logout');
  var ul_active_users = $('ul#active_users');
  var ul_messages = $('ul#messages');
  var input_msg = $('form#msg > div.field > div.control > input[name="text"]');

  $.ajaxSetup({
    statusCode: {
      401: tokenErrorHandler
    }
  });

  var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + '/notification');
  console.log(location.protocol + '//' + document.domain + ':' + location.port + '/notification');

  socket.on('connect', function() {
    console.log('socketio connected');
  });

  socket.on('push_users', function(msg) {
    setTimeout(function() {
      refreshActiveUsers(msg['data']);
    }, 0);
  });

  socket.on('push_messages', function(msg) {
    setTimeout(function() {
      refreshMessages(msg['data']);
    }, 0);
  });

  ul_active_users.children('li').each(function(index, object) {
    var color = randomColor();
    active_users.push({
      'user': object.innerText,
      'color': color,
      'refreshed_at': new Date()
    });
    object.style.color = color;
  });

  ul_messages.children('li').each(function(index, object) {
    var [msg, user] = object.innerText.split('-');
    msg = msg.trim();
    user = user.trim();
    var color = '#000000';
    for (var i = 0; i < active_users.length; i++) {
      if (active_users[i]['user'] === user) {
        color = active_users[i]['color'];
        break;
      }
    }
    object.innerText = msg;
    object.style.color = color;
  });

  form_login.submit(function(e) {
    var $this = $(this);
    var username = $this.serialize().split('&')[0].split('=')[1];
    var form_data = $this.serialize();
    $.ajax({
      url: '/user/login',
      type: 'POST',
      data: form_data,
      success: function(response) {
        if (typeof response !== 'undefined' && 'token' in response) {
          token = response['token'];
          form_login.attr('style', 'display: none');
          button_logout.attr('style', 'display: block');
        }
      }
    });
    e.preventDefault();
  });

  form_msg.submit(function(e) {
    var $this = $(this);
    var form_data = $this.serialize() + '&token=' + token;
    $.ajax({
      url: '/msg/send',
      type: 'POST',
      data: form_data,
      success: function(response) {
        input_msg.val('');
      }
    });
    e.preventDefault();
  });

  button_logout.click(function() {
    $.ajax({
      url: '/user/logout',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        'token': token
      }),
      success: function(response) {
        username = undefined;
        token = undefined;
        button_logout.attr('style', 'display: none');
        form_login.attr('style', 'display: block');
      }
    });
  });

  function refreshActiveUsers(data) {
    if (messages_refreshing === true) {
      setTimeout(function() {
        refreshActiveUsers(data);
      }, 100);
    } else {
      active_users_refreshing = true;
      var now = new Date();
      for (var i = 0; i < data.length; i++) {
        var found = false;
        for (var j = 0; j < active_users.length; j++) {
          if (active_users[j]['user'] === data[i]['user']) {
            active_users[j]['refreshed_at'] = now;
            found = true;
            break;
          }
        }
        if (!found) {
          active_users.push({
            'user': data[i]['user'],
            'color': randomColor(),
            'refreshed_at': now
          });
        }
      }
      ul_active_users.empty();
      for (var i = active_users.length - 1; i >= 0; i--) {
        if (active_users[i]['refreshed_at'].getTime() !== now.getTime()) {
          active_users.splice(i, 1);
        } else {
          ul_active_users.append('<li style="color: rgb(' + hexToRgb(active_users[i]['color']) + ');">' + active_users[i]['user'] + '</li>');
        }
      }
      active_users_refreshing = false;
    }
  };

  function refreshMessages(data) {
    if (active_users_refreshing === true) {
      setTimeout(function() {
        refreshMessages(data);
      }, 100);
    } else {
      messages_refreshing = true;
      ul_messages.empty();
      for (var i = 0; i < data.length; i++) {
        msg = data[i]['text'];
        user = data[i]['user'];
        var color = '#000000';
        for (var j = 0; j < active_users.length; j++) {
          if (active_users[j]['user'] === user) {
            color = active_users[j]['color'];
            break;
          }
        }
        ul_messages.append('<li style="color: rgb(' + hexToRgb(color) + ');">' + msg + '</li>');
      }
      messages_refreshing = false;
    }
  };

  function tokenErrorHandler(jqxhr, textStatus, errorThrown) {
    var request = this;
    var is_token_error = 'renew_token' in jqxhr.responseJSON;
    if (is_token_error) {
      var token_renewed = false;
      $.ajax({
        url: jqxhr.responseJSON.renew_token,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          'token': token
        }),
        success: function(response) {
          if (typeof response !== 'undefined' && 'token' in response) {
            token = response['token'];
            token_renewed = true;
          }
        }
      }).done(function() {
        if (token_renewed === true) {
          var token_replaced = false;
          var new_request_data = [];
          if (request.data[0] === '{') {
            var old_request_data = JSON.parse(request.data);
            if ('token' in old_request_data) {
              old_request_data['token'] = token;
              token_replaced = true;
            }
            new_request_data = JSON.stringify(old_request_data);
          } else {
            var old_request_data = request.data.split('&');
            for (var i = 0; i < old_request_data.length; i++) {
              var [key, value] = old_request_data[i].split('=');
              if (key == 'token') {
                new_request_data.push('token=' + token);
                token_replaced = true;
              } else {
                new_request_data.push(old_request_data[i]);
              }
            }
            new_request_data = new_request_data.join('&');
          }
          if (token_replaced === true) {
            request.data = new_request_data;
            $.ajax(request);
          }
        }
      });
    }
  };
});
