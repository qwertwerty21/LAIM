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
	var $angstModeBtn = $('#angstModeBtn');
	var $submitMessageBtn = $("#submitMsgBtn");
	var $chatUl = $('#chatUl'); 
	var $chatTypeStatus = $('#chatTypeStatus');
	var buddyArriveSFX = new Audio('/sounds/buddyArrive.mp3');
	var buddyDepartSFX = new Audio('/sounds/buddyDepart.mp3');
	var receiveImSFX = new Audio('/sounds/receiveIm.mp3');
	var sendImSFX = new Audio('/sounds/sendIm.mp3');
	var angsty = false;
	var Typer;
	var lyricsCacheArr = ['I walk a lonely road The only one that I have ever known Don\'t know where it goes, But it\'s home to me and I walk alone I walk this empty street On the Boulevard of Broken Dreams Where the city sleeps And I\'m the only one and I walk alone I walk alone I walk alone I walk alone I walk a- My shadow\'s the only one that walks beside me My shallow heart\'s the only thing that\'s beating Sometimes I wish someone out there will find me \'Til then I walk alone Ah-ah, ah-ah, ah-ah, aah-ah Ah-ah, ah-ah, ah-ah I\'m walking down the line That divides me somewhere in my mind On the border line Of the edge and where I walk alone Read between the lines What\'s fucked up and everything\'s alright Check my vital signs I know I\'m still alive and I walk alone I walk alone I walk alone I walk alone, I walk a- My shadow\'s the only one that walks beside me My shallow heart\'s the only thing that\'s beating Sometimes I wish someone out there will find me \'Til then I walk alone Ah-ah, ah-ah, ah-ah, aah-ah Ah-ah, ah-ah I walk alone I walk a- I walk this empty street On the Boulevard of Broken Dreams Where the city sleeps And I\'m the only one and I walk a- My shadow\'s the only one that walks beside me My shallow heart\'s the only thing that\'s beating Sometimes I wish someone out there will find me \'Til then I walk alone'];
	var artistSongTitleArray = [
			{artist: 'Blink 182', title: 'All The Small Things'},
			{artist: 'Linkin Park', title: 'Numb'},
			{artist: 'Paramore', title: 'Misery Business'},
			{artist: 'AFI', title: 'Miss Murder'},
			{artist: 'Evanescence', title: 'Wake Me Up Inside'},
			{artist: 'Panic At The Disco', title: 'I Write Sins Not Tragedies'},
			{artist: 'My Chemical Romance', title: 'Welcome To The Black Parade'},
			{artist: 'Drowning Pool', title: 'Bodies'},
			{artist: 'Avenged Sevenfold', title: 'Bat Country'},
			{artist: 'The Red Jumpsuit Apparatus', title: 'Face Down'},
			{artist: 'Rise Against', title: 'Prayer Of The Refugee'},
			{artist: 'Boys Like Girls', title: 'Thunder'}
	];

	$(".draggable").draggable({
		handle: ".top-bar-handle",
		scroll: false
	});

	$(".text-bg-color-pick").colorPicker({
		onColorChange: function( id, newValue ){
			console.log(id + ' has been changed to ' + newValue);
			$message.css('background-color', newValue);
			socket.emit('text bg color change', {
				bgColor: newValue
			});

		}
	});

	getEmoLyrics();

	function setTyper (){
	return	{
				text: null,
				index:0, // current cursor position
				speed:5, // speed of the Typer

				turnOff: function(){
					Typer = null;
				},

				content:function(){
					return $message.html();// get console content
				},

				write:function(str){// append to console content
					$message.append(str);
					return false;
				},

				addText:function(key){//Main function to add the code
					if(this.text){ // otherway if text is loaded
						var cont=this.content(); // get the console content
						if(key.keyCode!=8){ // if key is not backspace
							if(this.index >= this.text.length ){
								$submitMessageBtn.click();
								this.index = 0;
							}
							this.index+=this.speed;	// add to the index the speed
						}else{
							if(this.index>0) // else if index is not less than 0
								this.index-=this.speed;//	remove speed for deleting text
						}
						var text=this.text.substring(0,this.index);// parse the text for stripping html enities
						var rtn= new RegExp("\n", "g"); // newline regex
			
						$message.val(text.replace(rtn," "));// replace newline chars with br, tabs with 4 space and blanks with an html blank
						 // scroll to make sure bottom is always visible
						$message.scrollTop(9999);

					}
					if ( key.preventDefault && key.keyCode != 122 ) { // prevent F11(fullscreen) from being blocked
						key.preventDefault()
					};
					if(key.keyCode != 122){ // otherway prevent keys default behavior
						key.returnValue = false;
					}
				},
		};
	}

	function sendFunction(){
		console.log( $message.val() );
		sendImSFX.play();
		socket.emit( 'send message', { 
			username: $laimUserName.val(),
			msg: $message.val()
		});
		if(Typer){
			typeInAngst();
			Typer.index = 0;
		}
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

	function getLyricsUrl(song){
		var corsProxyURL = "https://crossorigin.me/"
		var urlBase = "https://makeitpersonal.co/lyrics?";
		var artist = 'artist=' + song.artist;
		var title = 'title=' + song.title;
		return corsProxyURL + urlBase + artist + "&" + title;

	}

	function initTyper(){
		Typer = setTyper();
	}

	function getEmoLyrics(){
		
		for(var i = 0; i < artistSongTitleArray.length; i++){
			var url = getLyricsUrl(artistSongTitleArray[i]);
			var lyrics = $.ajax({
				crossDomain: true,
				dataType: 'text',
				url: url
			});
			lyrics.done(function( result ){
				lyricsCacheArr.push(result);
			});
		}
		

	}

	function typeInAngst(){
		var randSong = getRandomNum(lyricsCacheArr.length);
		Typer.text = lyricsCacheArr[randSong];
	}
	//Add button to jade for angst mode, on $message keydown--if angst mode on--call get emo lyric--init Typer

	$userNameForm.submit( function(e){
		
		e.preventDefault();

		if( $laimUserName.val() ){
			modifyLaimUserName();
			setUserName();
		}
		
	});

	$angstModeBtn.on('click', function(){
		angsty ? angsty = false : angsty = true;
		console.log(angsty);
		if(angsty){
			$angstModeBtn.addClass('angst-mode-on');
			initTyper();
			typeInAngst();
		}
		else{
			$angstModeBtn.removeClass('angst-mode-on');
			Typer.turnOff();
		}
		$message.focus();
	});

	$message.keydown(function(event) {
		if(angsty === true){
			Typer.addText(event);
		}
		socket.emit('user typing', {
			username: $laimUserName.val()
		});
	});

	$message.keyup(function(event){
		socket.emit('noone typing');
	    if(event.keyCode == 13){
	        $submitMessageBtn.click();
	    }

	});

	$messageForm.submit( function(e){
		
		e.preventDefault();

		if( $message.val() !== ''){
			sendFunction();
		}
		
	})

	function postBuddyArrDpartNotif( sn , string ){
		
		if(!sn){
			sn = "Anon";
		}

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

	socket.on('update typing status', function(screenname){
		if(screenname){
			$chatTypeStatus.text( screenname + ' is typing...');
			setTimeout(function(){
				$chatTypeStatus.text("   ");
			}, 1000);
		}
		else{
			$chatTypeStatus.text("   ");
		}
		
	});

	socket.on('new message', function(data){
		var $chatListItem = $('<li>', {
			"class": "chat-li"
		});

		$chatListItem.css('background-color', data.textBGColor);

		var $spanUserName = $('<span>', {
			"class": "username-span"
		}).text(data.username + ": ");

		var $spanMsg = $('<span>', {
			"class": "msg-span"
		}).text(data.msg);
		console.log('hers the bg color' + data.textBGColor)
		$chatListItem.append($spanUserName, $spanMsg) 
		console.log($spanMsg);
		
		if( data.username !== $laimUserName.val()){
			receiveImSFX.play();
		}
		console.log('hers the background color ' + data.textBGColor);
		$chatUl.append($chatListItem);
		$chatUl.scrollTop($chatUl[0].scrollHeight);
		$message.focus();
	});

	socket.on('get users', function(data){
		console.log(data);
		var html = '';
		for(var i = 0; i < data.length; i++){
			html+= '<li class=buddy-li>' + data[i] + '</li>';
		}
		$buddyUl.html(html);
	});

});		
		