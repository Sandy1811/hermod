## happy path
* greet
  - utter_greet
* mood_great
  - utter_happy

## sad path 1
* greet
  - utter_greet
* mood_unhappy
  - utter_cheer_up
  - utter_did_that_help
* affirm
  - utter_happy
  - action_stop_listening

## sad path 2
* greet
  - utter_greet
* mood_unhappy
  - utter_cheer_up
  - utter_did_that_help
* deny
  - utter_goodbye
  - action_stop_listening

## say goodbye
* goodbye
  - utter_goodbye
  - action_dostuff
  - action_stop_listening

## bot challenge
* bot_challenge
  - utter_iamabot

## tell
* tell_me_about
    - utter_tell_me_about
    - action_stop_listening

## tell
* tell_me_about{"mnemotopic": "staged review"}
    - utter_about_staged_review
    - action_stop_listening

## tell
* tell_me_about{"mnemotopic": "mnemo"}
    - utter_about_mnemo
    - action_stop_listening


## tell
* tell_me_about{"mnemotopic": "mnemonics"}
    - utter_about_mnemonics
    - action_stop_listening

## tell
* about_developers
    - utter_about_developers
     - action_stop_listening


## greet then tell
* greet
    - utter_greet
* tell_me_about{"mnemotopic": "mnemo"}
    - utter_tell_me_about
    - action_tellmeabout
    - action_stop_listening

## review
* review
    - utter_review
    - action_review

## discover
* discover
    - utter_discover
    - action_discover
