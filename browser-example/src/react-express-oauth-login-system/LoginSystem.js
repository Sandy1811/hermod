/* global gapi */
import React, { Component } from 'react';
//import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
import Logout from './Logout'
import PropsRoute from './PropsRoute'
import Profile from './Profile'
import Login from './Login'
import Register from './Register'
import ConfirmRegistration from './ConfirmRegistration'
  
var config=require('../config')

export default  class LoginSystem extends Component {
    
    constructor(props) {
        super(props);
        this.timeout = null;
        
        this.state={warning_message:null};
        this.submitSignUp = this.submitSignUp.bind(this);
        this.submitSignIn = this.submitSignIn.bind(this);
        this.googleLogin = this.googleLogin.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.unforgotPassword = this.unforgotPassword.bind(this);
        this.recoverPassword = this.recoverPassword.bind(this);
        
       this.openAuth = this.openAuth.bind(this);
       //this.login = this.login.bind(this);
       //this.isAdmin = this.isAdmin.bind(this);
       this.refreshLogin = this.refreshLogin.bind(this);
       this.loginByToken = this.loginByToken.bind(this);
       this.loginByRecovery = this.loginByRecovery.bind(this);
       this.loginByConfirm = this.loginByConfirm.bind(this);
       this.logout = this.logout.bind(this);
       this.saveUser = this.saveUser.bind(this);
       this.setUser = this.setUser.bind(this);
       this.setToken = this.setToken.bind(this);
       this.isLoggedIn = this.isLoggedIn.bind(this)
        
       this.loginByLocalStorage = this.loginByLocalStorage.bind(this);
       this.submitWarning = this.submitWarning.bind(this);
       this.GoogleAuth = null; // Google Auth object.
       let loadedUser = null;
       try {
            loadedUser = JSON.parse(localStorage.getItem('user'));
       } catch (e) {
           loadedUser = {};
       }
       let loadedToken = null;
       try {
            loadedToken = JSON.parse(localStorage.getItem('token'));
       } catch (e) {
           loadedToken = {};
       }
       this.state = {
            user:(loadedUser && String(loadedUser._id).length > 0) ? loadedUser : {},
            token:(loadedToken && String(loadedToken.access_token).length > 0) ? loadedToken : {},
        }
        
    };
    
    componentDidMount() {
        let that=this;
      const script = document.createElement("script");
        script.src = "https://apis.google.com/js/platform.js";
        script.onload = () => {
           gapi.load('client:auth2', () => {
                gapi.client.init({
                    clientId: config.clientId,
                    scope: 'profile email'
                }).then(function () {
                    let instance=gapi.auth2.getAuthInstance();  
                    that.GoogleAuth = instance;
                });
              });
        };
        document.body.appendChild(script);
    
    //// try login from localstorage
    let token = null;
    let user = null;
    try {
     token = JSON.parse(localStorage.getItem('token'));
     user = JSON.parse(localStorage.getItem('user'));
      if (token && user) {
          that.refreshLogin(token,user);
      }
	} catch (e) {
		console.log(e);
	}
  
        
    };
    
      isLoggedIn() { 
      //
      if (this.state.token && this.state.token.access_token && this.state.token.access_token.length > 0 && this.state.user && this.state.user.username  && this.state.user.username.length > 0) {
          return true;
      } else {
          return false;
      }
    }; 
    
    
    setUser(user) {
        localStorage.setItem('user',JSON.stringify(user));
        this.setState({user:user});
        //if (this.props.setUser) this.props.setUser(user);
    };
    
    setToken(token) {
        localStorage.setItem('token',JSON.stringify(token));
        this.setState({token:token});
        //if (this.props.setToken) this.props.setToken(token);
    };
    
    
    submitWarning(warning) {
       // console.log(['WARNING',warning]);
        let that=this;
        clearTimeout(this.timeout);
        this.setState({'warning_message':warning});
        this.timeout = setTimeout(function() {
            that.setState({'warning_message':''});
        },6000);
    };
    
     
    submitSignIn(user,pass) {
        var that=this;
        this.submitWarning('');
       setTimeout(function() {
            ////console.log(this.state);
           fetch(that.props.apiPath+'/login/signin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                username: user,
                password: pass
              })
            }).then(this.checkStatus)
          .then(that.parseJSON)
          .then(function(data) {
                if (data.message) {
                    that.submitWarning(data.message);
                } 
                that.setToken(data.token);
                that.setUser(data.user);
                that.props.onLogin(data.user,data.token);
          }).catch(function(error) {
            ////console.log(['request failed', error])
          });
           
       },100);
    };
    
    submitSignUp(name,avatar,email,password,password2) {
       // console.log(['submit signup  ',name,avatar,email,password,password2 ])
       var that=this;
       this.submitWarning('');
       fetch(that.props.apiPath+'/login/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            avatar: avatar,
            username: email,
            password: password,
            password2: password2,
          })
        })
        .then(this.checkStatus)
      .then(this.parseJSON)
      .then(function(data) {
      // console.log(['signup  request with JSON response', data])
       if (data.warning) {
                that.submitWarning(data.warning);
            } else if (data.message) {
                that.submitWarning(data.message);
            }
            
        //if (data._id && data._id.length > 0) {
            //that.setState({justSignedUp: true, warning_message:data.warning_message});            
        //} else {
            //that.setState({warning_message:data.warning_message});            
        //}
      }).catch(function(error) {
        console.log(['request failed', error]);
      });
    }; 
    
    googleLogin(user) {
        let that=this;
        //console.log(['glogin ',user]);
        fetch(that.props.apiPath+'/login/googlesignin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name
          })
        })
        //.then(this.checkStatus)
      .then(this.parseJSON)
      .then(function(data) {
            that.setToken(data.token);
            that.setUser(data.user);
            that.props.onLogin(data.user,data.token);
            if (data.message) {
                that.submitWarning(data.message);
            } 
            
        ////    //console.log(['gsignin request with JSON response', data])
           //if (data.code && data.code.length > 0) {
              //window.location='/?code='+data.code;
             //// that.postToUrl('/',{code:data.code},'POST');
           //}
        }).catch(function(e) {
            console.log(e);
        });
    };

    forgotPassword(e) {
        e.preventDefault();
        this.setState({forgotPassword: true});
        return false;
    };
    unforgotPassword(e) {
        e.preventDefault();
        this.setState({forgotPassword: false});
        return false;
    };
    
    
    recoverPassword(e) {
        let that = this;
        e.preventDefault();
       // //console.log(['recover',this.state.email]);
        fetch(that.props.apiPath+'/login/recover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.state.email,
            password: this.state.password,
            password2: this.state.password2,
            code: Math.random().toString(36).replace(/[^a-z]+/g, '')
          })
        }).then(this.checkStatus)
      .then(this.parseJSON)
      .then(function(data) {
            if (data.message) {
                that.submitWarning(data.message);
            }
            ////console.log(['recover request with JSON response', data])
        that.setState(data); 
      }).catch(function(error) {
        //console.log(['request failed', error])
      });
        return false;
    };
  
  openAuth(service) {
      ////console.log(['oauth '+service]);
      //response_type:'code',
      let authRequest={redirect_uri:this.getQueryStringValue('redirect_uri'),response_type:this.getQueryStringValue('response_type'),scope:this.getQueryStringValue('scope'),state:this.getQueryStringValue('state')}
      // force logout
      localStorage.setItem('token','{}');
      localStorage.setItem('user','{}');
      this.setState({'token':'{}','user':'{}'});
      // this.GoogleAuth.disconnect();
      
      //this.setCurrentPage('login');
      localStorage.setItem('oauth',service);
      localStorage.setItem('oauth_request',JSON.stringify(authRequest));
  };


  //login (user) {
      //let that=this;
      //if (user) {
          //this.props.setUser(user);
          //localStorage.setItem('user',JSON.stringify(user));
                
          //// get a token
            //var params={
                //username: user.email ? user.email : user.username,
                //password: user.password,
                //'grant_type':'password',
                //'client_id':config.clientId,
                //'client_secret':config.clientSecret
              //};
            //fetch(that.props.apiPath+'/oauth/token', {
              //method: 'POST',
              //headers: {
                //'Content-Type': 'application/x-www-form-urlencoded',
              //},
              //body: Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&')
            //}).then(function(response) {
                //return response.json();
                
            //}).then(function(res) {
               //// //console.log(['ddtoken response',res]);
                //this.props.setToken(res);
                //if (data.message) {
                    //this.setState('warning_message':data.message);
                //} 
            
                //localStorage.setItem('token',JSON.stringify(res));
               //// that.startMqtt(that.state.user)
                //setInterval(function() {
                       //// //console.log('toke ref');
                        //that.refreshLogin(res)
                    //},(parseInt(res.expires_in,10)-1)*1000);
            //})
            //.catch(function(err) {
                ////console.log(['ERR',err]);
            //});
        //}
  //}    
    
    


   
  refreshLogin (token,user) {
      console.log(['REFRESHLOGIN',token]);
      //console.log(token);
      //if (!token) {
          //token=this.state.token;
      //}
      //var state={};
      var that = this;
      //state.user = this.state.user;
        var params={
            'refresh_token':token.refresh_token,
            'grant_type':'refresh_token',
            'client_id':config.clientId,
            'client_secret':config.clientSecret
          };
          //console.log(params);
        fetch(that.props.apiPath+'/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&')
        }).then(function(response) {
            if (response.code === 200 ) {
                return response.json();
            } else {
                return [];
            }
            
        }).then(function(restok) {
            if (restok && restok.access_token) {
                //this.props.setToken(restok);
                //console.log(['refreshed token',restok]);
    //            that.setState(state);
      //          localStorage.setItem('token',JSON.stringify(res));
                fetch(that.props.apiPath+'/login/me?code='+restok.access_token, {
                  method: 'GET',
                }).then(function(response) {
                    console.log(['RESCODE',response]);
                    return response.json();
                }).then(function(res) {
                    //console.log(['ddtoken response',res]);
                    that.setToken(restok)
                    that.setUser(res.user)
                    that.props.onLogin(res.user,restok);
                    
                    //that.startMqtt(res.user)
                    //setInterval(function() {
                  ////      //console.log('toke ref tok');
                        //that.refreshLogin(state.user)
                    //},(parseInt(that.state.token.expires_in,10)-1)*1000);
                })
                .catch(function(err) {
                    console.log(['ERRme',err]);
                });
                
            } else {
                if (user && user.username && user.password) {
                    that.submitSignIn(user.username,user.password);
                } else {
                    that.logout();
                }
            }
        })
        .catch(function(err) {
            console.log(['ERR',err]);
        });

  }  
    
  loginByToken(token) {
      let state = {token: token};
      let that = this;
      localStorage.setItem('currentTopic',null)
      fetch(that.props.apiPath+'/login/me?code='+token, {
          method: 'GET',
        }).then(function(response) {
            return response.json();
            
        }).then(function(res) {
        //    //console.log(['ddtoken response',res]);
            //state.user = res.user;
            //state.token = res.token;
            //localStorage.setItem('token',JSON.stringify(res.token));
            //localStorage.setItem('user',JSON.stringify(state.user));
            //that.setState(state);
            //that.startMqtt(state.user)
            //that.props.loadMeekaFromLocalStorage();
            that.setToken(res.token)
            that.setUser(res.user)
            that.props.onLogin(res.user,res.token);
            setInterval(function() {
          //      //console.log('toke ref tok');
                that.refreshLogin(res.token,res.user)
            },(parseInt(that.state.token.expires_in,10)-1)*1000);
        })
        .catch(function(err) {
            //console.log(['ERR',err]);
        });
  };
  
    loginByConfirm(token) {
    //  let state = {token: token};
      let that = this;
      localStorage.setItem('currentTopic',null)
      fetch(that.props.apiPath+'/login/doconfirm?code='+token, {
          method: 'GET',
        }).then(function(response) {
            return response.json();
            
        }).then(function(data) {
        //    //console.log(['ddtoken response',res]);
            if (data.message) {
                that.submitWarning(data.message);
            } 
            that.setToken(data.token);
            that.setUser(data.user);
            that.props.onLogin(data.user,data.token);
        })
        .catch(function(err) {
            //console.log(['ERR',err]);
        });
  };
  
    loginByRecovery(token) {
      let state = {token: token};
      let that = this;
      fetch(that.props.apiPath+'/login/dorecover?code='+token, {
          method: 'GET',
        }).then(function(response) {
            return response.json();
            
        }).then(function(res) {
        //    //console.log(['ddtoken response',res]);
            state.user = res.user;
            state.token = res.token;
            localStorage.setItem('token',JSON.stringify(res.token));
            localStorage.setItem('user',JSON.stringify(state.user));
            that.setState(state);
            //that.startMqtt(state.user)
            //that.props.loadMeekaFromLocalStorage();
            setInterval(function() {
              //  //console.log('toke ref tok');
                that.refreshLogin(state.user)
            },(parseInt(this.state.token.expires_in,10)-1)*1000);
        })
        .catch(function(err) {
            //console.log(['ERR',err]);
        });
  };
  
  logout() {
      console.log('DO LOGOUT REAL');
      //localStorage.setItem('token','{}');
      //localStorage.setItem('user','{}');
      this.setUser(null);
      this.setToken(null);
      //this.GoogleAuth.disconnect();
      //let GoogleAuth = gapi.auth2.getAuthInstance();
      if (this.GoogleAuth) this.GoogleAuth.disconnect();
      this.props.onLogout();
      //this.props.history.push("/login/login");
      //window.location='/';
      //gapi.auth2.getAuthInstance().disconnect();
      //var auth2 = gapi.auth2.getAuthInstance();
        //auth2.signOut().then(function () {
          ////console.log('User signed out.');
        //});
      ////console.log('logout at root');
      
  };
        
     
 
  
 
  
    saveUser(user) {
         let that = this;
         
        return fetch(that.props.apiPath+'/login/saveuser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        }).then(function(res) {
            return res.json();  
        }).then(function(res) {
            //console.log(['SAVED',res]);
            if (res.user) that.setState({user:res.user});
            if (res.warning_message) that.submitWarning(res.warning_message);
        }).catch(function(err) {
            console.log(err);
        });
    };
    
    
   
  loginByLocalStorage() {
      //return ;
      //////console.log(['loginByLocalStorage1',localStorage.getItem('token'),JSON.parse(localStorage.getItem('token'))]);
      //if (localStorage.getItem('token') && localStorage.getItem('token').length > 0 && localStorage.getItem('user') && localStorage.getItem('user').length > 0) {
          ////this.setState({user:JSON.parse(localStorage.getItem('user')),token:JSON.parse(localStorage.getItem('token'))});
          //this.login(JSON.parse(localStorage.getItem('user')));
      //}
  };
  
  

  
  
    //UTILS
    getQueryStringValue (key) {  
          return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
    } 
      
    checkStatus(response) {
      if (response.status >= 200 && response.status < 300) {
        return response
      } else {
        var error = new Error(response.statusText)
        error.response = response
        throw error
      }
    }


    parseJSON(response) {
      return response.json()
    }
    
    postToUrl(path, params, method) {
        method = method || "post";

        var form = document.createElement("form");
        form.setAttribute("method", method);
        form.setAttribute("action", path);

        for(var key in params) {
            if(params.hasOwnProperty(key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", params[key]);

                form.appendChild(hiddenField);
             }
        }

        document.body.appendChild(form);
        form.submit();
    }


    
    render() {
        let callBackFunctions = {
            submitSignUp : this.submitSignUp,
            submitSignIn : this.submitSignIn,
            googleLogin : this.googleLogin,
            forgotPassword : this.forgotPassword,
            unforgotPassword : this.unforgotPassword,
            recoverPassword : this.recoverPassword,
            openAuth : this.openAuth,
           login : this.login,
           isAdmin : this.isAdmin,
           refreshLogin : this.refreshLogin,
           loginByToken : this.loginByToken,
           loginByRecovery : this.loginByRecovery,
           loginByConfirm : this.loginByConfirm,
           logout : this.logout,
           isLoggedIn : this.isLoggedIn,
           saveUser : this.saveUser,
           setUser : this.setUser,
           setToken : this.setToken,
           loginByLocalStorage:this.loginByLocalStorage,
           user:this.state.user,
           token:this.state.token,
           resetMeekaLocalStorage :this.props.resetMeekaLocalStorage
        };
        //console.log('ren log sys');
        

        const LoginRedirect = function(props) {
           // console.log(['REDR',props.isLoggedIn()]);
            if (props.isLoggedIn()) {
               props.history.push("/login/profile");
            } else if (!props.isLoggedIn()) {
               props.history.push("/login/login");
            }
            return <b></b>;
        };
        
        return (<div>
                {(this.state.warning_message) && <div className='warning' >{this.state.warning_message}</div>}
                <PropsRoute {...callBackFunctions} path='/login/profile' component={Profile}  />
                <PropsRoute {...callBackFunctions} path='/login/login' component={Login}  />
                <PropsRoute {...callBackFunctions} path='/login/register' component={Register} />
                <PropsRoute {...callBackFunctions} path='/login/logout' component={Logout} />
                <PropsRoute {...callBackFunctions} path='/login/confirm/:token' component={ConfirmRegistration} />
                <PropsRoute {...callBackFunctions} exact={true} path='/login' component={LoginRedirect} />
            </div>)
            

    };
    


}

