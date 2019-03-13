/* global gapi */
import React, { Component } from 'react';

export default class GoogleLogin extends Component {
   constructor(props) {
        super(props);
        
        this.loggedIn = false;
        this.accessToken = '';
     
        this.GoogleAuth = null; 
        this.accessTokenExpires = 0;
        this.requiredScope = 'profile email'; 
        this.pickerApiLoaded = false;
        this.authApiLoaded = false;
        this.lastLoggedIn = 0;
        
        this.requireExtraScope = this.requireExtraScope.bind(this);
        this.renewAccessToken = this.renewAccessToken.bind(this);
        this.isAccessTokenExpired = this.isAccessTokenExpired.bind(this);
        this.renderSignIn = this.renderSignIn.bind(this);
        this.handleAuthClick = this.handleAuthClick.bind(this);
        this.stashGoogleAuth = this.stashGoogleAuth.bind(this);
        this.loginToWebsite = this.loginToWebsite.bind(this);
        this.googleSignOut = this.googleSignOut.bind(this);
        this.updateSigninStatus = this.updateSigninStatus.bind(this);
        this.handleFailure = this.handleFailure.bind(this);
        
    };
    
    render() {
        return <div id="google-signin"></div>
    };

    componentDidMount() {
       let that = this;
       const script = document.createElement("script");
        script.src = "https://apis.google.com/js/platform.js";
        script.onload = () => {
			console.log('google client api loaded now set key '+that.props.clientId);
          gapi.load('client', () => {
            gapi.client.setApiKey(that.props.clientId);
            gapi.load('client:auth2', that.renderSignIn);
            window.gapi = gapi;
           });
        };

        document.body.appendChild(script);
    }
    
    handleFailure() {
        this.googleSignOut();
    };
    
	renderSignIn() {
        gapi.signin2.render('google-signin', {
			'scope': 'profile email',
            'width': 200,
			'height': 35,
			'longtitle': true,
			'theme': 'dark',
			'onsuccess': this.handleAuthClick,
            'onfailure': this.handleFailure
		});
	}

	handleAuthClick() {
        this.authApiLoaded = true;
		this.GoogleAuth = gapi.auth2.getAuthInstance();
		this.GoogleAuth.isSignedIn.listen(this.updateSigninStatus);
		this.updateSigninStatus();
	}
    
    updateSigninStatus() {
		var user = this.GoogleAuth.currentUser.get();
			if (user) {
				this.loggedIn = user.hasGrantedScopes(this.requiredScope);
				if (this.loggedIn) {
					this.loginToWebsite().then(function(user) {
					});
				}
			} else {
				this.loggedIn = false;
			}
	}
	
	stashGoogleAuth(token) {
		this.accessToken = token;
	}
	
	loginToWebsite(token) {
		let p = new Promise((resolve, reject) => {
                var googleUser = this.GoogleAuth.currentUser.get();
                // gather user info and post to website
                if (googleUser  && googleUser['Zi'] && googleUser['Zi']['access_token']) {
                    this.accessTokenExpires = (new Date().getTime() / 1000) + parseInt(googleUser['Zi']['expires_in'],10);
                    //// Successfully authorized, create session
                    var id_token = googleUser.getAuthResponse().id_token;
					var profile = googleUser.getBasicProfile();
                    var props = {idtoken:id_token,name:profile.getName(),image:profile.getImageUrl() ,email: profile.getEmail() };
                    this.props.onSuccess(props);
                    resolve();
                } else {
					resolve();
				}
        });
		return p;
	}

    requireExtraScope(extraScope) {
		let p = new Promise((resolve, reject) => {
            var googleUser =  this.GoogleAuth.currentUser.get();
            if (googleUser) {
                window.timeout(function() {
                    if (!googleUser.hasGrantedScopes(extraScope)) {
                        googleUser.grant({'scope' : extraScope,'ux_mode':'popup'}).then(function(resp) {
                            resolve(resp.Zi);
                        });
                    } else {
                        resolve(googleUser['Zi']);
                    }
                });
            } else {
                reject();
            }
        });
        return p;
	}

	isAccessTokenExpired() {
		var now = new Date().getTime() / 1000;
		return (now > this.accessTokenExpires) ? true : false;
	}
	
	renewAccessToken()  {
		let p = new Promise((resolve, reject) => {
            if (this.authApiLoaded) {
                this.GoogleAuth = gapi.auth2.getAuthInstance();
                if (this.isAccessTokenExpired()) {
                    var googleUser =  this.GoogleAuth.currentUser.get();
                    if (googleUser) {
                        googleUser.reloadAuthResponse().then(function(auth) {
                            this.loginToWebsite().then(function() {
                                this.stashGoogleAuth(googleUser['Zi']['access_token']);
                                resolve(googleUser['Zi']['access_token']);
                            });
                        });
                    } else {
                        this.updateSigninStatus();
                        resolve('NOTOKEN');
                    }
                } else {
                   resolve(this.accessToken);
                }
            }
        });
		return p;
	}
	
	
	
	googleSignOut() {
		if (this.GoogleAuth) this.GoogleAuth.disconnect();
	}
	
}
