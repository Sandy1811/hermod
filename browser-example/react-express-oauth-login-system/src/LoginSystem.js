import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
import Logout from './Logout'
import PropsRoute from './PropsRoute'
import Profile from './Profile'
import Login from './Login'
import Register from './Register'
import ForgotPassword from './ForgotPassword'
import OAuth from './OAuth'
  
//var config=require('./config')

export default  class LoginSystem extends Component {
    
    constructor(props) {
        super(props);
        this.timeout = null;
        this.refreshInterval = null;
        this.state={warning_message:null};
        // XHR
        this.submitSignUp = this.submitSignUp.bind(this);
        this.submitSignIn = this.submitSignIn.bind(this);
        this.recoverPassword = this.recoverPassword.bind(this);
        this.saveUser = this.saveUser.bind(this);
        this.refreshLogin = this.refreshLogin.bind(this);
       
       this.logout = this.logout.bind(this);
       this.onLogin = this.onLogin.bind(this);
       this.isLoggedIn = this.isLoggedIn.bind(this)
       this.submitWarning = this.submitWarning.bind(this);
       
    };
    
    componentDidMount() {
        let that=this;
		try {
		  let token = localStorage.getItem('token');
		  if (token && token !== undefined) {
			  that.refreshLogin(token);
		  }
		} catch (e) {
		}
		// if there is an auth request pending, jump to that
		//let authRequest = localStorage.getItem('auth_request');
		//if (authRequest) {
			//this.props.history.push('/login/oauth');
		//}
    };
   
    
 
    saveUser(user) {
         let that = this;
         if (this.props.startWaiting) this.props.startWaiting();
         return fetch(that.props.authServer+'/saveuser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        }).then(function(res) {
            if (that.props.stopWaiting) that.props.stopWaiting();
            return res.json();  
        }).then(function(res) {
            if (res.user) that.setState({user:res.user});
            if (res.warning_message) that.submitWarning(res.warning_message);
        }).catch(function(err) {
            console.log(err);
        });
    };
    
    submitSignIn(user,pass) {
        var that=this;
        this.submitWarning('');
        if (this.props.startWaiting) this.props.startWaiting();
        setTimeout(function() {
           fetch(that.props.authServer+'/signin', {
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
                if (that.props.stopWaiting) that.props.stopWaiting();
                if (data.message) {
                    that.submitWarning(data.message);
                } else {
					that.onLogin(data);
				}
          }).catch(function(error) {
            console.log(['SIGN IN request failed', error])
          });
           
       },100);
    };
    
    submitSignUp(name,avatar,email,password,password2) {
       var that=this;
       this.submitWarning('');
       if (this.props.startWaiting) this.props.startWaiting();
       fetch(that.props.authServer+'/signup', {
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
		  if (that.props.stopWaiting) that.props.stopWaiting();
			if (data.warning) {
                that.submitWarning(data.warning);
            } else if (data.message) {
                that.submitWarning(data.message);
            }
      }).catch(function(error) {
        console.log(['request failed', error]);
      });
    }; 
 
    recoverPassword(email,password,password2) {
        let that = this;
       console.log(['recover',email,password,password2]);
        if (this.props.startWaiting) this.props.startWaiting();
       fetch(that.props.authServer+'/recover', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            password: password,
            password2: password2,
            code: Math.random().toString(36).replace(/[^a-z]+/g, '')
          })
        }).then(this.checkStatus)
      .then(this.parseJSON)
      .then(function(data) {
            if (that.props.stopWaiting) that.props.stopWaiting();
       
            if (data.warning_message) {
                that.submitWarning(data.warning_message);
            } else if (data.message) {
                that.submitWarning(data.message);
            }
            
           //console.log(['recover request with JSON response', data])
			//that.setState(data); 
      }).catch(function(error) {
        console.log(['recover request failed', error])
      });
        return false;
    };
  
 
	refreshLogin (code) {
	  		console.log('refresh login')
			let that = this;
			if (code && code !== undefined && code !== 'undefined' && code !== 'null' && code.length > 0) {
				
				fetch(that.props.authServer+'/me?code='+code, {
				  method: 'GET',
				  headers: {
					'Content-Type': 'application/json'
				  },
				//  body: JSON.stringify({access_token:code})
				}).then(function(res) {
					return res.json();  
				}).then(function(res) {
					console.log(['refreshed ',res])
					that.setUser(res);
				}).catch(function(err) {
					console.log(err);
				});				
			}
	}  
   
    // xhr processing chain
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
    
    
   isLoggedIn() { 
      if (this.state.user  && this.state.user.token && this.state.user.token.access_token  && this.state.user.token.access_token.length > 0) {
          return true;
      } else {
          return false;
      }
    }; 
     
    onLogin(user) {
		let that =this;
		// just the token into localstorage
        localStorage.setItem('token',user.token.access_token);
        this.setState({user:user});
        clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(function() {
			that.refreshLogin(that.state.token)
		},180000);
        if (this.props.onLogin) this.props.onLogin(user,this.props);
    };
    
    setUser(user) {
		// just the token into localstorage
        localStorage.setItem('token',user.token.access_token);
        this.setState({user:user});
        if (this.props.setUser) this.props.setUser(user);
    };
    
    submitWarning(warning) {
        let that=this;
        clearTimeout(this.timeout);
        this.setState({'warning_message':warning});
        this.timeout = setTimeout(function() {
            that.setState({'warning_message':''});
        },6000);
    };
    
     
  
  logout() {
      localStorage.setItem('token',null);
	  let user = this.state.user;
	  this.setState({user:null});
      if (this.props.onLogout) this.props.onLogout(user,this.props);
  };
 
    
    render() {
		//let that = this;
        let callBackFunctions = {
            submitSignUp : this.submitSignUp,
            submitSignIn : this.submitSignIn,
            recoverPassword : this.recoverPassword,
            onLogin : this.props.onLogin,
            refreshLogin : this.refreshLogin,
            logout : this.logout,
            isLoggedIn : this.isLoggedIn,
            saveUser : this.saveUser,
            setUser:  this.setUser,
            submitWarning : this.submitWarning,
            user:this.state.user,
            warning_message: this.state.warning_message,
            authServer: this.props.authServer,
            loginButtons: this.props.loginButtons
        };
        //console.log('ren log sys');
        
		// route for /login/
        const DefaultRedirect = function(props) {
            //if (!that.isLoggedIn()) {
               //props.history.push("/login/login");
            //} else if (that.isLoggedIn()) {
				//props.history.push("/login/profile");
			//}
            return <b></b>;
        };
        
        
 
        return (<div>
                <Route path='/' component={DefaultRedirect} />
                <PropsRoute {...callBackFunctions} path='/login/profile' component={Profile}   />
                <PropsRoute {...callBackFunctions} path='/login/login' component={Login} />
                <PropsRoute {...callBackFunctions} path='/login/register' component={Register} />
                <PropsRoute {...callBackFunctions} path='/login/logout' component={Logout} />
                <PropsRoute {...callBackFunctions} path='/login/oauth' component={OAuth} />
                <PropsRoute {...callBackFunctions} exact={true} path='/login' component={DefaultRedirect} />
                <PropsRoute {...callBackFunctions} exact={true} path='/login/forgot' component={ForgotPassword} />
            </div>)
            

    };
    


}

//<PropsRoute {...callBackFunctions} path='/login/confirm/:token' component={ConfirmRegistration} />
                
// moved down
//{(this.state.warning_message) && <div className='warning' >{this.state.warning_message}</div>}
                
