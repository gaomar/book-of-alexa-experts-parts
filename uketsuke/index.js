'use strict';

const Alexa = require('ask-sdk-core');
const LINENotify = require('./LINENotifyPost');

// 起動時に呼ばれる
const LaunchRequestHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = '該当するメニューをタップしてください。';

        return handlerInput.responseBuilder
            .speak(speechText)
            
            .addDirective({
                type : 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                token: "token",
                document: require('../apl/document/apl_doc_top.json'),
                datasources: require('../apl/data/apl_data_top.json')
            })	  

            .addDirective({
                type : 'Alexa.Presentation.APL.ExecuteCommands',
                token: "token",
                commands: [
                    {
                        type: "Sequential",
                        commands: [
                            {
                                type: "Idle",
                                delay: 5000
                            },
                            {
                                type: "SpeakItem",
                                componentId: "SpeechComponent_0",
                                highlightMode: "line",
                            }
                        ],
                        repeatCount: 2
                    }
                ]
            })
            .getResponse();

	}
};

const StartIntentHandler = {
    canHandle(h) {
        return h.requestEnvelope.request.type === 'IntentRequest'
            && h.requestEnvelope.request.intent.name === 'StartIntent';
    },
    async handle(h) {
        const dialogState = h.requestEnvelope.request.dialogState;
        if (dialogState !== 'COMPLETED') {
            const speechText = 'お名前をお答えください';
            
            return h.responseBuilder
            .addDirective({
                type : 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                token: "token",
                document: require('../apl/document/apl_doc_text.json'),
                datasources: {
                    "skilldata": {
                        "type": "object",
                        "maintext": speechText,
                    }
                }
            })	  
            .addDelegateDirective()

            .getResponse();
        } else {
            const company = h.requestEnvelope.request.intent.slots.company_val.value;
            const name = h.requestEnvelope.request.intent.slots.name_val.value;
            const num = h.requestEnvelope.request.intent.slots.num_val.value;
            
            const speechText = `${name} 様。お待ちしておりました。担当者が参りますので少々お待ち下さい`;
            
            // LINE Notifyに送信
            // await LINENotify.sendNotify(`${company}の${name}様が${num}名で来訪されました`)

            return h.responseBuilder
            .speak(speechText)
            .addDirective({
                type : 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                token: "token",
                document: require('../apl/document/apl_doc_top.json'),
                datasources: require('../apl/data/apl_data_top.json')
            })	  
            .withShouldEndSession(false)
            .getResponse();
        }
    }
};

// 画面タッチ処理
const TouchEventHandler = {
    canHandle(handlerInput) {
    return ((handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent' &&
        (handlerInput.requestEnvelope.request.source.handler === 'Press' || 
        handlerInput.requestEnvelope.request.source.handler === 'onPress')));
    },
    handle(handlerInput) {
        let choice = handlerInput.requestEnvelope.request.arguments[0];

        var speechText = '';
        var speechTextYomi = '';

        if (choice === 'apo') {
            speechText = '御社名/お名前/人数<br>を順番にお答えください';
            speechTextYomi = 'おんしゃ名をお答えください';
            
        } else if (choice === 'mensetsu') {
            speechText = '学校名・所属/お名前/人数<br>をお答えください';
            speechTextYomi = '学校名または所属名をお答えください';
        } else {
            speechTextYomi = '担当者が参りますので少々お待ち下さい';
            
            return handlerInput.responseBuilder
                .speak(speechTextYomi)

                .addDirective({
                    type : 'Alexa.Presentation.APL.RenderDocument',
                    version: '1.1',
                    token: "token",
                    document: require('../apl/document/apl_doc_top.json'),
                    datasources: require('../apl/data/apl_data_top.json')
                })	  
                
                .getResponse();  

        }
        return handlerInput.responseBuilder
            .speak(speechTextYomi)

            .addDirective({
                type : 'Alexa.Presentation.APL.RenderDocument',
                version: '1.1',
                token: "token",
                document: require('../apl/document/apl_doc_text.json'),
                datasources: {
                    "skilldata": {
                        "type": "object",
                        "maintext": speechText
                    }
                }
            })
            

            .getResponse();
    }
};

// 終了時に呼ばれる
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
      return handlerInput.responseBuilder
            .withShouldEndSession(true)
            .getResponse();
    }
};

// EndIntent
const EndHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'EndIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        const speechText = 'バイバイ！またね！';

        return handlerInput.responseBuilder
            .speak(speechText)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle(handlerInput, error) {
        return true;
    },
    handle(handlerInput, error) {
        const speechText = 'すみません、よく分かりませんでした。';
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

let event = function (req) {
    let EventEmitter = require('events');
    let ee = new EventEmitter();
    for (let prop in req.body) {
      if(prop){
        ee[prop] = req.body[prop];
      }
    }
    return ee;
};

let skill;
module.exports = async function (context, req) {
  if(!skill){
    skill = Alexa.SkillBuilders.custom()
        .addRequestHandlers(
            LaunchRequestHandler,
            StartIntentHandler,
            TouchEventHandler,
            EndHandler,
            SessionEndedRequestHandler)
        .addErrorHandlers(ErrorHandler)
        .create();
  }

  // 処理実行＆Alexa応答
  return skill.invoke(event(req));
};