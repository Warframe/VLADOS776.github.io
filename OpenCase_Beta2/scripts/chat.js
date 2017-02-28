$(function () {
    var MESSAGE_LIMIT = parseInt($("#chat__new-message").attr("max"));
    
    $(document).on('localizationloaded', function() {
        $('#chat__send-new-message').attr('value', Localization.getString('chat.send_message'))
    });
    
    $("#chat__new-message").on('change', function (event, myEvent) {
        event = myEvent ? myEvent : event;
        if (event.ctrlKey && event.keyCode == 13) {
            $("#chat__send-new-message").click();
            event.preventDefault();
        } else if (event.keyCode == 13) {
            $('#chat__new-message').append('\n');
        }
        
        if ($(this).text().length >= parseInt($(this).attr("max")) && (event.keyCode != 8 || event.keyCode != 46)) {
            $("#chat__new-message").html($("#chat__new-message").html().slice(0, parseInt($(this).attr("max"))));
            
        }
    });
    
    $('[contenteditable]').on('focus', function(event) {
        var $this = $(this);
        $this.data('before', $this.html());
        return $this;
    }).on('blur keyup paste', function(event) {
        var $this = $(this);
        if ($this.data('before') !== $this.html()) {
            $this.data('before', $this.html());
        }
        $this.trigger('change', [event]);
        return $this;
    });
    
    var goToChat = false;
    
    //User location
    //Changed the api to one that allows for more requests
	$.get("https://freegeoip.net/json", function(response) {
		Player.country = response.country_code.toLowerCase();
	}, "jsonp").fail(function() {
		Player.country = "ru"
	});
    
    if (/chat-\w{2}$/.test(history.state)) {
        var goToChat = history.state.match(/chat-(\w{2})/)[1];
    } else {
        history.replaceState("chat-rooms", null, null);
    }
    
    var rooms = "";
    for (var i = 0; i < fbChat.rooms.length; i++) {
        rooms += "<div class='chat__rooms__room" + (Settings.language == fbChat.rooms[i].code ? ' playerLang' : '') + "' data-room=\"" + fbChat.rooms[i].code + "\">";
        rooms += "<img src=\"../images/flags/" + fbChat.rooms[i].flag + "\"><span>" + fbChat.rooms[i].name + "</span></div>";
    }
    $('.chat__rooms').html(rooms);
    firebase.auth().onAuthStateChanged(function (user) {
        // Once authenticated, instantiate Firechat with the logged in user
        if (firebase.auth().currentUser != null && !goToChat) {
            $("#login").hide();
            $("#chat").hide();
            $(".chat__rooms-container").show();
            fbProfile.isModerator(null, function(isModerator) {
                fbChat.isModerator = isModerator;
            })
            fbProfile.isVip(null, function(isVip) {
                fbChat.isVip = isVip;
            })
        } else if (firebase.auth().currentUser != null && goToChat != false) {
            fbChat.setChatRef(goToChat);
            $("#login").hide();
            $("#chat").show();
            $(".chat__rooms-container").hide();
            fbChat.initChat('.chat__messages');
            fbProfile.isModerator(null, function(isModerator) {
                fbChat.isModerator = isModerator;
            })
            fbProfile.isVip(null, function(isVip) {
                fbChat.isVip = isVip;
            })
        } else {
            $("#chat").hide();
            $(".chat__rooms-container").hide();
            $("#login").show();
        }
    });
     
    $(document).on('click', '.message__info', function() {
        var nickname = $($(this).find('.message__from')[0]).text();
        var currentText = $('#chat__new-message').text();
        if (currentText.indexOf('@'+nickname) == -1 && currentText.length + nickname.length < MESSAGE_LIMIT)
            $('#chat__new-message').append('@'+nickname+', ');
    })
    
    $(document).on('click', '.message__moderator li a', function() {
        var msgKey = $(this).closest('.chat__message').data('msgkey');
        var msgAuthor = $(this).closest('.message__info').find('.message__from').text();
        var msgText = $(this).closest('.message__info').children('.message__text').text();
        
        var action = $(this).data('action');
        switch (action) {
            case 'delete-message':
                deleteMessage(msgKey, msgText, msgAuthor);
                break;
            case 'fake-vip':
                fbChat.extraClasses(msgKey, 'vip');
                break;
            case 'blur':
                fbChat.extraClasses(msgKey, 'vip-blur');
                break;
        }
        if (isAndroid()) {
            client.sendToAnalytics('Chat', 'Extra Classes', action, 'From ' + Player.nickname + ' to ' + msgAuthor);
        }
        LOG.log({
            action: 'Extra Classes',
            msg: {
                type: action,
                to: msgAuthor,
                from: Player.nickname 
            }
        })
        
        function deleteMessage(msgKey, msgText, msgAuthor) {
            Lobibox.confirm({
                iconSource : 'fontAwesome',
                title : Localization.getString('chat.moderator.delete_msg.title'),
                msg : Localization.getString('chat.moderator.delete_msg.message'),
                callback : function ($this, type, ev) {
                    if (type == 'yes') {
                        fbChat.deleteMsg(msgKey);
                        if (isAndroid()) {
                            client.sendToAnalytics('Chat', 'Модератор', "Модератор удалил сообщение.", msgText+' | '+Player.nickname);
                        }
                        LOG.log({
                            action: 'Moderator delete message',
                            msg: {
                                author: msgAuthor,
                                text: msgText
                            }
                        })
                    }
                }
            }); 
        }
    })
    
    $(document).on('click', '.chat__rooms__room', function () {
        fbChat.setChatRef($(this).data('room'));
        $("#login").hide();
        $("#chat").show();
        $(".chat__rooms-container").hide();
        if (isAndroid()) {
            client.sendToAnalytics('Chat', 'Open Chat Room', 'Open Chat Room', "Room: "+$(this).data('room'));
            fbProfile.getAndroidID(function(androidID){
                if (!androidID || androidID == "") {
                    fbProfile.setAndroidID();
                }
            })
        }
        fbChat.initChat('.chat__messages');
        history.pushState('chat-'+$(this).data('room'), "Chat Room", 'chat.html?room='+$(this).data('room'))
    })
    $(document).on('click', '#login button', function () {
        $(".chat__messages").append('<li id="js-loading-inventory" data-from="1"><div class="cssload-container"><div class="cssload-speeding-wheel"></div></div></li>');
        setTimeout(function () {
            fbChat.initChat('.chat__messages');
        }, 2000);
    });
    
    /*$(document).on('click', '.chat__message img', function () {
        var uid = $(this).data('userid');
        if (typeof uid == 'undefined') return false;
        if (isAndroid())
            client.sendToAnalytics('Chat', 'Open profile', "Player clicked on img in chat", 'UserId: '+$(this).data('userid'));
        window.location = 'profile.html?uid=' + uid;
    })*/
    
    $(document).on('click', '#forgot-pass',function() {
        fbProfile.forgotPassword($("#email").val());
        if (isAndroid())
            client.sendToAnalytics('Profile', 'Forgot pass', "Pressed on 'Forgot password' button", "none");
    })
});

window.addEventListener('popstate', function(e) {
    var prev = e.state;
    if (prev == 'chat-rooms') {
        $("#login").hide();
        $("#chat").hide();
        $(".chat__rooms-container").show();
    } else if (/chat-\w{2}/.test(prev)) {
        var room = prev.match(/chat-(\w{2})/)[1];
        fbChat.setChatRef(room);
        $("#login").hide();
        $("#chat").show();
        $(".chat__rooms-container").hide();
        fbChat.initChat('.chat__messages');
    }
}, false);
var fbChat = (function (module) {
    module.chatRef = '';
    module.isModerator = false;
    module.isVip = false;
    module.rooms = [
        {
            name: "Русский"
            , flag: 'RU.svg'
            , code: 'RU'
        , }, {
            name: 'Polski'
            , flag: 'PL.svg'
            , code: 'PL'
        , }, {
            name: 'English'
            , flag: 'EN.svg'
            , code: 'EN'
        , }, {
            name: 'Deutsch'
            , flag: 'DE.svg'
            , code: 'DE'
        , }, {
            name: 'Türk'
            , flag: 'TR.svg'
            , code: 'TR'
        , }, {
            name: 'Românesc'
            , flag: 'RO.svg'
            , code: 'RO'
        , }, {
            name: 'Suomalainen'
            , flag: 'FI.svg'
            , code: 'FI'
        , }, {
            name: 'Português'
            , flag: 'PT.svg'
            , code: 'PT'
        , }, {
            name: 'Français'
            , flag: 'FR.svg'
            , code: 'FR'
        , }
    ];
    module.setChatRef = function(ref) {
        if (module.chatRef) module.chatRef.off('child_added');
        module.chatRef = firebase.database().ref('chat/'+ref);
    }
    module.sendMsg = function (userName, text, img, country) {
        country = country || null;
        var uid = firebase.auth().currentUser.uid;
        firebase.database().ref('users/'+uid+'/moder/group').once('value', function(snapshot) {
            var group = snapshot.val() ;
            fbChat.chatRef.push({
                username: userName
                , uid: uid
                , text: text
                , img: img
                , group: group
                , country: country
                , timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        })
        if (isAndroid())
            client.sendToAnalytics('Chat', 'Send message', "User send msg", text);
        LOG.log({
            action: 'Send chat message',
            msg: text,
            room: fbChat.chatRef.path.o[1] ? fbChat.chatRef.path.o[1] : ''
        })
    }
    module.deleteMsg = function (msgKey) {
        module.chatRef.child(msgKey).remove();
    }
    module.clearChat = function (ref) {
        var chatRef = firebase.database().ref('chat/'+ref);
        (function(chatRef) {
            chatRef.limitToLast(40).once('value', function(snapshot) {
                chatRef.set(snapshot.val());
            });
        })(chatRef)
    }
    module.clearChatFull = function(ref) {
        var chatRef = firebase.database().ref('chat/'+ref);
        chatRef.remove();
    }
    module.loadAllChat = function (ref) {
        var chatRef = firebase.database().ref(ref);
        chatRef.once('value', function(snapshot) {
            messages = snapshot.val();
            for (key in messages) {
                var time = new Date(messages[key].timestamp);
                time = time.toLocaleString((Settings.language == 'RU') ? 'ru' : 'en-US', {
                    hour: 'numeric'
                    , minute: 'numeric'
                });
                console.log('('+messages[key].uid+') ['+time+']'+messages[key].username+': '+messages[key].text);
            }
            /*for (key in messages) {
                newMsg(key, messages[key].uid, messages[key].img, messages[key].username, messages[key].timestamp, messages[key].text, messages[key].group);
            }
            $("html, body").animate({
                    scrollTop: $(document).height()
            }, 500);*/
        });
    }
    module.extraClasses = function(key, classes) {
        module.chatRef.child(key).child('extra').once('value').then(function (data) {
            var classesArr = classes.split(' ');
            var currentClasses = data.val();
            if (currentClasses == null) {
                module.chatRef.child(key).child('extra').set(classes);
            } else if (currentClasses.trim() === classes) {
                module.chatRef.child(key).child('extra').remove();
            } else if (currentClasses.split(' ').indexOf(classes) !== -1) {
                module.chatRef.child(key).child('extra').set(currentClasses.replace(classes, '').trim());
            } else {
                module.chatRef.child(key).child('extra').set(currentClasses + ' ' + classes);
            }
        })
    }
    module.initChat = function (selector) {
        var newItems = false;
        $(selector + " li").remove();
        if (module.chatRef == '') return;
        var chatRef = module.chatRef;
        
        chatRef.limitToLast(40).once('value').then(function (snapshot) {
            newItems = true;
            messages = snapshot.val();
            for (key in messages) {
                newMsg(key, messages[key]);
            }
            $("#container").animate({
                    scrollTop: $('#chat').height()
            }, 500);
        })
        
        chatRef.limitToLast(1).on('child_added', function (data) {
            if (!newItems) return;
            if ($("li[data-msgkey='" + data.key + "']").length == 0) {
                newMsg(data.key, data.val());
                if ($('#container').scrollTop() + $('#container').height() > $('#chat').height() - 250)
                    $("#container").animate({
                        scrollTop: $('#chat').height()
                    }, 200);
            }
        });
        
        chatRef.limitToLast(40).on('child_removed', function (data) {
            removeMsg(data.key);
        });
        
        chatRef.limitToLast(40).on('child_changed', function (data) {
            var $parent = $("li[data-msgkey='" + data.key + "']");
            if ($parent.length !== 0) {
                newMsg(data.key, data.val(), true);
            } else {
                newMsg(data.key, data.val());
                if ($('#container').scrollTop() + $('#container').height() > $('#chat').height() - 250)
                    $("#container").animate({
                        scrollTop: $('#chat').height()
                    }, 200);
            }
        });
    }
    return module;
}(fbChat || {}));

function newMsg(key, message, edit) {
     var uid = message.uid,
        img = avatarUrl(message.img),
        username = message.username,
        time = message.timestamp,
        text = message.text,
        group = message.group || "",
        country = message.country || "",
        extraClasses = message.extra || '';
    edit = edit || false;
    
    if (!/^\.\.\/images\/ava\/.{1,5}\.\w{3}$/i.test(img) && !/(admin|moder|vip)/i.test(group)) {
        img = '../images/ava/0.jpg';
    }
    
    var imgRegExp = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif))/igm,
        youtubeRegExp = /(?:https?\:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.?be)\/(?:watch\?v=|embed\/)?([a-zA-Z0-9?=-]+)/igm;
        //vkRegExp = /(https?:\/\/vk\.com\/(.*))?/ig;
    
    var flag = "";
    if (country)
        flag = '<img src="../images/none.png" class="flag flag-'+country.toLowerCase()+'"/>';        
    var time = new Date(time);
    time = time.toLocaleString((Settings.language == 'RU') ? 'ru' : 'en-US', {
        hour: 'numeric'
        , minute: 'numeric'
    });
    
    var myMessage = false;
    if (uid == firebase.auth().currentUser.uid) myMessage = true;
    
    text = uid == "TrgkhCFTfVWdgOhZVUEAwxKyIo33" ? text : XSSreplace(text.brTrim());
    
    text = text.replace(imgRegExp, '<img src="$1" style="width: 400px; max-width:100%; display: block;">');
    if (/vip/.test(group)) {
        text = text.replace(youtubeRegExp, '<iframe width="100%" height="auto" src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');
    }
    
    username = XSSreplace(username);
    var toMe = text.indexOf('@'+Player.nickname) != -1 ? true : false;
    text = text.replace(/@(.*?)[, ]/gi, '<b class="player-nickname">@$1</b>, ');
    
    var moderBlock = "";
    
    if (fbChat.isModerator || (fbChat.isVip)) {
        var allow = {
            delete: fbChat.isModerator ? '' : fbChat.isVip ? myMessage ? '' : 'display: none;' : 'display: none;',
            fake_vip: fbChat.isVip ? '' : 'display: none;',
            blur: fbChat.isVip ? '' : 'display: none;'
        }
        moderBlock = "<div class='message__moderator' data-loc-group='message-menu'><div class='dropup'>\
                        <i aria-hidden='true' class='fa fa-bars dropdown-toggle' type='button' data-toggle='dropdown'></i>\
                        <ul class='dropdown-menu dropdown-menu-right'>\
                            <li style='" + allow.delete + "'><a href='#' data-action='delete-message' data-loc='delete'>Delete</a></li>\
                            <li style='" + allow.fake_vip + "'><a href='#' data-action='fake-vip' data-loc='fake_vip'>Fake VIP</a></li>\
                            <li style='" + allow.blur + "'><a href='#' data-action='blur' data-loc='Blur'>Blur</a></li>\
                        </ul>\
                     </div>\
                    </div>";
    }
    
    var msg = "<li class='" + (!edit ? "animated bounceIn" : "") + " chat__message" + (myMessage ? " my_message" : "") + (toMe ? " msgToMe" : "") + " " + group + " " + extraClasses + "' data-msgkey='" + key + "'>\
        <a href='profile.html?uid="+uid+"'>\
            <img src='" + img + "' data-userID='" + uid + "'>\
        </a>\
        <div class='message__info'>\
            <div class='message__info__from-time'>\
                <span class='message__from'>" + username + "</span>\
                " + flag + (group != "" ? "<span class='group'>"+group+"</span>" : "") + "\
                <span class='message__time'>" + time + "</span>\
                " + moderBlock + "\
            </div>\
        <span class='message__text'>" + text + "</span>\
        </div></li>";
    
    if (edit) {
        $("li[data-msgkey='" + key + "']").replaceWith(msg);
    } else {
        $(".chat__messages").append(msg);
    }
}

function removeMsg(key) {
    try {
        $("li[data-msgkey='" + key + "']").removeClass('bounceIn');
        $("li[data-msgkey='" + key + "']").addClass('zoomOut');
        setTimeout(function () {
            $('.zoomOut').remove();
        }, 1000);
    }
    catch (e) {}
}
$(document).on('click', '#chat__send-new-message', function () {
    var msg = $('#chat__new-message').html().brTrim();
    if (msg.length == 0) return false;
    fbChat.sendMsg(Player.nickname, msg, Player.avatar, Player.country);
    $('#chat__new-message').empty();
});
