import React from 'react';
import {BrowserRouter as Link} from 'react-router-dom'
import LoginSystem from './LoginSystem'

export default  class LoginSystemHooks extends LoginSystem {
    
    constructor(props) {
        super(props);
        this.timeout = null;
        this.refreshInterval = null;
        this.state={warning_message:null};
        this.isLoggedIn = this.isLoggedIn.bind(this);
        this.loginHooks = this.loginHooks.bind(this);
    };
      
    isLoggedIn() { 
	  if (this.props.user && this.props.user.token && this.props.user.token.access_token  && this.props.user.token.access_token.length > 0) {
          return true;
      } else {
          return false;
      }
    }; 
    
    componentDidMount() {
       this.loginHooks();
    };

    componentDidUpdate(props) {
       this.loginHooks();
    };


	loginHooks() {
		let that = this;
		// wait for other redirects to finish HACK
		setTimeout(function() {
			
			function checkAuthRequest(user) {
				// restore pending oauth request after login
				let authRequest = localStorage.getItem('auth_request');
				if (authRequest && that.isLoggedIn() ) {
					// using the showButton property, a button will be shown instead of immediate automatic redirect
					if (that.props.showButton) {
						that.setState({authRequest:authRequest});
					} else {
						// if there is an auth request pending, jump to that
						that.props.history.push('/login/oauth');
					}
				} else {
					that.props.history.push('/login/login');
				}
			}
			
			// login using request parameter code 
			function loginWithCode(code) {
				return new Promise(function(resolve,reject) {
					if (code && code.length > 0 && code !== undefined && code !== 'undefined'  && code !== 'null') {
						console.log(['LoginByCode',code])
						fetch(that.props.authServer+'/me?code='+code, {
						  method: 'GET',
						  headers: {
							'Content-Type': 'application/json'
						  },
						}).then(function(res) {
							return res.json();  
						}).then(function(res) {
							that.setUser(res);
							resolve(res);
						}).catch(function(err) {
							console.log(err);
							reject();
						});				
					}
				});
			}
			let code = null;
			if (that.props.location.search.startsWith('?code=')) {
				code = that.props.location.search.slice(6);
				if (code) {
					loginWithCode(code).then(function(user) {checkAuthRequest(user)});
				} 
			}
		},500);
	}
	
	render() {
		if (this.state.authRequest) {
			return <div className='pending-auth-request' ><Link to='/login/auth' className='btn btn-success'  >Pending Authentication Request</Link></div>
		} else {
			return null;
		}
	}
}
