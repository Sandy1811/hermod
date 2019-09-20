
  
## define
* define{"topic" : "literate"}
  - utter_onto_it
  - action_define

## say goodbye
* goodbye
  - utter_goodbye
  - action_stop_listening
  

## show me
* show_me{"pagetitle":"mnemo"}
  - action_show_me
  - action_stop_listening

## tell
* tell_me_about{"topic": "mnemo"}
    - utter_onto_it
    - action_tell_me_about
    - slot{"topic": "thetopic"}

## tell and more
* tell_me_about{"topic": "mnemo"}
    - utter_onto_it
    - action_tell_me_about
    - slot{"topic": "thetopic"}
    - action_listen
* tell_me_more
    - utter_onto_it
    - action_tell_me_more
        
               
## tell attribute
* tell_attribute{"topic": "mnemo", "attribute":"age"}
    - utter_onto_it
    - action_tell_attribute
    - slot{"topic": "thetopic"}
    
    
## tell attribute
* tell_attribute{"attribute":"age"}
    - utter_onto_it
    - action_tell_attribute
        
        
## list attributes
* list_attributes
    - utter_onto_it
    - action_list_attributes
        
## restart tracker
* restart_dialog
    - utter_restart
    - action_restart
        
## reset slots
* reset_slots
    - utter_reset_slots
    - action_reset_slots
        
