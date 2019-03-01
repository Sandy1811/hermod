import  { Component } from 'react';
//import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
//import GoogleLogin from './GoogleLogin'

//import mustache  from 'mustache';
//const config=require('../config');

export default  class ConfirmRegistration extends Component {
    
    //constructor(props) {
        //super(props);
       
    //};
     
    render() {
        if (this.props.match.params.token) {
            this.props.loginByConfirm(this.props.match.params.token);
        }
        this.props.history.push("/meeka/menu");
        return '';
    };
}
