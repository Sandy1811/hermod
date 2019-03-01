import  { Component } from 'react';
//import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
//import GoogleLogin from './GoogleLogin'
 
//import mustache  from 'mustache';
//const config=require('../config');

export default  class Logout extends Component {
    
    //constructor(props) {
        //super(props);
       
    //};
     
    componentDidMount() {
       if (this.props.isLoggedIn()) {
           this.props.logout();
       } 
       this.props.history.push("/");
        
    }; 
    
    render() {
       return null;
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
    
