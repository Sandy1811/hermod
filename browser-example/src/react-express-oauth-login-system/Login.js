import React, { Component } from 'react';
import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
import GoogleLogin from './GoogleLogin'
//import mustache  from 'mustache';
const config=require('../config');

export default  class Login extends Component {
    
    constructor(props) {
        super(props);
        this.state={signin_username:'syntithenai@gmail.com',signin_password:'aaa',rememberme:false};
        this.change = this.change.bind(this);
    };
         
    change(e) {
        var state = {};
        state[e.target.name] =  e.target.value;
        this.setState(state);
        return true;
    };
     
    componentDidMount() {
        if (this.props.isLoggedIn()) {
           this.props.history.push("/login/profile");
       }
    }; 
    componentDidUpdate() {
        if (this.props.isLoggedIn()) {
           this.props.history.push("/login/profile");
       }
    };
     
    render() {
           return  <form className="form-signin" onSubmit={(e) => {e.preventDefault();  this.props.submitSignIn(this.state.signin_username,this.state.signin_password); return false;}}>
           <Link to="/login/register" ><button style={{float:'right', marginRight:'0.3em',marginLeft:'2em'}} className='btn btn-primary' >Register</button></Link>
           
          <span style={{float:'right'}}><GoogleLogin 
                                clientId={config.googleClientId}
                                onSuccess={this.props.googleLogin}
                                /></span>
            <h1 className="h3 mb-3 font-weight-normal" style={{textAlign:'left'}}>Sign in</h1>
          <label htmlFor="inputEmail" className="sr-only">Email address</label>
          <input type="text" name="signin_username" id="inputEmail" className="form-control" placeholder="Email address" required  onChange={this.change} value={this.state.signin_username} />
          <label htmlFor="inputPassword" className="sr-only">Password</label>
          <input type="password" name="signin_password" id="inputPassword" className="form-control" placeholder="Password" required onChange={this.change}  value={this.state.signin_password} />

          <button className="btn btn-lg btn-success btn-block" type="submit">Sign in</button>           
        </form>
       
    };
}
      //<div className="checkbox mb-3">
        //<label>
          //<input type="checkbox" name='rememberme' value="remember-me"  onClick={this.toggleRemember} /> Remember me
        //</label>
      //</div>
        //this.toggleRemember = this.toggleRemember.bind(this);
    //toggleRemember(e) {
        //var state = this.state;
        //state.rememberme =  !state.rememberme;
        //this.setState(state);
        //return true;
    //};
    
