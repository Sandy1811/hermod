# Hermod Voice Protocol

The Hermod Voice Protocol describes a data format for sending messages between microservices on an MQTT bus to support voice based dialog.
The protocol describes a dialog flow starting with hotword detection or button press, through ASR, NLU and RASA core routing to support context based dialog.

The included library provides an implementation of the Hermod protocol that can be used to build your own Alexa like device.

The included React library provides implementation of some components of the protocol in a web browser (Speaker,Microphone, TTS, ..) to support building websites that you can talk to.

## Quickstart

Clone this repository and `docker-compose up`

The included RASA model and action server supports querying wikipedia. For example. Tell me about China. [bot reply first sentence wiki] ... What is the capital city [bot response from parsing infobox for attributes - Beijing]

By default, Deepspeech is used for speech recognition. Edit the docker-compose file to include credentials for Google STT or IBM Watson STT. Google is the most accurate and response 

## Why use a message bus in Hermod ? 

In comparison, the RASA team provide an [example voice chat using Deepspeech](https://github.com/RasaHQ/rasa-voice-interface) where the browser communicates directly with Deepspeech and RASA servers.

The protocol is derived from Snips Hermes which is intended for building offline solutions where minimising network traffic and performance load are less important and distribution is more important to support a network of smaller (Raspberry Pi) devices providing a multi room dialog solution.


CONS
- extra infrastructure (mqtt server, nodejs)
- protocol introduces complexity and processing overhead
- current implementation of ASR/NLU/CORE are server based so all communication with those services is doubled by bridging MQTT to HTTP.
- serverless deployment costs are unnecessarily inflated because each interaction requires multiple calls as a message proceeds through the dialog flow.


PROS
- useful for home automation setup as well as distributed web apps.
- elements of the protocol can be distributed
- protocol provides clarity because most microservices have a simple contract. A variety of implementations of ASR (Deepspeech, Google, BrowserDirectGoogle, .....) can all satisfy a simple contract of asr/start, asr/stop, microphone/audio then send messages asr/text or asr/fail.
- dialog manager as message broker provides opportunity to control flow of dialog (bailout, barge in, to person)
- protocol can be extended to support - display devices, asynchronous user identification, deduplication of requests when a spoken command is heard by multiple devices, .... 
- RASA can be behind a firewall that only exposes MQTT and HTTP. 
- messaging protocol provides for easy logging of dialog flow internals.
- secure realtime messaging built into application framework.
- distributed audio framework built in
- protocol can be used to build standalone audio endpoints eg Raspberry Pi 0 running Speaker, Microphone and Hotword services supported by "home hub" Pi4 that runs machine learning services Deepspeech and RASA. Mqtt libraries exist for Arduino so potential to build very low power devices.
- interface to alexa and google assistant through JOVO http endpoint triggering a dialog init and intent directly then collating tts/say 
until dialog/end or dialog/continue when the http endpoint returns ask or say to JOVO as appropriate.



MITIGATION
- Allow a browser or server to work without a central MQTT server by implementing an internal messaging proxy. 
Subscription manager can be modified to support messaging between components directly whilst optionally allowing some messages to be released to the bus.

- browser based components for ASR, NLU, CORE that speak Websockets directly to the back end services rather than via mqtt and node.



==================================


This project has been restructured and updated (11/09/2019) in the following ways
- For the best experience, google ASR and TTS are enabled by default. Credentials are now required to run the example. Deepspeech can be enabled by uncommenting lines in the Dockerfile and the config file. 
- RASA is now integrated as an official docker hub image rather than custom compilations.
- to simplify development, the hermod-react-satellite npm module has been removed in favor of placing all the React Component files into the webexample source directory.

- CoreRouting and Action service integration with RASA has been finished/fixed. Messages from the action server via the execute endpoint are sent as a sequence of TTS messages. action_stop_listening turns off the microphone otherwise the predict run loop continues until action_listen. 
- ActionService as part of the MQTT hermod protocol has been removed in favor of an action API server that is triggered by RASA core.
 
- use environment variables in docker-compose.yml for important config settings.
- support serverHotwordEnabled mode so Microphone audio streaming continues even when paused. Silence detection is enabled however it's really only intended to be used on local networks.
- rough implementation of UI cards. Where RASA messages include images, buttons, links.


DONE
- barge in. local and remote hotword always listening trigger stop/start dialog


TODO
- no click microphone during STT 
- minimise speaker volume during STT
- tts bailout (on STT)
- click mic -> end, start dialog


- minimise messages (lambda cost)
- hotword detected -> volume DOWN
- forms - js implementation
	- python version includes functions name, required slots, submit, validate, slot_mappings (text/intent/entity/custom)
- alt dialog strategies
	- list - select item
	- quiz
	- playlist
	- ordinal mentions (and other contextful mentions)
	- synonyms
- deepspeech - latency is too much. reunify service and listener (split because deepspeech exceptions crash node) to minimise latency by keeping model loaded.

- rasa mqtt input channel (see Juste's work with web interface)
- ? input channels, reply to same channel. hermod/alexa/google ?
- login init mqttt endpoint/secure MQTT (mosca easy and means hermod can be one service with npm install)
- wiki dialog example
- alternative approaches to free text capture
	- current implemention relies on examples as per NLU training data
	- alternatives could seek eg #Noun using compromise or use other pattern matching approaches?
	
- conversation logging - mqtt message and audio capture. export stories and NLU.
- knowledge graph fallback
- fallback actions
- welcome action 
- retrieval actions
- action listen then pre predict next possible actions after action_listen and apply as filters to NLU intent query ?

wikipedia
- show me pictures
- list attributes
- topic and categories ?
- related topics

- nomenclature
	- subject
	- topic
	- question
	- quiz question


## Overview

The Hermod (Norse messenger of the gods)  voice protocol describes a series of contracts between services that communicate over MQTT messaging bus and HTTPS to implement the steps in a voice interaction from capturing hardware audio through ASR (Automated Speech Recognition), NLU (Natural Language Understanding), ML (Machine Learning) based routing and finally executing commands.

As at 1/1/2019, Snips is the only company that offers a Privacy focused 'free to hackers' voice stack that runs offline and is optimised for low power hardware. Because Snips is closed source and isn't suitable for multi user, the Hermod suite has developed to extend ideas from the Snips Hermes protocol to be suitable for building voice based web applications.

This package provides a reference implementation of the Hermod protocol using nodejs as well as example applications.

The suite does not require Internet access to run making it suitable for standalone applications where network connectivity is patchy.
This feature significantly improves the privacy of voice automation devices because no information needs to leave your computer.

That said, a key feature of the Hermod protocol is the MQTT bus so that services in the stack can be seamlessly distributed across many computers in a network.

The MQTT messaging bus used for communication between the services, supports WebSockets so some services can be implemented in javascript for web browsers. The package includes a React component that displays a microphone that can be used to integrate voice services into a web application.


Some potential applications include

- Standalone voice only devices like Alexa and Google Home. 
- An office with a single voice server and many low power satellite devices throughout the building.
- A web site with a microphone button.
- A web based AI service offering authenticated access to MQTT and providing specialised vocabulary and actions to satellite devices.

The stack relies on many open source projects including  (but certainly not limited to)

- Snowboy Hotword Detector
- Picovoice Hotword Detector (for the browser)
- Mozilla Deepspeech to implement ASR (Online Google and Offline Kaldi implementations also available)
- RASA NLU
- RASA Core Routing
- pico2wave
- Snips for the light weight versions of ASR , Hotword and NLU services supporting low power ARM devices.


The main services involved in implementing a voice interaction include

- Bidirectional Media Streaming
- Hotword recognition (eg OK Google)
- Automated Speech Recognition (ASR) to convert audio to text.
- Natural Language Understanding (NLU) to convert text into intentions and typed variable slots.
- Dialog Manager to coordinate the services and track service state so it can garbage collect and log analytics data.
- Routing Service providing core routing using history of intents and slots with machine learning to determine actions and templates.
- Application Services listen for actions from the routing service and intents from the NLU service. They implement custom logic to build a response.

Other services include

- Text to speech server
- Volume manager (change volume in response to events)
- User identification and diarizing.
- Training manager
- LED lights animations



## Quickstart

Visit the google developer console  https://console.developers.google.com/apis/

In a new or existing project, enable the Speech and Text to Speech APIs.

Create and download service credentials.


Download this repository
```
git clone https://github.com/syntithenai/hermod.git
```

Edit the docker-compose.yml file to update the credentials volume mount to the location of your downloaded Google credentials.

Start the suite
```
docker-compose up 
```



This package comes with an example model but to do something useful you will want to build your own nlu vocabulary and core routing stories and actions.
See [The RASA website](http://rasa.com)


### Testing


Be sure to give the suite sufficient time to allow all services to start (watch the logs)

Open [https://localhost:3000](https://localhost:3000) and click the microphone to talk.

Try say "hello"

The user interface shows a log of messages sent. It is also possible to use mqtt_sub to subscribe to relevenant messages on the mqtt bus.

```
mqtt_sub -h localhost -v -t 'hermod/+/asr/+' -t 'hermod/+/nlu/+' -t 'hermod/+/dialog/+' -t 'hermod/+/hotword/+' -t 'hermod/+/intent' -t 'hermod/+/action' -t 'hermod/+/action/#' -t 'hermod/+/core/#' -t 'hermod/+/tts/#' -t 'hermod/+/speaker/started' -t 'hermod/+/speaker/finished'
```



## Dialog Manager Overview

The dialog manager is the glue between the services.

Service output messages are consumed by the dialog manager which then sends another message to the next service in the stack.

Because mediation by the dialog manager is required at each step in the dialog flow, it is able to track and control the state of each dialog to ensure valid dialog flow and manage asynchronous collation of dialog components before some stages in the dialog.

In general, a service should send message to let the dialog manager know when it starts and stops.


### Typical Dialog Flow



<img src='message-flow-hermod.svg.png' style="background-color:white" />




When the dialog manager starts, it sends

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/hotword/start`

When a session is initiated by one of 

- `hermod/<siteId>/hotword/detected`
- `hermod/<siteId>/dialog/start`

The dialog manager creates a new dialogId, then sends a series of MQTT messages to further the dialog.

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/dialog>/asr/start`
- `hermod/<siteId>/dialog/started`

The ASR sends `hermod/<siteId>/asr/started` and when the ASR finishes detecting text it sends `hermod/<siteId>/text` with a JSON payload. 

The dialog manager hears this message and sends 
 with a text message to speak in the JSON body (For example asking a question)
- `hermod/<siteId>/asr/stop`
- `hermod/<siteId>/nlu/parse`

The NLU service hears the parse request and sends 

- `hermod/<siteId>/nlu/started`
- `hermod/<siteId>/nlu/intent` or `hermod/<siteId>/nlu/fail`.

The dialog manager hears the nlu intent message and sends 

- `hermod/<siteId>/intent`

The core application router hears the intent message and starts an action processing loop by asking rasa core to determine the next action recursively until the next action is either `action_listen` or `action_end`. At each step the core routing service sends a `hermod/<siteId>/action` message with a JSON body including the action and currently tracked slots.

The application service hears each action message and runs. When finished it sends `hermod/<siteId>/action/finished`.

The core routing service processes each action sequentially (by waiting for action/finished Message) and when the loop finishes, it sends messages to hand the dialog back to the user. When the final action is action_listen, the service sends `hermod/<siteId>/dialog/continue`. If the last action is action_end, the service sends `hermod/<siteId>/dialog/end`

The dialog manager hears the continue message and sends

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/asr/start`

to restart voice recognition

OR

The dialog manager hears the end message. (This can be issued at any time). It clears the audio buffer and sends

- `hermod/<siteId>/microphone/start`
- `hermod/<siteId>/dialog/ended`
- `hermod/<siteId>/hotword/start`

to finish the dialog and enable the hotword detector.


### Dialog Extensions (TODO)

The dialog manager tracks when multiple ASR or NLU services of the same type indicate that they have started. It waits for all final responses and selects the highest confidence before sending the next message.

For example, when two ASR services on the same bus share a model key and respond to `hermod/<siteId>/asr/start` sending two `hermod/<siteId>/asr/started` messages,  the dialog manager waits for both to respond with `hermod/<siteId>/asr/text` before sending `hermod/<siteId>/nlu/parse`.

When two NLU services indicate they have started , the dialog manager waits before sending `hermod/<siteId>/intent`.

When Voice ID is enabled, the dialog manager waits for `hermod/<siteId>/voiceid/detected/<userId>`  before sending  `hermod/<siteId>/intent`.

When multiple devices in a room hear an utterance, they all respond at the same time. This affects Google Home, Alexa, Snips and Mycroft. 
Google has elements of a solution because an Android phone will show a notification saying "Answering on another device". Two Google Home devices in a room will both answer.

The hermod protocol with many satellites sharing a dialog service allows the solution that the  hotword server could be debounced. 

When the dialog manager hears 'hermod/<siteId>/hotword/detected' or 'hermod/<siteId>/dialog/start', it waits for a fraction of a second to see if there are any more messages with the same topic, where there are multiple messages, the one with the highest confidence/volume  is selected and the others are ignored.

?? The debounce introduces a short delay between hearing a hotword and starting transcription. To avoid requiring the user pause after the hotword, the ASR needs audio from immediately after the hotword is detected and before transcription is started. To support this, the media server maintains a short ring buffer of audio that is sent before audio data from the hardware. The length of audio that is sent can be controlled by a parameter prependAudio in the JSON body of a message to hermod/<siteId>/microphone/start






## Security

Where a device offers services over a network to other devices, the MQTT server must be exposed to network requests so MQTT authentication is required.

The mosquitto MQTT server includes an authentication plugin that allows configuration of users and access controls in various backend systems including postgres, myql, files, redis and mongodb. The default authentication plugin allows configuration of read and/or write access to any topic or wildcard topic by updating the access control field in the user collection of a mongodb database.

When using the authentication plugin, the client must provide username and password as part of the initial CONNECT message. Subscription to a topic is only allowed if the siteId matches the username and password.

The MQTT server authentication plugin can be initialised with a list of allowed sites or sites can be added on the fly by authenticated users.

To secure messages in transit, it is possible to configure the MQTT server to encrypt messages or perhaps easier to only allow access via secure websockets.

For a standalone device, network access to the MQTT server is prevented by a firewall or virtual private network and authentication is not required.




## Audio Setup

By default, the suite does not require access to the audio hardware and relies on a web browser to fill the Speaker and Microphone services.

It is also possible to run the suite with direct access to the hardware audio device and include those services if for example you were building a standalone Alexa like device.

The docker-compose file provides an commented example of using pulse audio to allow both the local audio and browser audio to work at the same time on a Linux Desktop.
Edit docker-compose.yml and update the pulseaudio host and path to cookie.
Install and run paprefs and enable network access to local audio hardware.

A Dockerfile build file is included that incorporates the deepspeech model and installed dependancies. The official build is available on Docker hub. Running the image requires parameters to allow access to sound hardware and expose network mqtt and web.

```docker run -v /dev/snd:/dev/snd -p 1883:1883 -p 3000:3000 -p 9001:9001  --privileged -it syntithenai/hermod bash```

Including volume  mounts so changes in hermod-* can be reflected in app. [!! CHANGE PATHS FOR YOUR SITE]
```
docker run -v /projects/hermod/browser-example:/usr/src/app/browser-example -v /projects/hermod/hermod-nodejs:/usr/src/app/hermod-nodejs -v /projects/hermod/hermod-react-satellite:/usr/src/app/hermod-react-satellite -v /dev/snd:/dev/snd -p 1883:1883 -p 3000:3000  -p 9001:9001 --privileged -it syntithenai/hermod bash
```

[To my knowledge] Docker on windows does not support access to audio hardware.
https://www.freedesktop.org/wiki/Software/PulseAudio/Ports/Windows/Support/

OSX seems to support pulseaudio
http://macappstore.org/pulseaudio/




## Hermod Protocol Reference


### Media Streaming

The media server can play and record audio on a device and send or receive it from the MQTT bus. 

The ASR and Hotword services listen for audio via the MQTT bus. The TTS service sends audio file of generated speech to the MQTT bus.

This means that the ASR and Hotword services do not work unless the microphone service is started with `hermod/<siteId>/microphone/start`

To minimise traffic on the network, the dialog manager enables and disables media streaming in response to lifecycle events in the protocol. In particular, the dialog manager ensures audio recording is enabled or disabled in sync with the ASR or Hotword services. However when the suite is configured to keep the hotword enabled at all times, the microphone is left enabled as well.

The microphone service also implements silence detection and pauses sending packets when there is no voice detected.


#### Message Reference

**Incoming**

- `hermod/<siteId>/speaker/play`
    - Play the wav file on the matching siteId.


- `hermod/<siteId>/speaker/stop`
    - Stop playing all current audio output.


- `hermod/<siteId>/speaker/volume`
    - Set the volume for current and future playback.


- `/hermod/<siteId>/microphone/start`
    - Start streaming audio packets


- `hermod/<siteId>/microphone/stop`
    - Stop streaming audio packets

**Outgoing**

- `hermod/<siteId>/speaker/finished`
    - Sent when the audio from a play request has finished playing on the hardware.


- `hermod/<siteId>/microphone/audio`
    - Sent continuously when microphone is started.
    - Message contains audio packet (Format 1 channel, 16 bit, 16000 rate)


### Hotword recognition

A hotword recogniser is a special case of automated speech recognition that is optimised to recognising just a few phrases. Optimising for a limited vocabulary means that the recognition engine can use minimum memory and resources.

The hotword recogniser is used in the protocol to initiate a conversation.

The hotword service listens for audio via the MQTT bus. When the hotword is detected a message is sent to the bus in reply. 

If the service is enabled for the site, hermod/<siteId>/hotword/detected is sent. 

On low power satellite devices, to save the overhead of a local MQTT server, the hotword service can be configured to listen for audio through local hardware. In this configuration, the dialog manager must be configured to only start the microphone for ASR requests.

The service may respond to multiple different utterances. The messages indicating that the hotword has been detected include a hotword identifier in the JSON body to indicate which hotword was heard.

Commercial systems like Google Home and Alexa discriminate between applications by asking for the application by name after the hotword. This can lead to some very long incantations.

For example "Hey Google Ask Meeka Music to play some blues by JL Hooker".

To minimise this problem, the hotword system can be configured to use different ASR and NLU models based on which hotword is detected. With this configuration, each hotword has a different personality and optimised suite of intents.

There are a number of semi open source implementations of hotword services including picovoice porcupine, snowboy and pocketSphinx. The Snips hotword detector is closed source but free to use.

[Mycroft Precise](https://github.com/MycroftAI/mycroft-precise/wiki/Software-Comparison) is the fully open source and accurate. 

It is also possible to use the ASR engine to do keyword spotting against a minimal word model.
https://discourse.mozilla.org/t/feature-request-spotting-keywords/36042

#### Configuration

- models - array of objects specifying audio models
- hotwords - array of objects mapping hotword ids to asr and nlu  models
- detector - shared configuration for detector

See example configuration file for details.

#### Message Reference

**Incoming**

- `hermod/<siteId>/hotword/start`
- `hermod/<siteId>/hotword/stop`

**Outgoing**

- `hermod/<siteId>/hotword/detected`
	- Sent when service is enabled and hotword is detected.
	- JSON message body
		- hotword - identifier for the hotword that was heard.
		- asrModel - (optional) key to identify which ASR model should be used for the rest of the dialog.
		- nluModel - (optional) key to identify which NLU model should be used for the rest of the dialog.






### Automated Speech Recognition (ASR)

The ASR service converts audio data into text strings. The service listens on the MQTT bus for audio packets. 

When the ASR detects a long silence (XX sec) in the audio stream, the final transcript is sent and the ASR service clears it's audio transcription buffer for the site.

(TODO) Optionally (depending on the service implementation),  when the ASR detects a short silence in the audio data (word gap xx ms ), a partial transcript is sent.

ASR is the most computationally expensive element of the protocol. Some of the implementations described below require more processing power and memory than is available on a Raspberry Pi. In particular running multiple offline models is likely to be unresponsive on low power machines.

Open source implementations of ASR include Kaldi, Mozilla DeepSpeech and PocketSphinx.

Closed source implementations include Snips, Google and Amazon Transcribe. 

Snips has the advantage being optimised minimum hardware and for of providing a downloadable model so transcription requests can be run on local devices (including Raspberry Pi). 

The ASR service allows the use of a suite of ASR processor implementations where each model is customised. The `asrModel` parameter of an ASR start message allows switching between models on the fly. 

-   Snips provides a reasonable quality general model but works best when the using the web UI to create a specific ASR model. 
-   Google or Amazon offer the best recognition accuracy because of access to large voice data sets and would be more appropriate for arbitrary transcription.
-   The open source solutions are not quite as accurate as the commercial offerings [citing WER under 10%](https://hacks.mozilla.org/2017/11/a-journey-to-10-word-error-rate/)  which approaches the human error rate of 5.83 and works very well when combined with NLU.

Some implementations perform recognition once off on an audio fragment. Other implementations allow for streaming audio and sending intermediate recognition results.

ASR implementations from Google and Amazon provide punctuation in results.

Google also implements automatic language(en/fr/jp) detection and provides a request parameter to select background noise environment.

As at 28/12/18, Amazon and Google charge $0.006 AUD / 15 second chunk of audio.

Depending on the implementation, the ASR model can be fine tuned to the set of words you want to recognise. 

-   Snips provides a web UI to build and download models
-   Google allows phraseHints to be sent with a recognition request.
-   Amazon offers an API or web UI to develop vocabularies in addition to the general vocabulary.
-   The open source implementations Deepspeech and Kaldi offer examples of training the ASR model.

For some implementations, a pool of ASR processors is managed by the service to support multiple concurrent requests. In particular, implementation using Kaldi provides this feature using [gstreamer](https://github.com/alumae/kaldi-gstreamer-server).

#### Message Reference

**Incoming**

- `hermod/<siteId>/asr/start`
    - Start listening for audio to convert to text.
    - JSON body with 
        - model - ASR service/model to use in capturing text (optional default value - _default_)
        - requestId - (optional) unique id sent forwarded with results to help client connect result with original request

- `hermod/<siteId>/asr/stop`
    - Stop listening for audio to convert to text.

**Outgoing**

- `hermod/<siteId>/asr/started`
- `hermod/<siteId>/asr/stopped`

- `hermod/<siteId>/asr/partial`
    - Send partial text results
    - JSON body with
        - requestId
        - text - transcribed text
        - confidence - ASR transcription confidence

- `hermod/<siteId>/asr/text`  
    - Send final text results
    - JSON body with 
        -  requestId 
        -  text - transcribed text
        -  confidence - ASR transcription confidence

    


### Natural Language Understanding (NLU)

The NLU service parses text to intents and variable slots.

Parsing can be configured by specifying a model, allowed intents, allowed slots and confidence.

Custom models can be developed and trained using a web user interface (based on [rasa-nlu-trainer](https://github.com/aasaHQ/rasa-nlu-trainer)) or text files.

The NLU model is configured with slots. When slots are extracted, the processing pipeline may be able to transform the values and extract additional metadata about the slot values. For example converting "next tuesday" into a Date or recognising a value in a predefined slot type.

Parsing results are sent to hermod/nlu/intent as a JSON message. For example


`
{
    "intent": {
    "name": "restaurant_search",
    "confidence": 0.8231117999072759
    },
    "entities": [
        {
            "value": "mexican",
            "raw": "mexican",
            "entity": "cuisine",
            "type": "text"
        }
    ],
    "intent_ranking": [
        {
            "name": "restaurant_search",
            "confidence": 0.8231117999072759
        },
        {
            "name": "affirm",
            "confidence": 0.07618757211779097
        },
        {
            "name": "goodbye",
            "confidence": 0.06298664363805719
        },
        {
            "name": "greet",
            "confidence": 0.03771398433687609
        }
    ],
    "text": "I am looking for Mexican food"
}
`


The NLU service is implemented using RASA. RASA configuration allows for a pipeline of processing steps that seek for patterns and extract metadata. Initial steps in the pipeline prepare data for later steps.

The NLU service can load multiple NLU models can be trained with different vocabularies and intents. Each parse request can specify which model to use to discover intents. If a parse request does not specify which model, the model named _default_  is used.

The NLU service can be instructed to only allow certain intents or slots. When configured, if the results of a parse request do not include any of the allowed intents or slots, a message will be sent to hermes/<siteId>/<dialogId>/nlu/fail. The default intent may be updated with an allowed intent from the intent_ranking list if the initial default intent does not match the filters.

If the final intents confidence score is not greater than the requested confidence, a message will be sent to hermes/<siteId>/<dialogId>/nlu/fail.


#### Configuration

minConfidence - intents recognised with confidence less than this value are not recognised and the service replies with hermod/<siteId>/nlu/fail


#### Message Reference

**Incoming**


- `hermod/<siteId>/nlu/parse`
    - Convert a  sentence into intents and slots
    - With JSON body
        - text - sentence to convert into intents and slots
        - model - name of the model to using in parsing intents and slots
        - intents - list of intents that are allowed to match
        - slot - specific slot to search for 

**Outgoing**

- `hermod/<siteId>/nlu/started`
     - sent by service to indicate that parse request was received and parsing has started.

- `hermod/<siteId>/nlu/intent`
    - Send parsed intent and slots

- `hermod/<siteId>/nlu/fail`
    - Send when entity recognition fails because there are no results of sufficient confidence value.




### Dialog Manager 

The dialog manager coordinates the services by listening for MQTT messages and responding with MQTT messages to further the dialog.

The dialog manager tracks the state of all active sessions so that it can

- Send fallback messages if services timeout.
- Garbage collect session and access data.
- Log analytics data.

#### Configuration

*   maximumDuration - (default 4) restrict ASR audio fragment to this number of seconds.
*   asrTimeout - (default 1) time after silence detected before determining ASR non responsive
*   nluTimeout - (default 0.5) time after silence detected before determining NLU non responsive
*   coreTimeout - (default 0.5) time after silence detected before determining NLU non responsive

#### Service Monitoring (TODO)

The dialog manager tracks the time duration between some messages so it can determine if services are not meeting performance criteria and provide useful feedback.

Where a services is deemed unresponsive, an error message is sent and the session is ended by sending `hermod/<siteId>/dialog/end`.

Services are considered unresponsive in the following circumstances



*   For the ASR service, If the time between <span style="text-decoration:underline;">asr/start</span> until <span style="text-decoration:underline;">asr/text</span> exceeds the configured maximumDuration
*   For the ASR service, If the time from ASR starting and then silence being detected , to asr/text or asr/fail exceeds the configured asrTimeout.
*   For the NLU service, If the time between nlu/parse and nlu/intent exceeds the configured nluTimeout
*   For the core routing service, If the time between nlu/intent and hermod/intent exceeds the configured coreTimeout
*   For the TTS service, if the time between tts/say and tts/finished
*   For the media streaming service, if the time between speaker/play and speaker/finished

#### Logging (TODO)

The dialog service can be configured to log all dialogs into a database.

Logging allows for diagnostics and capturing real user interactions to use in improving machine learning models.

The default implementation writes to a mongo database. An entry is created for every site and dialog interactions are logged as updates to the site as a dialog progresses.

Audio fragments are logged to their own collection with a reference to the dialog. 

Audio fragments start recording after `hermod/<siteId>/asr/start` and stop after `hermod/<siteId>/asr/stop`

Summary statistics ...



#### Message Reference

Outgoing messages are shown with => under the related incoming message.

- `hermod/<siteId>/hotword/detected`
- `hermod/<siteId>/dialog/start`
    - Start a dialog 
    - => `hermod/<siteId>/hotword/stop`
    - => `hermod/<siteId>/microphone/start`
    - => `hermod/<siteId>/asr/start`
    - => `hermod/<siteId>/dialog/started/<dialogId>`

** Where a dialog/start message includes a non empty text parameter in the message body, the dialog manager skips ASR and jumps to NLU **


- `hermod/<siteId>/dialog/start`  {text:'text sent directly'}
    - => hermod/<siteId>/hotword/stop`
    - => hermod/<siteId>/microphone/stop`
    - => `hermod/<siteId>/nlu/parse` {text:'text sent directly'}
    - => `hermod/<siteId>/dialog/started/<dialogId>`

- `hermod/<siteId>/dialog/continue`
    - Sent by an action to continue a dialog and seek user input.
    - JSON body 
        -   text - text to speak before waiting for more user input
        - ASR Model - ASR model to request
        - NLU Model - NLU model to request
        - Intents - Allowed Intents
    - => hermod/<siteId>/microphone/stop
    - => hermod/<siteId>/tts/say
    -    After hermod/<siteId>/tts/finished
        - => hermod/<siteId></pre>/microphone/start
        - => hermod/<siteId>/asr/start

- `hermod/<siteId>/asr/text`
    - => hermod/<siteId>/nlu/parse

- `hermod/<siteId>/nlu/intent`
    - => hermod/<siteId>/intent
    - OR
    - => hermod/<siteId>/nlu/fail 
        - Sent when entity recognition fails because there are no results of sufficient confidence value.


- `hermod/<siteId>/dialog/end`
    - The application that is listening for the intent, should send `hermod/<siteId>/dialog/end` when it's action is complete so the dialog manager can garbage collect dialog resources.
    - Respond with 
        -   `hermod/<siteId>/dialog/ended`
        -   `hermod/<siteId>/microphone/start`
        -   `hermod/<siteId>/hotword/start`



### Routing Service

The core routing server is the final machine learning layer that maps the history of intents and slots for the session to determine the next action and template.

#### Message Reference

**Incoming**

`hermod/<siteId>/intent`
    - Sent by dialog manager after hearing `hermes/<siteId>/<dialogId>/nlu/intent` 
    - Parameters
        - nlu parse data

**Outgoing**

`hermod/<siteId>/action`
    - action
    - slots


### Action Server

One or many action servers listen for intents and actions and perform custom processing  that may include

    *   Database or URL lookups, calculations
    *   A text string to speak
    *   A user interface description
    *   UI updates using React/Angular in a browser.


The default application service provides built in actions to support the dialog suite.

- action_listen will start the ASR service and listen
- action_end will finalise the dialog and then start the hotword service

Actions with a full stop in the name are split and text before the full stop is used to seek a file called actions.js in a matching configured skill directory.
The actions.json file exports an object containing action functions keyed to action names. Text after the full stop is used to lookup the action name.


**Incoming**

- `hermod/<siteId>/action`
- `hermod/<siteId>/intent`

**Outgoing**
- `hermod/<siteId>/action/started`
- `hermod/<siteId>/action/finished`


### Text to speech Service (TTS)

The text to speech service generates audio data from text. Audio containing the spoken text is sent to the media service via the MQTT bus.

Offline TTS implementations include Mycroft Mimic, picovoice, MaryTTS, espeak, [merlin](https://github.com/CSTR-Edinburgh/merlin) or speak.js in a browser.

Online TTS implementation include Amazon Polly and Google. These services support SSML markup.

[SuperSnipsTTS](https://gist.github.com/Psychokiller1888/cf10af3220b5cd6d9c92c709c6af92c2) provides a service implementation that can be configured to use a variety of implementations and fall back to offline implementations where required.

#### Message Reference

**Incoming**

`hermod/<siteId>/tts/say`

*   Speak the requested text by generating audio and sending it to the media streaming service.
*   Parameters
*   text - text to generate as audio
*   lang - (optional default en_GB)  language to use in interpreting text to audio

`hermod/<siteId>/speaker/finished`

*   When audio has finished playing send a message to hermod/<siteId>/tts/finished  to notify that speech has finished playing.

**Outgoing**

`hermod/<siteId>/speaker/play/<speechRequestId>`

*   speechRequestId is generated
*   Body contains WAV data of generated audio.

`hermod/<siteId>/tts/finished`

*   Notify applications that TTS has finished speaking.



## Other Details

The reference implementation of is primarily written for nodejs.
Key machine learning components of the stack are written in Python or C.

Developed on Linux, it should (untested) run on Windows, OSX and Linux x86/x64. ARM support is pending for deepspeech although Kaldi and Snips ASR will run on a Raspberry Pi3 (ARM7).

Cross platform audio us implemented by streaming using per system binaries sox, rec or arecord to access hardware audio.

The protocol is designed to scale to many concurrent users of a service suite. Subscriptions and publishing are segmented by siteId so messages are only sent to the correct site or sites.ASR

Topic segmentation also allows flexible implementation of access control. For example a user may be required to register with a website or be identified by voice, before being able to subscribe to their assigned topic. Every message in the protocol starts with `hermod/<siteId>` where siteId is a unique identifier for the device that initiated the dialog.




## Links


https://github.com/RasaHQ/rasa_lookup_demo

https://rasa.com/docs/core/master/policies/#two-stage-fallback-policy

https://github.com/JustinaPetr/Weatherbot_Tutorial

https://github.com/mrbot-ai/rasa-webchat

https://github.com/RasaHQ/conversational-ai-workshop-18

## DONE
- hermod react
- docker single image example
- rasa duckling
- autostart - duckling, rasa app server, ...  pm2
- music player model
	- play some {tag}
	- play something by {artist}
	- stop
	- volume
	- start

- mosca nodejs mqtt server


## TODO

- !!!! Authentication - login/signup/authorise site.

- passing model selection through dialog 
	- hotword, start session
	- continue session

- timeouts - nlu, ......

- fallbacks
	
- logging 
	- all recordings, transcriptions and parse results in database by conversation.
	- web UI to show

- build all skills script
- generate domain from config and skills folders  	

	
- rasa 2 stage fallback

- Sample music player web application
- Sample quiz web application

- rasa action server integration
	- allow python and nodejs application servers to coexist by using python normally and then sending mqtt for nodejs.
	- the Forms policy requires the python application server.
	- mqtt Dispatcher - so actions taken by the python server still feed back
	- return events from nodejs action callbacks (via mqtt)
	
- deepspeech asr component frequency filtering (as per deepspeech nodejs example)


- tests
	- mqtt based check each layer of service
	- rasa segregated training data for testing 


## TODO MEDIUM TERM


- nlu/partial parse entity only - how does this work with rasa?

- story and model builder UI 
	- define some actions
	- start an interactive learning session
	- also explicit add intent, slot, action, template

- picovoice hotword detector (more voices)

- train hotword UI


- External proxy base class and example. Run a service that connects to remote mqtt and proxies messages.

- training 
	- distributed service with training client callbacks.
	
- ARM image for pi with lightweight services - snips hotword/ASR/NLU and kaldi asr

- web development docs

- greenlock ssl generation 
	- currently self signed hermod.local certs in git
	- openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem


- an voice stack/dialog manager that 
	- works with a variety of online and offline ASR and NLU implementations and
	
	- provides mechanisms for switching implementations and models as a dialog progresses so application developers can optimise the use of a range of services. For example most ASR is local unless the action server asks for a google ASR model in which cases high quality (paid) transcription from google is used. NLU perhaps more relevant with responsively adjusting available model intentions to improve the accuracy of a dialog.
	
	- provides for login, multiple concurrent users and authenticated access to the mqtt bus so the stack can be used for the web.

	- integrates RASA core routing and action services
	
	- uses aggressive silence detection and service timeouts to ensure that the dialog remains responsive to the user.
	
	- allows hotword cut in to a dialog.
	
	- provides fallback pathways based on naming conventions where ASR or NLU confidence is insufficient.
	
	- allows for asynchronous collation and debounce of services. For example a user voice id service could listen for dialog/start, send voiceid/started to tell the dialog manager to wait and then voiceid/user when the user is identified. The dialog manager suspends sending an intent message until the user is identified. With the same mechanism multiple NLU services could be listening and offer multiple results. The dialog manager would need to merge and sort intents from multiple models.   
	
	- is a focus for a community discussion around what is the best/most flexible/easiest to use framework for developing voice applications for the web and dedicated devices. Hermes is an awesome idea but it needs ongoing room to grow. 
	
	- is open source  and uses 100% open source solutions by default. Deep Speech on Intel. Kaldi on ARM. RASA or Google BERT  (or dialog flow or ..) for NLU but notes clearly throughout documentation that Snips ASR and NLU can be used as the optimised/production models at cost.
	
- a web api for training models so the process can be scripted and models built from text generated by external tools.	
			
- an open source web toolkit including
	- microphone button
	- client side action server integration
	- audio meter
	- dialog logging
	- docker image with training UI
		- hotword
		- slots, intents, stories
	- documentation for building voice enabled web apps with node and react


