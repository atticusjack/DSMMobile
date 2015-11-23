(function () {

    var app;
    var loginURL;
    var baseURL;
    var getTeamURL;
    var getPresenceURL;
    var getPhotoURL;
    var absoluteLoginURL;
    var baseURLWithCompany;
    var baseURLWithCompanyAndService;

    var storage = {
        save: function (user) {
            localStorage.setItem("user", JSON.stringify(user));
        },
        load: function () {
            var user = localStorage.getItem("user");
            return user ? JSON.parse(user) : {};
        }
    };

    var sessionCookies = {
        save: function (sessionData) {
            localStorage.setItem("sessionData", JSON.stringify(sessionData));
        },
        load: function () {
            var sessionData = localStorage.getItem("sessionData");
            return sessionData ? JSON.parse(sessionData) : {};
        }
    };

    var sessionURLS = {
        save: function (sessionURLS) {
            localStorage.setItem("sessionURLS", JSON.stringify(sessionURLS));
        },
        load: function () {
            var sessionURLS = localStorage.getItem("sessionURLS");
            return sessionURLS ? JSON.parse(sessionURLS) : {};
        }
    };

    var LoginViewModel = function (defaults) {
        return kendo.observable($.extend({
            reset: function (e) {
                e.preventDefault();
                this.set("tnumber", defaults.tnumber);
                this.set("password", "");
                this.set("company", defaults.company);
            },
            loginUser: function (tnumber, password, company) {
                var that = this;

                $.ajax({
                    url: "appsettings.json",
                    dataType: "json",
                    success: function (json) {
                        //console.log("Configuration: " + json.baseURL + ". " + json.loginURL + ". " + json[company]  + ". " + json.teamURL + ". " + json.photoURL+ ". " + json.presenceURL + ". " + json.serviceIdentifier);
                        baseURL = json.baseURL;
                        baseURLWithCompanyAndService = baseURL + json[company] + json.serviceIdentifier;
                        loginURL = baseURL + json.loginURL;
                        getTeamURL = baseURLWithCompanyAndService + json.teamURL;
                        getPresenceURL = baseURLWithCompanyAndService + json.presenceURL;
                        getPhotoURL = baseURLWithCompanyAndService + json.photoURL;

                        sessionURLS.save({
                            baseURL: baseURL,
                            baseURLWithCompanyAndService: baseURLWithCompanyAndService,
                            loginURL: loginURL,
                            teamURL: getTeamURL,
                            presenceURL: getPresenceURL,
                            photoURL: getPhotoURL,
                        });
                        // Request with custom header
                        $.ajax({
                            url: loginURL,
                            type: "POST",
                            data: "username=" + tnumber + "&password=" + password + "&login-form-type=pwd",
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            },
                            success: function (data, textStatus, request) {
                                if (request.status == 200) {

                                    app.navigate("views/contacts.html"); // the url of the remote view
                                } else {
                                    alert('Unable to Login. Check t# and Password.');
                                }
                            },
                            error: function (jqxhr, textStatus, error) {
                                console.log("Request Failed: " + err);
                                alert('Unable to Login. Check t# and Password.');
                            },
                        });
                    },
                    error: function (jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.log("Request Failed: " + err);
                    },
                });

            },
            login: function (e) {
                e.preventDefault();
                // Initialize the Kendo UI Validator on your "form" container
                // (NOTE: Does NOT have to be a HTML form tag)
                var validator = $("#form-login").kendoValidator().data("kendoValidator");

                // Validate the input when the Save button is clicked
                if (validator.validate()) {
                    // If the form is valid, the Validator will return true
                    // optional - add a line here overwriting the
                    // original defaults value with what's being
                    // saved so the Reset To Defaults only resets
                    // to the most recently saved data.
                    storage.save({
                        tnumber: this.get("tnumber"),
                        password: "",
                        company: this.get("company"),
                    });
                    this.loginUser(this.get("tnumber"), this.get("password"), this.get("company"));
                }
            },
        }, defaults));
    };

    // create an object to store the models for each view
    window.APP = {
        contactListSource: null,
        models: {
            login: {
                loginViewModel: new LoginViewModel(storage.load()),
            },
            home: {
                title: 'Home'
            },
            settings: {
                title: 'Settings',
                saveUserPass: true,
                saveUserPassChange: function (e) {
                    storage.save({
                        tnumber: "",
                        password: "",
                        company: "",
                    });
                }
            },
            knowledge: {
                rating: 0,
                visible: true,
                enabled: true,
                knowledgeFeedbackText: "",
                submitfeedback: function (e) {
                    if (!this.checkSimulator()) {
                        cordova.plugins.email.isAvailable(this.knowledgecallback);
                    }
                },
                composeKnowledgeEmail: function () {
                    if (!this.checkSimulator()) {
                        var emailbody = '<h2>Feedback from DSM</h2><p>Rating:' + this.rating.tostring() + '<p>' + this.knowledgeFeedbackText;
                        cordova.plugins.email.open({
                            to: ['parag.joshi@centricconsulting.com'],
                            subject: 'Knowledge Feedback from DSM Mobile app',
                            body: emailbody,
                            isHtml: true
                        }, this.knowledgepostcallback)
                    }
                },
                knowledgepostcallback: function (msg) {
                    navigator.notification.alert(JSON.stringify(msg), null, 'Post EmailComposer callback', 'Close');
                },
                knowledgecallback: function (msg) {
                    navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
                    if (JSON.stringify(msg) == "true") {
                        this.composeKnowledgeEmail();
                    }
                },
                checkSimulator: function () {
                    if (window.navigator.simulator === true) {
                        alert('This plugin is not available in the simulator.');
                        return true;
                    } else if (window.cordova === undefined || window.cordova.plugins === undefined) {
                        alert('Plugin not found. Maybe you are running in AppBuilder Companion app which currently does not support this plugin.');
                        return true;
                    } else {
                        return false;
                    }
                },
            },
            reports: {
                rating: 0,
                visible: true,
                enabled: true,
                reportsFeedbackText: "",
                submitfeedback: function (e) {
                    if (!this.checkSimulator()) {
                        cordova.plugins.email.isAvailable(this.callback);
                    }
                },
                composeEmail: function () {
                    if (!this.checkSimulator()) {
                        var emailbody = '<h2>Feedback from DSM</h2><p>Rating:' + this.rating.tostring() + '<p>' + this.reportsFeedbackText;
                        cordova.plugins.email.open({
                            to: ['parag.joshi@centricconsulting.com'],
                            subject: 'Reports Feedback from DSM Mobile app',
                            body: emailbody,
                            isHtml: true
                        }, this.postcallback)
                    }
                },
                postcallback: function (msg) {
                    navigator.notification.alert(JSON.stringify(msg), null, 'Post EmailComposer callback', 'Close');
                },
                callback: function (msg) {
                    navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
                    if (JSON.stringify(msg) == "true") {
                        this.composeEmail();
                    }
                },
                checkSimulator: function () {
                    if (window.navigator.simulator === true) {
                        alert('This plugin is not available in the simulator.');
                        return true;
                    } else if (window.cordova === undefined || window.cordova.plugins === undefined) {
                        alert('Plugin not found. Maybe you are running in AppBuilder Companion app which currently does not support this plugin.');
                        return true;
                    } else {
                        return false;
                    }
                },
            },
            contacts: {
                title: 'Contacts',
                fetchTeam: function (e) {
                    var argumentData = e.button.data();

                    var jsonData = {
                        "requestVersionId": "1",
                        "teamId": argumentData.id.toString()
                    };

                    // Request with custom header
                    $.ajax({
                        url: getTeamURL,
                        type: "POST",
                        data: JSON.stringify(jsonData),
                        success: function (data, textStatus, request) {
                            if (request.status == 200) {
                                // Read from response
                                var sessionURLData = sessionURLS.load();

                                // Until routing is fixed, read from static file
                                $.ajax({
                                    url: "staticteamdata.json",
                                    dataType: "json",
                                    success: function (json) {
                                        APP.contactListSource = new kendo.data.DataSource({
                                            data: json.userList,
                                            schema: {
                                                parse: function (data) {
                                                    $.each(data, function (idx, elem) {
                                                        elem.photoUri = sessionURLData.baseURLWithCompanyAndService + elem.photoUri;
                                                        // Use logic here based on presence information
                                                        elem.presenceImage = "styles/images/available_icon.png"
                                                    });
                                                    return data;
                                                }
                                            }
                                        });
                                        APP.contactListSource.read();
                                        app.navigate("views/contactslist.html"); // the url of the remote view
                                    },
                                    error: function (jqxhr, textStatus, error) {
                                        var err = textStatus + ", " + error;
                                        console.log("Request Failed: " + err);
                                    },
                                });
                            } else {
                                alert('Unable to retrieve Team Members.');
                            }
                        },
                        error: function (jqxhr, textStatus, error) {
                            console.log("Request Failed: " + error);
                            alert('Unable to retrieve Team Members.');
                        },
                    });
                },
            }
        }
    };

    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {

        // hide the splash screen as soon as the app is ready. otherwise
        // Cordova will wait 5 very long seconds to do it for you.
        navigator.splashscreen.hide();

        app = new kendo.mobile.Application(document.body, {

            // you can change the default transition (slide, zoom or fade)
            transition: 'fade',

            // comment out the following line to get a UI which matches the look
            // and feel of the operating system
            // Need flat for the app to match DSM look and feel
            skin: 'flat',

            // the application needs to know which view to load first
            initial: 'views/login.html'
        });
    }, false);
}());