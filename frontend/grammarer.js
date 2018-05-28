var g = angular.module("grammarer", ["ngRoute","angular-loading-bar","ngAnimate","googlechart"]);

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

g.controller("g-search", function($scope){
    let client = algoliasearch("LVR9M3CEXL", "87e5f6ac8730b018995163f3e722d4fb");
    let index = client.initIndex("gm-all");
    $scope.doSearch = function(){
        index.search({
            query: $scope.searchQuery
        }, (err, content)=>{
            if(err) throw err;
            for(let i in content.hits){
                let th = content.hits[i];
                let match;
                if(th.type==="grammar"){
                    match = $scope.$parent.lists.find(function(e){
                        return e.identifier === th.identifier;
                    });
                }else{
                    match = $scope.$parent.vocab.find(function(e){
                        return e.identifier === th.identifier;
                    });
                }
                content.hits[i].progress = match.progress + "%";
            }
            $scope.searchHits = content.hits;
        });
    }
    $scope.hideSearch = function(){
        $scope.searchHits = [];
    }
});

g.controller("g-study",function($scope, $http, $routeParams, $rootScope, $route){
    $("body").off();
    $scope.listType = "grammar";
    $rootScope.listId = $routeParams.listId;
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
                    }
                    if((e.keyCode === 37 || e.keyCode === 39) && $("#"+position.join("")).hasClass("revealed")){
                        colourise(e.keyCode);
                        next(position);
                        gReveal();
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
                };
                $scope.mRight = function(){
                    colourise(39);
                    gReveal();
                    next(position);
                };
                $scope.mWrong = function(){
                    colourise(37);
                    gReveal();
                    next(position);
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
                };
                $scope.mRight = function(){
                    colourise(39);
                    gReveal();
                    next();
                };
                $scope.mWrong = function(){
                    colourise(37);
                    gReveal();
                    next();
                };

                $("body").on("keyup", function(e){
                    if(e.keyCode === 32){
                        $("#"+position).removeClass("selected");
                        $("#"+position).addClass("revealed");
                        gMark();
                    }
                    if((e.keyCode === 37 || e.keyCode === 39) && $("#"+position).hasClass("revealed")){
                        colourise(e.keyCode);
                        next();
                        gReveal();
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

g.controller("g-admin", function($scope,$http,$location,$route){
    $scope.newcode = {role:"student"};
    $scope.newdeploy = "";
    $scope.newcohort = {};
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
        const height = 20;

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

                            doc.setFontSize(10);
                            doc.text("http://bit.ly/grammarer", xCord + 2, yCord + 17);

                            if(x===2&&i===8){
                                doc.setFontSize(10);
                                doc.setTextColor(0, 0, 0);
                                doc.text("Grammarer access codes x16 | Deploy "+$scope.pdfDeploy+" | All codes registered automatically", 20, 280);
                                doc.save("a4.pdf");
                                button.removeClass("is-loading");
                                $route.reload();
                            }
                        } else {
                            throw new Error(data.error);
                            return;
                        }
                    });
            }
        }
    }
});