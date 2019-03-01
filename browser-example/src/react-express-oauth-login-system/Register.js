import React, { Component } from 'react';
//import 'whatwg-fetch'
import {BrowserRouter as Router,Route,Link,Switch,Redirect} from 'react-router-dom'
import GoogleLogin from './GoogleLogin'
//import mustache  from 'mustache';
const config=require('../config');
//const utils=require('../../auth_utils');
var faker = require('faker');
           
export default class Register extends Component {
    
    //render() {
        //return <iframe src="http://localhost:4000/login" style={{height: "40em", border: 0,  paddingLeft: '1em'}} />
    //};
    constructor(props) {
        super(props);
        this.state={
            warning_message:'',
            signin_warning_message:'',
            signup_warning_message:'',
            email_login:'',
            password_login:'',
            name:'aa ',
            email:'aa@syntithenai.com ',
            password:'aaa',
            password2:'aaa',
            justSignedUp: false,
            forgotPassword: false,
            avatar: faker.commerce.productAdjective()+faker.name.firstName()
            
        }
        this.change = this.change.bind(this);
        this.submitSignUp = this.submitSignUp.bind(this);
        
    };
    
    
    submitSignUp(e) {
       // console.log('SSU');
       // console.log(this.props);
        e.preventDefault();
        this.props.submitSignUp(this.state.name,this.state.avatar,this.state.email,this.state.password,this.state.password2);
        //this.setState('');
        return false;
    };
    
    change(e) {
        var state = {};
        state[e.target.name] =  e.target.value;
        this.setState(state);
        return true;
    };
    
    render() { //req,vars/
        return (
            <div  style={{width: '80%'}}>
                {this.state.warning_message && <div className='warning-message' style={{float:'right'}} >{this.state.warning_message}</div>}
                
                <div style={{paddingLeft:'1em',clear:'both'}}>
                   
                    <form method="POST" onSubmit={(e) => this.submitSignUp(e)}  >
                           <Link to="/login/login" ><button style={{float:'right', marginRight:'0.3em',marginLeft:'2em'}} className='btn btn-primary' >Login</button></Link>
                            <div className="form-group">
                            <span style={{float:'right'}}><GoogleLogin 
                            clientId={config.googleClientId}
                            onSuccess={this.props.googleLogin}
                            /></span>
                            <h3 style={{textAlign:'left'}} className="card-title">Registration</h3>
                              
                              {this.state.signup_warning_message && <div style={{float:'right'}}  className='warning-message'>{this.state.signup_warning_message}</div>}

                                <label htmlFor="name" style={{float:'left'}}>Name</label><input className='form-control' autoComplete="false" id="name" type='text' value={this.state.name} name='name' onChange={this.change} />
                                <label htmlFor="avatar" className='row'>Avatar </label><input className='form-control' autoComplete="false" id="avatar" type='text'  name='avatar' value={this.state.avatar} onChange={this.change} />
                                <label htmlFor="email" className='row'>Email </label><input className='form-control' autoComplete="false" id="email" type='text' name='email' value={this.state.email} onChange={this.change} />
                                <label htmlFor="password" className='row'>Password</label> <input value={this.state.password} className='form-control' autoComplete="false"  id="password" type='password' name='password' onChange={this.change} />
                                <label htmlFor="password2" className='row'>Repeat Password</label><input className='form-control'  autoComplete="false"  id="password2" type='password' name='password2' value={this.state.password2} onChange={this.change} />
                                
                            </div>
                            <br/>
                            <br/>
                            <button  className='btn btn-lg btn-success btn-block'>Register</button>
                    </form>
                </div>
              
            </div>
        )
    }


}
