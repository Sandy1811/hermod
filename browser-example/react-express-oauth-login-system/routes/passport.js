var express = require('express');
var router = express.Router();
var utils = require("./utils")
var config = require("../config")
var fetch = require('node-fetch');
const mustache = require('mustache');
const crypto = require("crypto"); 
var faker = require('faker');
var btoa = require('btoa');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const bodyParser = require('body-parser');
const bluebird = require('bluebird');
const oauthMiddlewares = require('../oauth/oauthServerMiddlewares');





/**********************************
 * INITIALISE MONGOOSE AND RAW MONGODB CONNECTIONS
 *********************************/
var ObjectId = require('mongodb').ObjectID;

if (!config.userFields || config.userFields.length === 0) config.userFields=['name','avatar','username','token','access_token','access_token_created','password','tmp_password']
//const User = require('./User');

//mongoose.connect(config.databaseConnection + config.database,{useMongoClient: true}).then(() => {
	////console.log('Mongoose Connected');
//}).catch((err) => {
	//console.log(err);
//});


const database = require('../oauth/database');
database.connect(config.databaseConnection+config.database);

// INITIALSE OAUTH SERVER - create client if not exists
database.OAuthClient.findOne({clientId: config.clientId}).then(function(client) {
	let clientFields = 	{clientId: config.clientId, clientSecret:config.clientSecret,name:config.clientName,website_url:config.clientWebsite,privacy_url:config.clientPrivacyPage,redirectUris:[],image:config.clientImage};
	if (client!= null) {
		// OK
		database.OAuthClient.update({clientId:config.clientId},clientFields);
	} else {
		let client = new database.OAuthClient(clientFields);
		client.save().then(function(r) {
		});
	}
}).catch(function(e) {
	console.log(e);
});
global.Promise = bluebird;


router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.all('/token', oauthMiddlewares.token);
router.post('/authorize', oauthMiddlewares.authorize);
router.get('/authorize',function(req,res) {
	//console.log(['AUTHORIZE',req]);
	
})
//router.post('/authorize', oauthMiddlewares.authorize);
//router.get('/secure', oauthMiddlewares.authenticate, (req, res) => {
//res.json({ message: 'Secure data' });
//});



/********************
 * CONFIGURE PASSPORT
 ********************/

var passport = require('passport')

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


var LocalStrategy = require('passport-local').Strategy;

// username/password
passport.use(new LocalStrategy(
  function(username, password, done) {
    database.User.findOne({ username: username,password:password }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect login details' });
      }
     // console.log('LOGIN',user.toObject());
      return done(null, user);
    });
  }
));


//console.log(['CONFIG GOOGLE',config.googleClientId,config.googleClientSecret,config.protocol+"://"+config.host]);
var GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(new GoogleStrategy({
    clientID: config.googleClientId,
    clientSecret: config.googleClientSecret,
    callbackURL: config.authServer + '/googlecallback'
  },
  function(accessToken, refreshToken, profile, cb) {
//	console.log(['GOOLGE LOGIN STRAT',accessToken, refreshToken, profile,profile.emails]);
	if (profile && profile.emails && profile.emails.length > 0) {
			let email = profile.emails[0].value
			findOrCreateUser(profile.displayName,email,cb);
		} else {
			cb('google did not provide an email',null);
		}
	}
));



var TwitterStrategy = require('passport-twitter').Strategy;

passport.use(new TwitterStrategy({
    consumerKey: config.twitterConsumerKey,
    consumerSecret: config.twitterConsumerSecret,
    callbackURL: config.authServer + '/twittercallback',
    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
  },
  function(token, tokenSecret, profile, cb) {
    //	console.log(['twitter LOGIN STRAT',token, tokenSecret, profile,profile.emails,profile.entities,profile.status,profile.photos]);
		if (profile && profile.emails && profile.emails.length > 0) {
			let email = profile.emails[0].value
			findOrCreateUser(profile.displayName,email,cb);
		} else {
			cb('twitter did not provide an email',null);
		}
  }
));


var FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: config.facebookAppId,
    clientSecret: config.facebookAppSecret,
    callbackURL: config.authServer + '/facebookcallback',
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(token, tokenSecret, profile, cb) {
    	//console.log(['FacebookStrategy LOGIN STRAT',token, tokenSecret, profile,profile.emails,profile.entities,profile.status,profile.photos]);
		if (profile && profile.emails && profile.emails.length > 0) {
			let email = profile.emails[0].value
			findOrCreateUser(profile.displayName,email,cb);
		} else {
			cb('FacebookStrategy did not provide an email',null);
		}
  }
));
// NO ACCESS TO EMAIL ADDRESS
//var InstagramStrategy = require('passport-instagram').Strategy;

//passport.use(new InstagramStrategy({
    //clientID: config.instagramClientId,
    //clientSecret: config.instagramClientSecret,
    //callbackURL: config.authServer+"/instagramcallback"
  //},
  //function(accessToken, refreshToken, profile, cb) {
    //console.log([profile,profile.emails]);
    //if (profile && profile.emails && profile.emails.length > 0) {
		//let email = profile.emails[0].value
		//findOrCreateUser(profile.displayName,email,cb);
	//} else {
		//cb('instagram did not provide an email',null);
	//}
  //}
//));

var GithubStrategy = require('passport-github').Strategy;

passport.use(new GithubStrategy({
    clientID: config.githubClientId,
    clientSecret: config.githubClientSecret,
    callbackURL: config.authServer+"/githubcallback",
  },
  function(accessToken, refreshToken, profile, cb) {
	//  console.log([profile,profile.emails]);
    if (profile && profile.emails && profile.emails.length > 0) {
		let email = profile.emails[0].value
		findOrCreateUser(profile.displayName ? profile.displayName : profile.username,email,cb);
	} else {
		cb('github did not provide an email',null);
	}
  }
));


	function findOrCreateUser(name,email,cb) {
		if (email && email.length > 0) {
		 //console.log(['/findorcreate have mail',email]);
			 database.User.findOne({username:email.trim()}).then(function(user) {
		         //console.log(['/findorcreate fnd',user]);
				  if (user!=null) {
					  requestToken(user).then(function(user) {
							let token = user.token;
							 cb(null,Object.assign(sanitizeUser(user.toObject()),{token:token}))					
					  });
				  } else {
					  var pw = crypto.randomBytes(20).toString('hex');
					  let item={name:name,username:email,password:pw};
					  //item.access_token = generateToken();
					  //item.access_token_created = new Date().getTime();
					   if (!item.avatar) item.avatar = faker.commerce.productAdjective()+faker.name.firstName()+faker.name.lastName()
					  let user = new database.User(item)
			 		  requestToken(user).then(function(user) {
						    //   console.log(['SAVE USER',user]);
							  user.save().then(function(err,result) {
								let token = user.token;
								cb(null,Object.assign(sanitizeUser(user.toObject()),{token:token}))
							  })                      
					  });
				  }
			 }).catch(function(e) {
				 //console.log(e);
				 cb(e, null);
			 });
		} else {
			cb('no user', null);
		}
	}

	function generateToken() {	
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}
	
	function requestToken(user) {
		 return new Promise(function(resolve,reject) {
			 var params={
				username: user.username,
				password: user.password,
				'grant_type':'password',
				'client_id':config.clientId,
				'client_secret':config.clientSecret
			  };
			//  console.log(['RQUEST TOKEN',params])
			  return fetch(config.authServer+"/token", {
				  method: 'POST',
				  headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				  },
				  
				  body: Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&')
				}).then(function(response) {
					return response.json();
				}).then(function(token) {
					//console.log(['got token',token]);
					//res.redirect(config.redirectOnLogin + '?code='+token.access_token);
					//res.send({user:user,token:token});
					if (token.access_token && token.access_token.length > 0) {
						user.token = token;
					} else {
						console.log(['ERROR REQUESTING TOKEN',token])
					}
					resolve(user);
				}).catch(function(err) {
						console.log(['ERROR REQUESTING TOKEN',err])
				});
		});
	}
	

	function sanitizeUser(user) {
		let item={};
		//console.log(['sanitize user',config.userFields]);
		
		config.userFields.map(function(fieldName) {
			let key = fieldName.trim();
			item[key] = typeof user[key] ==="string" ? user[key].trim() : '';
		 });
		 if (user._id) item._id = user._id;
		 delete item.password;
		 delete item.tmp_password;
		 return item;
	}


	//// default route
	//router.get("/",function(req,res) {
		//res.redirect(config.apiPath + '/login');
	////	utils.sendTemplate(req,res,{"content":utils.renderLogin(req)});
	//})
	
	router.use(passport.initialize());

	router.use('/login',function(req, res, next) {
	  //  console.log('do login NOW')
		passport.authenticate('local', function(err, user, info) {
		//	console.log('really done login NOW')
		//	console.log(req.user);
			res.json(req.user);
		})(req, res, next);
	})  

	router.use('/google',function(req, res, next) {
	  //console.log('do Glogin NOW')
		passport.authenticate('google', { scope: ['profile','email'] })(req,res,next);
	//	next();
	}) 
	router.get('/googlecallback', 
	  passport.authenticate('google', { failureRedirect: '/login' }),
	  function(req, res) {
		// Successful authentication, redirect home
		//console.log('GOOGLE CALLBACK USER',req.user)
		res.redirect(config.redirectOnLogin+'?code='+req.user.token.access_token);
     });
	
	router.use('/twitter',function(req, res, next) {
	  console.log('do twitter login NOW')
		passport.authenticate('twitter', { scope: ['email'] })(req,res,next);
	//	next();
	}) 
	router.get('/twittercallback', 
	  passport.authenticate('twitter', { failureRedirect: '/login' }),
	  function(req, res, next) {
		// Successful authentication, redirect home
		//console.log('twitter CALLBACK USER',req.user)
		res.redirect(config.redirectOnLogin+'?code='+req.user.token.access_token);
     });
	
	router.use('/facebook',function(req, res, next) {
	  //console.log('do facebook login NOW')
		passport.authenticate('facebook', { scope: ['email'] })(req,res,next);
	//	next();
	}) 
	router.get('/facebookcallback', 
	  passport.authenticate('facebook', { failureRedirect: '/login' }),
	  function(req, res, next) {
		// Successful authentication, redirect home
		//console.log('facebook CALLBACK USER',req.user)
		res.redirect(config.redirectOnLogin+'?code='+req.user.token.access_token);
     });
	
	// NO ACCESS TO EMAIL ADDRESS
	//router.use('/instagram',function(req, res, next) {
	  //console.log('do instagram login NOW')
		//passport.authenticate('instagram', { scope: ['basic'] })(req,res,next);
	////	next();
	//}) 
	//router.get('/instagramcallback', 
	  //passport.authenticate('instagram', { failureRedirect: '/login' }),
	  //function(req, res, next) {
		//// Successful authentication, redirect home
		//console.log('instagram CALLBACK USER',req.user)
		//res.redirect(config.redirectOnLogin+'?code='+req.user.access_token);
     //});
	
	
	router.use('/github',function(req, res, next) {
	  //console.log('do github login NOW')
		passport.authenticate('github', { scope: ['user'] })(req,res,next);
	//	next();
	}) 
	router.get('/githubcallback', 
	  passport.authenticate('github', { failureRedirect: '/login' }),
	  function(req, res, next) {
		// Successful authentication, redirect home
		//console.log('github CALLBACK USER',req.user)
		res.redirect(config.redirectOnLogin+'?code='+req.user.token.access_token);
     });
	
	
	
	/********************
	 * SIGNUP
	 ********************/
	router.post('/signup', function(req, res) {
	//	console.log(['SERVER SIGNUP',req.body])
		
			if (req.body.username && req.body.username.length > 0 && req.body.name && req.body.name.length>0 && req.body.avatar && req.body.avatar.length>0 && req.body.password && req.body.password.length>0 && req.body.password2 && req.body.password2.length>0) {
			if (!config.allowedUsers || config.allowedUsers.length === 0 ||  (config.allowedUsers.indexOf(req.body.username.toLowerCase().trim()) >= 0 )) {
				
				if (req.body.password2 != req.body.password)  {
					res.send({message:'Passwords do not match.'});
				} else {
							database.User.findOne({username:req.body.username.trim()}, function(err, ditem) {
								if (err) console.log(err)
								if (ditem) {
									res.send({'warning':'There is already a user registered with the email address '+req.body.username});
								} else {
									let item = {}
									config.userFields.map(function(fieldName) {
										let key = fieldName.trim();
										item[key] = req.body[key] ? req.body[key].trim() : '';
									});
									item.password = req.body.password.trim();
									database.User.findOne({avatar:{$eq:req.body.avatar.trim()}}).then(function(avUser) {
											if (avUser!=null && avUser.length>0) {
												res.send({message:'Avatar name is already taken, try something different.'});
											} else {
												item.signup_token =  generateToken();
												item.tmp_password=item.password;
												item.password='';
												item.password2='';
												let user = new database.User(item)
												
												//User.update({'_id': ObjectId(item._id)},{$set:updatedItem})
												user.save().then(function(result2) {
													res.send(sendWelcomeEmail(item.signup_token,req.body.name,item.username));
												});                                        
											}
									});
								
								}
							});
				}
			} else {
				res.send({message:'Sorry. You are not allowed to register and login.'});
			}
		} else {
			res.send({message:'Missing required information.'});
		}
	});
	  

	/********************
	 * CONFIRM REGISTRATION
	 ********************/
	router.get('/doconfirm',function(req,res) {
		let params = req.query;
		      database.User.findOne({ signup_token:params.code.trim()})
				.then(function(user)  {
						if (user != null) {
	    					var userId = user._id;
						  user.password = user.tmp_password;
						  user.signup_token = undefined;
						  user.tmp_password = undefined;
						  requestToken(user).then(function(user) {
							  //user.access_token = generateToken();
							  //user.access_token_created = new Date().getTime();
							  user.save().then(function() {
								   res.redirect(config.redirectOnLogin + '?code='+user.token.access_token);

							  }).catch(function(e) {
								  res.send({message:'Error saving user in signup confirmation'});
							  });
						  });
						} else {
							res.send({message:'No matching registration'} );
						}
				   // }
				}).catch(function(e) {
					console.log(['failed',e]);
					res.send({message:'failed'});
				});
	})


	/********************
	 * SIGN IN
	 ********************/
	router.post('/signin', function(req, res) {
		let params = req.query;		
		//console.log('SERVER SIGNIN NOW');
		
		//console.log(req.body);
		if (req.body.username && req.body.username.length > 0 && req.body.password && req.body.password.length>0) {
				database.User.findOne({username:req.body.username.trim(),password:req.body.password.trim()})
				.then(function(user)  {
						if (user != null) {
	    				  //user.access_token = generateToken();
						  //user.access_token_created = new Date().getTime();
						  requestToken(user).then(function(user) {
							    let token = user.token;
								//console.log('signin',Object.assign(sanitizeUser(user.toObject()),{token:token}))
							     res.send(Object.assign(sanitizeUser(user.toObject()),{token:token}))
						  });
						} else {
							res.send({message:'No matching user'} );
						}
				}).catch(function(e) {
					res.send({message:'failed'});
				});		
		} else {
			 res.send({message:'Missing required login credentials'});
		}
	});


	///********************
	 //* GOOGLE SIGN IN
	 //********************/
	//router.post('/googlesignin',function(req,res) {
	   //// //console.log(['/googlesignin']);
		//if (req.body.email && req.body.email.length > 0) {
		 ////   //console.log(['/googlesignin have mail',req.body.email]);
			 //User.findOne({username:req.body.email.trim()}).then(function(user) {
		   ////      //console.log(['/googlesignin fnd',user]);
				  //if (user!=null) {
	////				 sendTokenRequest(res,user);
				  //} else {
					  //var pw = crypto.randomBytes(20).toString('hex');
					  //let item={name:req.body.name,username:req.body.email,password:pw};
					  //if (config.allowedUsers.length === 0 ||  (config.allowedUsers.indexOf(item.username.toLowerCase().trim()) >= 0 )) {        
						  //if (!item.avatar) item.avatar = faker.commerce.productAdjective()+faker.name.firstName()+Math.round(Math.random()*10000000)
						  //let user = new User(item)
						  //user.save().then(function(err,result) {
						   ////sendTokenRequest(res,item);
						    //res.send({user:sanitizeUser(item)})
						  //})                      
					  //} else {
						  //res.send({message:'Sorry. You are not allowed to login. '});
					  //}
					  
				  //}
			 //}).catch(function(e) {
				 ////console.log(e);
				 //res.send({message:'Invalid request e'});
			 //});
		//} else {
			//res.send({message:'Invalid request'});
		//}
		
		
	//})

	/********************
	 * REQUEST  PASSWORD RECOVERY EMAIL
	 ********************/
	router.post('/recover', function(req, res) {
		if (req.body.email && req.body.email.length > 0 && req.body.code && req.body.code.length > 0) {
			if (!req.body.password || req.body.password.length==0 || !req.body.password2 || req.body.password2.length==0) {
				res.send({warning_message:'Empty password is not allowed'});
			} else if (req.body.password2 != req.body.password)  {
				res.send({warning_message:'Passwords do not match'});
			} else {
				database.User.findOne({username:req.body.email}, function(err, item) {
				  if (err) {
					  res.send({warning_message:err});
				  } else if (item!=null) {
					  item.tmp_password = req.body.password;
					  item.recover_password_token=req.body.code;
					  // no update email address, item.username = req.body.username;
					  database.User.update({'_id': ObjectId(item._id)},{$set:item}).then(function(xres) {
						   var link = config.authServer + '/dorecover?code='+item.recover_password_token;
						   var mailTemplate = config.recoveryEmailTemplate && config.recoveryEmailTemplate.length > 0 ? config.recoveryEmailTemplate : `<div>Hi {{name}}! <br/>

	To confirm your password recovery of your account , please click the link below.<br/>

	<a href="{{link}}" >Confirm your password update</a><br/>

	If you did not recently request a password recovery for your account, please ignore this email.<br/><br/>

									  </div>`;
						   
						   
						   var mailTemplate =  mustache.render(mailTemplate,{link:link,name:item.name});
						   utils.sendMail(config.mailFrom,req.body.email,"Update your password ",
									 mailTemplate
								  );  
						  item.warning_message="Sent recovery email";
						  res.send(item);
					  });  
					  
				  } else {
					  res.send({warning_message:'No matching email address found for recovery'});
				  }
				}); 
			}
		} else {
			res.send({warning_message:'Missing required information.'});
		}
	});
	/********************
	 * PASSWORD RECOVERY 
	 ********************/
	router.get('/dorecover',function(req,res) {
			let params = req.query;
		 	  database.User.findOne({ recover_password_token:params.code})
				.then(function(user)  {
					if (user != null) {
					  var userId = user._id;
					  user.password = user.tmp_password;
					  user.recover_password_token = undefined;
					  user.tmp_password = undefined;
					  //user.access_token = generateToken()
					  //user.access_token_created = new Date().getTime();
					  requestToken(user).then(function(user) {
							user.save().then(function() {
							   res.redirect(config.redirectOnLogin + '?code='+user.token.access_token);
						  }).catch(function(e) {
							  //console.log(['Failed confirmation',e]);
							  res.send('failed ' );
						  });
					  });	
					} else {
						res.send('no matching registration' );
					}
				}).catch(function(e) {
					//console.log(['failed',e]);
					res.send('failed');
				});		
	})



	/********************
	 * Get user info using req.query.code
	 ********************/
	//router.use('/me',
		//passport.authenticate('bearer'),
		//function(req, res) {
			//console.log(['me',req.user])
			//res.json(req.user);
		//}
	//);

	router.get('/me',function(req,res) {
		let token = req.query.code;
		database.OAuthAccessToken.findOne({$and:[{accessToken:{$eq:token}},{accessTokenExpiresAt: {$gt: new Date()}}]},function(err,token) {
			if (err) {
				res.send({error:err})  
			} else {
				database.User.findOne({_id:token.user}, function (err, user) {
					if (err) { 
						res.send({error:err})  
					} else {
						if (user) {
							  res.send(Object.assign(sanitizeUser(user.toObject()),{token:token.toObject()}))
						} else {
								res.send({error:'no match'})  
						}
					}
				});	 			
			}
		});
			 
			 
	})

	/********************
	 * SAVE USER
	 ********************/
	router.post('/saveuser', function(req, res) {
		if (req.body._id && req.body._id.length > 0) {
			if (req.body.password && req.body.password.length > 0 && req.body.password2 && req.body.password2.length > 0 && req.body.password2 != req.body.password)  {
				res.send({warning_message:'Passwords do not match'});
			} else {
				database.User.findOne(ObjectId(req.body._id), function(err, item) {
				  if (err) {
					  //console.log(err);
					  res.send({warning_message:err});
				  } else if (item!=null) {
					 config.userFields.map(function(fieldName) {
						let key = fieldName.trim();
						// don't update username
						if (key !== 'username') {
							item[key] = req.body[key] ? req.body[key].trim() : '';
						}
				     });
				    
				     if (req.body.password && req.body.password.trim().length > 0 && req.body.password2 && req.body.password2.trim().length > 0 && req.body.password === req.body.password2) {
						  item.password=req.body.password.trim();
					 } else {
						  delete item.password
					 }
					
					  // update avatar only when changed
					  if (req.body.avatar && item.avatar != req.body.avatar) {
						  database.User.findOne({avatar:{$eq:req.body.avatar}}, function(err, avUser) {
							  if (avUser!=null) {
								  res.send({warning_message:"Avatar name is already taken, try something different."});
							  } else {
								  database.User.update({'_id': ObjectId(item._id)},{$set:item}).then(function(xres) {
									  item.warning_message="Saved changes";
									  res.send(item);
								  });  
							  }
						  });
					  } else {
						database.User.update({'_id': ObjectId(item._id)},{$set:item}).then(function(xres) {
							  item.warning_message="Saved changes";
							  res.send(item);
						  });  
					  }
				  } else {
					  res.send({warning_message:'ERROR: No user found for update'});
				  }
				}); 
			}
		} else {
			res.send({warning_message:'Missing required information.'});
		}
	});

	router.get('/oauthclient',function(req,res) {
		//  {access_token_created :{$gt: tokenCutoff} }
		//User.findOne({$and:[ {access_token: {$eq:token}}] }, function (err, user) {
		let clientId = req.query.clientId;
		database.OAuthClient.findOne({clientId:clientId}, function (err, client) {
		    if (err) { 
				res.send({error:err})  
			} else {
				if (client) {
					res.send({name:client.name,website_url:client.website_url,privacy_url:client.privacy_url,image:client.image});
				} else {
						res.send({error:'no match'})  
				}
			}
		});	 
			 
			 
	})
	// error handlers
	router.use((req, res, next) => {
	  const err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});

	router.use((err, req, res, next) => {
	  res.status(err.status || 500);
	  res.json({
		message: err.message,
		error: err
	  });
	});



	function sendWelcomeEmail(token,name,username) {
		var link = config.authServer + '/doconfirm?code='+token;
		var mailTemplate = config.signupEmailTemplate && config.signupEmailTemplate.length > 0  ? config.signupEmailTemplate : `<div>Hi {{name}}! <br/>

				Welcome,<br/>

				To confirm your registration, please click the link below.<br/>

				<a href="{{link}}" >Confirm registration</a><br/>

				If you did not recently register, please ignore this email.<br/><br/>

				</div>`
		utils.sendMail(config.mailFrom,username,'Confirm your registration',
			mustache.render(mailTemplate,{link:link,name:name}
			)
		);
		item={}
		item.message = 'Check your email to confirm your sign up.';
		return item;
		
	}


	
	//function sendToken(req,res,user) {
		 //var params={
			//username: user.username,
			//password: user.password,
			//'grant_type':'password',
			//'client_id':config.clientId,
			//'client_secret':config.clientSecret
	  //};
		//fetch(config.apiPath+"/oauth/token", {
		  //method: 'POST',
		  //headers: {
			//'Content-Type': 'application/x-www-form-urlencoded',
			////Authorization: 'Basic '+btoa(config.clientId+":"+config.clientSecret) 
		  //},
		  
		  //body: Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&')
		//}).then(function(response) {
			//return response.json();
		//}).then(function(token) {
		  ////  //console.log(['got token',token]);
		   //res.send({code:token.access_token});
		//}).catch(function(e) {
		   //// //console.log(e);
			 //res.send({message:'Error logging in'});
		//});
	//}
	

module.exports = router;
