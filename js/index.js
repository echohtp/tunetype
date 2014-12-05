var indexModule = {

	//variables
	mmAPI : 'b956117746bf6dd8824562b615bf0516',
	enAPI : 'SIJACLXSKCNP2AUPM',
	mmEP : 'http://api.musixmatch.com/ws/1.1/',

	YT_endpoint: 'http://gdata.youtube.com/feeds/api/videos/',
	YT_artist : "",
	YT_song : "",
	lyrics: "",

	YT_iD : null,

	lyricEventHash: {},

	lyricEvents: [],

	trackDuration: null,

	timeTrack : null,

	bucketTrack: 0,

	bucketEnd: 0,

	currentSubtitle: null,

	nextSubtitle: null,

	polledEventLoop: null,

	//how fast it polls
	interval: 50,

	userScore: 0,

	authRef: null,

	userId: null,

	fbRef: null,

	userName: null,

	leaderboardUserHash: {},

	computeBucketScore: function(user, provided){
		var that = this;
		var user = user.trim() || null;
		var provided = provided.trim() || null;

	//	console.log ('computeScore: ' + user + ',' + provided);
		if (user && provided){
			for(var stringIndex in provided){
				var compChar = provided[stringIndex];
				if(compChar === user[stringIndex]){
					that.userScore++;
				}
			}
		}
		$('#user_score').text(that.userScore);
	},

	lyricComparer:	function(){
			var userType   = $('#user_lyric').val();
			var actualType = $('#lyric_container').text();

			if( userType == actualType ){
				$('#user_lyric').css('color','green');
			}else{

				if( actualType.indexOf(userType) >= 0 ){
					$('#user_lyric').css('color','white');
				}else{
					$('#user_lyric').css('color','red');
				}

			}
	},

	getYoutubeArtist: function( callback ){


		//all done
		if('function' == typeof callback){
			callback();
		}
	},

	getYoutubeSong: function(callback){

		//all done
		if('function' == typeof callback){
			callback();
		}
	},

	getEchnonestArist: function(callback){

		//all done
		if('function' == typeof callback){
			callback();
		}
	},

	getEchonestSong: function(callback){

		//all done
		if('function' == typeof callback){
			callback();
		}
	},

	renderLyricLine: function(){
		var that = this;

		$('#lyric_container').text( that.lyricEventHash[ that.currentSubtitle ] );

		/*
		$('#lyric_container').addClass('magictime tinRightOut',function(){
			$('#lyric_container').text( that.lyricEventHash[ that.currentSubtitle ] );
			$('#lyric_container').addClass('magictime tinLeftIn');
		});
		*/
	},

	saveUserScore: function( callback ){
		var curTime = new Date().getTime();
		var that = this;

		//save it
		var scoreObj = {
			id:     that.YT_iD,
			score:  that.userScore,
			time:   curTime,
			artist: that.YT_artist,
			song:   that.YT_song
		};

		var leaderBoardObj = {
			userId: that.userId, 
			artist: that.YT_artist, 
			song:   that.YT_song, 
			time:   curTime,
			id:     that.YT_iD
		};

		that.fbRef.child('users').child(that.userId).child('tunes').push(scoreObj,function(err){

			that.fbRef.child('scores').child(that.userScore).push( leaderBoardObj, function(err){

				//put it in the end modal
				$('.userScore').text(that.userScore);

				if('function' == typeof callback){
					callback();
				}

			});

		});

	},

	setupEventLoop: function(){
		var that = this;

		$('#user_lyric').focus();
		$('#user_lyric').focusout(function(){
			$('#user_lyric').focus();
		});

		that.timeTrack = 1;

		that.currentSubtitle = parseInt( that.lyricEvents[0] );
		that.nextSubtitle    = parseInt( that.lyricEvents[1] );
		that.bucketEnd       = that.nextSubtitle;

	//	console.log( that.currentSubtitle );
	//	console.log( that.lyricEventHash[ that.currentSubtitle ] );
		//$('#lyric_container').text( that.lyricEventHash[ that.currentSubtitle ] );

		that.polledEventLoop = setInterval(function(){

			if( that.timeTrack >= that.currentSubtitle ){
				that.bucketEnd = that.nextSubtitle - that.currentSubtitle;

				that.computeBucketScore($('#user_lyric').val(), $('#lyric_container').text());

				that.renderLyricLine(); //that.lyricEventHash[ that.currentSubtitle ]

				$('#user_lyric').val('');

				that.bucketTrack = 0;

				that.currentSubtitle = parseInt( that.lyricEvents.shift() );
				//
				that.nextSubtitle = parseInt( that.lyricEvents[0] );
			//	console.log( that.currentSubtitle );
			//	console.log( that.nextSubtitle );
		//		console.log( that.lyricEventHash[ that.currentSubtitle ] );

//				that.bucketEnd = that.nextSubtitle - that.currentSubtitle;

				$('#lyricProgress').css('width',function(){
				//	console.log( progressPercent );
					return '0%';
				});

				$('#lyricProgress').removeClass('progress-bar-warning');
				$('#lyricProgress').removeClass('progress-bar-danger');
				$('#lyricProgress').addClass('progress-bar-info');

			}

			that.timeTrack += that.interval;
			that.bucketTrack += that.interval;

			//console.log(that.nextSubtitle);
			//progress update
			var progressPercent = Math.floor( ( that.bucketTrack / that.bucketEnd ) * 100 ) || null;
			//console.log(progressPercent);
			if( progressPercent ){
				$('#lyricProgress').css('width',function(){
				//	console.log( progressPercent );
					return progressPercent + '%';
				});

				if( progressPercent > 60 ){
					$('#lyricProgress').removeClass('progress-bar-info');
					$('#lyricProgress').removeClass('progress-bar-danger');
					$('#lyricProgress').addClass('progress-bar-warning');
				}

				if( progressPercent > 90 ){
					$('#lyricProgress').removeClass('progress-bar-info');
					$('#lyricProgress').removeClass('progress-bar-warning');
					$('#lyricProgress').addClass('progress-bar-danger');
				}
			}

			//terminates the event loop
			if(that.timeTrack >= that.trackDuration){
				console.log('song is over');
				clearInterval( that.polledEventLoop );

				$('#stopButton').hide();
				$('#startButton').show();
				$('#endModal').modal('show');
				$('#endscreenSong').text( that.YT_song );

				that.saveUserScore(function(){
					that.reset();
				});
			}

			that.lyricComparer();

		}, that.interval);
	},

	parseLyricEvents: function(callback){
	//	console.log(this.lyrics);
		var that  = this;
		var count = 0;

		//reset it
		that.lyricEventHash = {};
		that.lyricEvents    = [];

		for(var lyricIndex in that.lyrics ){

			var curLyric  = that.lyrics[lyricIndex];
			var time      = curLyric.time;
			var eventTime = parseInt(time.total * 1000);
			that.lyricEventHash[ eventTime ] = curLyric.text;

			that.lyricEvents.push( eventTime );
		}

		//at the end it's over - set duration
		that.trackDuration = eventTime;

		if(typeof callback == 'function'){
			callback();
		}
	},

	getMMLyrics: function(callback){
		var that = this;
		var jsonURL = 'http://api.musixmatch.com/ws/1.1/matcher.subtitle.get?apikey=b956117746bf6dd8824562b615bf0516&subtitle_format=mxm&q_artist=' + that.YT_artist + '&q_track=' + that.YT_song + '&callback=?&format=jsonp'  ;

		$.getJSON(jsonURL,  function(data){
			//on success
			that.lyrics = JSON.parse(data.message.body.subtitle.subtitle_body);
			//set up the lyric/time hash
			that.parseLyricEvents();
		});

		//all done
		if('function' == typeof callback){
			callback();
		}
	},

	reset: function(){
		var that = this;

		//reset the score
		that.userScore = 0;

		//reset the stack
		that.parseLyricEvents();

	},

	bindKeyboard: function( callback ){

		/*$(window).keydown(function(e){ 
			e.preventDefault();
			if (e.which == 8){
				//IGNORE ME
			}
		});

		$(window).keyup(function(e){
			e.preventDefault();
			console.log(e);
			console.log(e.keyCode);
			var keystring = String.fromCharCode(e.keyCode);
			var newString = $('#type_container').text() + keystring;
			
			$('#type_container').text(newString);
			//$('#type_container');
		}); */

		//all done
		if('function' == typeof callback){
			callback();
		}		
	},

	renderYoutubePlayer: function(){
		var that = this;
		var player = $('<iframe onload="" id="tunetypeplayer" width="100%" height="100%" src="http://www.youtube.com/embed/' + this.YT_iD +'?enablejsapi=1&autoplay=0&autohide=1&showinfo=0" frameborder="0" class="yt_player_entry_obj" allowfullscreen></iframe>');
		
		$('#video_junk').toggle();
		
		$('#startButton').click(function(){
			//start the app
			that.startTuneType();
		});

		$('#video_wrapper').append( player );

		$('#video_wrapper').mousedown(function(){
			that.startTuneType();
			$('.video_wrapper').unbind('mousedown');
		});

	},

	showArtistSongTitle: function(){
		var that = this;
		$('#artist_name').text(that.YT_artist);
		$('#song_name').text(that.YT_song);
		$('footer').show();
	},

	//should kick off the whole thing, like, ready, GO type of thing
	startTuneType: function(callback){
		var that = this;
		
		$('#startButton').unbind('click');
		$('#startButton').hide();

		$('#stopButton').show(function(){

			$('#stopButton').click(function(){
				clearInterval(that.polledEventLoop);
				
				$('#stopButton').hide();
				$('#stopButton').unbind('click');

				$('#startButton').show();

				that.reset();

				$('#startButton').click(function(){
					that.startTuneType();
				});
			});

		});

		this.bindKeyboard(function(){
			that.setupEventLoop();

			$('#lyricProgress').show();
		});

		//all done
		if('function' == typeof callback){
			callback();
		}
	},



	//this is the method that scrapes
	scrapeYoutube: function( v_id,artist,song, callback ){
		var that = this;

		if(artist && song){
			that.YT_artist = artist;
			that.YT_song = song;
		}

		$.get(that.YT_endpoint + v_id, function(data){

			var title_parts = $(data).find('title').html().split('-');

			title_parts[0] = title_parts[0] || null;
			title_parts[1] = title_parts[1] || null;

			if(title_parts[0] && title_parts[1]){
				that.YT_artist = title_parts[0];
				that.YT_song   = title_parts[1];
			}

			that.getMMLyrics();
			$('#link_submit').hide();

			if('function' == typeof callback){
				callback();
			}
		});

	},

	loginTwitter: function(){
		var that = this;

		that.authRef.login('twitter');
	},

	loginFacebook: function(){
		var that = this;

		that.authRef.login('facebook');
	},	

	loginAnonymous: function(){
		var that = this;

		that.authRef.login('anonymous');
	},

	logout: function(){
		var that = this;
		that.authRef.logout();

		//stuff here
		$('#user_menu').hide();
		$('#user_name').text('');
		$('#link_submit').hide();
		$('#loginModal').modal('toggle');
	},

	setUsername: function( username ){
		$('#link_submit').show();
		$('#user_name').html(' ' + username + ' <span class="caret"></span>');
		$('#user_menu').show();
	},

	getUserScores: function(){
		var that = this;

		that.fbRef.child('users').child(that.userId).child('tunes').on('value',function(tunesSnap){

			$('#scoresTable').html('');
			var allTunes = tunesSnap.val();
			$('<tr><th>Score</th><th>Song</th></tr>').appendTo('#scoresTable');
			
			var countSongs = 0;
			for( var tuneIndex in allTunes ){
				$('<tr><td>' + allTunes[tuneIndex]['score'] + '</td><td>' + allTunes[tuneIndex]['song'] + '</td></tr>').appendTo('#scoresTable');
				countSongs++;
			}
			if(countSongs <1 ){
				$('<tr><td colspan="2">No Scores Yet</td></tr>').appendTo('#scoresTable');
			}
		});
	},

	getLeaderboard: function(){
		var that = this;

		console.log("getting leaderboard");
		that.runLeaderboard();

		//and bind it - make it live
		that.fbRef.child('scores').on('child_changed', function( scoreSnap ){
			that.runLeaderboard();
		});
	},

	runLeaderboard: function(){
		var that = this;

		that.fbRef.child('scores').once('value',function( scoresNodeSnap){
			var allScores = scoresNodeSnap.val();
			var totalScores = 0;

			if( allScores !== null ){

				$('<tr><thead><th>User</th><th data-sort="int">Score</th><th>Song</th></thead></tr>')
					.appendTo('#leaderboardTable');

				for(var scoreAsIndex in allScores ){
					var scoreStack = allScores[ scoreAsIndex ];
					var sIndex = scoreAsIndex;
					console.log(scoreAsIndex);

					for(var uScoreId in scoreStack){

						that.userNameLookupRender( scoreStack[ uScoreId ]['userId'], sIndex, scoreStack[ uScoreId ]['song']);

						totalScores++;
					}
				}

			}

			if( totalScores < 1 ){
				$('#leaderboardTable')
					.append('<tr><td colspan="3">No scores yet</td></tr>');
			}

			$("#leaderboardTable").stupidtable();
		});
	},

	userNameLookupRender: function( uId, sIndex, song, callback ){
		var that = this;

		that.fbRef.child('users').child( uId ).once('value',function(userNodeSnap){
			var userObj = userNodeSnap.val();
			
			$('<tr><td>'+ userObj.userName +'</td><td>'+sIndex+'</td><td>'+song+'</td></tr>')
							.appendTo('#leaderboardTable');


			if('function' == typeof callback){
				callback( userObj.userName );
			}
		});
	},

	runAuth: function(callback){
		var that = this;
		
		that.authRef = new FirebaseSimpleLogin(that.fbRef, function(error, user) {
		  if (error) {
		    // an error occurred while attempting login
		    console.log(error);
		  } else if (user) {
		  	console.log(user);

		    // user authenticated with Firebase
		    console.log('User ID: ' + user.uid + ', Provider: ' + user.provider);

			if(user.provider == 'anonymous'){
				that.userId = user.uid;
				that.userName = 'anonymous';
				that.setUsername('anonymous');

				$('#loginLink').show();
				$('#logoutLink').hide();
			}

			if(user.provider == 'twitter'){
				that.userId = user.uid;
				that.userName = user.displayName;
				that.setUsername(user.displayName);

				$('#loginLink').hide();
				$('#logoutLink').show();
			}

			if(user.provider == 'facebook'){
				that.userId = user.uid;
				that.userName = user.displayName;
				that.setUsername(user.displayName);

				$('#loginLink').hide();
				$('#loginLink').show();
			}

			that.fbRef.child('users').child( user.uid ).once('value',function(userSnap){
				var currTime = new Date().getTime();
				var userObj = userSnap.val();
				if( userObj != null ){
					that.fbRef.child('users').child(user.uid).child('timeago').set( currTime );
					that.fbRef.child('users').child(user.uid).child('userName').set( that.userName );
				}else{
					that.fbRef.child('users').child( user.uid )
						.set( {userId:user.uid, provider: user.provider, userName: that.userName} );
				}
			});

			that.getUserScores();

		    $('#loginModal').modal('toggle');

		  } else {
		    // user is logged out
		  }
		});

		if('function' == typeof callback){
			callback();
		}
	},

	processDifficultyChoice: function( yt_link, artist, song ){
		var that = this;

		var yt_params = yt_link.split('?');
		var id_parts  = yt_params[1].split('=');
		var yt_id     = id_parts[1];

		var _artist = artist;
		var _song = song;

		if( yt_id.length > 1 ){
			that.YT_iD = yt_id;

			//scrape the youtube link
			that.scrapeYoutube( yt_id, _artist, _song, function(){
				
				//show the player on the page
				that.renderYoutubePlayer();
				that.showArtistSongTitle();
			});

		}
	},

	setupMainGallery: function(){
		var that = this;

		var bindGalleryLink = function(el,url,artist,song){
			$(el).click(function(){
					indexModule.processDifficultyChoice(url,artist,song );
			});
		};

		for( var diffIndex in songModule.songList ){
			console.log(diffIndex);
			var diffCount = 0;

			for( var sIndex in songModule.songList[diffIndex]){
				var songItem = songModule.songList[diffIndex][sIndex];
				console.log(songItem);
				var galleryItemId = diffIndex + diffCount;
				var galleryItem = $("<a href='javascript:;' id='" + galleryItemId + "' />");
				var galleryImage = $("<img src='" + songItem.imageUrl + "' />").addClass('img-responsive img-rounded center-block');				

				$(galleryImage).appendTo(galleryItem);

				$(galleryItem).appendTo('#' + diffIndex+'_list');
				$('<br />').appendTo('#' + diffIndex+'_list');

				bindGalleryLink( '#' + galleryItemId, songItem.youtubeUrl, songItem.artist, songItem.song );

				diffCount++;
			}
		}

	},

	readyIndexModule: function(callback){
		var that = this;

		that.fbRef = new Firebase('https://tunetype.firebaseio.com');

		that.getLeaderboard();

		$('#go_button').click(function(e){
			e.preventDefault();
			console.log('clicked');
			var yt_link = $('#yt_link').val();

			var yt_params = yt_link.split('?');
			var id_parts  = yt_params[1].split('=');
			var yt_id     = id_parts[1];

			if( yt_id.length > 1 ){
				that.YT_iD = yt_id;

				//scrape the youtube link
				that.scrapeYoutube( yt_id, function(){
					
					//show the player on the page
					that.renderYoutubePlayer();
					that.showArtistSongTitle();
				});

			}

		});

		$('#video_junk').hide();

		//bind the login buttons

		$('#twitterLogin').click(function(){
			that.loginTwitter();
		});
		$('#facebookLogin').click(function(){
			that.loginFacebook();
		});
		$('#anonymousLogin').click(function(){
			that.loginAnonymous();
		});

		//show login modal
		that.runAuth(function(){
			$('#loginModal').modal('show');
		});

		$('#logoutLink').click(function(){
			that.logout();
		});

		$('#loginLink').click(function(){
			$('#loginModal').modal('show');
		});

		$('#showScores').click(function(){
			$('#scoresModal').modal('show');
		});

		$('#closeEndModal').click(function(){
			$('#endModal').modal('hide');
			$('#video_wrapper').html('');
			$('#video_junk').hide();
			$('#link_submit').show();
			$('footer').hide();
		});

		$('.scoresTab').click(function(){
			$('#leaderboardTable').hide();
			$('#scoresTable').hide();
			$('#friendsTable').hide();

			$('li.active').removeClass('active');

			$(this).parent().toggleClass('active',true);
			var sectionId = $(this).data('opens');
			$('#'+sectionId).show();
		});

		that.setupMainGallery();

		//all done
		if('function' == typeof callback){
			callback();
		}	

	}
};

$(function(){
	indexModule.readyIndexModule(function(){

	});

	/*

	$('body').load('./templates/videoModal.html',function(){
		console.log('loaded modal');
	});

	*/
});
