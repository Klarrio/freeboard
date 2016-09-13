/* Klarrio AWS (MQTT over WSS) Freeboard datasource plugin
 * Daniel Vangrieken - 12/08/2016 
 * A Freeboard Plugin using AWS's Javascript library (MQTT over Websockets)**/

(function () {

	freeboard.loadDatasourcePlugin({
		type_name: "AWS Subscrib Data Generator Plugin",
		"display_name": "Klarrio AWS Topic Subscribe",
        "description" : "Receive data from AWS based on topic subscribtion.",
		"external_scripts" : [
			"../../lib/js/thirdparty/aws-iot-sdk-browser-bundle.js"
		],
		settings: [
		    {
            	"name"        	: "accessKeyId",
            	"display_name"	: "AccessKeyId",
            	"type"        	: "text",
            	"description" 	: "The AWS accessKeyId used to access the AWS IoT platform.",
            	"default_value"	: "",
            	"required"    	: true
            },
            {
            	"name"        	: "secretKey",
            	"display_name"	: "SecretKey",
            	"type"        	: "text",
            	"description" 	: "The AWS secretKey that is associated with the accessKeyId to access the AWS IoT platform.",
            	"default_value"	: "",
            	"required"    	: true
            },
            {
            	"name"        	: "topic",
            	"display_name"	: "Topic",
            	"type"        	: "text",
            	"description" 	: "The topic to subscribe to on the AWS IoT platform.",
            	"default_value"	: "",
            	"required"    	: true
            },
			{
				"name"          : "logEnabled",
				"display_name"  : "Enable Console Logging",
				"type"          : "boolean",
				"default_value" : false, 
				"description"   : "This is a boolean value to enable console logging for debugging. The default is set to false.",	
			},
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new klarrioAWSSubDatasourcePlugin(settings, updateCallback));
		}
	});
	
	var klarrioAWSSubDatasourcePlugin = function(settings, updateCallback)
	{
		var printLog = null;
		var currentSettings = settings;
		debug(currentSettings.logEnabled);
 		var self = this;
		
		/*Configure the console logging.**/
		function debug(bool) {
			console.log('Start debug()');
			
			if (bool == false) {
				console.log('Console log will be disabled');
				printLog = function() {};
			}
			else {
				printLog = console.log.bind(window.console);
				printLog('Console log will be enabled');
			}

			printLog('End debug()');
		}

		var awsIot = require('aws-iot-device-sdk');
		var iotDevice = null;
		
		function configurationChanged() {
			printLog('Start configurationChanged()');
			cleanUp();
			initializeIotDevice();
			printLog('Start configurationChanged()');
		}
		
		function isValidJSon(data) {
			printLog('Start isValidJSon()');
			try {
				JSON.parse(data);
		    } catch (e) {
		        printLog("The received data is not in a JSon format : " + data + " with error : " + e);
		        return false;
		    }
		    printLog("The received data is in a JSon format.");
		    return true;
		}
		
		/** AWS Iot Device implementation**/
		function initializeIotDevice() {
			printLog('Enter function: initializeIotDevice');
			self.iotDevice = awsIot.device({
		    	region: "eu-central-1",
		    	protocol: "wss",
		    	accessKeyId: currentSettings.accessKeyId,
		    	secretKey: currentSettings.secretKey
			});

			self.iotDevice.on('connect', function() {
				printLog('Device is connected');
				self.iotDevice.subscribe(currentSettings.topic);
		    });

		    self.iotDevice.on('close', function() {
		        printLog('Device connection is closed!');
		    });

		    self.iotDevice.on('reconnect', function() {
		        printLog('Device is trying to reconnect!');
		    });

		    self.iotDevice.on('offline', function() {
		        printLog('Device is offline');
		    });

		    self.iotDevice.on('error', function(error) {
		        printLog('Device has received an error!', error);
		    });

		    self.iotDevice.on('message', function(topic, payload) {
		        printLog('Device received message on topic : ', topic, payload.toString());
		        if (isValidJSon(payload)) {
		        	updateData(JSON.parse(payload));
		        }
		    });
			printLog('Exit function: initializeIotDevice');
		}

		function updateData(data) {
			printLog('Start updateData()');
			
			function callBack(data) {
				updateCallback(data);
			}
			updateCallback(data);
			printLog('The updateCallback date = ' + data);
			printLog('End updateData()');
		}
		
		function cleanUp() {
			printLog('Start cleanUp()');
			iotDevice = null;
			data = null;
			printLog('End cleanUp()');
		}		
        /* Freeboard callback implementations**/
        
		this.updateNow = function () {
			printLog('Start updateNow()');
			cleanUp();
			initializeIotDevice();
			printLog('End updateNow()');
		};

		this.onDispose = function () {
			printLog('Start onDispose()');
			cleanUp();
			printLog('End upDispose()');
		};

		this.onSettingsChanged = function (newSettings) {
			printLog('Start onSettingsChanged()');
			currentSettings = newSettings;
			debug(currentSettings.logEnabled);
			configurationChanged();
			printLog('End onSettingsChanged()');
		};
	};
	
}());