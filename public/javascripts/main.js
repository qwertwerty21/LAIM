$(document).ready(function() {
	var socket = io();
	var socketID;
	var $userNameRow = $('#userNameRow');
	var $userNameForm = $('#userNameForm');
	var $laimUserName = $('#laimUserName');
	var $myUserName = $('#myUserName');
	var $buddyChatRow = $('#buddyChatRow');
	var $buddyUl = $('#buddyUl');
	var $messageForm = $('#messageForm');
	var $message = $('#message');
	var $chatUl = $('#chatUl'); 
	var buddyArriveSFX = new Audio('/sounds/buddyArrive.mp3');
	var buddyDepartSFX = new Audio('/sounds/buddyDepart.mp3');
	var receiveImSFX = new Audio('/sounds/receiveIm.mp3');
	var sendImSFX = new Audio('/sounds/sendIm.mp3');


	$(".draggable").draggable({
		scroll: false
	});

	function sendFunction(){
		console.log( $message.val() );
		sendImSFX.play();
		socket.emit( 'send message', { 
			username: $laimUserName.val(),
			msg: $message.val()
		});
		$message.val('');
	}

	function setUserName(){
		socket.emit( 'new username', $laimUserName.val(), function(data){
			if(data){
				$userNameRow.hide();
				$buddyChatRow.show();
				$message.focus();
				$myUserName.text($laimUserName.val());

			}
		});
		
	}

	function getRandomNum( num ){
		return Math.floor(Math.random() * num);
	}

	function runCallback( callback, username, probability ){
		
		if( getRandomNum(100) <= probability ){
			return callback(username);
		}
		return username;
	}

	function addPrefixUserName( username ){
		var prefixArr = ['lil', 'qtie', 'baby', '4eva', 'evil', 'loverboi', 'sk8trgrl', 'gangstr', "teh", "pwnzorz", "haxorz", "leet"];
		var num = getRandomNum(prefixArr.length);
		return prefixArr[num] + username;

	}

	function addNumbersUserName( username ){
		if( getRandomNum(100) <= 50 ){
			return username + '69';
		}
		return username + getRandomNum(1000);
	}

	function addFaceUserName( username ){
		var faceArr = ["</3", "<3", "XD", ";P", "-_-", "^.^", "X.X", "T.T", "0_0", "(.)(.)", "@.@", ";-)", ">:o", ":-X", ":'("];
		var num = getRandomNum(faceArr.length);
		return username + faceArr[num];
	}

	function capitalizeUserName( username ){
		return username.split('').map(function( curVal, ind, arr ){
			return ind % 2 !== 0 ? curVal.toUpperCase() : curVal;
		}).join('');
	}

	function leetifyUserName(username){
		var leetObj = { "a":"@", "B":"8", "e":"3", "o":"0", "s":"$"};
		var myRegex = /[aBeos]/g;
		return username.replace(myRegex, function( char ){
			return leetObj[char];
		});
	}

	function modifyLaimUserName(){
		var moddedLaimUserName = $laimUserName.val();
		moddedLaimUserName = runCallback( addPrefixUserName, moddedLaimUserName, 70 );
		moddedLaimUserName = runCallback( addNumbersUserName, moddedLaimUserName, 50 );
		moddedLaimUserName = runCallback( addFaceUserName, moddedLaimUserName, 25 );
		moddedLaimUserName = runCallback( capitalizeUserName, moddedLaimUserName, 50 );
		moddedLaimUserName = runCallback( leetifyUserName, moddedLaimUserName, 90 );
		$laimUserName.val( moddedLaimUserName );
	}

	$userNameForm.submit( function(e){
		
		e.preventDefault();

		if( $laimUserName.val() ){
			modifyLaimUserName();
			setUserName();
		}
		
	})

	$message.keyup(function(event){
	    if(event.keyCode == 13){
	        $("#submitMsgBtn").click();
	    }
	});

	$messageForm.submit( function(e){
		
		e.preventDefault();

		if( $message.val() !== ''){
			sendFunction();
		}
		
	})

	function postBuddyArrDpartNotif( sn , string ){
		var $chatListItem = $('<li>', {
			"class": "notification-li"
		}).text(sn + ' has ' + string + ' the room.');
		$chatUl.append($chatListItem);

	}
	socket.on('buddy arrives', function( screenname ){
		buddyArriveSFX.play();
		postBuddyArrDpartNotif(screenname, 'joined');
	});

	socket.on('buddy departs', function( screenname ){
		buddyDepartSFX.play();
		postBuddyArrDpartNotif(screenname, 'left');
	});

	socket.on('new message', function(data){
		var $chatListItem = $('<li>', {
			"class": "chat-li"
		});

		var $spanUserName = $('<span>', {
			"class": "username-span"
		}).text(data.username + ": ");

		var $spanMsg = $('<span>', {
			"class": "msg-span"
		}).text(data.msg);

		$chatListItem.append($spanUserName, $spanMsg) 
		console.log(data.msg);
		
		if( data.username !== $laimUserName.val()){
			receiveImSFX.play();
		}

		$chatUl.append($chatListItem);
		$chatUl.scrollTop($chatUl[0].scrollHeight);
		$message.focus();
	});

	socket.on('get users', function(data){
		var html = '';
		for(var i = 0; i < data.length; i++){
			html+= '<li class=buddy-li>' + data[i] + '</li>';
		}
		$buddyUl.html(html);
	});

});		
		