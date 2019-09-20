import React from 'react'
import {Component} from 'react'
import HermodReactComponent from './HermodReactComponent'

export default class HermodReactTrackerView extends HermodReactComponent  {

    constructor(props) {
        super(props);
        if (!props.siteId || props.siteId.length === 0) {
            throw "TTS Server must be configured with a siteId property";
        }
        //this.props.config={}
        let that = this;
        this.state={tracker:null}
        let eventFunctions = {
        // SESSION
            'hermod/+/core/tracker' : function(topic,siteId,payload) {
				if (siteId && siteId.length > 0) { // && payload.siteId === props.siteId) {
                   console.log(['set TRACJER' +siteId ,payload])
					let final = []
					if (payload && payload.tracker && payload.tracker.events) {
						final = payload.tracker.events.map(function(event) {return {event:event.event,name:event.name,text:event.text}})
					}
					that.setState({slots:payload.tracker.slots,tracker:final});
					
               }
            }
        }
        
        this.logger = this.connectToLogger(props.logger,eventFunctions);
    }  
    
    componentDidMount() {
    };
    
  


    render() {
        return <div><h1>Slots</h1>{JSON.stringify(this.state.slots)}<h1>Tracker</h1><pre id="Hermodreacttts" >{JSON.stringify(this.state.tracker,null,1)}</pre></div>
    };

  
}

