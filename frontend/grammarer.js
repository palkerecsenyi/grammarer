var g = angular.module("grammarer", ["ngRoute","ngCookies","angular-loading-bar","ngAnimate","googlechart"]);

g.config(function($routeProvider, $locationProvider){
    $routeProvider
        .when("/",{
            templateUrl: "views/home.html",
            controller: "g-home"
        })
        .when("/lists",{
            templateUrl: "views/lists.html",
            controller: "g-lists"
        })
        .when("/lists/:type",{
            templateUrl: "views/lists.html",
            controller: "g-lists-tab"
        })
        .when("/exit",{
            templateUrl: "views/exit.html",
            controller: "g-exit"
        })
        .when("/study/:listId",{
            templateUrl: "views/study.html",
            controller: "g-study"
        })
        .when("/study-vocab/:listId",{
            templateUrl: "views/study.html",
            controller: "g-study-vocab"
        })
        .when("/about",{
            templateUrl: "views/about.html"
        })
        .when("/admin",{
            templateUrl: "views/admin.html",
            controller: "g-admin"
        })
        .when("/admin/lists",{
            templateUrl: "views/listadmin.html",
            controller: "g-admin-lists"
        })
        .otherwise({
            templateUrl: "views/notfound.html"
        });
});

g.directive("limitTo", [function() {
    return {
        restrict: "A",
        link: function(scope, elem, attrs) {
            let limit = parseInt(attrs.limitTo);
            angular.element(elem).on("keypress", function(e) {
                if (this.value.length == limit) e.preventDefault();
            });
        }
    }
}]);

g.controller("g-global",function($scope, $http, $rootScope, $location){
    $rootScope.$on('$routeChangeStart', function (next, last) {
        $http.get("/d/session")
            .then(function(data){
                data = data.data;
                $rootScope.authed = data.authenticated;
                $rootScope.authcode = data.code;
                if(!data.authenticated){
                    $location.path("/");
                }
                $rootScope.options = {};
            });
    });
    window.addEventListener("touchstart",function GFirstTouch(){
        document.body.classList.add("g-touch");
        window.removeEventListener("touchstart", GFirstTouch, false);
    });
    $scope.gmConfig = function(){
        $http.get("/gm-options.json")
            .then(function(data){
                $rootScope.config = data.data;
                $scope.orgInfo = $rootScope.config.organisation;
            });
        $http.get("https://api.github.com/repos/palkerecsenyi/grammarer/releases/latest")
            .then(function(data){
                $rootScope.gmRelease = data.data;
            });
    };
});

g.controller("g-exit", function($scope, $location, $http, $rootScope){
    $http.get("/d/signout")
        .then(function(data){
            data = data.data;
            if(data.success){
                $location.path("/");
                $rootScope.authed = false;
                $rootScope.authcode = null;
                window.location.reload();
            }
        });
});

g.controller("g-home", function($scope, $window, $location, $http, $rootScope){
    $scope.problem = false;
    $scope.orgInfo = $rootScope.config.organisation;
    if($rootScope.authed){
        $location.path("/lists");
    }else{
        $scope.auth = function(){
            $("#go").addClass("is-loading");
            $http.get("/d/auth?code="+$scope.code+"&cohort="+$scope.cohort)
                .then(function(data){
                    data = data.data;
                    if(data.success){
                        $location.path("/lists");
                        $rootScope.authed = true;
                    }else{
                        $("#go").removeClass("is-loading");
                        $scope.problem = true;
                        $scope.message = data.error;
                        $rootScope.authed = false;
                    }
                });
        };

        $http.get("/d/cohorts")
            .then(function(data){
                data = data.data;
                $scope.cohorts = data;
                $scope.cohort = data[0].name;
            });
    }
    $("body").keyup(function(e){
        if(e.keyCode === 13){
            $scope.auth();
        }
    });
});

g.controller("g-lists",function($location, $scope){
    $("body").off();
    $scope.tab = "none";
});

g.controller("g-lists-tab",function($scope,$rootScope,$http,$routeParams,$anchorScroll,$location,$timeout){

    /**
     * Returns word with first letter capitalised
     * @param input
     * @returns {string}
     * @constructor
     */
    $scope.FirstCapital = function(input){
        if(input!=="pdf"){
            return input[0].toUpperCase()+input.substr(1);
        }else{
            return "Printables";
        }
    };
    $http.get("/d/lists")
        .then(function(data){
            data = data.data;

            $scope.lists = [];
            $scope.vocab = [];

            for(var i in data){
                if(data[i].progress==null||data[i].progress===undefined){
                    data[i].progress = 0;
                }
                if(data[i].type === "vocab"){
                    $scope.vocab.push(data[i]);
                }else if(data[i].type === "grammar"){
                    $scope.lists.push(data[i]);
                }
            }

            $scope.pdfs = $rootScope.config.printables;

            $scope.languages = {};
            for(let i in $rootScope.config.languages){
                $scope.languages[$scope.FirstCapital($rootScope.config.languages[i])] = {
                    lists: [],
                    vocab: []
                };
            }

            $scope.config = $rootScope.config;

            for(let x in $scope.lists){
                if($scope.languages[$scope.lists[x].language] !== undefined){
                    $scope.languages[$scope.lists[x].language].lists.push($scope.lists[x]);
                }
            }
            for(let x in $scope.vocab){
                if($scope.languages[$scope.vocab[x].language] !== undefined){
                    $scope.languages[$scope.vocab[x].language].vocab.push($scope.vocab[x]);
                }
            }

            PushScope();
        });

    function PushScope(){
        $scope.tab = $routeParams.type;
        $scope.nameOfTab = $scope.FirstCapital($scope.tab);
        if($location.search().lang!==undefined){
            $timeout(function(){
                $location.hash('g-'+$location.search().lang);
                $anchorScroll();
            });
        }
    }
});

g.controller("g-study-onboarding", function($scope, $cookies){
    let test = $cookies.get("g-tutorial");

    $scope.$parent.onb = {
        active: false,
        slide: 0
    };

    $scope.onboard = false;
    if(test == null){
        $cookies.put("g-tutorial", "true");
        $scope.onboard = true;

        $scope.begin = function(){
            $scope.onboard = false;
            $scope.$parent.dismissScroll();

            $scope.$parent.onb = {
                active: true,
                slide: 1
            };
        }
    }
});

g.controller("g-study",function($scope, $http, $routeParams, $rootScope, $route){
    $("body").off();
    $scope.listType = "grammar";
    $rootScope.listId = $routeParams.listId;
    $scope.listId = $rootScope.listId;
    $(document).ready(function(){
        $("html, body").animate({
            scrollTop: $("#g-action-box").offset().top + 30
        }, 300);
    });
    $http.get("/d/listdata?list="+$routeParams.listId)
        .then(function(data){
            $scope.table = data.data.table;
            $scope.displayInfo = data.data.language + " | " + data.data.title;
            $scope.language = data.data.language;
            $scope.learning = false;
            $("#results-box").hide();
            $scope.answers = [0,0];
            $("body").on("keyup",function(e){
                if(e.keyCode===32){
                    $("#g-go").click();
                }
            });
            let scrollOverlay = document.getElementById("g-scroll-overlay");
            if($(window).width()<=768){
                scrollOverlay.style.display = "block";
            }else{
                scrollOverlay.style.display = "none";
            }
            $("#g-table-container").on("scroll",function(){
                scrollOverlay.style.display = "none";
            });
            $scope.dismissScroll = () => {
                scrollOverlay.style.display = "none";
            };
            $scope.begin = function(){
                $("body").off();
                scrollOverlay.style.display = "none";
                $scope.learning = true;
                $(".g-content").addClass("clear");
                var position = [1,1];
                var mp = data.data.maxPosition;
                var mps = [mp[0]-1,mp[1]-1];
                $("#11").addClass("selected");
                function next(p){
                    if(p[1]>mps[1]){
                        p[0]+=1;
                        p[1]=1;
                    }else{
                        p[1]+=1;
                    }
                    if(p[0]>mp[0]){
                        complete();
                    }else{
                        $("#"+p.join("")).addClass("selected");
                        let gContainer = $("#g-table-container");
                        gContainer.animate({
                            scrollTop: $("#"+p.join("")).offset().top - gContainer.offset().top + gContainer.scrollTop(),
                            scrollLeft: $("#"+p.join("")).offset().left - (gContainer.offset().left + (gContainer.width() / 4)) + gContainer.scrollLeft()
                        }, 300);
                    }
                }
                function colourise(r){
                    if(r===39){
                        $("#"+position.join("")).addClass("right");
                        $scope.answers[0]+=1;
                    }else{
                        $("#"+position.join("")).addClass("wrong");
                        $scope.answers[1]+=1;
                    }
                }
                function complete(){
                    $("#correct").text($scope.answers[0]);
                    $("#incorrect").text($scope.answers[1]);
                    var percent = Math.round(($scope.answers[0]/($scope.answers[0]+$scope.answers[1]))*100);
                    $("#percent").text(percent);
                    $("body").off();
                    $(".g-mark").prop('disabled', true);
                    $(".g-reveal").prop('disabled',true);
                    $("#m-controlbox").hide();
                    $("#results-box").show();
                    $("html, body").animate({
                        scrollTop: $("#results-box").offset().top
                    }, 300);
                }
                $("body").on("keyup", function(e){
                    if(e.keyCode === 32){
                        $("#"+position.join("")).removeClass("selected");
                        $("#"+position.join("")).addClass("revealed");
                        gMark();
                        $scope.onb.slide = 3;
                    }
                    if((e.keyCode === 37 || e.keyCode === 39) && $("#"+position.join("")).hasClass("revealed")){
                        colourise(e.keyCode);
                        next(position);
                        gReveal();
                        $scope.onb.slide = 4;
                    }
                });
                function gMark(){
                    $(".g-mark").prop('disabled', false);
                    $(".g-reveal").prop('disabled',true);
                }
                function gReveal(){
                    $(".g-mark").prop('disabled', true);
                    $(".g-reveal").prop('disabled', false);
                }
                gReveal();
                $scope.mReveal = function(){
                    $("#"+position.join("")).removeClass("selected");
                    $("#"+position.join("")).addClass("revealed");
                    gMark();
                    $scope.onb.slide = 3;
                };
                $scope.mRight = function(){
                    colourise(39);
                    gReveal();
                    next(position);
                    $scope.onb.slide = 4;
                };
                $scope.mWrong = function(){
                    colourise(37);
                    gReveal();
                    next(position);
                    $scope.onb.slide = 4;
                };
            };
            $scope.save = function(){
                $("#save").addClass("is-loading");
                $http.get("/d/listsave?list="+$routeParams.listId+"&c="+$scope.answers[0]+"&i="+$scope.answers[1])
                    .then(function(data){
                        $("#save").removeClass("is-loading");
                        data = data.data;
                        if(data.success){
                            window.location.href = "#!/lists/grammar?lang="+$scope.language;
                        }else{
                            alert("An error ocurred: "+data.error);
                        }
                    });
            };
            $scope.clear = function(){
                $("#clear").addClass("is-loading");
                $http.get("/d/listclear?list="+$routeParams.listId)
                    .then(function(data){
                        data = data.data;
                        if(data.success){
                            $("#clear").removeClass("is-loading");
                            $("#clear").text("Progress cleared!");
                            window.setTimeout(function(){
                                $route.reload();
                            },1000);
                        }else{
                            alert("An error ocurred: "+data.error);
                        }
                    });
            }
        });
});

g.controller("g-study-vocab", function($scope, $http, $rootScope, $routeParams, $route){
    $("body").off();
    $scope.listType = "vocab";
    $rootScope.listId = $routeParams.listId;
    $scope.listId = $rootScope.listId;
    $(document).ready(function(){
        $("html, body").animate({
            scrollTop: $("#g-action-box").offset().top + 30
        }, 300);
    });
    $http.get("/d/listdata?list="+$routeParams.listId)
        .then(function(data) {
            $scope.table = data.data.list;
            $scope.displayInfo = data.data.language + " | Checklist " + data.data.number;
            $scope.language = data.data.language;
            $scope.learning = false;
            $("#results-box").hide();
            $scope.answers = [0, 0];
            $scope.swap = function(){
                for(let i in $scope.table){
                    let english = $scope.table[i].english;
                    let original = $scope.table[i].original;
                    $scope.table[i].english = original;
                    $scope.table[i].original = english;
                    $("#swap").blur();
                }
            };
            $("body").on("keyup", function (e) {
                if (e.keyCode === 32) {
                    $("#g-go").click();
                }
            });
            let scrollOverlay = document.getElementById("g-scroll-overlay");
            if ($(window).width() <= 768) {
                scrollOverlay.style.display = "block";
            } else {
                scrollOverlay.style.display = "none";
            }
            $("#g-table-container").on("scroll", function () {
                scrollOverlay.style.display = "none";
            });
            $scope.dismissScroll = () => {
                scrollOverlay.style.display = "none";
            };
            $scope.begin = function () {
                $("body").off();
                $(".g-function-button").hide();
                scrollOverlay.style.display = "none";
                $scope.learning = true;
                $(".g-content").addClass("clear");
                let position = 0;
                let vLength = data.data.vocabLength;

                $("#"+position).addClass("selected");

                function colourise(r){
                    if(r===39){
                        $("#"+position).addClass("right");
                        $scope.answers[0]+=1;
                    }else{
                        $("#"+position).addClass("wrong");
                        $scope.answers[1]+=1;
                    }
                }

                function next(){
                    position += 1;
                    if(position + 1 > vLength){
                        $("#correct").text($scope.answers[0]);
                        $("#incorrect").text($scope.answers[1]);
                        var percent = Math.round(($scope.answers[0]/($scope.answers[0]+$scope.answers[1]))*100);
                        $("#percent").text(percent);
                        $("body").off();
                        $(".g-mark").prop('disabled', true);
                        $(".g-reveal").prop('disabled',true);
                        $("#m-controlbox").hide();
                        $("#results-box").show();
                        $("html, body").animate({
                            scrollTop: $("#results-box").offset().top
                        }, 300);
                    }else{
                        $("#"+position).addClass("selected");
                        let gContainer = $("#g-table-container");
                        gContainer.animate({
                            scrollTop: $("#"+position).offset().top - gContainer.offset().top + gContainer.scrollTop()
                        }, 300);
                    }
                }

                function gMark(){
                    $(".g-mark").prop('disabled', false);
                    $(".g-reveal").prop('disabled',true);
                }
                function gReveal(){
                    $(".g-mark").prop('disabled', true);
                    $(".g-reveal").prop('disabled', false);
                }

                gReveal();

                $scope.mReveal = function(){
                    $("#"+position).removeClass("selected");
                    $("#"+position).addClass("revealed");
                    gMark();
                    $scope.onb.slide = 3;
                };
                $scope.mRight = function(){
                    colourise(39);
                    gReveal();
                    next();
                    $scope.onb.slide = 4;
                };
                $scope.mWrong = function(){
                    colourise(37);
                    gReveal();
                    next();
                    $scope.onb.slide = 4;
                };

                $("body").on("keyup", function(e){
                    if(e.keyCode === 32){
                        $("#"+position).removeClass("selected");
                        $("#"+position).addClass("revealed");
                        gMark();
                        $scope.onb.slide = 3;
                    }
                    if((e.keyCode === 37 || e.keyCode === 39) && $("#"+position).hasClass("revealed")){
                        colourise(e.keyCode);
                        next();
                        gReveal();
                        $scope.onb.slide = 4;
                    }
                });



            };
        });

    $scope.save = function(){
        $("#save").addClass("is-loading");
        $http.get("/d/listsave?list="+$routeParams.listId+"&c="+$scope.answers[0]+"&i="+$scope.answers[1])
            .then(function(data){
                $("#save").removeClass("is-loading");
                data = data.data;
                if(data.success){
                    window.location.href = "#!/lists/vocab?lang="+$scope.language;
                }else{
                    alert("An error ocurred: "+data.error);
                }
            });
    };
    $scope.clear = function(){
        $("#clear").addClass("is-loading");
        $http.get("/d/listclear?list="+$routeParams.listId)
            .then(function(data){
                data = data.data;
                if(data.success){
                    $("#clear").removeClass("is-loading");
                    $("#clear").text("Progress cleared!");
                    window.setTimeout(function(){
                        $route.reload();
                    },1000);
                }else{
                    alert("An error ocurred: "+data.error);
                }
            });
    }
});

g.controller("g-study-results", function($scope,$http,$rootScope){
    $scope.chartShown = false;
    $http.get("/d/listhistory?list="+$rootScope.listId)
        .then(function(hData){
            for(var i in hData.data.data.rows){
                hData.data.data.rows[i].c[0].v = new Date(hData.data.data.rows[i].c[0].v);
            }
            $scope.ghresults = hData.data;
        });
    $scope.showChart = function(){
        $scope.chartShown = true;
        window.dispatchEvent(new Event("resize"));
    }
});

g.controller("g-admin", function($scope,$http,$location,$route,$rootScope){
    $scope.newcode = {role:"student"};
    $scope.newdeploy = "";
    $scope.newcohort = {};
    $scope.tab = "codes";
    $scope.modal = {show:false};
    $scope.assign = {show:false};
    $http.get("/d/session")
        .then(function(data){
            data = data.data;
            $scope.adminRole = data.adminRole;
            if(!data.admin){
                $location.path("/lists");
            }else{
                $http.get("/d/admincodes")
                    .then(codes=>{
                        codes = codes.data;
                        if(codes.error!==null){
                            alert(codes.error);
                        }else{
                            $scope.data = codes.data;
                            $scope.cohort = codes.cohort;
                            $http.get("/d/cohorts")
                                .then(function(cohorts){
                                    cohorts = cohorts.data;
                                    $scope.cohorts = cohorts;
                                    $scope.newcode.cohort = $scope.cohorts[0].name;
                                });
                            $scope.addCode = function(){
                                $("#addbutton").addClass("is-loading");

                                $http.get("/d/adminaddcode?code="+$scope.newcode.code+"&deploy="+$scope.newdeploy+"&card="+$scope.newcard+"&role="+$scope.newcode.role+"&cohort="+$scope.newcode.cohort)
                                    .then(function(added){
                                        added = added.data;
                                        $("#addbutton").removeClass("is-loading");
                                        if(added.success){

                                            window.setTimeout(function(){
                                                $route.reload();
                                            }, 500);

                                        }else{
                                            alert(added.error);
                                            $route.reload();
                                        }
                                    })
                            };
                        }
                    })
            }
        });

    $scope.aDelete = function($event, code, cohort){
        let button = $($event.currentTarget);
        button.addClass("is-loading");
        $http.get("/d/admindelcode?code="+code+"&cohort="+cohort)
            .then(function(data){
                data = data.data;
                button.removeClass("is-loading");

                if(data.success){
                    document.getElementById("aTable").deleteRow($event.currentTarget.parentNode.parentNode.rowIndex);
                }else{
                    alert(data.error);
                }
            });
    };
    $scope.addCohort = function(){
        $("#cohortbutton").addClass("is-loading");
        $http.get("/d/adminaddcohort?name="+$scope.newcohort.name)
            .then(function(data){
                 data = data.data;

                 $("#cohortbutton").removeClass("is-loading");

                 if(data.success){
                     $route.reload();
                 }else{
                     alert(data.error);
                 }
            });
    };
    $scope.pdf = function($event){
        let button = $($event.currentTarget);
        button.addClass("is-loading");

        let doc = new jsPDF();
        doc.setTextColor(255, 255, 255);
        const width = 60;
        const height = 25;

        function randColor(){
            const rand = Math.floor(Math.random() * (0 - 4)) + 4;
            if(rand === 0){
                return [70, 129, 137];
            }else if(rand === 1){
                return [255, 107, 107];
            }else if(rand === 2){
                return [3, 25, 38];
            }else{
                return [78, 205, 196];
            }
        }
        for(let x = 1; x < 3; x++) {
            for (let i = 1; i < 9; i++) {

                let newCode = Math.floor(1000 + Math.random() * 9000).toString();
                $http.get("/d/adminaddcode?code=" + newCode + "&deploy=" + $scope.pdfDeploy + "&card=true")
                    .then(function (data) {
                        data = data.data;
                        if (data.success) {

                            doc.setTextColor(255, 255, 255);


                            let xCord;
                            let yCord;
                            xCord = x === 1 ? 20 : 120;
                            yCord = i * 30;

                            doc.setFillColor.apply(null, randColor());

                            doc.rect(xCord, yCord, width, height, "F");

                            doc.setFontSize(18);
                            doc.setFontStyle("bold");
                            doc.text("Grammarer", xCord + 2, yCord + 6);

                            doc.setFontSize(15);
                            doc.setFontStyle("normal");
                            doc.text("Access code: " + data.code, xCord + 2, yCord + 12);
                            doc.text("Cohort: " + data.cohort, xCord + 2, yCord + 18);

                            doc.setFontSize(10);
                            doc.text($rootScope.config.rootUrl, xCord + 2, yCord + 23);

                            if(x===2&&i===8){
                                doc.setFontSize(10);
                                doc.setTextColor(0, 0, 0);
                                doc.text("Grammarer access codes x16 | Deploy "+$scope.pdfDeploy+" | All codes registered automatically", 20, 280);
                                window.setTimeout(function(){
                                    doc.save("a4.pdf");
                                    button.removeClass("is-loading");
                                    $route.reload();
                                }, 500);
                            }
                        } else {
                            throw new Error(data.error);
                            return;
                        }
                    });
            }
        }
    };

    $scope.aShowModal = function(name, userCount){
        $scope.modal = {show: true, name: name, userCount: userCount, confirm: ""};
    };

    $scope.aShowAssign = function(name, assigned){
        $scope.assign = {
            show: true,
            name: name,
            assigned:assigned,
            newAssignment: {
                listId: "",
                addIt: function(listId){
                    $http.get("/d/adminassigncohort?cohort="+name+"&listid="+listId)
                        .then(function(data){
                            data = data.data;
                            if(data.error){
                                alert(data.error);
                            }else{
                                $scope.assign.assigned.push(listId);
                                $scope.assign.newAssignment.listId = "";
                            }
                        })

                }
            },
            removeAssignment: function($event, listId){
                $($event.currentTarget).addClass("is-loading");
                $http.get("/d/adminunassigncohort?cohort="+name+"&listid="+listId)
                    .then(function(data){
                        data = data.data;
                        $($event.currentTarget).removeClass("is-loading");
                        if(data.success){
                            const index = $scope.assign.assigned.indexOf(listId);
                            $scope.assign.assigned.splice(index, 1);
                        }
                    });
            }
        };
    };

    $scope.aDeleteCohort = function($event, name){
        let target = $($event.currentTarget);
        target.addClass("is-loading");

        $http.get("/d/admindelcohort?name="+name)
            .then(function(data){
                data = data.data;

                target.removeClass("is-loading");
                if(data.success){
                    $route.reload();
                }else{
                    alert(data.error);
                }
            });
    };

    $scope.switchTab = function($event){
        let tab = $event.currentTarget;
        $(tab.parentNode).addClass("is-active");

        if(tab.parentNode.id === "g-t-cohorts"){
            $("#g-t-codes").removeClass("is-active");
            $scope.tab = "cohorts";
        }else{
            $("#g-t-cohorts").removeClass("is-active");
            $scope.tab = "codes";
            $route.reload();
        }
    };

    $scope.newcode.random = function(){
        $http.get("/d/randomcode?cohort="+$scope.newcode.cohort)
            .then(function(data){
                data = data.data;
                $scope.newcode.code = data.code;
            });
    }
});

g.controller("g-admin-lists", function($scope,$http,$location,$route,$rootScope){
    $scope.modal = {
        show:false,
        type:"grammar",
        table:{
            head:[{name: "", editing: false},{name: "", editing: false},{name: "", editing: false},{name: "", editing: false}],
            rows:[
                {
                    first: {name: "", editing: false},
                    cells:[
                        {name: "", editing: false},
                        {name: "", editing: false},
                        {name: "", editing: false}
                    ]
                },
                {
                    first: {name: "", editing: false},
                    cells:[
                        {name: "", editing: false},
                        {name: "", editing: false},
                        {name: "", editing: false}
                    ]
                },
                {
                    first: {name: "", editing: false},
                    cells:[
                        {name: "", editing: false},
                        {name: "", editing: false},
                        {name: "", editing: false}
                    ]
                }
            ]
        },
        slide: 1,
        setup:{
            name: "",
            language: $rootScope.config.languages[0],
            identifier: "",
            direction: "down"
        }
    };
    $http.get("/d/adminlists")
        .then(function(data){
            data = data.data;
            $scope.lists = data;
        });


    $scope.listDelete = function($event, listid){
        let btn = $($event.currentTarget);
        btn.addClass("is-loading");
        $http.get("/d/admindellist?listid="+listid)
            .then(function(data){
                data = data.data;
                btn.removeClass("is-loading");
                if(data.success){
                    $route.reload();
                }else{
                    alert(data.error);
                }
            });
    }
    $scope.listInsert = function(){
        $scope.modal.show = true;
    };
    $scope.listDblclick = function(e){
        // If currently editing
        if(document.body.classList.contains("g-table-editing")){
            // Search and remove
            // Head
            for(let i in $scope.modal.table.head){
                $scope.modal.table.head[i].editing = false;
            }
            for(let i in $scope.modal.table.rows){
                // Body firsts
                $scope.modal.table.rows[i].first.editing = false;
                // Body cells
                for(let x in $scope.modal.table.rows[i].cells){
                    $scope.modal.table.rows[i].cells[x].editing = false;
                }
            }
            document.body.classList.remove("g-table-editing");
        }

        // Identify element
        let element = e.currentTarget;

        // Set element identifier from JSON object
        let reference = $scope.modal.table;
        if(element.parentNode.classList.contains("g-head")){
            // Header object
            reference = reference.head[element.cellIndex];
        }else if(element.classList.contains("g-first")){
            // First in body row
            reference = reference.rows[element.parentNode.rowIndex - 1].first;
        }else if(element.classList.contains("g-content")){
            // Regular content
            reference = reference.rows[element.parentNode.rowIndex - 1].cells[element.cellIndex - 1];
        }

        // Set reference to editing
        reference.editing = true;
        // Add class to body
        document.body.classList.add("g-table-editing");
    };

    $scope.listEnter = function(e, cell){
        // If enter key pressed
        if(e.keyCode === 13){
            // Turn off editing for that cell
            cell.editing = false;
            // Remove class from body
            document.body.classList.remove("g-table-editing");
        }
    };

    $scope.addC = function($event){
        if($event.currentTarget.parentNode.cellIndex <= 9){
            $scope.modal.table.head.push({
                name: " ",
                editing: false
            });
            let table = $scope.modal.table.rows;
            for(let i in table){
                table[i].cells.push({
                    name: " ",
                    editing: false
                });
            }
            $scope.modal.table.rows = table;
        }else{
            alert("Column count limit (9) reached.");
        }
    };

    $scope.addR = function(){
        let cells = [];
        if($scope.modal.table.rows.length + 1 <= 9){
            for(let i = 0; i < $scope.modal.table.rows[$scope.modal.table.rows.length - 1].cells.length; i++){
                cells.push({
                    name: " ",
                    editing: false
                });
            }
            $scope.modal.table.rows.push({
                first: {name: "", editing: false},
                cells: cells
            });
        }else{
            alert("Row count limit (9) reached.");
        }
    };

    $scope.delC = function($event){
        $event.stopPropagation();

        let element = $event.currentTarget.parentNode.parentNode;
        let cellIndex = element.cellIndex;
        $scope.modal.table.head.splice(cellIndex, 1);

        for(let i in $scope.modal.table.rows){
            $scope.modal.table.rows[i].cells.splice(cellIndex - 1, 1);
        }
    };

    $scope.delR = function($event){
        $event.stopPropagation();

        let element = $event.currentTarget.parentNode.parentNode.parentNode;
        let rowIndex = element.rowIndex - 1;

        $scope.modal.table.rows.splice(rowIndex, 1);
    };

    $scope.listSave = function($event){
        let btn = $($event.currentTarget);
        btn.addClass("is-loading");

        $scope.modal.generatedTable = {table:{head:[], rows:[]}};

        $scope.modal.generatedTable.title = $scope.modal.setup.name;
        $scope.modal.generatedTable.language = $scope.modal.setup.language[0].toUpperCase() + $scope.modal.setup.language.substring(1);
        $scope.modal.generatedTable.identifier = $scope.modal.setup.identifier;
        $scope.modal.generatedTable.type = "grammar";
        $scope.modal.generatedTable.results = [];

        $scope.modal.generatedTable.maxPosition = [0, 0];
        if($scope.modal.setup.direction === "left"){
            $scope.modal.generatedTable.maxPosition[0] = $scope.modal.table.rows.length;
            $scope.modal.generatedTable.maxPosition[1] = $scope.modal.table.head.length - 1;
        }else{
            $scope.modal.generatedTable.maxPosition[0] = $scope.modal.table.head.length - 1;
            $scope.modal.generatedTable.maxPosition[1] = $scope.modal.table.rows.length;
        }

        for(let i in $scope.modal.table.head){
            $scope.modal.generatedTable.table.head.push($scope.modal.table.head[i].name);
        }

        for(let i in $scope.modal.table.rows){
            $scope.modal.generatedTable.table.rows.push({first: "", cells: []});
            $scope.modal.generatedTable.table.rows[i].first = $scope.modal.table.rows[i].first.name;

            for(let x in $scope.modal.table.rows[i].cells){
                $scope.modal.generatedTable.table.rows[i].cells.push({name: "", id: ""});
                $scope.modal.generatedTable.table.rows[i].cells[x].name = $scope.modal.table.rows[i].cells[x].name;

                $scope.modal.generatedTable.table.rows[i].cells[x].id = [0, 0];
                if($scope.modal.setup.direction === "left"){
                    $scope.modal.generatedTable.table.rows[i].cells[x].id[0] = parseInt(i) + 1;
                    $scope.modal.generatedTable.table.rows[i].cells[x].id[1] = parseInt(x) + 1;
                }else{
                    $scope.modal.generatedTable.table.rows[i].cells[x].id[0] = parseInt(x) + 1;
                    $scope.modal.generatedTable.table.rows[i].cells[x].id[1] = parseInt(i) + 1;
                }

                $scope.modal.generatedTable.table.rows[i].cells[x].id = $scope.modal.generatedTable.table.rows[i].cells[x].id.join("").toString();
            }
        }

        $http.get("/d/adminaddlist?json="+JSON.stringify($scope.modal.generatedTable))
            .then(function(data){
                data = data.data;
                btn.removeClass("is-loading");

                if(data.success){
                    $route.reload();
                }else{
                    alert(data.error);
                }
            });
    };

    $scope.listEdit = function($event, id){
        $scope.modal
    };

});