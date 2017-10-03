
// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

'use strict';

const Alexa = require('./node_modules/alexa-sdk');
const data = require('./data');

var languageStrings = {
    'en': {
        'translation': {
            'WELCOME_MESSAGE'   : "Welcome to Doors.  You can say, about,  about to know about this skill,  or say,  Saturday or Sunday to know about what buildings are open those days,  or say,  list the buildings near Downtown, to hear which one is available in that area,  or say,  tell me about Union Trust...What can I help you with?",
            'SKILL_NAME'        : "Doors",
            'WELCOME_REPROMPT'  : "For instructions on what you can say, please say help me",
            'HELP_MESSAGE'      : "Say about,  to hear more about this skill,  or say saturday or sunday, to hear what buildings are open those days,  or for example say,  tell me about 'The Pennsylvanian'.  ",
            'HELP_REPROMPT'     : "You can say things like, Saturday or Sunday,  give me info about or you can say exit ...Now, what can I help you with?",
            'ABOUT'             : "After his first intent on building Alexa AVS, Pedro realized that he can make more things available to him. He enjoyed Open Doors Pittsburgh last year, and he decided to go this year again, but now he is taking me with him. I hope see you there, until then, good luck. ",
            'STOP_MESSAGE'      : "Okay, see you next time!",
            'BUILDING_MESSAGE'  : "%s, which is at %s is open %s and you would experience: %s.  Enjoy your journey!",
        }
    }
    // , 'de-DE': { 'translation' : { 'TITLE'   : "Local Helfer etc." } }
};

const handlers = {
    //Use LaunchRequest, instead of NewSession if you want to use the one-shot model Alexa, ask [my-skill-invocation-name] to (do something)...
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE'), this.t('SKILL_NAME');
        // If the user either does not reply to the welcome message or says something that is not understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },

    'AboutIntent': function () {
        this.emit(':tell', this.t('ABOUT'));
    },

    'BuildingIntent': function () {
        const itemSlot = this.event.request.intent.slots.name;
        let itemName;
        if(itemSlot && itemSlot.value){
            itemName = itemSlot.value.toLowerCase();
        }

        var building = getBuildingByName(itemName);

        if(building && building.name) {
            let say = building.name + ', which is at ' + building.address + ' is open on ' + building.day + 
                ', here is more information: ' + building.description + ', and you will experience: ' + building.experience;
            let cardTitle = building.name;
            let cardContext = building.name + '\n' + building.address + '\n' + data.city + ', ' + data.state + ' ' + data.postcode;
            this.attributes.speechOutput = say;
            this.attributes.repromptSpeech = this.t('HELP_REPROMPT');

            this.response.speak(this.attributes.speechOutput);
            this.response.cardRenderer(cardTitle, cardContext);
            this.emit(':responseReady');
        } else {
            let say = 'We could not find any building with that name. Try saying: List the buildings for Saturday, or say, List the buildings near Downtown';
            
            this.response.speak(say).listen(this.t('WELCOME_REPROMPT'));
            this.emit(':responseReady');
        }

    },
	
	// Get a list of the buildings open on Saturday
	'SaturdayIntent': function () {
		var buildingsNames = getBuildingByDay('Saturday');
		var say = 'Here are some of the buildings open on Saturday: ' + buildingsNames + '. Would you like more, say for example, tell me about Union Trust ';
		this.response.speak(say);
        this.emit(':responseReady');
	},

	// Get a list of the buildings open on Sunday
	'SundayIntent': function () {
		var buildingsNames = getBuildingByDay('Sunday');
		var say = 'Here are some of the buildings open on Sunday: ' + buildingsNames + '. Would you like more, say for example, tell me about Union Trust ';
		this.response.speak(say);
        this.emit(':responseReady');
    },
    
    'LocationIntent': function () {
        var location = "";
        let say = "";
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');

        if(this.event.request.intent.slots.location.value){
            location = this.event.request.intent.slots.location.value;
            var buildingsNames = getBuildingByLocation(location);
            say = 'Here are some of the buildings open on ' + location + ': ' + buildingsNames + '. Would you like more, say for example, tell me about Union Trust ';
        
            this.response.speak(say).listen(this.attributes.repromptSpeech);
        } else {
            say = "There were not buildings open in that location. Valid locations: Downtown, Strip District";

            this.response.speak(say).listen(this.attributes.repromptSpeech);
        }

        this.response.speak(say);
        this.emit(':responseReady');
    },

    'AMAZON.YesIntent': function () {
        var buildingName = this.attributes['building'];
        var BuildingDetails = getBuildingByName(buildingName);

        var say = BuildingDetails.name
            + ' is located at ' + BuildingDetails.address
            + ', and the description is, ' + BuildingDetails.description
            + '  I have sent these details to the Alexa App on your phone.  Enjoy your journey! <say-as interpret-as="interjection">bon voyage</say-as>' ;

        var card = BuildingDetails.name + '\n' + BuildingDetails.address + '\n'
            + data.city + ', ' + data.state + ' ' + data.postcode
            + '\n';

        this.emit(':tellWithCard', say, BuildingDetails.name, card);
    },

    'AMAZON.NoIntent': function () {
        this.emit('AMAZON.StopIntent');
    },
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', this.t('HELP_MESSAGE'));
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    }

};


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    // alexa.appId = 'amzn1.echo-sdk-ams.app.1234';
    ///alexa.dynamoDBTableName = 'YourTableName'; // creates new table for session.attributes
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


// ==========> Helper Functions <==========

function getBuildingByDay(weekEndDay) {
    var list = "";
    var day = weekEndDay.charAt(0).toUpperCase() + weekEndDay.slice(1);
    data.buildings.forEach((building) => {
        if(building.day.search(day) > -1) {
            list += building.name + ', ';
        }
    });
    return list;
}

function getBuildingByName(buildingName) {
    var building = {};
    for(var i = 0; i < data.buildings.length; i++) {
        if(data.buildings[i].name.toLowerCase() == buildingName) {
            building = data.buildings[i];
        }
    }
    return building;
}

function getBuildingByLocation(location) {
    let list = "";
    data.buildings.forEach((building)  => {
        if(building.location.toLowerCase() == location.toLowerCase()){
            list += building.name;
        }
    })
    return list
}